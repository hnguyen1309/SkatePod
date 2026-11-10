package com.skatepod.api.student;

import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.lesson.Lesson;
import com.skatepod.api.lesson.LessonRepository;
import com.skatepod.api.program.ProgramService;
import com.skatepod.api.student.dto.NextLessonResponse;
import com.skatepod.api.student.dto.StudentDisciplineRequest;
import com.skatepod.api.student.dto.StudentDisciplineResponse;
import com.skatepod.api.student.dto.StudentRequest;
import com.skatepod.api.student.dto.StudentResponse;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentService {

    private final StudentRepository students;
    private final LessonRepository lessons;
    private final NextLessonCalculator nextLessonCalculator;
    private final ProgramService programs;
    private final Clock clock;

    public StudentService(StudentRepository students, LessonRepository lessons,
                          NextLessonCalculator nextLessonCalculator, ProgramService programs, Clock clock) {
        this.students = students;
        this.lessons = lessons;
        this.programs = programs;
        this.nextLessonCalculator = nextLessonCalculator;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> list() {
        // One query for all lessons, grouped by student, instead of one query per student.
        Map<UUID, List<Lesson>> lessonsByStudent = lessons.findAll().stream()
                .collect(Collectors.groupingBy(lesson -> lesson.getStudent().getId()));
        return students.findAllByOrderByNameAsc().stream()
                .map(student -> toResponse(student, lessonsByStudent.getOrDefault(student.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentResponse get(UUID id) {
        Student student = find(id);
        return toResponse(student, lessons.findAllByStudentId(id));
    }

    @Transactional
    public StudentResponse create(StudentRequest request) {
        Student student = students.save(new Student(request.name().trim(), checkPhone(request.phone()), toDisciplines(request.disciplines())));
        return toResponse(student, List.of());
    }

    @Transactional
    public StudentResponse update(UUID id, StudentRequest request) {
        Student student = find(id);
        student.update(request.name().trim(), checkPhone(request.phone()), toDisciplines(request.disciplines()));
        return toResponse(student, lessons.findAllByStudentId(id));
    }

    /**
     * A phone number is optional. When there is one it's trimmed and needs 7 to 15 digits (spaces and
     * + ( ) - . around them are fine; StudentRequest already refused other characters).
     * Same rule as phoneProblem in the app's data.ts.
     */
    static String checkPhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        long digits = phone.chars().filter(Character::isDigit).count();
        if (digits < 7 || digits > 15) {
            throw new BadRequestException("A phone number needs 7 to 15 digits.");
        }
        return phone.trim();
    }

    /**
     * Deleting a student deletes everything that's theirs: their programs with their uploaded music files
     * (ProgramService.deleteAllFor, since files on disk need deleting by hand), then the student, which
     * takes their lessons, notes and disciplines with it (ON DELETE CASCADE in the database).
     */
    @Transactional
    public void delete(UUID id) {
        Student student = find(id);
        programs.deleteAllFor(id);
        students.delete(student);
    }

    private Student find(UUID id) {
        return students.findById(id).orElseThrow(() -> new NotFoundException("Student", id));
    }

    /**
     * Checks the requested disciplines: each one only once, and each level must be one of
     * that discipline's levels (e.g. "Juvenile" isn't a Standard Freeskate level).
     */
    private static List<StudentDiscipline> toDisciplines(List<StudentDisciplineRequest> requested) {
        if (requested == null) {
            return List.of();
        }
        Set<Discipline> seen = EnumSet.noneOf(Discipline.class);
        List<StudentDiscipline> result = new ArrayList<>();
        for (StudentDisciplineRequest item : requested) {
            Discipline discipline = item.discipline();
            String level = item.level().trim();
            if (!seen.add(discipline)) {
                throw new BadRequestException(discipline.getDisplayName() + " is listed more than once");
            }
            if (!discipline.hasLevel(level)) {
                throw new BadRequestException(level + " is not a level in " + discipline.getDisplayName());
            }
            result.add(new StudentDiscipline(discipline, item.track(), level));
        }
        return result;
    }

    private StudentResponse toResponse(Student student, List<Lesson> studentLessons) {
        NextLessonResponse nextLesson = nextLessonCalculator
                .findNext(studentLessons, LocalDateTime.now(clock))
                .map(next -> new NextLessonResponse(next.lesson().getId(), next.startsAt().toLocalDate(),
                        next.lesson().getStartTime(), next.lesson().getType(), next.lesson().getDurationMinutes()))
                .orElse(null);
        // Same order as the Discipline enum, so Singles comes before Ice Dance and so on.
        List<StudentDisciplineResponse> disciplines = student.getDisciplines().stream()
                .sorted(Comparator.comparing(StudentDiscipline::getDiscipline))
                .map(item -> new StudentDisciplineResponse(
                        item.getDiscipline(),
                        item.getDiscipline().getDisplayName(),
                        item.getDiscipline().getCategory(),
                        item.getDiscipline().getCategory().getDisplayName(),
                        item.getTrack(),
                        item.getTrack().getDisplayName(),
                        item.getLevel()))
                .toList();
        return new StudentResponse(
                student.getId(),
                student.getName(),
                student.getPhone(),
                disciplines,
                nextLesson,
                student.getCreatedAt(),
                student.getUpdatedAt());
    }
}

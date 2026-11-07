package com.skatepod.api.student;

import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.lesson.Lesson;
import com.skatepod.api.lesson.LessonRepository;
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
    private final Clock clock;

    public StudentService(StudentRepository students, LessonRepository lessons,
                          NextLessonCalculator nextLessonCalculator, Clock clock) {
        this.students = students;
        this.lessons = lessons;
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
        Student student = students.save(new Student(request.name().trim(), toDisciplines(request.disciplines())));
        return toResponse(student, List.of());
    }

    @Transactional
    public StudentResponse update(UUID id, StudentRequest request) {
        Student student = find(id);
        student.update(request.name().trim(), toDisciplines(request.disciplines()));
        return toResponse(student, lessons.findAllByStudentId(id));
    }

    /** Deleting a student also deletes their lessons and disciplines (ON DELETE CASCADE in the database). */
    @Transactional
    public void delete(UUID id) {
        students.delete(find(id));
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
                .map(lesson -> new NextLessonResponse(lesson.getId(), lesson.getDate(),
                        lesson.getStartTime(), lesson.getType(), lesson.getDurationMinutes()))
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
                disciplines,
                nextLesson,
                student.getCreatedAt(),
                student.getUpdatedAt());
    }
}

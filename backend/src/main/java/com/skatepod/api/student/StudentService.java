package com.skatepod.api.student;

import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.lesson.Lesson;
import com.skatepod.api.lesson.LessonRepository;
import com.skatepod.api.student.dto.NextLessonResponse;
import com.skatepod.api.student.dto.StudentRequest;
import com.skatepod.api.student.dto.StudentResponse;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
        Student student = students.save(new Student(
                request.name().trim(), request.level().trim(), request.discipline().trim(),
                blankToNull(request.focus()), request.progress()));
        return toResponse(student, List.of());
    }

    @Transactional
    public StudentResponse update(UUID id, StudentRequest request) {
        Student student = find(id);
        student.update(request.name().trim(), request.level().trim(), request.discipline().trim(),
                blankToNull(request.focus()), request.progress());
        return toResponse(student, lessons.findAllByStudentId(id));
    }

    /** Deleting a student also deletes their lessons (ON DELETE CASCADE in the database). */
    @Transactional
    public void delete(UUID id) {
        students.delete(find(id));
    }

    private Student find(UUID id) {
        return students.findById(id).orElseThrow(() -> new NotFoundException("Student", id));
    }

    private StudentResponse toResponse(Student student, List<Lesson> studentLessons) {
        NextLessonResponse nextLesson = nextLessonCalculator
                .findNext(studentLessons, LocalDateTime.now(clock))
                .map(lesson -> new NextLessonResponse(lesson.getId(), lesson.getDate(),
                        lesson.getStartTime(), lesson.getType(), lesson.getDurationMinutes()))
                .orElse(null);
        return new StudentResponse(
                student.getId(),
                student.getName(),
                student.getLevel(),
                student.getDiscipline(),
                student.getFocus(),
                student.getProgress(),
                nextLesson,
                student.getCreatedAt(),
                student.getUpdatedAt());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

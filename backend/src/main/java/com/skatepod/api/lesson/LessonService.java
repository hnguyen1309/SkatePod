package com.skatepod.api.lesson;

import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.lesson.dto.LessonRequest;
import com.skatepod.api.lesson.dto.LessonResponse;
import com.skatepod.api.student.Student;
import com.skatepod.api.student.StudentRepository;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LessonService {

    /** Earliest date first, then by start time, like a calendar. */
    static final Comparator<Lesson> CALENDAR_ORDER =
            Comparator.comparing(Lesson::getDate).thenComparing(Lesson::getStartTime);

    private final LessonRepository lessons;
    private final StudentRepository students;

    public LessonService(LessonRepository lessons, StudentRepository students) {
        this.lessons = lessons;
        this.students = students;
    }

    @Transactional(readOnly = true)
    public List<LessonResponse> list(UUID studentId) {
        List<Lesson> found = studentId == null ? lessons.findAll() : lessons.findAllByStudentId(studentId);
        return found.stream().sorted(CALENDAR_ORDER).map(LessonService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public LessonResponse get(UUID id) {
        return toResponse(find(id));
    }

    @Transactional
    public LessonResponse create(LessonRequest request) {
        Student student = findStudent(request.studentId());
        Lesson lesson = new Lesson(student, request.date(), request.startTime(),
                request.durationMinutes(), request.type().trim(), request.color());
        return toResponse(lessons.save(lesson));
    }

    @Transactional
    public LessonResponse update(UUID id, LessonRequest request) {
        Lesson lesson = find(id);
        Student student = findStudent(request.studentId());
        lesson.update(student, request.date(), request.startTime(),
                request.durationMinutes(), request.type().trim(), request.color());
        return toResponse(lesson);
    }

    @Transactional
    public void delete(UUID id) {
        lessons.delete(find(id));
    }

    private Lesson find(UUID id) {
        return lessons.findById(id).orElseThrow(() -> new NotFoundException("Lesson", id));
    }

    private Student findStudent(UUID id) {
        return students.findById(id).orElseThrow(() -> new NotFoundException("Student", id));
    }

    static LessonResponse toResponse(Lesson lesson) {
        Student student = lesson.getStudent();
        return new LessonResponse(
                lesson.getId(),
                student.getId(),
                student.getName(),
                lesson.getDate(),
                lesson.getStartTime(),
                lesson.getDurationMinutes(),
                lesson.getType(),
                lesson.getColor());
    }
}

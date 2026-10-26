package com.skatepod.api.lesson;

import com.skatepod.api.common.ConflictException;
import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.lesson.dto.LessonRequest;
import com.skatepod.api.lesson.dto.LessonResponse;
import com.skatepod.api.student.Student;
import com.skatepod.api.student.StudentRepository;
import java.time.LocalTime;
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
        checkTimeIsFree(request, null);
        Lesson lesson = new Lesson(student, request.date(), request.startTime(),
                request.durationMinutes(), request.type().trim(), request.color());
        return toResponse(lessons.save(lesson));
    }

    @Transactional
    public LessonResponse update(UUID id, LessonRequest request) {
        Lesson lesson = find(id);
        Student student = findStudent(request.studentId());
        checkTimeIsFree(request, lesson);
        lesson.update(student, request.date(), request.startTime(),
                request.durationMinutes(), request.type().trim(), request.color());
        return toResponse(lesson);
    }

    @Transactional
    public void delete(UUID id) {
        lessons.delete(find(id));
    }

    /**
     * A coach can only teach one lesson at a time, so a new or moved lesson can't overlap
     * any other lesson that day (for any student). Two lessons overlap when each one starts
     * before the other ends. Back-to-back is fine: a lesson ending at 9:45 and one starting
     * at 9:45 don't clash. ignore is the lesson being updated, so it doesn't clash with itself.
     */
    private void checkTimeIsFree(LessonRequest request, Lesson ignore) {
        int start = minutesOfDay(request.startTime());
        int end = start + request.durationMinutes();
        for (Lesson other : lessons.findAllByDate(request.date())) {
            if (other == ignore) continue;
            int otherStart = minutesOfDay(other.getStartTime());
            int otherEnd = otherStart + other.getDurationMinutes();
            if (start < otherEnd && otherStart < end) {
                throw new ConflictException("That time is already taken: " + other.getStudent().getName()
                        + " has a lesson at " + other.getStartTime() + " on " + other.getDate()
                        + " (" + other.getDurationMinutes() + " minutes)");
            }
        }
    }

    // Plain minutes (not LocalTime) so a lesson running past midnight doesn't wrap around to 00:xx.
    private static int minutesOfDay(LocalTime time) {
        return time.getHour() * 60 + time.getMinute();
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

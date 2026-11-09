package com.skatepod.api.lesson;

import com.skatepod.api.availability.AvailabilityBlock;
import com.skatepod.api.availability.AvailabilityBlockRepository;
import com.skatepod.api.availability.AvailabilityService;
import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.common.ConflictException;
import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.lesson.dto.LessonRequest;
import com.skatepod.api.lesson.dto.LessonResponse;
import com.skatepod.api.student.Student;
import com.skatepod.api.student.StudentRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LessonService {

    /** Monday first, then by start time, like the weekly calendar. */
    static final Comparator<Lesson> WEEK_ORDER =
            Comparator.comparing(Lesson::getDayOfWeek).thenComparing(Lesson::getStartTime);

    private final LessonRepository lessons;
    private final StudentRepository students;
    private final AvailabilityBlockRepository availability;
    private final Clock clock;

    public LessonService(LessonRepository lessons, StudentRepository students,
                         AvailabilityBlockRepository availability, Clock clock) {
        this.lessons = lessons;
        this.students = students;
        this.availability = availability;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<LessonResponse> list(UUID studentId) {
        List<Lesson> found = studentId == null ? lessons.findAll() : lessons.findAllByStudentId(studentId);
        List<AvailabilityBlock> blocks = availability.findAll();
        return found.stream().sorted(WEEK_ORDER).map(lesson -> toResponse(lesson, blocks)).toList();
    }

    @Transactional(readOnly = true)
    public LessonResponse get(UUID id) {
        return toResponse(find(id), availability.findAll());
    }

    @Transactional
    public LessonResponse create(LessonRequest request) {
        Student student = findStudent(request.studentId());
        LocalDate today = LocalDate.now(clock);
        // A new lesson starts today unless the coach picks a later day (same as the app).
        LocalDate startDate = request.startDate() == null ? today : request.startDate();
        if (startDate.isBefore(today)) {
            throw new BadRequestException("A new lesson can't start before today (" + today + ")");
        }
        checkDates(startDate, request.endDate());
        checkTimeIsFree(request, startDate, null);
        Lesson lesson = new Lesson(student, request.dayOfWeek(), request.startTime(), request.durationMinutes(),
                request.type().trim(), startDate, request.endDate());
        return toResponse(lessons.save(lesson), availability.findAll());
    }

    /**
     * Updates a lesson. The start date can stay in the past here: the lesson already happened
     * those weeks. Leaving startDate out keeps the old one.
     */
    @Transactional
    public LessonResponse update(UUID id, LessonRequest request) {
        Lesson lesson = find(id);
        Student student = findStudent(request.studentId());
        LocalDate startDate = request.startDate() == null ? lesson.getStartDate() : request.startDate();
        checkDates(startDate, request.endDate());
        checkTimeIsFree(request, startDate, lesson);
        lesson.update(student, request.dayOfWeek(), request.startTime(), request.durationMinutes(),
                request.type().trim(), startDate, request.endDate());
        return toResponse(lesson, availability.findAll());
    }

    /** Deleting a lesson keeps its notes in the training history (they just lose the link to it). */
    @Transactional
    public void delete(UUID id) {
        lessons.delete(find(id));
    }

    private static void checkDates(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new BadRequestException("The end date (" + endDate + ") can't be before the start date (" + startDate + ")");
        }
    }

    /**
     * A coach can only teach one lesson at a time, so a new or moved lesson can't overlap any other
     * lesson on the same weekday (for any student) in a week when both are running.
     * Two lessons overlap when each one starts before the other ends. Back-to-back is fine: a lesson
     * ending at 9:45 and one starting at 9:45 don't clash. Lessons whose dates never meet don't clash
     * either (one ends in October, the other starts in November).
     * Same rule as findClash in the app. ignore is the lesson being updated, so it doesn't clash with itself.
     */
    private void checkTimeIsFree(LessonRequest request, LocalDate startDate, Lesson ignore) {
        int start = minutesOfDay(request.startTime());
        int end = start + request.durationMinutes();
        for (Lesson other : lessons.findAllByDayOfWeek(request.dayOfWeek())) {
            if (other == ignore) continue;
            if (!WeeklyLessons.datesOverlap(startDate, request.endDate(), other.getStartDate(), other.getEndDate())) continue;
            int otherStart = minutesOfDay(other.getStartTime());
            int otherEnd = otherStart + other.getDurationMinutes();
            if (start < otherEnd && otherStart < end) {
                throw new ConflictException("That time is already taken: " + other.getStudent().getName()
                        + " has a lesson every " + other.getDayOfWeek() + " at " + other.getStartTime()
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

    static LessonResponse toResponse(Lesson lesson, List<AvailabilityBlock> blocks) {
        Student student = lesson.getStudent();
        return new LessonResponse(
                lesson.getId(),
                student.getId(),
                student.getName(),
                lesson.getDayOfWeek(),
                lesson.getStartTime(),
                lesson.getDurationMinutes(),
                lesson.getType(),
                lesson.getColor(),
                lesson.getStartDate(),
                lesson.getEndDate(),
                AvailabilityService.placeFor(lesson.getDayOfWeek(), lesson.getStartTime(), blocks),
                lesson.getCreatedAt());
    }
}

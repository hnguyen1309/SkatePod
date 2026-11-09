package com.skatepod.api.note;

import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.lesson.Lesson;
import com.skatepod.api.lesson.LessonRepository;
import com.skatepod.api.lesson.WeeklyLessons;
import com.skatepod.api.note.dto.NoteRequest;
import com.skatepod.api.note.dto.NoteResponse;
import com.skatepod.api.student.Student;
import com.skatepod.api.student.StudentRepository;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NoteService {

    private final NoteRepository notes;
    private final HistoryCheckRepository historyChecks;
    private final LessonRepository lessons;
    private final StudentRepository students;
    private final Clock clock;

    public NoteService(NoteRepository notes, HistoryCheckRepository historyChecks, LessonRepository lessons,
                       StudentRepository students, Clock clock) {
        this.notes = notes;
        this.historyChecks = historyChecks;
        this.lessons = lessons;
        this.students = students;
        this.clock = clock;
    }

    /**
     * The training history, newest first. Brings it up to date first, so every lesson that has started
     * has an entry. studentId, from and to are optional filters (from and to are included).
     */
    @Transactional
    public List<NoteResponse> list(UUID studentId, Instant from, Instant to) {
        catchUpHistory();
        return notes.findAll().stream()
                .filter(note -> studentId == null || note.getStudent().getId().equals(studentId))
                .filter(note -> from == null || !note.getTime().isBefore(from))
                .filter(note -> to == null || !note.getTime().isAfter(to))
                .sorted(Comparator.comparing(Note::getTime).reversed())
                .map(NoteService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public NoteResponse get(UUID id) {
        return toResponse(find(id));
    }

    @Transactional
    public NoteResponse create(NoteRequest request) {
        Student student = check(request);
        Note note = new Note(student, request.lessonId(), request.date(), request.title().trim(),
                request.lessonType(), request.durationMinutes(), blankToNull(request.overall()),
                blankToNull(request.focus()), blankToNull(request.observations()), blankToNull(request.nextSteps()),
                skills(request), request.shared());
        return toResponse(notes.save(note));
    }

    @Transactional
    public NoteResponse update(UUID id, NoteRequest request) {
        Note note = find(id);
        Student student = check(request);
        note.update(student, request.lessonId(), request.date(), request.title().trim(),
                request.lessonType(), request.durationMinutes(), blankToNull(request.overall()),
                blankToNull(request.focus()), blankToNull(request.observations()), blankToNull(request.nextSteps()),
                skills(request), request.shared());
        return toResponse(note);
    }

    /** Deleting a history entry is for good: catchUpHistory won't add it back. */
    @Transactional
    public void delete(UUID id) {
        notes.delete(find(id));
    }

    /**
     * Adds an empty history entry for every calendar lesson that started since the last check, up to now.
     * Same rule as lessonHistoryToAdd in the app:
     *  - The very first check starts from Monday of this week.
     *  - A lesson's history begins on its start date (or when it was added, for lessons without one)
     *    and stops after its end date.
     *  - A lesson that already has a note for that day doesn't get a second one.
     * Returns how many entries were added.
     */
    @Transactional
    public int catchUpHistory() {
        ZoneId zone = clock.getZone();
        Instant nowInstant = clock.instant();
        LocalDateTime now = LocalDateTime.ofInstant(nowInstant, zone);
        HistoryCheck check = historyChecks.findById(HistoryCheck.ONLY_ROW).orElse(null);
        LocalDateTime since = check != null
                ? LocalDateTime.ofInstant(check.getCheckedAt(), zone)
                : now.toLocalDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();

        // Notes from the start of that day on are enough to see which lessons already have one.
        List<Note> known = new ArrayList<>(notes.findAllByTimeGreaterThanEqual(
                since.toLocalDate().atStartOfDay(zone).toInstant()));
        List<Note> added = new ArrayList<>();
        for (Lesson lesson : lessons.findAll()) {
            LocalDateTime begins = lesson.getStartDate() != null ? lesson.getStartDate().atStartOfDay()
                    : lesson.getCreatedAt() != null ? LocalDateTime.ofInstant(lesson.getCreatedAt(), zone) : since;
            LocalDateTime from = begins.isAfter(since) ? begins : since;
            for (LocalDateTime time : WeeklyLessons.startsBetween(lesson, from, now)) {
                if (findLessonNote(known, lesson, time.toLocalDate(), zone) == null) {
                    Note entry = emptyLessonNote(lesson, time.atZone(zone).toInstant());
                    known.add(entry);
                    added.add(entry);
                }
            }
        }
        notes.saveAll(added);

        if (check == null) {
            historyChecks.save(new HistoryCheck(nowInstant));
        } else {
            check.setCheckedAt(nowInstant);
        }
        return added.size();
    }

    /**
     * The note already written for this lesson on this day, if there is one. Notes without a lessonId
     * (from "Add a past lesson") count too when they're for the same student on the same day.
     * Same rule as findLessonNote in the app.
     */
    static Note findLessonNote(List<Note> candidates, Lesson lesson, LocalDate day, ZoneId zone) {
        List<Note> sameDay = candidates.stream()
                .filter(note -> sameStudent(note.getStudent(), lesson.getStudent()))
                .filter(note -> LocalDate.ofInstant(note.getTime(), zone).equals(day))
                .toList();
        return sameDay.stream()
                .filter(note -> note.getLessonId() != null && note.getLessonId().equals(lesson.getId()))
                .findFirst()
                .orElse(sameDay.stream().filter(note -> note.getLessonId() == null).findFirst().orElse(null));
    }

    private static boolean sameStudent(Student a, Student b) {
        return a == b || (a.getId() != null && a.getId().equals(b.getId()));
    }

    /** A history entry for a lesson that happened, with nothing written in it yet (emptyLessonNote in the app). */
    static Note emptyLessonNote(Lesson lesson, Instant time) {
        return new Note(lesson.getStudent(), lesson.getId(), time, lesson.getType() + " lesson", lesson.getType(),
                lesson.getDurationMinutes(), null, null, null, null, List.of(), false);
    }

    /**
     * The student must exist. A note linked to a lesson must be for that lesson's student.
     * A note without a lesson ("Add a past lesson") can't be dated in the future.
     */
    private Student check(NoteRequest request) {
        Student student = students.findById(request.studentId())
                .orElseThrow(() -> new NotFoundException("Student", request.studentId()));
        if (request.lessonId() != null) {
            Lesson lesson = lessons.findById(request.lessonId())
                    .orElseThrow(() -> new NotFoundException("Lesson", request.lessonId()));
            if (!lesson.getStudent().getId().equals(student.getId())) {
                throw new BadRequestException("That lesson is " + lesson.getStudent().getName()
                        + "'s, not " + student.getName() + "'s");
            }
        } else if (request.date().isAfter(clock.instant())) {
            throw new BadRequestException("A past lesson can't be dated in the future");
        }
        return student;
    }

    private Note find(UUID id) {
        return notes.findById(id).orElseThrow(() -> new NotFoundException("Note", id));
    }

    private static List<String> skills(NoteRequest request) {
        return request.skills() == null ? List.of() : request.skills().stream().map(String::trim).toList();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    static NoteResponse toResponse(Note note) {
        Student student = note.getStudent();
        // Copy the skills now: they load lazily from the database, and the JSON is written after the
        // database session has closed (that gave "Failed to write request" before).
        return new NoteResponse(note.getId(), student.getId(), student.getName(), note.getLessonId(), note.getTime(),
                note.getTitle(), note.getLessonType(), note.getDurationMinutes(), note.getOverall(), note.getFocus(),
                note.getObservations(), note.getNextSteps(), List.copyOf(note.getSkills()), note.isShared(), note.isEmpty(),
                note.getCreatedAt(), note.getUpdatedAt());
    }
}

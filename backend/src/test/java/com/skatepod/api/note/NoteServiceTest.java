package com.skatepod.api.note;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.lesson.Lesson;
import com.skatepod.api.lesson.LessonRepository;
import com.skatepod.api.note.dto.NoteRequest;
import com.skatepod.api.note.dto.NoteResponse;
import com.skatepod.api.student.Student;
import com.skatepod.api.student.StudentRepository;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

/** "Now" is Thursday, October 22, 2026 at noon (UTC, so dates and times read plainly). */
@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    @Mock
    private NoteRepository notes;

    @Mock
    private HistoryCheckRepository historyChecks;

    @Mock
    private LessonRepository lessons;

    @Mock
    private StudentRepository students;

    private NoteService service;

    private static final Instant NOW = Instant.parse("2026-10-22T12:00:00Z");
    private final Student emma = withId(new Student("Emma", List.of()));
    private final Student lily = withId(new Student("Lily", List.of()));

    @BeforeEach
    void setUp() {
        service = new NoteService(notes, historyChecks, lessons, students, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    /** Entities only get an id when saved, so tests give them one by hand. */
    private static <T> T withId(T entity) {
        ReflectionTestUtils.setField(entity, "id", UUID.randomUUID());
        return entity;
    }

    private Lesson weekly(Student student, DayOfWeek day, int hour, LocalDate startDate, LocalDate endDate) {
        return withId(new Lesson(student, day, LocalTime.of(hour, 0), 60, "Freestyle", startDate, endDate));
    }

    @SuppressWarnings("unchecked")
    private List<Note> catchUpAndCaptureAdded() {
        service.catchUpHistory();
        ArgumentCaptor<List<Note>> added = ArgumentCaptor.forClass(List.class);
        verify(notes).saveAll(added.capture());
        return added.getValue();
    }

    @Test
    @DisplayName("First check: adds lessons from Monday of this week up to now, not later today")
    void firstCheckStartsThisWeek() {
        when(historyChecks.findById(1)).thenReturn(Optional.empty());
        Lesson tuesday9 = weekly(emma, DayOfWeek.TUESDAY, 9, null, null);
        Lesson thursday15 = weekly(emma, DayOfWeek.THURSDAY, 15, null, null); // later today
        when(lessons.findAll()).thenReturn(List.of(tuesday9, thursday15));

        List<Note> added = catchUpAndCaptureAdded();

        assertThat(added).hasSize(1);
        Note entry = added.get(0);
        assertThat(entry.getTime()).isEqualTo(Instant.parse("2026-10-20T09:00:00Z"));
        assertThat(entry.getLessonId()).isEqualTo(tuesday9.getId());
        assertThat(entry.getTitle()).isEqualTo("Freestyle lesson");
        assertThat(entry.isEmpty()).isTrue();
        verify(historyChecks).save(any(HistoryCheck.class));
    }

    @Test
    @DisplayName("Later checks only add lessons that started since the last check")
    void sinceLastCheck() {
        HistoryCheck check = new HistoryCheck(Instant.parse("2026-10-22T08:00:00Z"));
        when(historyChecks.findById(1)).thenReturn(Optional.of(check));
        Lesson thursday7 = weekly(emma, DayOfWeek.THURSDAY, 7, null, null); // before the last check
        Lesson thursday9 = weekly(lily, DayOfWeek.THURSDAY, 9, null, null);
        when(lessons.findAll()).thenReturn(List.of(thursday7, thursday9));

        List<Note> added = catchUpAndCaptureAdded();

        assertThat(added).extracting(Note::getLessonId).containsExactly(thursday9.getId());
        assertThat(check.getCheckedAt()).isEqualTo(NOW);
    }

    @Test
    @DisplayName("A lesson that already has a note that day doesn't get a second one")
    void noDuplicates() {
        when(historyChecks.findById(1)).thenReturn(Optional.empty());
        Lesson tuesday9 = weekly(emma, DayOfWeek.TUESDAY, 9, null, null);
        Note written = new Note(emma, tuesday9.getId(), Instant.parse("2026-10-20T09:00:00Z"), "Great lesson",
                "Freestyle", 60, "Steady", "Axel", "", "", List.of(), false);
        when(notes.findAllByTimeGreaterThanEqual(any())).thenReturn(List.of(written));
        when(lessons.findAll()).thenReturn(List.of(tuesday9));

        assertThat(catchUpAndCaptureAdded()).isEmpty();
    }

    @Test
    @DisplayName("History follows a lesson's start and end dates")
    void respectsDates() {
        when(historyChecks.findById(1)).thenReturn(Optional.empty());
        Lesson startsNextWeek = weekly(emma, DayOfWeek.MONDAY, 9, LocalDate.of(2026, 10, 26), null);
        Lesson endedSunday = weekly(lily, DayOfWeek.TUESDAY, 9, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 10, 18));
        Lesson startedWednesday = weekly(lily, DayOfWeek.MONDAY, 10, LocalDate.of(2026, 10, 21), null);
        when(lessons.findAll()).thenReturn(List.of(startsNextWeek, endedSunday, startedWednesday));

        // Monday's lesson (Oct 19) is before startedWednesday's first day, so nothing is added at all.
        assertThat(catchUpAndCaptureAdded()).isEmpty();
    }

    @Test
    @DisplayName("A note for a lesson must be that lesson's student")
    void lessonMustBeTheStudents() {
        Lesson lilysLesson = weekly(lily, DayOfWeek.TUESDAY, 9, null, null);
        when(students.findById(emma.getId())).thenReturn(Optional.of(emma));
        when(lessons.findById(lilysLesson.getId())).thenReturn(Optional.of(lilysLesson));
        NoteRequest request = new NoteRequest(emma.getId(), lilysLesson.getId(), NOW, "Freestyle lesson",
                "Freestyle", 60, null, null, null, null, List.of(), false);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("That lesson is Lily's, not Emma's");
        verify(notes, never()).save(any());
    }

    @Test
    @DisplayName("A past lesson (no calendar lesson) can't be dated in the future")
    void pastLessonNotInTheFuture() {
        when(students.findById(emma.getId())).thenReturn(Optional.of(emma));
        NoteRequest request = new NoteRequest(emma.getId(), null, NOW.plusSeconds(3600), "Extra session",
                "Public", 45, null, null, null, null, List.of(), false);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("A past lesson can't be dated in the future");
    }

    @Test
    @DisplayName("Creating trims text and treats blanks as empty")
    void createTrims() {
        when(students.findById(emma.getId())).thenReturn(Optional.of(emma));
        when(notes.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));
        NoteRequest request = new NoteRequest(emma.getId(), null, NOW.minusSeconds(3600), "  Extra session ",
                "Public", 45, "", "  Edges ", "   ", null, List.of(" Power pulls "), true);

        NoteResponse created = service.create(request);

        assertThat(created.title()).isEqualTo("Extra session");
        assertThat(created.overall()).isNull();
        assertThat(created.focus()).isEqualTo("Edges");
        assertThat(created.observations()).isNull();
        assertThat(created.skills()).containsExactly("Power pulls");
        assertThat(created.empty()).isFalse();
    }

    @Test
    @DisplayName("Listing brings the history up to date first, then shows newest first")
    void listIsNewestFirst() {
        when(historyChecks.findById(1)).thenReturn(Optional.of(new HistoryCheck(NOW)));
        when(lessons.findAll()).thenReturn(List.of());
        Note older = new Note(emma, null, NOW.minusSeconds(86400), "Older", "Public", 45, null, null, null, null, List.of(), false);
        Note newer = new Note(lily, null, NOW.minusSeconds(3600), "Newer", "Public", 45, null, null, null, null, List.of(), false);
        when(notes.findAll()).thenReturn(List.of(older, newer));

        assertThat(service.list(null, null, null)).extracting(NoteResponse::title).containsExactly("Newer", "Older");
        assertThat(service.list(emma.getId(), null, null)).extracting(NoteResponse::title).containsExactly("Older");
        verify(notes, org.mockito.Mockito.atLeastOnce()).saveAll(anyList());
    }
}

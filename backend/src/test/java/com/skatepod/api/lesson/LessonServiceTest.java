package com.skatepod.api.lesson;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.skatepod.api.availability.AvailabilityBlock;
import com.skatepod.api.availability.AvailabilityBlockRepository;
import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.common.ConflictException;
import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.lesson.dto.LessonRequest;
import com.skatepod.api.lesson.dto.LessonResponse;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LessonServiceTest {

    @Mock
    private LessonRepository lessons;

    @Mock
    private StudentRepository students;

    @Mock
    private AvailabilityBlockRepository availability;

    private LessonService service;

    // "Today" is Thursday, October 22, 2026.
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 22);
    private static final DayOfWeek MONDAY = DayOfWeek.MONDAY;

    private final UUID studentId = UUID.randomUUID();
    private final Student emma = new Student("Emma", List.of());
    private final Student lily = new Student("Lily", List.of());

    @BeforeEach
    void setUp() {
        Clock fixed = Clock.fixed(Instant.parse("2026-10-22T12:00:00Z"), ZoneOffset.UTC);
        service = new LessonService(lessons, students, availability, fixed);
    }

    private LessonRequest request(DayOfWeek day, LocalTime start, int minutes, String type) {
        return new LessonRequest(studentId, day, start, minutes, type, null, null);
    }

    private void emmaExists() {
        when(students.findById(studentId)).thenReturn(Optional.of(emma));
    }

    private void saveReturnsTheLesson() {
        when(lessons.save(any(Lesson.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createForUnknownStudentThrowsAndSavesNothing() {
        when(students.findById(studentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(request(MONDAY, LocalTime.of(9, 0), 45, "Freestyle")))
                .isInstanceOf(NotFoundException.class);
        verify(lessons, never()).save(any());
    }

    @Test
    void createStartsTodayWhenNoStartDateIsGivenAndColorFollowsType() {
        emmaExists();
        saveReturnsTheLesson();

        LessonResponse created = service.create(request(DayOfWeek.FRIDAY, LocalTime.of(7, 30), 60, " Public "));

        assertThat(created.studentName()).isEqualTo("Emma");
        assertThat(created.dayOfWeek()).isEqualTo(DayOfWeek.FRIDAY);
        assertThat(created.type()).isEqualTo("Public");
        assertThat(created.color()).isEqualTo(LessonColor.SAND);
        assertThat(created.startDate()).isEqualTo(TODAY);
        assertThat(created.endDate()).isNull();
    }

    @Test
    void newLessonCantStartBeforeToday() {
        emmaExists();
        LessonRequest request = new LessonRequest(studentId, MONDAY, LocalTime.of(9, 0), 45, "Freestyle",
                TODAY.minusDays(1), null);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("can't start before today");
    }

    @Test
    void endDateCantBeBeforeStartDate() {
        emmaExists();
        LessonRequest request = new LessonRequest(studentId, MONDAY, LocalTime.of(9, 0), 45, "Freestyle",
                TODAY.plusDays(10), TODAY.plusDays(3));

        assertThatThrownBy(() -> service.create(request)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void overlappingAnotherStudentsLessonOnTheSameWeekdayIsAConflict() {
        emmaExists();
        // Lily already skates every Monday 9:00-9:45, so Emma at 9:30 clashes.
        when(lessons.findAllByDayOfWeek(MONDAY)).thenReturn(List.of(
                new Lesson(lily, MONDAY, LocalTime.of(9, 0), 45, "Freestyle", null, null)));

        assertThatThrownBy(() -> service.create(request(MONDAY, LocalTime.of(9, 30), 30, "Public")))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Lily has a lesson every MONDAY at 09:00");
        verify(lessons, never()).save(any());
    }

    @Test
    void startingBeforeAnotherLessonButRunningIntoItIsAConflict() {
        emmaExists();
        when(lessons.findAllByDayOfWeek(MONDAY)).thenReturn(List.of(
                new Lesson(emma, MONDAY, LocalTime.of(10, 0), 45, "Freestyle", null, null)));

        // 9:30 + 60 minutes ends at 10:30, after the 10:00 lesson starts.
        assertThatThrownBy(() -> service.create(request(MONDAY, LocalTime.of(9, 30), 60, "Public")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void backToBackIsAllowed() {
        emmaExists();
        saveReturnsTheLesson();
        when(lessons.findAllByDayOfWeek(MONDAY)).thenReturn(List.of(
                new Lesson(emma, MONDAY, LocalTime.of(9, 0), 45, "Freestyle", null, null)));

        LessonResponse created = service.create(request(MONDAY, LocalTime.of(9, 45), 30, "Public"));

        assertThat(created.startTime()).isEqualTo(LocalTime.of(9, 45));
    }

    @Test
    void sameTimeIsFineWhenTheDatesNeverMeet() {
        emmaExists();
        saveReturnsTheLesson();
        // Lily's Monday 9:00 lesson ended last week, so the slot is free again from today.
        when(lessons.findAllByDayOfWeek(MONDAY)).thenReturn(List.of(
                new Lesson(lily, MONDAY, LocalTime.of(9, 0), 45, "Freestyle", TODAY.minusDays(60), TODAY.minusDays(7))));

        LessonResponse created = service.create(request(MONDAY, LocalTime.of(9, 0), 45, "Freestyle"));

        assertThat(created.startTime()).isEqualTo(LocalTime.of(9, 0));
    }

    @Test
    void updateDoesNotClashWithItselfAndKeepsItsStartDate() {
        UUID lessonId = UUID.randomUUID();
        LocalDate startedInSeptember = LocalDate.of(2026, 9, 7);
        Lesson existing = new Lesson(emma, MONDAY, LocalTime.of(9, 0), 45, "Freestyle", startedInSeptember, null);
        when(lessons.findById(lessonId)).thenReturn(Optional.of(existing));
        emmaExists();
        when(lessons.findAllByDayOfWeek(MONDAY)).thenReturn(List.of(existing));

        // 15 minutes longer only overlaps its old self. No startDate sent, so the old one stays (in the past is fine).
        LessonResponse updated = service.update(lessonId, request(MONDAY, LocalTime.of(9, 0), 60, "Freestyle"));

        assertThat(updated.durationMinutes()).isEqualTo(60);
        assertThat(updated.startDate()).isEqualTo(startedInSeptember);
    }

    @Test
    void listIsInWeekOrderWithPlaces() {
        Lesson saturday = new Lesson(emma, DayOfWeek.SATURDAY, LocalTime.of(9, 0), 60, "Public", null, null);
        Lesson mondayLate = new Lesson(emma, MONDAY, LocalTime.of(15, 0), 45, "Off-ice", null, null);
        Lesson mondayEarly = new Lesson(emma, MONDAY, LocalTime.of(7, 0), 45, "Freestyle", null, null);
        when(lessons.findAll()).thenReturn(List.of(saturday, mondayLate, mondayEarly));
        when(availability.findAll()).thenReturn(List.of(
                new AvailabilityBlock(DayOfWeek.SATURDAY, LocalTime.of(8, 0), LocalTime.of(12, 0), "South Rink")));

        List<LessonResponse> result = service.list(null);

        assertThat(result).extracting(LessonResponse::type).containsExactly("Freestyle", "Off-ice", "Public");
        assertThat(result).extracting(LessonResponse::place).containsExactly(null, null, "South Rink");
    }
}

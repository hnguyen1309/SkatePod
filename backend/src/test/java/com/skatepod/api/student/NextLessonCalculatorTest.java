package com.skatepod.api.student;

import static org.assertj.core.api.Assertions.assertThat;

import com.skatepod.api.lesson.Lesson;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * The acceptance criteria for feature #2 (next lesson), now that lessons repeat weekly like in the app.
 * "Now" is Thursday, October 22, 2026 unless a test says otherwise.
 */
class NextLessonCalculatorTest {

    private static final LocalDate THURSDAY = LocalDate.of(2026, 10, 22);
    private static final LocalDateTime THURSDAY_8AM = THURSDAY.atTime(8, 0);
    private static final LocalDateTime THURSDAY_9AM = THURSDAY.atTime(9, 0);
    private static final LocalDateTime THURSDAY_10AM = THURSDAY.atTime(10, 0);

    private final NextLessonCalculator calculator = new NextLessonCalculator();
    private final Student emma = new Student("Emma", List.of());

    private Lesson weekly(DayOfWeek day, int hour) {
        return dated(day, hour, null, null);
    }

    private Lesson dated(DayOfWeek day, int hour, LocalDate startDate, LocalDate endDate) {
        return new Lesson(emma, day, LocalTime.of(hour, 0), 45, "Freestyle", startDate, endDate);
    }

    @Test
    @DisplayName("No lessons means not scheduled")
    void noLessons() {
        assertThat(calculator.findNext(List.of(), THURSDAY_8AM)).isEmpty();
    }

    @Test
    @DisplayName("Picks a lesson later today over one tomorrow")
    void laterToday() {
        Lesson thursday9 = weekly(DayOfWeek.THURSDAY, 9);
        Lesson friday7 = weekly(DayOfWeek.FRIDAY, 7);

        var next = calculator.findNext(List.of(friday7, thursday9), THURSDAY_8AM).orElseThrow();

        assertThat(next.lesson()).isSameAs(thursday9);
        assertThat(next.startsAt()).isEqualTo(THURSDAY_9AM);
    }

    @Test
    @DisplayName("A lesson starting right now still counts as next")
    void startingNow() {
        Lesson thursday9 = weekly(DayOfWeek.THURSDAY, 9);

        assertThat(calculator.findNext(List.of(thursday9), THURSDAY_9AM).orElseThrow().startsAt()).isEqualTo(THURSDAY_9AM);
    }

    @Test
    @DisplayName("A lesson that already started today counts as next week's")
    void alreadyStartedToday() {
        Lesson thursday9 = weekly(DayOfWeek.THURSDAY, 9);

        assertThat(calculator.findNext(List.of(thursday9), THURSDAY_10AM).orElseThrow().startsAt())
                .isEqualTo(THURSDAY.plusWeeks(1).atTime(9, 0));
    }

    @Test
    @DisplayName("Earlier in the week means next week: Tuesday comes after Saturday")
    void wrapsToNextWeek() {
        Lesson tuesday = weekly(DayOfWeek.TUESDAY, 9);
        Lesson saturday = weekly(DayOfWeek.SATURDAY, 9);

        assertThat(calculator.findNext(List.of(tuesday, saturday), THURSDAY_10AM).orElseThrow().lesson()).isSameAs(saturday);
    }

    @Test
    @DisplayName("A lesson that starts later begins on its first day")
    void startsLater() {
        Lesson fromNovember = dated(DayOfWeek.FRIDAY, 13, LocalDate.of(2026, 11, 5), null);

        assertThat(calculator.findNext(List.of(fromNovember), THURSDAY_8AM).orElseThrow().startsAt())
                .isEqualTo(LocalDateTime.of(2026, 11, 6, 13, 0));
    }

    @Test
    @DisplayName("A lesson that has ended is skipped: nothing upcoming means not scheduled")
    void ended() {
        Lesson ended = dated(DayOfWeek.SUNDAY, 7, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 10, 18));

        assertThat(calculator.findNext(List.of(ended), THURSDAY_8AM)).isEmpty();
    }

    @Test
    @DisplayName("A lesson whose last day is today, later today, still counts")
    void lastDayToday() {
        Lesson lastOne = dated(DayOfWeek.THURSDAY, 9, LocalDate.of(2026, 9, 1), THURSDAY);

        assertThat(calculator.findNext(List.of(lastOne), THURSDAY_8AM)).isPresent();
        assertThat(calculator.findNext(List.of(lastOne), THURSDAY_10AM)).isEmpty();
    }
}

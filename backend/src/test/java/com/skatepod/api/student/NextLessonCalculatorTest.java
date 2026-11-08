package com.skatepod.api.student;

import static org.assertj.core.api.Assertions.assertThat;

import com.skatepod.api.lesson.Lesson;
import com.skatepod.api.lesson.LessonColor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 👋 Han: these tests are the acceptance criteria for feature #2.
 * Delete the @Disabled line below, run ./mvnw test, and make them all pass
 * by implementing NextLessonCalculator.findNext().
 */
class NextLessonCalculatorTest {

    private static final LocalDate LAST_THURSDAY = LocalDate.of(2026, 10, 15);
    private static final LocalDate TUESDAY = LocalDate.of(2026, 10, 20);
    private static final LocalDate WEDNESDAY = LocalDate.of(2026, 10, 21);
    private static final LocalDate THURSDAY = LocalDate.of(2026, 10, 22);
    private static final LocalDate FRIDAY = LocalDate.of(2026, 10, 23);
    private static final LocalDate SATURDAY = LocalDate.of(2026, 10, 24);
    private static final LocalDate NEXT_TUESDAY = LocalDate.of(2026, 10, 27);
    private static final LocalDate THREE_WEEKS_OUT = LocalDate.of(2026, 11, 12);

    // Thursday, October 22, 2026
    private static final LocalDateTime THURSDAY_8AM = THURSDAY.atTime(8, 0);
    private static final LocalDateTime THURSDAY_9AM = THURSDAY.atTime(9, 0);
    private static final LocalDateTime THURSDAY_10AM = THURSDAY.atTime(10, 0);
    private static final LocalDateTime WEDNESDAY_NOON = WEDNESDAY.atTime(12, 0);

    private final NextLessonCalculator calculator = new NextLessonCalculator();
    private final Student emma = new Student("Emma", List.of());

    private Lesson lesson(LocalDate date, int hour) {
        return new Lesson(emma, date, LocalTime.of(hour, 0), 45, "Freestyle", LessonColor.TEAL);
    }

    @Test
    @DisplayName("No lessons means not scheduled")
    void noLessons() {
        assertThat(calculator.findNext(List.of(), THURSDAY_8AM)).isEmpty();
    }

    @Test
    @DisplayName("Picks a lesson later today over one tomorrow")
    void laterToday() {
        Lesson thursday9 = lesson(THURSDAY, 9);
        Lesson friday7 = lesson(FRIDAY, 7);

        assertThat(calculator.findNext(List.of(friday7, thursday9), THURSDAY_8AM)).containsSame(thursday9);
    }

    @Test
    @DisplayName("A lesson starting right now still counts as next")
    void startingNow() {
        Lesson thursday9 = lesson(THURSDAY, 9);

        assertThat(calculator.findNext(List.of(thursday9), THURSDAY_9AM)).containsSame(thursday9);
    }

    @Test
    @DisplayName("Skips lessons that already started today")
    void skipsEarlierToday() {
        Lesson thursday9 = lesson(THURSDAY, 9);
        Lesson saturday9 = lesson(SATURDAY, 9);

        assertThat(calculator.findNext(List.of(thursday9, saturday9), THURSDAY_10AM)).containsSame(saturday9);
    }

    @Test
    @DisplayName("Twice a week: picks the next of the week's two lessons")
    void twiceAWeek() {
        Lesson tuesday = lesson(TUESDAY, 9);
        Lesson thursday = lesson(THURSDAY, 9);
        Lesson nextTuesday = lesson(NEXT_TUESDAY, 9);

        assertThat(calculator.findNext(List.of(nextTuesday, tuesday, thursday), WEDNESDAY_NOON)).containsSame(thursday);
    }

    @Test
    @DisplayName("Less than once a week: a lesson weeks away is still the next one")
    void lessThanWeekly() {
        Lesson lastThursday = lesson(LAST_THURSDAY, 9);
        Lesson threeWeeksOut = lesson(THREE_WEEKS_OUT, 9);

        assertThat(calculator.findNext(List.of(lastThursday, threeWeeksOut), THURSDAY_8AM)).containsSame(threeWeeksOut);
    }

    @Test
    @DisplayName("Past lessons don't repeat: nothing upcoming means not scheduled")
    void onlyPastLessons() {
        Lesson lastThursday = lesson(LAST_THURSDAY, 9);
        Lesson thursday9 = lesson(THURSDAY, 9);

        assertThat(calculator.findNext(List.of(lastThursday, thursday9), THURSDAY_10AM)).isEmpty();
    }
}

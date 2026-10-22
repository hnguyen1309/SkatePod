package com.skatepod.api.student;

import static org.assertj.core.api.Assertions.assertThat;

import com.skatepod.api.lesson.Lesson;
import com.skatepod.api.lesson.LessonColor;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 👋 Han: these tests are the acceptance criteria for feature #2.
 * Delete the @Disabled line below, run ./gradlew test, and make them all pass
 * by implementing NextLessonCalculator.findNext().
 */
@Disabled("Han: remove this line when you start building feature #2")
class NextLessonCalculatorTest {

    // Thursday, October 22, 2026
    private static final LocalDateTime THURSDAY_8AM = LocalDateTime.of(2026, 10, 22, 8, 0);
    private static final LocalDateTime THURSDAY_9AM = LocalDateTime.of(2026, 10, 22, 9, 0);
    private static final LocalDateTime THURSDAY_10AM = LocalDateTime.of(2026, 10, 22, 10, 0);
    private static final LocalDateTime SUNDAY_6PM = LocalDateTime.of(2026, 10, 25, 18, 0);

    private final NextLessonCalculator calculator = new NextLessonCalculator();
    private final Student emma = new Student("Emma", "Pre-Gold", "Freestyle", null, 50);

    private Lesson lesson(DayOfWeek day, int hour) {
        return new Lesson(emma, day, LocalTime.of(hour, 0), 45, "Freestyle", LessonColor.TEAL);
    }

    @Test
    @DisplayName("No lessons means not scheduled")
    void noLessons() {
        assertThat(calculator.findNext(List.of(), THURSDAY_8AM)).isEmpty();
    }

    @Test
    @DisplayName("Picks a lesson later today over one tomorrow")
    void laterToday() {
        Lesson thursday9 = lesson(DayOfWeek.THURSDAY, 9);
        Lesson friday7 = lesson(DayOfWeek.FRIDAY, 7);

        assertThat(calculator.findNext(List.of(friday7, thursday9), THURSDAY_8AM)).containsSame(thursday9);
    }

    @Test
    @DisplayName("A lesson starting right now still counts as next")
    void startingNow() {
        Lesson thursday9 = lesson(DayOfWeek.THURSDAY, 9);

        assertThat(calculator.findNext(List.of(thursday9), THURSDAY_9AM)).containsSame(thursday9);
    }

    @Test
    @DisplayName("Skips lessons that already started today")
    void skipsEarlierToday() {
        Lesson thursday9 = lesson(DayOfWeek.THURSDAY, 9);
        Lesson saturday9 = lesson(DayOfWeek.SATURDAY, 9);

        assertThat(calculator.findNext(List.of(thursday9, saturday9), THURSDAY_10AM)).containsSame(saturday9);
    }

    @Test
    @DisplayName("Wraps around to next week on Sunday evening")
    void wrapsToNextWeek() {
        Lesson monday7 = lesson(DayOfWeek.MONDAY, 7);
        Lesson thursday9 = lesson(DayOfWeek.THURSDAY, 9);

        assertThat(calculator.findNext(List.of(thursday9, monday7), SUNDAY_6PM)).containsSame(monday7);
    }

    @Test
    @DisplayName("If the only lesson already happened today, it's next week's")
    void onlyLessonAlreadyHappened() {
        Lesson thursday9 = lesson(DayOfWeek.THURSDAY, 9);

        assertThat(calculator.findNext(List.of(thursday9), THURSDAY_10AM)).containsSame(thursday9);
    }
}

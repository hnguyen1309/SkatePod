package com.skatepod.api.lesson;

import static org.assertj.core.api.Assertions.assertThat;

import com.skatepod.api.student.Student;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class WeeklyLessonsTest {

    private static final LocalDate SEP_1 = LocalDate.of(2026, 9, 1);
    private static final LocalDate SEP_30 = LocalDate.of(2026, 9, 30);
    private static final LocalDate OCT_1 = LocalDate.of(2026, 10, 1);
    private static final LocalDate OCT_15 = LocalDate.of(2026, 10, 15);
    private static final LocalDate OCT_31 = LocalDate.of(2026, 10, 31);

    private final Student emma = new Student("Emma", List.of());

    private Lesson tuesdayAt9(LocalDate startDate, LocalDate endDate) {
        return new Lesson(emma, DayOfWeek.TUESDAY, LocalTime.of(9, 0), 60, "Freestyle", startDate, endDate);
    }

    @Test
    @DisplayName("Date ranges that meet overlap; ones that don't, don't; no dates means no limit")
    void datesOverlap() {
        assertThat(WeeklyLessons.datesOverlap(SEP_1, OCT_31, OCT_15, null)).isTrue();
        assertThat(WeeklyLessons.datesOverlap(SEP_1, SEP_30, OCT_1, null)).isFalse();
        assertThat(WeeklyLessons.datesOverlap(OCT_1, null, SEP_1, SEP_30)).isFalse();
        assertThat(WeeklyLessons.datesOverlap(null, null, OCT_1, OCT_1)).isTrue();
        assertThat(WeeklyLessons.datesOverlap(SEP_1, OCT_1, OCT_1, OCT_31)).isTrue(); // same last/first day
    }

    @Test
    @DisplayName("Lists each week's start after `from` and up to `to`, inside the lesson's dates")
    void startsBetween() {
        // Tuesdays from Oct 6 to Oct 20 only.
        Lesson lesson = tuesdayAt9(LocalDate.of(2026, 10, 6), LocalDate.of(2026, 10, 20));

        List<LocalDateTime> times = WeeklyLessons.startsBetween(lesson,
                LocalDateTime.of(2026, 9, 28, 0, 0), LocalDateTime.of(2026, 10, 31, 0, 0));

        assertThat(times).containsExactly(
                LocalDateTime.of(2026, 10, 6, 9, 0),
                LocalDateTime.of(2026, 10, 13, 9, 0),
                LocalDateTime.of(2026, 10, 20, 9, 0));
    }

    @Test
    @DisplayName("A lesson starting exactly at `to` is included; one exactly at `from` isn't")
    void startsBetweenEdges() {
        Lesson lesson = tuesdayAt9(null, null);
        LocalDateTime tuesday9 = LocalDateTime.of(2026, 10, 20, 9, 0);

        assertThat(WeeklyLessons.startsBetween(lesson, tuesday9.minusMinutes(1), tuesday9)).containsExactly(tuesday9);
        assertThat(WeeklyLessons.startsBetween(lesson, tuesday9, tuesday9.plusDays(1))).isEmpty();
    }
}

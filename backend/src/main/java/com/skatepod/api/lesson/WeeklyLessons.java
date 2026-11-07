package com.skatepod.api.lesson;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Date rules for weekly lessons. These are copies of the app's rules in mobile/src/data.ts
 * (datesOverlap, isLessonActiveOn, nextLessonTime, lessonTimesBetween): change both together.
 */
public final class WeeklyLessons {

    private WeeklyLessons() {
    }

    /**
     * Do two weekly lessons ever run in the same week? A missing start or end date means "no limit".
     * Example: Sep 1–Oct 31 and Oct 15–(no end) overlap; Sep 1–Sep 30 and Oct 1–(no end) don't.
     */
    public static boolean datesOverlap(LocalDate startA, LocalDate endA, LocalDate startB, LocalDate endB) {
        boolean aStartsBeforeBEnds = startA == null || endB == null || !startA.isAfter(endB);
        boolean bStartsBeforeAEnds = startB == null || endA == null || !startB.isAfter(endA);
        return aStartsBeforeBEnds && bStartsBeforeAEnds;
    }

    /** Is the lesson running on this calendar day (between its start and end dates)? */
    public static boolean isActiveOn(Lesson lesson, LocalDate date) {
        return (lesson.getStartDate() == null || !date.isBefore(lesson.getStartDate()))
                && (lesson.getEndDate() == null || !date.isAfter(lesson.getEndDate()));
    }

    /**
     * When the lesson next starts at or after `now`, or empty if it has ended.
     * A lesson that already started today counts as next week's. A lesson that starts
     * later (startDate in the future) gives its first day.
     */
    public static Optional<LocalDateTime> nextStart(Lesson lesson, LocalDateTime now) {
        LocalDate monday = now.toLocalDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDateTime time = monday.with(TemporalAdjusters.nextOrSame(lesson.getDayOfWeek())).atTime(lesson.getStartTime());
        if (time.isBefore(now)) {
            time = time.plusWeeks(1);
        }
        while (lesson.getStartDate() != null && time.toLocalDate().isBefore(lesson.getStartDate())) {
            time = time.plusWeeks(1);
        }
        if (lesson.getEndDate() != null && time.toLocalDate().isAfter(lesson.getEndDate())) {
            return Optional.empty();
        }
        return Optional.of(time);
    }

    /**
     * Every time the lesson started after `from` and up to and including `to`, skipping weeks outside
     * its start and end dates. Used to fill in the training history.
     */
    public static List<LocalDateTime> startsBetween(Lesson lesson, LocalDateTime from, LocalDateTime to) {
        List<LocalDateTime> times = new ArrayList<>();
        LocalDate monday = from.toLocalDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDateTime time = monday.with(TemporalAdjusters.nextOrSame(lesson.getDayOfWeek())).atTime(lesson.getStartTime());
        for (; !time.isAfter(to); time = time.plusWeeks(1)) {
            if (lesson.getEndDate() != null && time.toLocalDate().isAfter(lesson.getEndDate())) {
                break;
            }
            if (time.isAfter(from) && isActiveOn(lesson, time.toLocalDate())) {
                times.add(time);
            }
        }
        return times;
    }
}

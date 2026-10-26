package com.skatepod.api.student;

import com.skatepod.api.lesson.Lesson;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * Feature #2: "As an instructor, I want each student's next lesson to come from my calendar,
 * so that I always see accurate schedule info without updating it twice."
 *
 * 👋 Han, this one is yours to build! The tests in NextLessonCalculatorTest describe what it
 * should do. Remove the @Disabled line there, run ./mvnw test, and make them pass.
 *
 * Rules (from the acceptance criteria):
 *  - The calendar is the source of truth. Each lesson is one dated entry on it
 *    (a date and a startTime). Nothing repeats automatically.
 *  - A student can have any number of lessons: twice a week, once a month, or a one-off.
 *  - Return the lesson that starts soonest at or after `now`.
 *  - Lessons that have already started (an earlier date, or earlier today) are skipped.
 *  - No upcoming lessons → Optional.empty() (the app shows "Not scheduled").
 *
 * Hint: lesson.getDate().atTime(lesson.getStartTime()) gives the moment a lesson starts.
 * Keep the ones that aren't before `now`, then pick the earliest.
 */
@Component
public class NextLessonCalculator {

    public Optional<Lesson> findNext(List<Lesson> lessons, LocalDateTime now) {
        
        Lesson bestLesson = null;
        LocalDateTime bestStartsAt = null;

        for (Lesson lesson : lessons) {
            LocalDateTime startsAt = lesson.getDate().atTime(lesson.getStartTime());

            // Already started, so it can't be the next lesson.
            if (startsAt.isBefore(now)) {
                continue;
            }

            // First upcoming lesson found, or sooner than the best so far.
            if (bestLesson == null || startsAt.isBefore(bestStartsAt)) {
                bestLesson = lesson;
                bestStartsAt = startsAt;
            }
        }

        // Still null if there were no lessons, or they were all in the past.
        return Optional.ofNullable(bestLesson);
    }
}

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
 * should do. Remove the @Disabled line there, run ./gradlew test, and make them pass.
 *
 * Rules (from the acceptance criteria):
 *  - Lessons repeat every week (each has a dayOfWeek and startTime).
 *  - Return the lesson that starts soonest at or after `now`.
 *  - If every lesson this week has already started, wrap around to next week.
 *  - No lessons → Optional.empty() (the app shows "Not scheduled").
 *
 * Hint: for each lesson, work out how many minutes from `now` until it next starts
 * (0 to 7 days ahead), then pick the smallest. Look at now.getDayOfWeek(),
 * now.toLocalTime(), and DayOfWeek.getValue().
 */
@Component
public class NextLessonCalculator {

    public Optional<Lesson> findNext(List<Lesson> lessons, LocalDateTime now) {
        // TODO(Han): implement feature #2.
        return Optional.empty();
    }
}

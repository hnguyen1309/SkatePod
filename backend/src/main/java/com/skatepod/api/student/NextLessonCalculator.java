package com.skatepod.api.student;

import com.skatepod.api.lesson.Lesson;
import com.skatepod.api.lesson.WeeklyLessons;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * Feature #2: "As an instructor, I want each student's next lesson to come from my calendar,
 * so that I always see accurate schedule info without updating it twice."
 *
 * Han, you built the first version of this for dated lessons. Lessons repeat weekly again now
 * (like the app), so this works out when each lesson next happens and picks the soonest:
 *  - The calendar is the source of truth. Each lesson repeats every week on its day and time,
 *    from its start date until its end date (if it has one).
 *  - A lesson starting right now still counts. One that already started today counts as next week's.
 *  - A lesson that has ended (end date passed) is skipped.
 *  - No upcoming lessons → Optional.empty() (the app shows "Not scheduled").
 * Same rule as findNextLesson / nextLessonTime in the app.
 */
@Component
public class NextLessonCalculator {

    /** The next lesson and the moment it starts. */
    public record Upcoming(Lesson lesson, LocalDateTime startsAt) {
    }

    public Optional<Upcoming> findNext(List<Lesson> lessons, LocalDateTime now) {
        Upcoming best = null;
        for (Lesson lesson : lessons) {
            Optional<LocalDateTime> startsAt = WeeklyLessons.nextStart(lesson, now);
            // Sooner than the best so far (or the first one found).
            if (startsAt.isPresent() && (best == null || startsAt.get().isBefore(best.startsAt()))) {
                best = new Upcoming(lesson, startsAt.get());
            }
        }
        return Optional.ofNullable(best);
    }
}

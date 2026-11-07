package com.skatepod.api.lesson;

import java.time.DayOfWeek;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    List<Lesson> findAllByStudentId(UUID studentId);

    /** Every weekly lesson on one weekday, for any student. Used to stop double booking. */
    List<Lesson> findAllByDayOfWeek(DayOfWeek dayOfWeek);
}

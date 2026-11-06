package com.skatepod.api.lesson;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    List<Lesson> findAllByStudentId(UUID studentId);

    /** Every lesson on one day, for any student. Used to stop double booking. */
    List<Lesson> findAllByDate(LocalDate date);
}

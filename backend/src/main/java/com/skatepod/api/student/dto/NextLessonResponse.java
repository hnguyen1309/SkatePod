package com.skatepod.api.student.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/** A student's soonest upcoming lesson, shown on their profile. Null when nothing is scheduled. */
public record NextLessonResponse(
        UUID lessonId,
        LocalDate date,
        LocalTime startTime,
        String type,
        int durationMinutes) {
}

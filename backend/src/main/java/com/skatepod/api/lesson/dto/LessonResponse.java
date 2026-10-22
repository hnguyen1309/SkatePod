package com.skatepod.api.lesson.dto;

import com.skatepod.api.lesson.LessonColor;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.UUID;

/** What the API returns for a lesson. */
public record LessonResponse(
        UUID id,
        UUID studentId,
        String studentName,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        int durationMinutes,
        String type,
        LessonColor color) {
}

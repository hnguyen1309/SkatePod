package com.skatepod.api.lesson.dto;

import com.skatepod.api.lesson.LessonColor;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * What the API returns for a weekly lesson.
 * place is the availability block the lesson starts in (e.g. "North Rink"), or null.
 */
public record LessonResponse(
        UUID id,
        UUID studentId,
        String studentName,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        int durationMinutes,
        String type,
        LessonColor color,
        LocalDate startDate,
        LocalDate endDate,
        String place,
        Instant createdAt) {
}

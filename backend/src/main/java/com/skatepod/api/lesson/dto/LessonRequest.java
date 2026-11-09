package com.skatepod.api.lesson.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * What the app sends to create or update a weekly lesson.
 * Example: {"studentId": "...", "dayOfWeek": "TUESDAY", "startTime": "09:30", "durationMinutes": 45,
 *           "type": "Freestyle", "startDate": "2026-11-10", "endDate": null}
 *
 * - The start time can be any minute (6:32 is fine), like the app's calendar.
 * - The type must be exactly "Public", "Freestyle" or "Off-ice". The color follows from it.
 * - startDate can be left out: a new lesson then starts today. A new lesson can't start before today.
 * - endDate can be left out (the lesson keeps going) and can't be before startDate.
 */
public record LessonRequest(
        @NotNull UUID studentId,
        @NotNull DayOfWeek dayOfWeek,
        @NotNull LocalTime startTime,
        @NotNull @Min(5) @Max(240) Integer durationMinutes,
        @NotNull @Pattern(regexp = "Public|Freestyle|Off-ice", message = "must be Public, Freestyle or Off-ice") String type,
        LocalDate startDate,
        LocalDate endDate) {
}

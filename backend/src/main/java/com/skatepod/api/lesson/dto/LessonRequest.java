package com.skatepod.api.lesson.dto;

import com.skatepod.api.lesson.LessonColor;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * What the app sends to create or update a lesson.
 * Example: {"studentId": "...", "date": "2026-10-22", "startTime": "09:00",
 *           "durationMinutes": 45, "type": "Freestyle", "color": "TEAL"}
 * The type must be exactly "Public", "Freestyle" or "Off-ice" (the database checks this too).
 */
public record LessonRequest(
        @NotNull UUID studentId,
        @NotNull LocalDate date,
        @NotNull LocalTime startTime,
        @NotNull @Min(5) @Max(240) Integer durationMinutes,
        @NotNull @Pattern(regexp = "Public|Freestyle|Off-ice", message = "must be Public, Freestyle or Off-ice") String type,
        @NotNull LessonColor color) {
}

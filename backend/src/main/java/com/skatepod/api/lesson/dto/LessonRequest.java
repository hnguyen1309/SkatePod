package com.skatepod.api.lesson.dto;

import com.skatepod.api.lesson.LessonColor;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * What the app sends to create or update a lesson.
 * Example: {"studentId": "...", "date": "2026-10-22", "startTime": "09:00",
 *           "durationMinutes": 45, "type": "Freestyle", "color": "TEAL"}
 */
public record LessonRequest(
        @NotNull UUID studentId,
        @NotNull LocalDate date,
        @NotNull LocalTime startTime,
        @NotNull @Min(5) @Max(240) Integer durationMinutes,
        @NotBlank @Size(max = 40) String type,
        @NotNull LessonColor color) {
}

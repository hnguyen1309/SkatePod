package com.skatepod.api.availability.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.DayOfWeek;
import java.time.LocalTime;

/**
 * What the app sends to add or change an availability block.
 * Example: {"dayOfWeek": "TUESDAY", "startTime": "15:00", "endTime": "18:00", "place": "North Rink"}
 * place is optional. The end must be after the start, and blocks on one day can't overlap.
 */
public record AvailabilityBlockRequest(
        @NotNull DayOfWeek dayOfWeek,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @Size(max = 60) String place) {
}

package com.skatepod.api.availability.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.UUID;

/** What the API returns for an availability block. place is null when the coach didn't name one. */
public record AvailabilityBlockResponse(
        UUID id,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        String place) {
}

package com.skatepod.api.note.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * What the app sends to add or change a note. Field names match the app's Note type, except the length
 * is a number of minutes (durationMinutes: 60) instead of text ("60 minutes").
 *
 * - lessonId links the note to a calendar lesson; it must be that student's lesson.
 *   Leave it out for "Add a past lesson", whose date can't be in the future.
 * - overall is one of the app's choices (OVERALL in data.ts), or left out.
 */
public record NoteRequest(
        @NotNull UUID studentId,
        UUID lessonId,
        @NotNull Instant date,
        @NotBlank @Size(max = 120) String title,
        @NotNull @Pattern(regexp = "Public|Freestyle|Off-ice", message = "must be Public, Freestyle or Off-ice") String lessonType,
        @NotNull @Min(5) @Max(240) Integer durationMinutes,
        @Pattern(regexp = "|Strong progress|Steady|Tough session|Breakthrough",
                message = "must be Strong progress, Steady, Tough session or Breakthrough") String overall,
        @Size(max = 200) String focus,
        @Size(max = 5000) String observations,
        @Size(max = 5000) String nextSteps,
        @Size(max = 30) List<@NotBlank @Size(max = 80) String> skills,
        @NotNull Boolean shared) {
}

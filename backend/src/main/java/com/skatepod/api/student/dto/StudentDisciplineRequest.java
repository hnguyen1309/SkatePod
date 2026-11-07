package com.skatepod.api.student.dto;

import com.skatepod.api.student.Discipline;
import com.skatepod.api.student.Track;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * One discipline in a student request.
 * Example: {"discipline": "STANDARD_FREESKATE", "track": "CHAMPIONSHIP", "level": "Pre-Gold"}
 * StudentService checks that the level belongs to the discipline.
 * The track isn't shown on the student profile; it's there for the Programs panel.
 */
public record StudentDisciplineRequest(
        @NotNull Discipline discipline,
        @NotNull Track track,
        @NotBlank String level) {
}

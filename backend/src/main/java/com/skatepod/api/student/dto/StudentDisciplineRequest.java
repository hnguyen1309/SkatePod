package com.skatepod.api.student.dto;

import com.skatepod.api.student.Discipline;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * One discipline in a student request. Example: {"discipline": "STANDARD_FREESKATE", "level": "Pre-Gold"}
 * StudentService checks that the level belongs to the discipline.
 */
public record StudentDisciplineRequest(
        @NotNull Discipline discipline,
        @NotBlank String level) {
}

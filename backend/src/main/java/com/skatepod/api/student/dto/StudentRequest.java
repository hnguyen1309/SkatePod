package com.skatepod.api.student.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * What the app sends to create or update a student.
 * disciplines can be left out or empty. Each discipline can only be listed once.
 */
public record StudentRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 200) String focus,
        @NotNull @Min(0) @Max(100) Integer progress,
        @Valid List<@NotNull StudentDisciplineRequest> disciplines) {
}

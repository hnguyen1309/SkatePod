package com.skatepod.api.student.dto;

import jakarta.validation.Valid;
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
        @Valid List<@NotNull StudentDisciplineRequest> disciplines) {
}

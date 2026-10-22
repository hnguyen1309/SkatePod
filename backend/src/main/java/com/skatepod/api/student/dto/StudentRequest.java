package com.skatepod.api.student.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** What the app sends to create or update a student. */
public record StudentRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 60) String level,
        @NotBlank @Size(max = 60) String discipline,
        @Size(max = 200) String focus,
        @NotNull @Min(0) @Max(100) Integer progress) {
}

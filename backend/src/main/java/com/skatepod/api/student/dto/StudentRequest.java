package com.skatepod.api.student.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * What the app sends to create or update a student.
 * disciplines can be left out or empty. Each discipline can only be listed once.
 * phone is optional: digits, spaces and + ( ) - . only; StudentService checks it has 7 to 15 digits
 * (same rule as phoneProblem in the app's data.ts).
 */
public record StudentRequest(
        @NotBlank @Size(max = 100) String name,
        @Valid List<@NotNull StudentDisciplineRequest> disciplines,
        @Size(max = 30) @Pattern(regexp = "[0-9+()\\-. ]*", message = "may only use digits, spaces and + ( ) - .") String phone) {

    /** A request without a phone number (handy in tests). */
    public StudentRequest(String name, List<StudentDisciplineRequest> disciplines) {
        this(name, disciplines, null);
    }
}

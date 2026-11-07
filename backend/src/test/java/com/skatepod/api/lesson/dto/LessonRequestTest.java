package com.skatepod.api.lesson.dto;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Checks the rules on a lesson request (type, length), the same way Spring does for @Valid requests. */
class LessonRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private Set<ConstraintViolation<LessonRequest>> validate(String type, int minutes) {
        LessonRequest request = new LessonRequest(UUID.randomUUID(), DayOfWeek.MONDAY, LocalTime.of(9, 0),
                minutes, type, null, null);
        return validator.validate(request);
    }

    @ParameterizedTest
    @ValueSource(strings = {"Public", "Freestyle", "Off-ice"})
    void acceptsTheThreeLessonTypes(String type) {
        assertThat(validate(type, 45)).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"Moves", "Program", "Spins", "freestyle", "Off ice", ""})
    void rejectsAnyOtherLessonType(String type) {
        assertThat(validate(type, 45)).extracting(violation -> violation.getPropertyPath().toString()).containsExactly("type");
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 4, 241, 300})
    void rejectsLengthsOutside5To240Minutes(int minutes) {
        assertThat(validate("Freestyle", minutes)).extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("durationMinutes");
    }
}

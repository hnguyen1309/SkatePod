package com.skatepod.api.lesson.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.skatepod.api.lesson.LessonColor;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Checks the @Pattern rule on the lesson type, the same way Spring does for @Valid requests. */
class LessonRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private Set<ConstraintViolation<LessonRequest>> validate(String type) {
        LessonRequest request = new LessonRequest(UUID.randomUUID(), LocalDate.of(2026, 10, 26), LocalTime.of(9, 0),
                45, type, LessonColor.TEAL);
        return validator.validate(request);
    }

    @ParameterizedTest
    @ValueSource(strings = {"Public", "Freestyle", "Off-ice"})
    void acceptsTheThreeLessonTypes(String type) {
        assertThat(validate(type)).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"Moves", "Program", "Spins", "freestyle", "Off ice", ""})
    void rejectsAnyOtherLessonType(String type) {
        assertThat(validate(type)).extracting(violation -> violation.getPropertyPath().toString()).containsExactly("type");
    }
}

package com.skatepod.api.student.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** What the API returns for a student. */
public record StudentResponse(
        UUID id,
        String name,
        List<StudentDisciplineResponse> disciplines,
        NextLessonResponse nextLesson,
        Instant createdAt,
        Instant updatedAt) {
}

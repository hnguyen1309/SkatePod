package com.skatepod.api.student.dto;

import java.time.Instant;
import java.util.UUID;

/** What the API returns for a student. */
public record StudentResponse(
        UUID id,
        String name,
        String level,
        String discipline,
        String focus,
        int progress,
        NextLessonResponse nextLesson,
        Instant createdAt,
        Instant updatedAt) {
}

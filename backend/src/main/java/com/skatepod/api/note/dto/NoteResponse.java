package com.skatepod.api.note.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** What the API returns for a note. empty is true when nothing has been written in it yet. */
public record NoteResponse(
        UUID id,
        UUID studentId,
        String studentName,
        UUID lessonId,
        Instant date,
        String title,
        String lessonType,
        int durationMinutes,
        String overall,
        String focus,
        String observations,
        String nextSteps,
        List<String> skills,
        boolean shared,
        boolean empty,
        Instant createdAt,
        Instant updatedAt) {
}

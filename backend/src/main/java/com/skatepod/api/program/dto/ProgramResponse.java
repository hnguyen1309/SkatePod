package com.skatepod.api.program.dto;

import com.skatepod.api.music.dto.MusicFileResponse;
import com.skatepod.api.program.ElementCatalog;
import com.skatepod.api.student.Track;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** One of a student's programs. musicFile is null when no file was uploaded; it's played from GET /api/music/{id}. */
public record ProgramResponse(
        UUID id,
        UUID studentId,
        String studentName,
        String name,
        String musicTitle,
        String artist,
        String duration,
        Track track,
        String trackName,
        String level,
        String musicLink,
        MusicFileResponse musicFile,
        List<ElementCatalog.Element> elements,
        List<List<RinkPointDto>> paths,
        List<PlacementDto> placements,
        Instant createdAt,
        Instant updatedAt) {
}

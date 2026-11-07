package com.skatepod.api.program.dto;

import com.skatepod.api.program.ElementCatalog;
import com.skatepod.api.student.Track;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A student's program. saved is false when the student has no program yet: this is then the starting
 * program the app shows (on the student's own track), and updatedAt is null.
 */
public record ProgramResponse(
        UUID studentId,
        String studentName,
        boolean saved,
        String musicTitle,
        String artist,
        String duration,
        Track track,
        String trackName,
        String level,
        List<ElementCatalog.Element> elements,
        List<List<RinkPointDto>> paths,
        List<PlacementDto> placements,
        Instant updatedAt) {
}

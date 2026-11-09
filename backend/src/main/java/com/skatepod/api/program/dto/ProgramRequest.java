package com.skatepod.api.program.dto;

import com.skatepod.api.student.Track;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

/**
 * What the app sends to add or change a program. Like the app's Program, except elements are just
 * their codes in skating order, e.g. ["1A", "2S", "1S+1T", "StSq"].
 *
 * - name is what the coach calls the program, like "Free skate 2026-27".
 * - The level must be one of the track's levels, and every code must be in the element catalog
 *   (or be a jump combination, see ElementCatalog.find).
 * - musicLink is a web link to the music (YouTube, Apple Music, Spotify...), or left out.
 * - musicFileId is a file uploaded first with POST /api/music, or left out.
 * - A program stays with its student: studentId can't change on PUT.
 */
public record ProgramRequest(
        @NotNull UUID studentId,
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Size(max = 120) String musicTitle,
        @Size(max = 120) String artist,
        @NotNull @Pattern(regexp = "\\d{1,2}:[0-5]\\d", message = "must look like 2:10") String duration,
        @NotNull Track track,
        @NotBlank String level,
        @Size(max = 500) @Pattern(regexp = "|https?://\\S+", message = "must be a web link starting with https://") String musicLink,
        UUID musicFileId,
        @NotNull @Size(max = 40) List<@NotBlank String> elements,
        @Size(max = 50) List<@NotNull @Size(max = 1000) List<@NotNull @Valid RinkPointDto>> paths,
        @Size(max = 100) List<@NotNull @Valid PlacementDto> placements) {
}

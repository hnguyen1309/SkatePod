package com.skatepod.api.program.dto;

import com.skatepod.api.student.Track;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * What the app sends to save a student's program. Like the app's ProgramData, except elements
 * are just their codes in skating order, e.g. ["1A", "2S", "CCoSp", "StSq"].
 * The level must be one of the track's levels, and every code must be in the element catalog.
 */
public record ProgramRequest(
        @NotBlank @Size(max = 120) String musicTitle,
        @Size(max = 120) String artist,
        @NotNull @Pattern(regexp = "\\d{1,2}:[0-5]\\d", message = "must look like 2:10") String duration,
        @NotNull Track track,
        @NotBlank String level,
        @NotNull @Size(max = 40) List<@NotBlank String> elements,
        @Size(max = 50) List<@NotNull @Size(max = 1000) List<@NotNull @Valid RinkPointDto>> paths,
        @Size(max = 100) List<@NotNull @Valid PlacementDto> placements) {
}

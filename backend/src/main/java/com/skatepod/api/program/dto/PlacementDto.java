package com.skatepod.api.program.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** An element marker on the rink map (like the app's RinkPlacement). id is the app's own id for it. */
public record PlacementDto(
        @NotBlank @Size(max = 40) String id,
        @NotBlank String code,
        @NotNull Double x,
        @NotNull Double y) {
}

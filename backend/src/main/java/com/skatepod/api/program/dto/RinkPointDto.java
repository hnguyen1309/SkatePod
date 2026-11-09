package com.skatepod.api.program.dto;

import jakarta.validation.constraints.NotNull;

/** A point on the rink map, in the rink drawing's own units (like the app's RinkPoint). */
public record RinkPointDto(@NotNull Double x, @NotNull Double y) {
}

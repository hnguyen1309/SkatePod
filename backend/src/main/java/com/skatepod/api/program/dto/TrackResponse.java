package com.skatepod.api.program.dto;

import com.skatepod.api.student.Track;
import java.util.List;

/** One track and its levels, lowest first. */
public record TrackResponse(Track track, String name, List<String> levels) {

    public static TrackResponse from(Track track) {
        return new TrackResponse(track, track.getDisplayName(), track.getLevels());
    }
}

package com.skatepod.api.student;

import java.util.List;

/**
 * Singles competition tracks and their levels, named as in U.S. Figure Skating's 2026-27 charts.
 * Stored by name (e.g. "EXCEL") in student_disciplines.track and programs.track.
 *
 * Same tracks and levels as the Programs panel in the app (TRACK_LEVELS in mobile/src/data.ts):
 * change both together, at least once a season. The student profile doesn't show the track;
 * it's there so a new program starts on the student's own track.
 * Any track can go with any discipline for now: the API doesn't check combinations.
 */
public enum Track {
    // The main competitive pathway. Juvenile and up can qualify for nationals.
    CHAMPIONSHIP("Championship",
            "Pre-Preliminary", "Preliminary", "Pre-Juvenile", "Juvenile",
            "Intermediate", "Novice", "Junior", "Senior"),
    // For skaters who compete for fun and growth with simpler rules. "Plus" levels sit between two
    // regular levels and allow a few more difficult elements.
    EXCEL("Excel",
            "Excel Pre-Preliminary", "Excel Preliminary Plus", "Excel Pre-Juvenile Plus",
            "Excel Juvenile", "Excel Juvenile Plus", "Excel Intermediate", "Excel Intermediate Plus",
            "Excel Novice", "Excel Junior", "Excel Senior"),
    // Adults have their own levels. The "Championship" ones are the qualifying events.
    ADULT("Adult",
            "Adult Pre-Bronze", "Adult Bronze", "Adult Silver", "Championship Adult Silver",
            "Adult Gold", "Championship Adult Gold",
            "Masters Intermediate-Novice", "Championship Masters Intermediate-Novice",
            "Masters Junior-Senior", "Championship Masters Junior-Senior");

    private final String displayName;
    private final List<String> levels;

    Track(String displayName, String... levels) {
        this.displayName = displayName;
        this.levels = List.of(levels);
    }

    public String getDisplayName() {
        return displayName;
    }

    /** Lowest first. */
    public List<String> getLevels() {
        return levels;
    }

    /** True if the level is one of this track's levels (exact spelling and capitals). */
    public boolean hasLevel(String level) {
        return levels.contains(level);
    }
}

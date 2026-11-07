package com.skatepod.api.student;

/**
 * The track a student follows in one discipline. Stored by its name (e.g. "EXCEL")
 * in student_disciplines.track.
 *
 * Same tracks as the Programs panel in the app (TRACK_LEVELS in mobile/src/data.ts).
 * The student profile doesn't show the track; it's there so Programs can be filled in.
 * Any track can go with any discipline for now: the API doesn't check combinations.
 */
public enum Track {
    CHAMPIONSHIP("Championship"),
    EXCEL("Excel"),
    ADULT("Adult");

    private final String displayName;

    Track(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

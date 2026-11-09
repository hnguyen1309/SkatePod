package com.skatepod.api.lesson;

/**
 * Calendar color, matching the app: teal = Freestyle, sand = Public, purple = Off-ice.
 * The color always follows the lesson type (colorForType in the app), so it isn't stored or sent in.
 */
public enum LessonColor {
    TEAL,
    SAND,
    PURPLE;

    public static LessonColor forType(String type) {
        return switch (type) {
            case "Public" -> SAND;
            case "Off-ice" -> PURPLE;
            default -> TEAL; // Freestyle
        };
    }
}

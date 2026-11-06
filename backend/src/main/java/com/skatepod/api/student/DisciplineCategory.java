package com.skatepod.api.student;

/** The big groups of disciplines. The app gives each one its own color. */
public enum DisciplineCategory {
    LEARN_TO_SKATE("Learn to Skate"),
    SINGLES("Singles"),
    SKATING_SKILLS("Skating Skills"),
    ICE_DANCE("Ice Dance"),
    PAIRS("Pairs"),
    SYNCHRONIZED("Synchronized"),
    SHOWCASE("Showcase"),
    THEATRE_ON_ICE("Theatre On Ice");

    private final String displayName;

    DisciplineCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

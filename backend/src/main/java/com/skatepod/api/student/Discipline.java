package com.skatepod.api.student;

import java.util.List;

/**
 * Every discipline a student can train in, with its levels from lowest to highest
 * (US Figure Skating test structure). The order here is also the order the API lists them in.
 *
 * This list is copied in the app (DISCIPLINES in mobile/src/data.ts). Change both together.
 */
public enum Discipline {
    STANDARD_FREESKATE(DisciplineCategory.SINGLES, "Standard Track (Freeskate)",
            "Pre-Preliminary", "Preliminary", "Pre-Bronze", "Bronze", "Pre-Silver", "Silver", "Pre-Gold", "Gold"),
    ADULT_FREESKATE(DisciplineCategory.SINGLES, "Adult Track (Freeskate)",
            "Adult Beginner", "Adult High Beginner", "Adult Pre-Bronze", "Adult Bronze", "Adult Silver", "Adult Gold"),
    STANDARD_SKILLS(DisciplineCategory.SKATING_SKILLS, "Standard Track (Skills)",
            "Pre-Preliminary", "Preliminary", "Pre-Bronze", "Bronze", "Pre-Silver", "Silver", "Pre-Gold", "Gold"),
    ADULT_SKILLS(DisciplineCategory.SKATING_SKILLS, "Adult Track (Skills)",
            "Adult Pre-Bronze", "Adult Bronze", "Adult Silver", "Adult Gold"),
    PATTERN_DANCE(DisciplineCategory.ICE_DANCE, "Pattern Dance (Solo/Partnered)",
            "Preliminary", "Pre-Bronze", "Bronze", "Pre-Silver", "Silver", "Pre-Gold", "Gold", "International"),
    FREE_DANCE(DisciplineCategory.ICE_DANCE, "Free Dance (Solo/Partnered)",
            "Juvenile", "Intermediate", "Novice", "Junior", "Senior"),
    PAIRS(DisciplineCategory.PAIRS, "Pair Track",
            "Centennial", "Juvenile", "Intermediate", "Novice", "Junior", "Senior"),
    SYNCHRO(DisciplineCategory.SYNCHRONIZED, "Synchro Team",
            "Aspire", "Preliminary", "Open Juvenile", "Juvenile", "Intermediate", "Novice", "Junior", "Senior"),
    SHOWCASE(DisciplineCategory.SHOWCASE, "Individual / Duet",
            "Preliminary", "Pre-Bronze", "Bronze", "Silver", "Gold"),
    THEATRE_ON_ICE(DisciplineCategory.THEATRE_ON_ICE, "TOI Team Production",
            "Intro to TOI", "Open", "Preliminary", "Intermediate", "Novice", "Junior", "Senior");

    private final DisciplineCategory category;
    private final String displayName;
    private final List<String> levels;

    Discipline(DisciplineCategory category, String displayName, String... levels) {
        this.category = category;
        this.displayName = displayName;
        this.levels = List.of(levels);
    }

    /** True if the level is one of this discipline's levels (exact spelling and capitals). */
    public boolean hasLevel(String level) {
        return levels.contains(level);
    }

    public DisciplineCategory getCategory() {
        return category;
    }

    public String getDisplayName() {
        return displayName;
    }

    public List<String> getLevels() {
        return levels;
    }
}

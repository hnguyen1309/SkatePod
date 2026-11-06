package com.skatepod.api.student;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class DisciplineTest {

    @ParameterizedTest
    @EnumSource(Discipline.class)
    void everyDisciplineHasLevelsWithoutDuplicates(Discipline discipline) {
        assertThat(discipline.getLevels()).isNotEmpty().doesNotHaveDuplicates();
    }

    @Test
    void levelsAreLowestFirst() {
        assertThat(Discipline.STANDARD_FREESKATE.getLevels()).startsWith("Pre-Preliminary").endsWith("Gold");
        assertThat(Discipline.PAIRS.getLevels()).startsWith("Centennial").endsWith("Senior");
    }

    @Test
    void learnToSkateTracksComeFirstInTheirOwnCategory() {
        assertThat(Discipline.values()[0]).isEqualTo(Discipline.LEARN_TO_SKATE);
        assertThat(Discipline.LEARN_TO_SKATE.getCategory()).isEqualTo(DisciplineCategory.LEARN_TO_SKATE);
        assertThat(Discipline.ADULT_LEARN_TO_SKATE.getCategory()).isEqualTo(DisciplineCategory.LEARN_TO_SKATE);
        assertThat(Discipline.LEARN_TO_SKATE.getLevels()).startsWith("Snowplow Sam 1").endsWith("Basic 6");
        assertThat(Discipline.ADULT_LEARN_TO_SKATE.getLevels()).startsWith("Adult Beginner 1").endsWith("Adult Beginner 6");
    }

    @Test
    void hasLevelOnlyMatchesThatDisciplinesLevels() {
        assertThat(Discipline.FREE_DANCE.hasLevel("Juvenile")).isTrue();
        assertThat(Discipline.STANDARD_FREESKATE.hasLevel("Juvenile")).isFalse();
        assertThat(Discipline.STANDARD_FREESKATE.hasLevel("pre-gold")).isFalse();
    }
}

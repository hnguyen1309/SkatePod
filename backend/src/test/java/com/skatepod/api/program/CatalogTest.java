package com.skatepod.api.program;

import static org.assertj.core.api.Assertions.assertThat;

import com.skatepod.api.student.Track;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Spot checks that the backend's copies of the app's catalogs (ELEMENT_CATALOG, TRACK_LEVELS) still match. */
class CatalogTest {

    @Test
    @DisplayName("47 elements: 24 jumps, 21 spins, then ChSq and StSq")
    void elementCatalog() {
        assertThat(ElementCatalog.all()).hasSize(47);
        assertThat(ElementCatalog.all().get(0)).isEqualTo(new ElementCatalog.Element("1T", "Single Toe Loop", "Jump"));
        assertThat(ElementCatalog.find("4A")).hasValueSatisfying(e -> assertThat(e.title()).isEqualTo("Quad Axel"));
        assertThat(ElementCatalog.all().stream().filter(e -> e.category().equals("Spin"))).hasSize(21);
        assertThat(ElementCatalog.all().get(46).code()).isEqualTo("StSq");
        assertThat(ElementCatalog.find("ChSt")).isEmpty(); // dropped in 2026-27
    }

    @Test
    @DisplayName("Tracks and their first and last levels")
    void tracks() {
        assertThat(Track.CHAMPIONSHIP.getLevels()).startsWith("Pre-Preliminary").endsWith("Senior").hasSize(8);
        assertThat(Track.EXCEL.getLevels()).startsWith("Excel Pre-Preliminary").endsWith("Excel Senior").hasSize(10);
        assertThat(Track.ADULT.getLevels()).startsWith("Adult Pre-Bronze").endsWith("Championship Masters Junior-Senior").hasSize(10);
    }
}

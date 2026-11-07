package com.skatepod.api.program;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Every element a program can have, in the same order and wording as the app's ELEMENT_CATALOG
 * (mobile/src/data.ts), which follows U.S. Figure Skating's EMS forms. Change both together.
 * Every element is available at every level: requirements change by season and have exceptions.
 */
public final class ElementCatalog {

    /** One element, e.g. 2S "Double Salchow", a Jump. */
    public record Element(String code, String title, String category) {
    }

    private static final Map<String, Element> BY_CODE = new LinkedHashMap<>();

    static {
        // Every jump from single to quad: 1T, 1S, 1Lo, 1F, 1Lz, 1A, then 2T ... up to 4A.
        String[][] jumpKinds = {{"T", "Toe Loop"}, {"S", "Salchow"}, {"Lo", "Loop"}, {"F", "Flip"}, {"Lz", "Lutz"}, {"A", "Axel"}};
        String[] rotations = {"Single", "Double", "Triple", "Quad"};
        for (int i = 0; i < rotations.length; i++) {
            for (String[] kind : jumpKinds) {
                add((i + 1) + kind[0], rotations[i] + " " + kind[1], "Jump");
            }
        }
        // Spins in the same order and wording as the PPC form, with their ISU codes.
        String[][] spins = {
                {"USp", "Upright Spin"}, {"LSp", "Layback Spin"}, {"CSp", "Camel Spin"}, {"SSp", "Sit Spin"},
                {"FUSp", "Flying Upright Spin"}, {"FLSp", "Flying Layback Spin"}, {"FCSp", "Flying Camel Spin"},
                {"FSSp", "Flying Sit Spin"}, {"CUSp", "Change Foot Upright Spin"}, {"CLSp", "Change Foot Layback Spin"},
                {"CCSp", "Change Foot Camel Spin"}, {"CSSp", "Change Foot Sit Spin"},
                {"CoSp", "Spin Combo with change of position and no change of foot"},
                {"CCoSp", "Spin Combo with change of position and change of foot"},
                {"FCoSp", "Spin Combo with change of position, no change of foot and flying entry"},
                {"FCCoSp", "Spin Combo with change of position and change of foot and flying entry"},
                {"FCCSp", "Change Foot Camel Spin with Flying Entry"}, {"FCSSp", "Change Foot Sit Spin with Flying Entry"},
                {"FCUSp", "Change Foot Upright Spin with Flying Entry"},
                {"FCLSp", "Change Foot Layback Spin with Flying Entry"}, {"2FtUSp", "Two-Foot Upright Spin"},
        };
        for (String[] spin : spins) {
            add(spin[0], spin[1], "Spin");
        }
        // Steps & Spirals. (The choreographic step sequence, ChSt, isn't used in the 2026-27 charts.)
        add("ChSq", "Choreographic Sequence", "Choreography");
        add("StSq", "Step Sequence", "Sequence");
    }

    /** What a new program starts with (STARTER_ELEMENTS in the app). */
    public static final List<String> STARTER_CODES = List.of("1A", "2S", "CCoSp", "StSq");

    private ElementCatalog() {
    }

    private static void add(String code, String title, String category) {
        BY_CODE.put(code, new Element(code, title, category));
    }

    public static Optional<Element> find(String code) {
        return Optional.ofNullable(BY_CODE.get(code));
    }

    public static List<Element> all() {
        return Collections.unmodifiableList(new ArrayList<>(BY_CODE.values()));
    }
}

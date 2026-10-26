package com.skatepod.api.student.dto;

import com.skatepod.api.student.Discipline;
import com.skatepod.api.student.DisciplineCategory;
import java.util.List;

/** One discipline and its levels, lowest first. */
public record DisciplineResponse(
        Discipline discipline,
        String name,
        DisciplineCategory category,
        String categoryName,
        List<String> levels) {

    public static DisciplineResponse from(Discipline discipline) {
        return new DisciplineResponse(discipline, discipline.getDisplayName(), discipline.getCategory(),
                discipline.getCategory().getDisplayName(), discipline.getLevels());
    }
}

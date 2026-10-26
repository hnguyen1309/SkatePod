package com.skatepod.api.student.dto;

import com.skatepod.api.student.Discipline;
import com.skatepod.api.student.DisciplineCategory;

/** One discipline a student trains in, with display names so the app doesn't need to look them up. */
public record StudentDisciplineResponse(
        Discipline discipline,
        String disciplineName,
        DisciplineCategory category,
        String categoryName,
        String level) {
}

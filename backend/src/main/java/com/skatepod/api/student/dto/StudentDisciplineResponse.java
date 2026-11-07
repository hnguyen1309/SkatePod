package com.skatepod.api.student.dto;

import com.skatepod.api.student.Discipline;
import com.skatepod.api.student.DisciplineCategory;
import com.skatepod.api.student.Track;

/**
 * One discipline a student trains in, with display names so the app doesn't need to look them up.
 * The track is for the Programs panel, not the student profile.
 */
public record StudentDisciplineResponse(
        Discipline discipline,
        String disciplineName,
        DisciplineCategory category,
        String categoryName,
        Track track,
        String trackName,
        String level) {
}

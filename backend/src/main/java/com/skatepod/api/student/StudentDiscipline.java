package com.skatepod.api.student;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

/**
 * One discipline a student trains in, with their track and level in it. Stored as a row in
 * student_disciplines. It has no id of its own: it only exists as part of a Student.
 */
@Embeddable
public class StudentDiscipline {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Discipline discipline;

    /** Not shown on the student profile; used to fill in the Programs panel. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Track track;

    @Column(nullable = false, length = 60)
    private String level;

    protected StudentDiscipline() {
        // Required by JPA.
    }

    public StudentDiscipline(Discipline discipline, Track track, String level) {
        this.discipline = discipline;
        this.track = track;
        this.level = level;
    }

    public Discipline getDiscipline() {
        return discipline;
    }

    public Track getTrack() {
        return track;
    }

    public String getLevel() {
        return level;
    }
}

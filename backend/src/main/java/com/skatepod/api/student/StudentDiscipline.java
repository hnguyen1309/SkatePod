package com.skatepod.api.student;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

/**
 * One discipline a student trains in, and their level in it. Stored as a row in
 * student_disciplines. It has no id of its own: it only exists as part of a Student.
 */
@Embeddable
public class StudentDiscipline {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Discipline discipline;

    @Column(nullable = false, length = 60)
    private String level;

    protected StudentDiscipline() {
        // Required by JPA.
    }

    public StudentDiscipline(Discipline discipline, String level) {
        this.discipline = discipline;
        this.level = level;
    }

    public Discipline getDiscipline() {
        return discipline;
    }

    public String getLevel() {
        return level;
    }
}

package com.skatepod.api.student;

import com.skatepod.api.common.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "students")
public class Student extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 200)
    private String focus;

    @Column(nullable = false)
    private int progress;

    /** Each discipline the student trains in, with their level. Can be empty. */
    @ElementCollection
    @CollectionTable(name = "student_disciplines", joinColumns = @JoinColumn(name = "student_id"))
    private List<StudentDiscipline> disciplines = new ArrayList<>();

    protected Student() {
        // Required by JPA.
    }

    public Student(String name, String focus, int progress, List<StudentDiscipline> disciplines) {
        update(name, focus, progress, disciplines);
    }

    public void update(String name, String focus, int progress, List<StudentDiscipline> disciplines) {
        this.name = name;
        this.focus = focus;
        this.progress = progress;
        // Replace the list's contents instead of the list itself, so JPA can track the change.
        this.disciplines.clear();
        this.disciplines.addAll(disciplines);
    }

    public String getName() {
        return name;
    }

    public String getFocus() {
        return focus;
    }

    public int getProgress() {
        return progress;
    }

    public List<StudentDiscipline> getDisciplines() {
        return Collections.unmodifiableList(disciplines);
    }
}

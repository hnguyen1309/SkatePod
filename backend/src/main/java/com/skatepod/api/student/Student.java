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

    /** Each discipline the student trains in, with their track and level. Can be empty. */
    @ElementCollection
    @CollectionTable(name = "student_disciplines", joinColumns = @JoinColumn(name = "student_id"))
    private List<StudentDiscipline> disciplines = new ArrayList<>();

    protected Student() {
        // Required by JPA.
    }

    public Student(String name, List<StudentDiscipline> disciplines) {
        update(name, disciplines);
    }

    public void update(String name, List<StudentDiscipline> disciplines) {
        this.name = name;
        // Replace the list's contents instead of the list itself, so JPA can track the change.
        this.disciplines.clear();
        this.disciplines.addAll(disciplines);
    }

    public String getName() {
        return name;
    }

    public List<StudentDiscipline> getDisciplines() {
        return Collections.unmodifiableList(disciplines);
    }
}

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

    /** Optional phone number, kept as the coach typed it. Null when there isn't one. */
    @Column(length = 30)
    private String phone;

    /** Each discipline the student trains in, with their track and level. Can be empty. */
    @ElementCollection
    @CollectionTable(name = "student_disciplines", joinColumns = @JoinColumn(name = "student_id"))
    private List<StudentDiscipline> disciplines = new ArrayList<>();

    protected Student() {
        // Required by JPA.
    }

    public Student(String name, String phone, List<StudentDiscipline> disciplines) {
        update(name, phone, disciplines);
    }

    /** A student without a phone number (handy in tests). */
    public Student(String name, List<StudentDiscipline> disciplines) {
        this(name, null, disciplines);
    }

    public void update(String name, String phone, List<StudentDiscipline> disciplines) {
        this.name = name;
        this.phone = phone;
        // Replace the list's contents instead of the list itself, so JPA can track the change.
        this.disciplines.clear();
        this.disciplines.addAll(disciplines);
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }

    public List<StudentDiscipline> getDisciplines() {
        return Collections.unmodifiableList(disciplines);
    }
}

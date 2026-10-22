package com.skatepod.api.student;

import com.skatepod.api.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "students")
public class Student extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 60)
    private String level;

    @Column(nullable = false, length = 60)
    private String discipline;

    @Column(length = 200)
    private String focus;

    @Column(nullable = false)
    private int progress;

    protected Student() {
        // Required by JPA.
    }

    public Student(String name, String level, String discipline, String focus, int progress) {
        update(name, level, discipline, focus, progress);
    }

    public void update(String name, String level, String discipline, String focus, int progress) {
        this.name = name;
        this.level = level;
        this.discipline = discipline;
        this.focus = focus;
        this.progress = progress;
    }

    public String getName() {
        return name;
    }

    public String getLevel() {
        return level;
    }

    public String getDiscipline() {
        return discipline;
    }

    public String getFocus() {
        return focus;
    }

    public int getProgress() {
        return progress;
    }
}

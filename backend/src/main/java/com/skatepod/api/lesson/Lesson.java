package com.skatepod.api.lesson;

import com.skatepod.api.common.BaseEntity;
import com.skatepod.api.student.Student;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.DayOfWeek;
import java.time.LocalTime;

/** One slot in a coach's recurring weekly schedule. */
@Entity
@Table(name = "lessons")
public class Lesson extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 9)
    private DayOfWeek dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(name = "lesson_type", nullable = false, length = 40)
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LessonColor color;

    protected Lesson() {
        // Required by JPA.
    }

    public Lesson(Student student, DayOfWeek dayOfWeek, LocalTime startTime, int durationMinutes, String type, LessonColor color) {
        update(student, dayOfWeek, startTime, durationMinutes, type, color);
    }

    public void update(Student student, DayOfWeek dayOfWeek, LocalTime startTime, int durationMinutes, String type, LessonColor color) {
        this.student = student;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.durationMinutes = durationMinutes;
        this.type = type;
        this.color = color;
    }

    public Student getStudent() {
        return student;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public String getType() {
        return type;
    }

    public LessonColor getColor() {
        return color;
    }
}

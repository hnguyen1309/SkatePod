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
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * A weekly lesson on the coach's calendar, like the app's: every Tuesday at 9:00 for 60 minutes,
 * from startDate until endDate. No start date means "always on" (older lessons in the app);
 * no end date means it keeps going.
 */
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

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    protected Lesson() {
        // Required by JPA.
    }

    public Lesson(Student student, DayOfWeek dayOfWeek, LocalTime startTime, int durationMinutes, String type,
                  LocalDate startDate, LocalDate endDate) {
        update(student, dayOfWeek, startTime, durationMinutes, type, startDate, endDate);
    }

    public void update(Student student, DayOfWeek dayOfWeek, LocalTime startTime, int durationMinutes, String type,
                       LocalDate startDate, LocalDate endDate) {
        this.student = student;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.durationMinutes = durationMinutes;
        this.type = type;
        this.startDate = startDate;
        this.endDate = endDate;
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

    /** Worked out from the type, never stored. */
    public LessonColor getColor() {
        return LessonColor.forType(type);
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }
}

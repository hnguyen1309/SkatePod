package com.skatepod.api.note;

import com.skatepod.api.common.BaseEntity;
import com.skatepod.api.student.Student;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * One entry in the training history (the app's Lessons tab): a lesson that happened, with the coach's
 * notes. Entries for calendar lessons are added automatically, empty, once the lesson starts
 * (see NoteService.catchUpHistory). "Add a past lesson" makes one with no lessonId.
 */
@Entity
@Table(name = "notes")
public class Note extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    /** The calendar lesson this note was written for, or null. Just the id: the lesson may be deleted later. */
    @Column(name = "lesson_id")
    private UUID lessonId;

    /** When the lesson happened. */
    @Column(name = "note_time", nullable = false)
    private Instant time;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(name = "lesson_type", nullable = false, length = 40)
    private String lessonType;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(length = 40)
    private String overall;

    @Column(length = 200)
    private String focus;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(name = "next_steps", columnDefinition = "TEXT")
    private String nextSteps;

    /** Skills worked on, in the order the coach added them. */
    @ElementCollection
    @CollectionTable(name = "note_skills", joinColumns = @JoinColumn(name = "note_id"))
    @OrderColumn(name = "position")
    @Column(name = "skill", nullable = false, length = 80)
    private List<String> skills = new ArrayList<>();

    @Column(nullable = false)
    private boolean shared;

    protected Note() {
        // Required by JPA.
    }

    public Note(Student student, UUID lessonId, Instant time, String title, String lessonType, int durationMinutes,
                String overall, String focus, String observations, String nextSteps, List<String> skills, boolean shared) {
        update(student, lessonId, time, title, lessonType, durationMinutes, overall, focus, observations, nextSteps,
                skills, shared);
    }

    public void update(Student student, UUID lessonId, Instant time, String title, String lessonType,
                       int durationMinutes, String overall, String focus, String observations, String nextSteps,
                       List<String> skills, boolean shared) {
        this.student = student;
        this.lessonId = lessonId;
        this.time = time;
        this.title = title;
        this.lessonType = lessonType;
        this.durationMinutes = durationMinutes;
        this.overall = overall;
        this.focus = focus;
        this.observations = observations;
        this.nextSteps = nextSteps;
        // Replace the list's contents instead of the list itself, so JPA can track the change.
        this.skills.clear();
        this.skills.addAll(skills);
        this.shared = shared;
    }

    /** True when the coach hasn't written anything yet (same rule as isEmptyNote in the app). */
    public boolean isEmpty() {
        return isBlank(observations) && isBlank(focus) && isBlank(nextSteps) && skills.isEmpty();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public Student getStudent() {
        return student;
    }

    public UUID getLessonId() {
        return lessonId;
    }

    public Instant getTime() {
        return time;
    }

    public String getTitle() {
        return title;
    }

    public String getLessonType() {
        return lessonType;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public String getOverall() {
        return overall;
    }

    public String getFocus() {
        return focus;
    }

    public String getObservations() {
        return observations;
    }

    public String getNextSteps() {
        return nextSteps;
    }

    public List<String> getSkills() {
        return Collections.unmodifiableList(skills);
    }

    public boolean isShared() {
        return shared;
    }
}

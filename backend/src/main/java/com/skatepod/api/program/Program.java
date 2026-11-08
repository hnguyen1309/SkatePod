package com.skatepod.api.program;

import com.skatepod.api.common.BaseEntity;
import com.skatepod.api.student.Student;
import com.skatepod.api.student.Track;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * A student's program layout (the app's Programs tab): music, track and level, the elements in
 * skating order, and the rink map. Each student has at most one.
 */
@Entity
@Table(name = "programs")
public class Program extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false, unique = true)
    private Student student;

    @Column(name = "music_title", nullable = false, length = 120)
    private String musicTitle;

    @Column(length = 120)
    private String artist;

    /** Program length as text, like "2:10". */
    @Column(nullable = false, length = 5)
    private String duration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Track track;

    @Column(nullable = false, length = 60)
    private String level;

    /** Element codes (e.g. "2S") in skating order. */
    @ElementCollection
    @CollectionTable(name = "program_elements", joinColumns = @JoinColumn(name = "program_id"))
    @OrderColumn(name = "position")
    @Column(name = "code", nullable = false, length = 20)
    private List<String> elements = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "program_path_points", joinColumns = @JoinColumn(name = "program_id"))
    @OrderColumn(name = "position")
    private List<ProgramPathPoint> pathPoints = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "program_placements", joinColumns = @JoinColumn(name = "program_id"))
    @OrderColumn(name = "position")
    private List<ProgramPlacement> placements = new ArrayList<>();

    protected Program() {
        // Required by JPA.
    }

    public Program(Student student, String musicTitle, String artist, String duration, Track track, String level,
                   List<String> elements, List<ProgramPathPoint> pathPoints, List<ProgramPlacement> placements) {
        this.student = student;
        update(musicTitle, artist, duration, track, level, elements, pathPoints, placements);
    }

    public void update(String musicTitle, String artist, String duration, Track track, String level,
                       List<String> elements, List<ProgramPathPoint> pathPoints, List<ProgramPlacement> placements) {
        this.musicTitle = musicTitle;
        this.artist = artist;
        this.duration = duration;
        this.track = track;
        this.level = level;
        // Replace the lists' contents instead of the lists themselves, so JPA can track the change.
        this.elements.clear();
        this.elements.addAll(elements);
        this.pathPoints.clear();
        this.pathPoints.addAll(pathPoints);
        this.placements.clear();
        this.placements.addAll(placements);
    }

    public Student getStudent() {
        return student;
    }

    public String getMusicTitle() {
        return musicTitle;
    }

    public String getArtist() {
        return artist;
    }

    public String getDuration() {
        return duration;
    }

    public Track getTrack() {
        return track;
    }

    public String getLevel() {
        return level;
    }

    public List<String> getElements() {
        return Collections.unmodifiableList(elements);
    }

    public List<ProgramPathPoint> getPathPoints() {
        return Collections.unmodifiableList(pathPoints);
    }

    public List<ProgramPlacement> getPlacements() {
        return Collections.unmodifiableList(placements);
    }
}

package com.skatepod.api.program;

import com.skatepod.api.common.BaseEntity;
import com.skatepod.api.music.MusicFile;
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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * One of a student's programs (the app's Programs tab): a name, the music (title, a link and/or an
 * uploaded file), track and level, the elements in skating order, and the rink map.
 * A student can have several, like a free skate and a showcase.
 */
@Entity
@Table(name = "programs")
public class Program extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    /** What the coach calls it, like "Free skate 2026-27". */
    @Column(nullable = false, length = 80)
    private String name;

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

    /** A web link to the music (YouTube, Apple Music, Spotify...), or null. */
    @Column(name = "music_link", length = 500)
    private String musicLink;

    /** The uploaded music file, or null. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "music_file_id")
    private MusicFile musicFile;

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

    public Program(Student student, String name, String musicTitle, String artist, String duration, Track track,
                   String level, String musicLink, MusicFile musicFile, List<String> elements,
                   List<ProgramPathPoint> pathPoints, List<ProgramPlacement> placements) {
        this.student = student;
        update(name, musicTitle, artist, duration, track, level, musicLink, musicFile, elements, pathPoints, placements);
    }

    public void update(String name, String musicTitle, String artist, String duration, Track track, String level,
                       String musicLink, MusicFile musicFile, List<String> elements,
                       List<ProgramPathPoint> pathPoints, List<ProgramPlacement> placements) {
        this.name = name;
        this.musicLink = musicLink;
        this.musicFile = musicFile;
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

    public String getName() {
        return name;
    }

    public String getMusicLink() {
        return musicLink;
    }

    public MusicFile getMusicFile() {
        return musicFile;
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

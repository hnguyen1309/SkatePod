package com.skatepod.api.availability;

import com.skatepod.api.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.DayOfWeek;
import java.time.LocalTime;

/**
 * An optional "I'm available to coach" block on the weekly calendar, e.g. Tuesday 3–6 PM at North Rink.
 * It's only a hint on the calendar: lessons can still be booked outside every block.
 */
@Entity
@Table(name = "availability_blocks")
public class AvailabilityBlock extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 9)
    private DayOfWeek dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(length = 60)
    private String place;

    protected AvailabilityBlock() {
        // Required by JPA.
    }

    public AvailabilityBlock(DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime, String place) {
        update(dayOfWeek, startTime, endTime, place);
    }

    public void update(DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime, String place) {
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.place = place;
    }

    /** True if a lesson starting at `time` on `day` falls inside this block (the end itself is outside). */
    public boolean contains(DayOfWeek day, LocalTime time) {
        return dayOfWeek == day && !time.isBefore(startTime) && time.isBefore(endTime);
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public String getPlace() {
        return place;
    }
}

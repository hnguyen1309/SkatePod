package com.skatepod.api.availability;

import com.skatepod.api.availability.dto.AvailabilityBlockRequest;
import com.skatepod.api.availability.dto.AvailabilityBlockResponse;
import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.common.ConflictException;
import com.skatepod.api.common.NotFoundException;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AvailabilityService {

    /** Monday first, then by start time, like the calendar. (Sorted in Java: the database sorts day names A to Z.) */
    static final Comparator<AvailabilityBlock> WEEK_ORDER =
            Comparator.comparing(AvailabilityBlock::getDayOfWeek).thenComparing(AvailabilityBlock::getStartTime);

    private final AvailabilityBlockRepository blocks;

    public AvailabilityService(AvailabilityBlockRepository blocks) {
        this.blocks = blocks;
    }

    @Transactional(readOnly = true)
    public List<AvailabilityBlockResponse> list() {
        return blocks.findAll().stream().sorted(WEEK_ORDER).map(AvailabilityService::toResponse).toList();
    }

    @Transactional
    public AvailabilityBlockResponse create(AvailabilityBlockRequest request) {
        check(request, null);
        AvailabilityBlock block = new AvailabilityBlock(request.dayOfWeek(), request.startTime(), request.endTime(),
                blankToNull(request.place()));
        return toResponse(blocks.save(block));
    }

    @Transactional
    public AvailabilityBlockResponse update(UUID id, AvailabilityBlockRequest request) {
        AvailabilityBlock block = find(id);
        check(request, block);
        block.update(request.dayOfWeek(), request.startTime(), request.endTime(), blankToNull(request.place()));
        return toResponse(block);
    }

    @Transactional
    public void delete(UUID id) {
        blocks.delete(find(id));
    }

    /**
     * The place of the block a lesson starting at `time` on `day` falls in, or null.
     * Same rule as placeFor in the app.
     */
    public static String placeFor(DayOfWeek day, LocalTime time, List<AvailabilityBlock> all) {
        return all.stream().filter(block -> block.contains(day, time))
                .map(AvailabilityBlock::getPlace).filter(place -> place != null)
                .findFirst().orElse(null);
    }

    /**
     * The end must be after the start, and blocks on the same day can't overlap
     * (same rule as findBlockOverlap in the app). Touching is fine: 3–6 PM and 6–8 PM.
     * ignore is the block being updated, so it doesn't overlap itself.
     */
    private void check(AvailabilityBlockRequest request, AvailabilityBlock ignore) {
        if (!request.endTime().isAfter(request.startTime())) {
            throw new BadRequestException("The end time must be after the start time");
        }
        for (AvailabilityBlock other : blocks.findAllByDayOfWeek(request.dayOfWeek())) {
            if (other == ignore) continue;
            if (request.startTime().isBefore(other.getEndTime()) && other.getStartTime().isBefore(request.endTime())) {
                throw new ConflictException("That overlaps your " + other.getStartTime() + "–" + other.getEndTime()
                        + " block on " + dayName(other.getDayOfWeek())
                        + (other.getPlace() == null ? "" : " at " + other.getPlace()));
            }
        }
    }

    private AvailabilityBlock find(UUID id) {
        return blocks.findById(id).orElseThrow(() -> new NotFoundException("Availability block", id));
    }

    private static String dayName(DayOfWeek day) {
        String name = day.name().toLowerCase();
        return Character.toUpperCase(name.charAt(0)) + name.substring(1);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    static AvailabilityBlockResponse toResponse(AvailabilityBlock block) {
        return new AvailabilityBlockResponse(block.getId(), block.getDayOfWeek(), block.getStartTime(),
                block.getEndTime(), block.getPlace());
    }
}

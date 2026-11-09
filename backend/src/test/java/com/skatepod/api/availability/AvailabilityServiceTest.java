package com.skatepod.api.availability;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.skatepod.api.availability.dto.AvailabilityBlockRequest;
import com.skatepod.api.availability.dto.AvailabilityBlockResponse;
import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.common.ConflictException;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    @Mock
    private AvailabilityBlockRepository blocks;

    private AvailabilityService service;

    private static final DayOfWeek TUESDAY = DayOfWeek.TUESDAY;
    private final AvailabilityBlock northRink3To6 =
            new AvailabilityBlock(TUESDAY, LocalTime.of(15, 0), LocalTime.of(18, 0), "North Rink");

    @BeforeEach
    void setUp() {
        service = new AvailabilityService(blocks);
    }

    @Test
    void createTrimsThePlaceAndTreatsBlankAsNone() {
        when(blocks.save(any(AvailabilityBlock.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AvailabilityBlockResponse named = service.create(
                new AvailabilityBlockRequest(TUESDAY, LocalTime.of(9, 0), LocalTime.of(11, 0), "  South Rink "));
        AvailabilityBlockResponse unnamed = service.create(
                new AvailabilityBlockRequest(TUESDAY, LocalTime.of(12, 0), LocalTime.of(13, 0), "   "));

        assertThat(named.place()).isEqualTo("South Rink");
        assertThat(unnamed.place()).isNull();
    }

    @Test
    void endMustBeAfterStart() {
        assertThatThrownBy(() -> service.create(
                new AvailabilityBlockRequest(TUESDAY, LocalTime.of(15, 0), LocalTime.of(15, 0), null)))
                .isInstanceOf(BadRequestException.class);
        verify(blocks, never()).save(any());
    }

    @Test
    void overlappingBlocksOnTheSameDayAreAConflict() {
        when(blocks.findAllByDayOfWeek(TUESDAY)).thenReturn(List.of(northRink3To6));

        assertThatThrownBy(() -> service.create(
                new AvailabilityBlockRequest(TUESDAY, LocalTime.of(17, 0), LocalTime.of(19, 0), null)))
                .isInstanceOf(ConflictException.class)
                .hasMessage("That overlaps your 15:00–18:00 block on Tuesday at North Rink");
    }

    @Test
    void touchingBlocksAreFine() {
        when(blocks.findAllByDayOfWeek(TUESDAY)).thenReturn(List.of(northRink3To6));
        when(blocks.save(any(AvailabilityBlock.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AvailabilityBlockResponse created = service.create(
                new AvailabilityBlockRequest(TUESDAY, LocalTime.of(18, 0), LocalTime.of(20, 0), "South Rink"));

        assertThat(created.startTime()).isEqualTo(LocalTime.of(18, 0));
    }

    @Test
    void placeForFindsTheBlockALessonStartsIn() {
        List<AvailabilityBlock> all = List.of(northRink3To6);

        assertThat(AvailabilityService.placeFor(TUESDAY, LocalTime.of(15, 0), all)).isEqualTo("North Rink");
        assertThat(AvailabilityService.placeFor(TUESDAY, LocalTime.of(17, 59), all)).isEqualTo("North Rink");
        assertThat(AvailabilityService.placeFor(TUESDAY, LocalTime.of(18, 0), all)).isNull(); // the end is outside
        assertThat(AvailabilityService.placeFor(DayOfWeek.WEDNESDAY, LocalTime.of(16, 0), all)).isNull();
    }

    @Test
    void listIsMondayFirstThenByTime() {
        AvailabilityBlock sunday = new AvailabilityBlock(DayOfWeek.SUNDAY, LocalTime.of(8, 0), LocalTime.of(9, 0), null);
        AvailabilityBlock tuesdayEarly = new AvailabilityBlock(TUESDAY, LocalTime.of(6, 0), LocalTime.of(8, 0), null);
        AvailabilityBlock monday = new AvailabilityBlock(DayOfWeek.MONDAY, LocalTime.of(12, 0), LocalTime.of(13, 0), null);
        when(blocks.findAll()).thenReturn(List.of(sunday, northRink3To6, tuesdayEarly, monday));

        assertThat(service.list()).extracting(AvailabilityBlockResponse::dayOfWeek)
                .containsExactly(DayOfWeek.MONDAY, TUESDAY, TUESDAY, DayOfWeek.SUNDAY);
        assertThat(service.list().get(1).startTime()).isEqualTo(LocalTime.of(6, 0));
    }
}

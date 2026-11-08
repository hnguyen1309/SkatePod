package com.skatepod.api.lesson;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.skatepod.api.common.ConflictException;
import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.lesson.dto.LessonRequest;
import com.skatepod.api.lesson.dto.LessonResponse;
import com.skatepod.api.student.Student;
import com.skatepod.api.student.StudentRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LessonServiceTest {

    @Mock
    private LessonRepository lessons;

    @Mock
    private StudentRepository students;

    private LessonService service;
    private static final LocalDate MONDAY = LocalDate.of(2026, 10, 26);

    private final Student emma = new Student("Emma", List.of());

    @BeforeEach
    void setUp() {
        service = new LessonService(lessons, students);
    }

    @Test
    void createForUnknownStudentThrowsAndSavesNothing() {
        UUID studentId = UUID.randomUUID();
        when(students.findById(studentId)).thenReturn(Optional.empty());
        LessonRequest request = new LessonRequest(studentId, LocalDate.of(2026, 10, 26), LocalTime.of(9, 0), 45, "Freestyle", LessonColor.TEAL);

        assertThatThrownBy(() -> service.create(request)).isInstanceOf(NotFoundException.class);
        verify(lessons, never()).save(any());
    }

    @Test
    void createSavesLessonForStudent() {
        UUID studentId = UUID.randomUUID();
        when(students.findById(studentId)).thenReturn(Optional.of(emma));
        when(lessons.save(any(Lesson.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LessonResponse created = service.create(
                new LessonRequest(studentId, LocalDate.of(2026, 10, 23), LocalTime.of(7, 30), 60, " Public ", LessonColor.SAND));

        assertThat(created.studentName()).isEqualTo("Emma");
        assertThat(created.date()).isEqualTo(LocalDate.of(2026, 10, 23));
        assertThat(created.startTime()).isEqualTo(LocalTime.of(7, 30));
        assertThat(created.type()).isEqualTo("Public");
    }

    @Test
    void createOverlappingAnotherLessonThrowsConflictAndSavesNothing() {
        UUID studentId = UUID.randomUUID();
        Student lily = new Student("Lily", List.of());
        when(students.findById(studentId)).thenReturn(Optional.of(emma));
        // Lily already skates 9:00-9:45 that day, so Emma at 9:30 clashes.
        when(lessons.findAllByDate(MONDAY)).thenReturn(List.of(
                new Lesson(lily, MONDAY, LocalTime.of(9, 0), 45, "Freestyle", LessonColor.TEAL)));

        assertThatThrownBy(() -> service.create(
                new LessonRequest(studentId, MONDAY, LocalTime.of(9, 30), 30, "Public", LessonColor.SAND)))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Lily has a lesson at 09:00");
        verify(lessons, never()).save(any());
    }

    @Test
    void createStartingBeforeAnotherLessonButRunningIntoItThrowsConflict() {
        UUID studentId = UUID.randomUUID();
        when(students.findById(studentId)).thenReturn(Optional.of(emma));
        when(lessons.findAllByDate(MONDAY)).thenReturn(List.of(
                new Lesson(emma, MONDAY, LocalTime.of(10, 0), 45, "Freestyle", LessonColor.TEAL)));

        // 9:30 + 60 minutes ends at 10:30, after the 10:00 lesson starts.
        assertThatThrownBy(() -> service.create(
                new LessonRequest(studentId, MONDAY, LocalTime.of(9, 30), 60, "Public", LessonColor.SAND)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void createBackToBackWithAnotherLessonIsAllowed() {
        UUID studentId = UUID.randomUUID();
        when(students.findById(studentId)).thenReturn(Optional.of(emma));
        when(lessons.findAllByDate(MONDAY)).thenReturn(List.of(
                new Lesson(emma, MONDAY, LocalTime.of(9, 0), 45, "Freestyle", LessonColor.TEAL)));
        when(lessons.save(any(Lesson.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Starts the minute the 9:00 lesson ends.
        LessonResponse created = service.create(
                new LessonRequest(studentId, MONDAY, LocalTime.of(9, 45), 30, "Public", LessonColor.SAND));

        assertThat(created.startTime()).isEqualTo(LocalTime.of(9, 45));
    }

    @Test
    void updateDoesNotClashWithItself() {
        UUID studentId = UUID.randomUUID();
        UUID lessonId = UUID.randomUUID();
        Lesson existing = new Lesson(emma, MONDAY, LocalTime.of(9, 0), 45, "Freestyle", LessonColor.TEAL);
        when(lessons.findById(lessonId)).thenReturn(Optional.of(existing));
        when(students.findById(studentId)).thenReturn(Optional.of(emma));
        when(lessons.findAllByDate(MONDAY)).thenReturn(List.of(existing));

        // Making the same lesson 15 minutes longer only overlaps its old self.
        LessonResponse updated = service.update(lessonId,
                new LessonRequest(studentId, MONDAY, LocalTime.of(9, 0), 60, "Freestyle", LessonColor.TEAL));

        assertThat(updated.durationMinutes()).isEqualTo(60);
    }

    @Test
    void listIsInCalendarOrder() {
        Lesson nextMonth = new Lesson(emma, LocalDate.of(2026, 11, 2), LocalTime.of(7, 0), 45, "Off-ice", LessonColor.PURPLE);
        Lesson mondayLate = new Lesson(emma, LocalDate.of(2026, 10, 26), LocalTime.of(15, 0), 45, "Public", LessonColor.SAND);
        Lesson mondayEarly = new Lesson(emma, LocalDate.of(2026, 10, 26), LocalTime.of(7, 0), 45, "Freestyle", LessonColor.TEAL);
        when(lessons.findAll()).thenReturn(List.of(nextMonth, mondayLate, mondayEarly));

        List<LessonResponse> result = service.list(null);

        assertThat(result).extracting(LessonResponse::type).containsExactly("Freestyle", "Public", "Off-ice");
    }
}

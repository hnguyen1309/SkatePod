package com.skatepod.api.lesson;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.lesson.dto.LessonRequest;
import com.skatepod.api.lesson.dto.LessonResponse;
import com.skatepod.api.student.Student;
import com.skatepod.api.student.StudentRepository;
import java.time.DayOfWeek;
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
    private final Student emma = new Student("Emma", "Pre-Gold", "Freestyle", null, 50);

    @BeforeEach
    void setUp() {
        service = new LessonService(lessons, students);
    }

    @Test
    void createForUnknownStudentThrowsAndSavesNothing() {
        UUID studentId = UUID.randomUUID();
        when(students.findById(studentId)).thenReturn(Optional.empty());
        LessonRequest request = new LessonRequest(studentId, DayOfWeek.MONDAY, LocalTime.of(9, 0), 45, "Freestyle", LessonColor.TEAL);

        assertThatThrownBy(() -> service.create(request)).isInstanceOf(NotFoundException.class);
        verify(lessons, never()).save(any());
    }

    @Test
    void createSavesLessonForStudent() {
        UUID studentId = UUID.randomUUID();
        when(students.findById(studentId)).thenReturn(Optional.of(emma));
        when(lessons.save(any(Lesson.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LessonResponse created = service.create(
                new LessonRequest(studentId, DayOfWeek.FRIDAY, LocalTime.of(7, 30), 60, " Moves ", LessonColor.SAND));

        assertThat(created.studentName()).isEqualTo("Emma");
        assertThat(created.dayOfWeek()).isEqualTo(DayOfWeek.FRIDAY);
        assertThat(created.startTime()).isEqualTo(LocalTime.of(7, 30));
        assertThat(created.type()).isEqualTo("Moves");
    }

    @Test
    void listIsInWeekOrder() {
        Lesson saturday = new Lesson(emma, DayOfWeek.SATURDAY, LocalTime.of(9, 0), 45, "Program", LessonColor.TEAL);
        Lesson mondayLate = new Lesson(emma, DayOfWeek.MONDAY, LocalTime.of(15, 0), 45, "Moves", LessonColor.SAND);
        Lesson mondayEarly = new Lesson(emma, DayOfWeek.MONDAY, LocalTime.of(7, 0), 45, "Freestyle", LessonColor.TEAL);
        when(lessons.findAll()).thenReturn(List.of(saturday, mondayLate, mondayEarly));

        List<LessonResponse> result = service.list(null);

        assertThat(result).extracting(LessonResponse::type).containsExactly("Freestyle", "Moves", "Program");
    }
}

package com.skatepod.api.student;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.lesson.LessonRepository;
import com.skatepod.api.student.dto.StudentRequest;
import com.skatepod.api.student.dto.StudentResponse;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository students;

    @Mock
    private LessonRepository lessons;

    @Mock
    private NextLessonCalculator nextLessonCalculator;

    private StudentService service;

    @BeforeEach
    void setUp() {
        Clock fixed = Clock.fixed(Instant.parse("2026-10-22T12:00:00Z"), ZoneId.of("America/New_York"));
        service = new StudentService(students, lessons, nextLessonCalculator, fixed);
    }

    @Test
    void createTrimsInputAndTreatsBlankFocusAsEmpty() {
        when(students.save(any(Student.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(nextLessonCalculator.findNext(anyList(), any())).thenReturn(Optional.empty());

        StudentResponse created = service.create(new StudentRequest("  Emma  ", "Pre-Gold", "Freestyle", "   ", 40));

        assertThat(created.name()).isEqualTo("Emma");
        assertThat(created.focus()).isNull();
        assertThat(created.progress()).isEqualTo(40);
        assertThat(created.nextLesson()).isNull();
    }

    @Test
    void getUnknownStudentThrowsNotFound() {
        UUID id = UUID.randomUUID();
        when(students.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(id))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining(id.toString());
    }

    @Test
    void updateChangesFields() {
        UUID id = UUID.randomUUID();
        Student emma = new Student("Emma", "Pre-Gold", "Freestyle", "Axel", 40);
        when(students.findById(id)).thenReturn(Optional.of(emma));
        when(lessons.findAllByStudentId(id)).thenReturn(List.of());
        when(nextLessonCalculator.findNext(anyList(), any())).thenReturn(Optional.empty());

        StudentResponse updated = service.update(id, new StudentRequest("Emma M", "Gold", "Moves", "Power pulls", 90));

        assertThat(updated.name()).isEqualTo("Emma M");
        assertThat(updated.level()).isEqualTo("Gold");
        assertThat(updated.discipline()).isEqualTo("Moves");
        assertThat(updated.progress()).isEqualTo(90);
    }

    @Test
    void deleteUnknownStudentDoesNothing() {
        UUID id = UUID.randomUUID();
        when(students.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(id)).isInstanceOf(NotFoundException.class);
        verify(students, never()).delete(any());
    }
}

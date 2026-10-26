package com.skatepod.api.student;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.lesson.LessonRepository;
import com.skatepod.api.student.dto.StudentDisciplineRequest;
import com.skatepod.api.student.dto.StudentDisciplineResponse;
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

    private static StudentDisciplineRequest discipline(Discipline discipline, String level) {
        return new StudentDisciplineRequest(discipline, level);
    }

    private void saveReturnsTheStudent() {
        when(students.save(any(Student.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createTrimsInputAndTreatsBlankFocusAsEmpty() {
        saveReturnsTheStudent();
        when(nextLessonCalculator.findNext(anyList(), any())).thenReturn(Optional.empty());

        StudentResponse created = service.create(new StudentRequest("  Emma  ", "   ", 40,
                List.of(discipline(Discipline.STANDARD_FREESKATE, " Pre-Gold "))));

        assertThat(created.name()).isEqualTo("Emma");
        assertThat(created.focus()).isNull();
        assertThat(created.progress()).isEqualTo(40);
        assertThat(created.disciplines()).extracting(StudentDisciplineResponse::level).containsExactly("Pre-Gold");
        assertThat(created.nextLesson()).isNull();
    }

    @Test
    void createWithoutDisciplinesIsAllowed() {
        saveReturnsTheStudent();
        when(nextLessonCalculator.findNext(anyList(), any())).thenReturn(Optional.empty());

        assertThat(service.create(new StudentRequest("Amelia", null, 0, null)).disciplines()).isEmpty();
        assertThat(service.create(new StudentRequest("Amelia", null, 0, List.of())).disciplines()).isEmpty();
    }

    @Test
    void disciplinesComeBackInCatalogOrderWithNames() {
        saveReturnsTheStudent();
        when(nextLessonCalculator.findNext(anyList(), any())).thenReturn(Optional.empty());

        StudentResponse created = service.create(new StudentRequest("Lily", null, 50, List.of(
                discipline(Discipline.PATTERN_DANCE, "Bronze"),
                discipline(Discipline.STANDARD_FREESKATE, "Silver"))));

        assertThat(created.disciplines()).extracting(StudentDisciplineResponse::discipline)
                .containsExactly(Discipline.STANDARD_FREESKATE, Discipline.PATTERN_DANCE);
        StudentDisciplineResponse dance = created.disciplines().get(1);
        assertThat(dance.disciplineName()).isEqualTo("Pattern Dance (Solo/Partnered)");
        assertThat(dance.category()).isEqualTo(DisciplineCategory.ICE_DANCE);
        assertThat(dance.categoryName()).isEqualTo("Ice Dance");
    }

    @Test
    void levelFromAnotherDisciplineIsRejected() {
        StudentRequest request = new StudentRequest("Emma", null, 40,
                List.of(discipline(Discipline.STANDARD_FREESKATE, "Juvenile")));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Juvenile is not a level in Standard Track (Freeskate)");
        verify(students, never()).save(any());
    }

    @Test
    void sameDisciplineTwiceIsRejected() {
        StudentRequest request = new StudentRequest("Emma", null, 40, List.of(
                discipline(Discipline.STANDARD_FREESKATE, "Bronze"),
                discipline(Discipline.STANDARD_FREESKATE, "Silver")));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Standard Track (Freeskate) is listed more than once");
        verify(students, never()).save(any());
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
    void updateReplacesFieldsAndDisciplines() {
        UUID id = UUID.randomUUID();
        Student emma = new Student("Emma", "Axel", 40,
                List.of(new StudentDiscipline(Discipline.STANDARD_FREESKATE, "Pre-Gold")));
        when(students.findById(id)).thenReturn(Optional.of(emma));
        when(lessons.findAllByStudentId(id)).thenReturn(List.of());
        when(nextLessonCalculator.findNext(anyList(), any())).thenReturn(Optional.empty());

        StudentResponse updated = service.update(id, new StudentRequest("Emma M", "Power pulls", 90,
                List.of(discipline(Discipline.STANDARD_SKILLS, "Gold"))));

        assertThat(updated.name()).isEqualTo("Emma M");
        assertThat(updated.progress()).isEqualTo(90);
        assertThat(updated.disciplines()).extracting(StudentDisciplineResponse::discipline)
                .containsExactly(Discipline.STANDARD_SKILLS);
        assertThat(updated.disciplines()).extracting(StudentDisciplineResponse::level).containsExactly("Gold");
    }

    @Test
    void deleteUnknownStudentDoesNothing() {
        UUID id = UUID.randomUUID();
        when(students.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(id)).isInstanceOf(NotFoundException.class);
        verify(students, never()).delete(any());
    }
}

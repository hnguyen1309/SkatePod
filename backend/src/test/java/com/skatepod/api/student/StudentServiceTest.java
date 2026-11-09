package com.skatepod.api.student;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.lesson.LessonRepository;
import com.skatepod.api.program.ProgramService;
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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private ProgramService programs;

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
        service = new StudentService(students, lessons, nextLessonCalculator, programs, fixed);
    }

    private static StudentDisciplineRequest discipline(Discipline discipline, String level) {
        return new StudentDisciplineRequest(discipline, Track.CHAMPIONSHIP, level);
    }

    private void saveReturnsTheStudent() {
        when(students.save(any(Student.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createTrimsNameAndLevel() {
        saveReturnsTheStudent();
        when(nextLessonCalculator.findNext(anyList(), any())).thenReturn(Optional.empty());

        StudentResponse created = service.create(new StudentRequest("  Emma  ",
                List.of(discipline(Discipline.STANDARD_FREESKATE, " Pre-Gold "))));

        assertThat(created.name()).isEqualTo("Emma");
        assertThat(created.disciplines()).extracting(StudentDisciplineResponse::level).containsExactly("Pre-Gold");
        assertThat(created.nextLesson()).isNull();
    }

    @Test
    void createWithoutDisciplinesIsAllowed() {
        saveReturnsTheStudent();
        when(nextLessonCalculator.findNext(anyList(), any())).thenReturn(Optional.empty());

        assertThat(service.create(new StudentRequest("Amelia", null)).disciplines()).isEmpty();
        assertThat(service.create(new StudentRequest("Amelia", List.of())).disciplines()).isEmpty();
    }

    @Test
    void disciplinesComeBackInCatalogOrderWithNames() {
        saveReturnsTheStudent();
        when(nextLessonCalculator.findNext(anyList(), any())).thenReturn(Optional.empty());

        StudentResponse created = service.create(new StudentRequest("Lily", List.of(
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
        StudentRequest request = new StudentRequest("Emma",
                List.of(discipline(Discipline.STANDARD_FREESKATE, "Juvenile")));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Juvenile is not a level in Standard Track (Freeskate)");
        verify(students, never()).save(any());
    }

    @Test
    void sameDisciplineTwiceIsRejected() {
        StudentRequest request = new StudentRequest("Emma", List.of(
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
        Student emma = new Student("Emma",
                List.of(new StudentDiscipline(Discipline.STANDARD_FREESKATE, Track.CHAMPIONSHIP, "Pre-Gold")));
        when(students.findById(id)).thenReturn(Optional.of(emma));
        when(lessons.findAllByStudentId(id)).thenReturn(List.of());
        when(nextLessonCalculator.findNext(anyList(), any())).thenReturn(Optional.empty());

        StudentResponse updated = service.update(id, new StudentRequest("Emma M",
                List.of(new StudentDisciplineRequest(Discipline.STANDARD_SKILLS, Track.EXCEL, "Gold"))));

        assertThat(updated.name()).isEqualTo("Emma M");
        assertThat(updated.disciplines()).extracting(StudentDisciplineResponse::discipline)
                .containsExactly(Discipline.STANDARD_SKILLS);
        assertThat(updated.disciplines()).extracting(StudentDisciplineResponse::level).containsExactly("Gold");
        assertThat(updated.disciplines()).extracting(StudentDisciplineResponse::track).containsExactly(Track.EXCEL);
    }

    @Test
    void trackComesBackWithItsName() {
        saveReturnsTheStudent();
        when(nextLessonCalculator.findNext(anyList(), any())).thenReturn(Optional.empty());

        StudentResponse created = service.create(new StudentRequest("Noah", List.of(
                new StudentDisciplineRequest(Discipline.ADULT_FREESKATE, Track.ADULT, "Adult Gold"))));

        StudentDisciplineResponse freeskate = created.disciplines().get(0);
        assertThat(freeskate.track()).isEqualTo(Track.ADULT);
        assertThat(freeskate.trackName()).isEqualTo("Adult");
    }

    @Test
    void deleteUnknownStudentDoesNothing() {
        UUID id = UUID.randomUUID();
        when(students.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(id)).isInstanceOf(NotFoundException.class);
        verify(students, never()).delete(any());
    }

    @Test
    @DisplayName("Deleting a student deletes their programs and music files first, then the student")
    void deleteRemovesTheirPrograms() {
        UUID id = UUID.randomUUID();
        Student student = new Student("Skater", List.of());
        when(students.findById(id)).thenReturn(Optional.of(student));

        service.delete(id);

        InOrder order = inOrder(programs, students);
        order.verify(programs).deleteAllFor(id);
        order.verify(students).delete(student);
    }
}

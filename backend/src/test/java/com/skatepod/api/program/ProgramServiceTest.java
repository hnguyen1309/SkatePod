package com.skatepod.api.program;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.program.dto.PlacementDto;
import com.skatepod.api.program.dto.ProgramRequest;
import com.skatepod.api.program.dto.ProgramResponse;
import com.skatepod.api.program.dto.RinkPointDto;
import com.skatepod.api.student.Discipline;
import com.skatepod.api.student.Student;
import com.skatepod.api.student.StudentDiscipline;
import com.skatepod.api.student.StudentRepository;
import com.skatepod.api.student.Track;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProgramServiceTest {

    @Mock
    private ProgramRepository programs;

    @Mock
    private StudentRepository students;

    private ProgramService service;
    private final UUID studentId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new ProgramService(programs, students);
    }

    private static Student student(StudentDiscipline... disciplines) {
        return new Student("Skater", List.of(disciplines));
    }

    private static ProgramRequest request(Track track, String level, List<String> elements) {
        return new ProgramRequest("Clair de Lune", "Debussy", "2:30", track, level, elements, null, null);
    }

    @Test
    @DisplayName("The starting program is on the student's freeskate track")
    void startingProgramUsesTheStudentsTrack() {
        Student lily = student(
                new StudentDiscipline(Discipline.PATTERN_DANCE, Track.CHAMPIONSHIP, "Bronze"),
                new StudentDiscipline(Discipline.STANDARD_FREESKATE, Track.EXCEL, "Silver"));

        ProgramResponse program = ProgramService.startingProgram(lily);

        assertThat(program.saved()).isFalse();
        assertThat(program.track()).isEqualTo(Track.EXCEL);
        // Silver isn't an Excel level, so it starts at the track's first level.
        assertThat(program.level()).isEqualTo("Excel Pre-Preliminary");
        assertThat(program.musicTitle()).isEqualTo("Untitled program");
        assertThat(program.elements()).extracting(ElementCatalog.Element::code).containsExactly("1A", "2S", "CCoSp", "StSq");
    }

    @Test
    @DisplayName("The starting level is the student's own when the track has it")
    void startingLevelFromTheStudent() {
        Student noah = student(new StudentDiscipline(Discipline.ADULT_FREESKATE, Track.ADULT, "Adult Gold"));
        Student jonah = student(new StudentDiscipline(Discipline.STANDARD_FREESKATE, Track.CHAMPIONSHIP, "Preliminary"));

        assertThat(ProgramService.startingProgram(noah).level()).isEqualTo("Adult Gold");
        assertThat(ProgramService.startingProgram(jonah).level()).isEqualTo("Preliminary");
    }

    @Test
    @DisplayName("No disciplines: Championship track, Preliminary (the app's default)")
    void startingProgramWithoutDisciplines() {
        ProgramResponse program = ProgramService.startingProgram(student());

        assertThat(program.track()).isEqualTo(Track.CHAMPIONSHIP);
        assertThat(program.level()).isEqualTo("Preliminary");
    }

    @Test
    void levelMustBelongToTheTrack() {
        when(students.findById(studentId)).thenReturn(Optional.of(student()));

        assertThatThrownBy(() -> service.save(studentId, request(Track.EXCEL, "Juvenile", List.of("2S"))))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Juvenile is not a level in the Excel track");
        verify(programs, never()).save(any());
    }

    @Test
    void elementsMustBeInTheCatalog() {
        when(students.findById(studentId)).thenReturn(Optional.of(student()));

        assertThatThrownBy(() -> service.save(studentId, request(Track.CHAMPIONSHIP, "Juvenile", List.of("2S", "5A"))))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("5A is not an element in the catalog");
    }

    @Test
    @DisplayName("Saving keeps the element order and the lines drawn on the rink")
    void saveKeepsOrderAndPaths() {
        when(students.findById(studentId)).thenReturn(Optional.of(student()));
        when(programs.findByStudentId(studentId)).thenReturn(Optional.empty());
        when(programs.save(any(Program.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ProgramRequest request = new ProgramRequest("Clair de Lune", " ", "2:30", Track.CHAMPIONSHIP, "Juvenile",
                List.of("StSq", "2S", "1A"),
                List.of(List.of(new RinkPointDto(1.0, 2.0), new RinkPointDto(3.0, 4.0)), List.of(new RinkPointDto(5.0, 6.0))),
                List.of(new PlacementDto("p1", "2S", 10.0, 20.0)));

        ProgramResponse saved = service.save(studentId, request);

        assertThat(saved.saved()).isTrue();
        assertThat(saved.artist()).isNull();
        assertThat(saved.elements()).extracting(ElementCatalog.Element::code).containsExactly("StSq", "2S", "1A");
        assertThat(saved.paths()).hasSize(2);
        assertThat(saved.paths().get(0)).containsExactly(new RinkPointDto(1.0, 2.0), new RinkPointDto(3.0, 4.0));
        assertThat(saved.placements()).containsExactly(new PlacementDto("p1", "2S", 10.0, 20.0));
    }
}

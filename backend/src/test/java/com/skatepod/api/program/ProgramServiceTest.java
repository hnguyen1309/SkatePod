package com.skatepod.api.program;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.music.MusicFile;
import com.skatepod.api.music.MusicFileService;
import com.skatepod.api.program.dto.PlacementDto;
import com.skatepod.api.program.dto.ProgramRequest;
import com.skatepod.api.program.dto.ProgramResponse;
import com.skatepod.api.program.dto.RinkPointDto;
import com.skatepod.api.student.Student;
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
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ProgramServiceTest {

    @Mock
    private ProgramRepository programs;

    @Mock
    private StudentRepository students;

    @Mock
    private MusicFileService musicFiles;

    private ProgramService service;
    private final UUID studentId = UUID.randomUUID();
    private Student student;

    @BeforeEach
    void setUp() {
        service = new ProgramService(programs, students, musicFiles);
        student = new Student("Skater", List.of());
        ReflectionTestUtils.setField(student, "id", studentId);
    }

    private ProgramRequest request(Track track, String level, List<String> elements, UUID musicFileId) {
        return new ProgramRequest(studentId, "Free skate", "Clair de Lune", "Debussy", "2:30", track, level,
                "https://www.youtube.com/watch?v=abc", musicFileId, elements, null, null);
    }

    private static MusicFile musicFile() {
        MusicFile file = new MusicFile("Clair de Lune.mp3", "audio/mpeg", 1234);
        ReflectionTestUtils.setField(file, "id", UUID.randomUUID());
        return file;
    }

    /** A saved program of `student`, with a music file. */
    private Program savedProgram(MusicFile file) {
        Program program = new Program(student, "Free skate", "Clair de Lune", null, "2:30", Track.CHAMPIONSHIP,
                "Juvenile", null, file, List.of("2S"), List.of(), List.of());
        ReflectionTestUtils.setField(program, "id", UUID.randomUUID());
        return program;
    }

    @Test
    void levelMustBelongToTheTrack() {
        when(students.findById(studentId)).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> service.create(request(Track.EXCEL, "Juvenile", List.of("2S"), null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Juvenile is not a level in the Excel track");
        verify(programs, never()).save(any());
    }

    @Test
    void elementsMustBeInTheCatalog() {
        when(students.findById(studentId)).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> service.create(request(Track.CHAMPIONSHIP, "Juvenile", List.of("2S", "5A"), null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("5A is not an element in the catalog");
    }

    @Test
    @DisplayName("A new program keeps its name, music link and file, element order and rink map")
    void createKeepsEverything() {
        MusicFile file = musicFile();
        when(students.findById(studentId)).thenReturn(Optional.of(student));
        when(musicFiles.find(file.getId())).thenReturn(file);
        when(programs.save(any(Program.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ProgramRequest request = new ProgramRequest(studentId, " Free skate ", "Clair de Lune", " ", "2:30",
                Track.CHAMPIONSHIP, "Juvenile", "https://open.spotify.com/track/1", file.getId(),
                List.of("StSq", "2S+1Eu+3S", "1A"),
                List.of(List.of(new RinkPointDto(1.0, 2.0), new RinkPointDto(3.0, 4.0)), List.of(new RinkPointDto(5.0, 6.0))),
                List.of(new PlacementDto("p1", "2S", 10.0, 20.0)));

        ProgramResponse saved = service.create(request);

        assertThat(saved.name()).isEqualTo("Free skate");
        assertThat(saved.artist()).isNull();
        assertThat(saved.musicLink()).isEqualTo("https://open.spotify.com/track/1");
        assertThat(saved.musicFile().fileName()).isEqualTo("Clair de Lune.mp3");
        assertThat(saved.elements()).extracting(ElementCatalog.Element::code).containsExactly("StSq", "2S+1Eu+3S", "1A");
        assertThat(saved.paths()).hasSize(2);
        assertThat(saved.paths().get(0)).containsExactly(new RinkPointDto(1.0, 2.0), new RinkPointDto(3.0, 4.0));
        assertThat(saved.placements()).containsExactly(new PlacementDto("p1", "2S", 10.0, 20.0));
    }

    @Test
    @DisplayName("A program can't be moved to another student")
    void programStaysWithItsStudent() {
        Program program = savedProgram(null);
        when(programs.findById(program.getId())).thenReturn(Optional.of(program));
        ProgramRequest other = new ProgramRequest(UUID.randomUUID(), "Free skate", "Clair de Lune", null, "2:30",
                Track.CHAMPIONSHIP, "Juvenile", null, null, List.of("2S"), null, null);

        assertThatThrownBy(() -> service.update(program.getId(), other))
                .isInstanceOf(BadRequestException.class)
                .hasMessageStartingWith("A program stays with its student");
    }

    @Test
    @DisplayName("Removing the music file from a program deletes the file when nothing else uses it")
    void removedFileIsDeleted() {
        MusicFile file = musicFile();
        Program program = savedProgram(file);
        when(programs.findById(program.getId())).thenReturn(Optional.of(program));
        when(programs.countByMusicFileId(file.getId())).thenReturn(0L);

        ProgramResponse saved = service.update(program.getId(), request(Track.CHAMPIONSHIP, "Juvenile", List.of("2S"), null));

        assertThat(saved.musicFile()).isNull();
        verify(musicFiles).delete(file);
    }

    @Test
    @DisplayName("Keeping the same music file doesn't delete it")
    void sameFileIsKept() {
        MusicFile file = musicFile();
        Program program = savedProgram(file);
        when(programs.findById(program.getId())).thenReturn(Optional.of(program));
        when(musicFiles.find(file.getId())).thenReturn(file);

        service.update(program.getId(), request(Track.CHAMPIONSHIP, "Juvenile", List.of("2S"), file.getId()));

        verify(musicFiles, never()).delete(any());
    }

    @Test
    @DisplayName("Deleting a program keeps a music file another program still uses")
    void sharedFileIsKept() {
        MusicFile file = musicFile();
        Program program = savedProgram(file);
        when(programs.findById(program.getId())).thenReturn(Optional.of(program));
        when(programs.countByMusicFileId(file.getId())).thenReturn(1L);

        service.delete(program.getId());

        verify(programs).delete(program);
        verify(musicFiles, never()).delete(any());
    }

    @Test
    @DisplayName("Deleting a student's programs deletes their music files, but keeps one another program still uses")
    void deleteAllForAStudent() {
        MusicFile own = musicFile();
        MusicFile shared = musicFile();
        Program withOwnFile = savedProgram(own);
        Program withSharedFile = savedProgram(shared);
        Program withoutFile = savedProgram(null);
        when(programs.findByStudentIdOrderByCreatedAtAsc(studentId)).thenReturn(List.of(withOwnFile, withSharedFile, withoutFile));
        when(programs.countByMusicFileId(own.getId())).thenReturn(0L);
        when(programs.countByMusicFileId(shared.getId())).thenReturn(1L);

        service.deleteAllFor(studentId);

        verify(programs).deleteAll(List.of(withOwnFile, withSharedFile, withoutFile));
        verify(musicFiles).delete(own);
        verify(musicFiles, never()).delete(shared);
    }
}

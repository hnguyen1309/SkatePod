package com.skatepod.api.music;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.music.dto.MusicFileResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class MusicFileServiceTest {

    @Mock
    private MusicFileRepository files;

    @TempDir
    Path folder;

    private MusicFileService service;

    @BeforeEach
    void setUp() {
        service = new MusicFileService(files, folder.toString());
    }

    @Test
    @DisplayName("An uploaded MP3 is saved on disk under its id, with its name and type")
    void storesTheFile() throws Exception {
        UUID id = UUID.randomUUID();
        when(files.save(any(MusicFile.class))).thenAnswer(invocation -> {
            MusicFile file = invocation.getArgument(0);
            ReflectionTestUtils.setField(file, "id", id);
            return file;
        });
        byte[] bytes = {1, 2, 3, 4};

        MusicFileResponse saved = service.store(new MockMultipartFile("file", "Clair de Lune.mp3", "audio/mpeg", bytes));

        assertThat(saved.fileName()).isEqualTo("Clair de Lune.mp3");
        assertThat(saved.contentType()).isEqualTo("audio/mpeg");
        assertThat(saved.sizeBytes()).isEqualTo(4);
        assertThat(Files.readAllBytes(folder.resolve(id.toString()))).isEqualTo(bytes);
    }

    @Test
    @DisplayName("Files that aren't audio are turned away")
    void rejectsOtherFiles() {
        MockMultipartFile photo = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[] {1});

        assertThatThrownBy(() -> service.store(photo))
                .isInstanceOf(BadRequestException.class)
                .hasMessageStartingWith("photo.jpg isn't an audio file");
        verify(files, never()).save(any());
    }

    @Test
    void rejectsEmptyFiles() {
        assertThatThrownBy(() -> service.store(new MockMultipartFile("file", "song.mp3", "audio/mpeg", new byte[0])))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("The music file is empty");
    }

    @Test
    @DisplayName("When the phone doesn't send an audio type, the extension decides")
    void typeFromExtension() {
        assertThat(MusicFileService.audioTypeOf("Song.M4A", "application/octet-stream")).isEqualTo("audio/mp4");
        assertThat(MusicFileService.audioTypeOf("song.mp3", null)).isEqualTo("audio/mpeg");
        assertThat(MusicFileService.audioTypeOf("song.wav", "audio/x-wav")).isEqualTo("audio/x-wav");
    }

    @Test
    @DisplayName("File names lose any folder path, and a blank one becomes \"music\"")
    void cleansFileNames() {
        assertThat(MusicFileService.cleanFileName("/private/var/tmp/Clair de Lune.mp3")).isEqualTo("Clair de Lune.mp3");
        assertThat(MusicFileService.cleanFileName("C:\\Music\\song.mp3")).isEqualTo("song.mp3");
        assertThat(MusicFileService.cleanFileName("  ")).isEqualTo("music");
        assertThat(MusicFileService.cleanFileName(null)).isEqualTo("music");
    }

    @Test
    @DisplayName("Deleting removes the row and the file on disk")
    void deletesTheFile() throws Exception {
        MusicFile file = new MusicFile("song.mp3", "audio/mpeg", 1);
        UUID id = UUID.randomUUID();
        ReflectionTestUtils.setField(file, "id", id);
        Files.write(folder.resolve(id.toString()), new byte[] {1});

        service.delete(file);

        verify(files).delete(file);
        assertThat(folder.resolve(id.toString())).doesNotExist();
    }
}

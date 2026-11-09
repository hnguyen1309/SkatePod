package com.skatepod.api.music;

import com.skatepod.api.common.BadRequestException;
import com.skatepod.api.common.NotFoundException;
import com.skatepod.api.music.dto.MusicFileResponse;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Keeps uploaded music files: the bytes go in a folder on disk (skatepod.music.dir, by default
 * backend/uploads/music), the name and type in the music_files table.
 */
@Service
public class MusicFileService {

    /** The biggest file accepted: 20 MB, about 20 minutes of MP3. Also set in application.yaml (multipart). */
    public static final long MAX_BYTES = 20L * 1024 * 1024;

    // The audio types the app lets coaches pick, by file extension. Phones don't always send a proper
    // type (sometimes just "application/octet-stream"), so the extension decides when they don't.
    static final Map<String, String> AUDIO_TYPES = Map.of(
            "mp3", "audio/mpeg",
            "m4a", "audio/mp4",
            "aac", "audio/aac",
            "wav", "audio/wav",
            "aif", "audio/aiff",
            "aiff", "audio/aiff",
            "ogg", "audio/ogg",
            "flac", "audio/flac");

    private final MusicFileRepository files;
    private final Path folder;

    public MusicFileService(MusicFileRepository files, @Value("${skatepod.music.dir}") String folder) {
        this.files = files;
        this.folder = Path.of(folder);
    }

    /** A file read back from disk, for GET /api/music/{id}. */
    public record StoredMusic(MusicFile file, Resource resource) {
    }

    @Transactional
    public MusicFileResponse store(MultipartFile upload) {
        if (upload == null || upload.isEmpty()) {
            throw new BadRequestException("The music file is empty");
        }
        if (upload.getSize() > MAX_BYTES) {
            throw new BadRequestException("Music files can be up to 20 MB");
        }
        String fileName = cleanFileName(upload.getOriginalFilename());
        String contentType = audioTypeOf(fileName, upload.getContentType());
        MusicFile saved = files.save(new MusicFile(fileName, contentType, upload.getSize()));
        try {
            Files.createDirectories(folder);
            upload.transferTo(pathOf(saved.getId()));
        } catch (IOException exception) {
            // Throwing rolls the new row back, so there's never a row without its file.
            throw new UncheckedIOException("Couldn't save the music file", exception);
        }
        return MusicFileResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public MusicFile find(UUID id) {
        return files.findById(id).orElseThrow(() -> new NotFoundException("Music file", id));
    }

    @Transactional(readOnly = true)
    public StoredMusic load(UUID id) {
        MusicFile file = find(id);
        Path path = pathOf(id);
        if (!Files.exists(path)) {
            throw new NotFoundException("Music file", id);
        }
        return new StoredMusic(file, new FileSystemResource(path));
    }

    /** Deletes the row and the file on disk. ProgramService only calls this when no program uses the file any more. */
    @Transactional
    public void delete(MusicFile file) {
        files.delete(file);
        try {
            Files.deleteIfExists(pathOf(file.getId()));
        } catch (IOException exception) {
            throw new UncheckedIOException("Couldn't delete the music file", exception);
        }
    }

    Path pathOf(UUID id) {
        return folder.resolve(id.toString());
    }

    /** "Clair de Lune.mp3" stays as it is; a path is cut to its last part; a blank name becomes "music". */
    static String cleanFileName(String original) {
        String name = original == null ? "" : original.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).trim();
        if (name.isEmpty()) name = "music";
        return name.length() > 200 ? name.substring(name.length() - 200) : name;
    }

    /** The file's audio type, from what the phone sent or else from the extension. Anything else isn't music. */
    static String audioTypeOf(String fileName, String sentType) {
        if (sentType != null && sentType.toLowerCase(Locale.ROOT).startsWith("audio/")) {
            return sentType.toLowerCase(Locale.ROOT);
        }
        int dot = fileName.lastIndexOf('.');
        String extension = dot < 0 ? "" : fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
        String type = AUDIO_TYPES.get(extension);
        if (type == null) {
            throw new BadRequestException(fileName + " isn't an audio file. Use MP3, M4A, AAC, WAV, AIFF, OGG or FLAC.");
        }
        return type;
    }
}

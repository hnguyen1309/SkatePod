package com.skatepod.api.music.dto;

import com.skatepod.api.music.MusicFile;
import java.util.UUID;

/**
 * An uploaded music file. The file itself is at GET /api/music/{id}.
 * Example: {"id": "...", "fileName": "Clair de Lune.mp3", "contentType": "audio/mpeg", "sizeBytes": 4812345}
 */
public record MusicFileResponse(UUID id, String fileName, String contentType, long sizeBytes) {

    public static MusicFileResponse from(MusicFile file) {
        return new MusicFileResponse(file.getId(), file.getFileName(), file.getContentType(), file.getSizeBytes());
    }
}

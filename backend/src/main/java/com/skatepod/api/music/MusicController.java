package com.skatepod.api.music;

import com.skatepod.api.music.dto.MusicFileResponse;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Music files for programs. The app uploads the file first (POST, as a form with a "file" field),
 * then saves the program with the returned id as musicFileId.
 */
@RestController
@RequestMapping("/api/music")
public class MusicController {

    private final MusicFileService service;

    public MusicController(MusicFileService service) {
        this.service = service;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MusicFileResponse> upload(@RequestParam("file") MultipartFile file) {
        MusicFileResponse saved = service.store(file);
        return ResponseEntity.created(URI.create("/api/music/" + saved.id())).body(saved);
    }

    /**
     * The file itself, to play it. Spring answers "Range" requests for a Resource by itself, which
     * the iPhone's audio player needs to skip ahead.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        MusicFileService.StoredMusic music = service.load(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(music.file().getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(music.file().getFileName(), StandardCharsets.UTF_8).build().toString())
                .body(music.resource());
    }
}

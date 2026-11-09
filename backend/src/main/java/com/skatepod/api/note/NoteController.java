package com.skatepod.api.note;

import com.skatepod.api.note.dto.NoteRequest;
import com.skatepod.api.note.dto.NoteResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** The training history (the app's Lessons tab). */
@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteService service;

    public NoteController(NoteService service) {
        this.service = service;
    }

    /** Newest first. Optional filters: ?studentId=...&from=2026-11-01T00:00:00Z&to=... */
    @GetMapping
    public List<NoteResponse> list(@RequestParam(required = false) UUID studentId,
                                   @RequestParam(required = false) Instant from,
                                   @RequestParam(required = false) Instant to) {
        return service.list(studentId, from, to);
    }

    @GetMapping("/{id}")
    public NoteResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<NoteResponse> create(@Valid @RequestBody NoteRequest request) {
        NoteResponse created = service.create(request);
        return ResponseEntity.created(URI.create("/api/notes/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public NoteResponse update(@PathVariable UUID id, @Valid @RequestBody NoteRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

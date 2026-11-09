package com.skatepod.api.program;

import com.skatepod.api.program.dto.ProgramRequest;
import com.skatepod.api.program.dto.ProgramResponse;
import com.skatepod.api.program.dto.TrackResponse;
import com.skatepod.api.student.Track;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Arrays;
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

/** Programs (a student can have several), plus the tracks and elements the Programs tab's dropdowns need. */
@RestController
@RequestMapping("/api")
public class ProgramController {

    private final ProgramService service;

    public ProgramController(ProgramService service) {
        this.service = service;
    }

    /** Every program, oldest first. Optional filter: ?studentId=... */
    @GetMapping("/programs")
    public List<ProgramResponse> list(@RequestParam(required = false) UUID studentId) {
        return service.list(studentId);
    }

    @GetMapping("/programs/{id}")
    public ProgramResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping("/programs")
    public ResponseEntity<ProgramResponse> create(@Valid @RequestBody ProgramRequest request) {
        ProgramResponse created = service.create(request);
        return ResponseEntity.created(URI.create("/api/programs/" + created.id())).body(created);
    }

    @PutMapping("/programs/{id}")
    public ProgramResponse update(@PathVariable UUID id, @Valid @RequestBody ProgramRequest request) {
        return service.update(id, request);
    }

    /** Also deletes the program's music file when no other program uses it. */
    @DeleteMapping("/programs/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tracks")
    public List<TrackResponse> tracks() {
        return Arrays.stream(Track.values()).map(TrackResponse::from).toList();
    }

    @GetMapping("/elements")
    public List<ElementCatalog.Element> elements() {
        return ElementCatalog.all();
    }
}

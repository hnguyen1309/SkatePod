package com.skatepod.api.program;

import com.skatepod.api.program.dto.ProgramRequest;
import com.skatepod.api.program.dto.ProgramResponse;
import com.skatepod.api.program.dto.TrackResponse;
import com.skatepod.api.student.Track;
import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Programs (one per student), plus the tracks and elements the Programs tab's dropdowns need. */
@RestController
@RequestMapping("/api")
public class ProgramController {

    private final ProgramService service;

    public ProgramController(ProgramService service) {
        this.service = service;
    }

    /** The saved program, or the starting program (saved: false) on the student's own track. */
    @GetMapping("/students/{studentId}/program")
    public ProgramResponse get(@PathVariable UUID studentId) {
        return service.get(studentId);
    }

    /** Creates or replaces the student's program. */
    @PutMapping("/students/{studentId}/program")
    public ProgramResponse save(@PathVariable UUID studentId, @Valid @RequestBody ProgramRequest request) {
        return service.save(studentId, request);
    }

    @DeleteMapping("/students/{studentId}/program")
    public ResponseEntity<Void> delete(@PathVariable UUID studentId) {
        service.delete(studentId);
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

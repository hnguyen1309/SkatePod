package com.skatepod.api.lesson;

import com.skatepod.api.lesson.dto.LessonRequest;
import com.skatepod.api.lesson.dto.LessonResponse;
import jakarta.validation.Valid;
import java.net.URI;
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

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonService service;

    public LessonController(LessonService service) {
        this.service = service;
    }

    /** All lessons, or only one student's with ?studentId=... */
    @GetMapping
    public List<LessonResponse> list(@RequestParam(required = false) UUID studentId) {
        return service.list(studentId);
    }

    @GetMapping("/{id}")
    public LessonResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<LessonResponse> create(@Valid @RequestBody LessonRequest request) {
        LessonResponse created = service.create(request);
        return ResponseEntity.created(URI.create("/api/lessons/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public LessonResponse update(@PathVariable UUID id, @Valid @RequestBody LessonRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

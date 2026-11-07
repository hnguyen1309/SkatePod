package com.skatepod.api.availability;

import com.skatepod.api.availability.dto.AvailabilityBlockRequest;
import com.skatepod.api.availability.dto.AvailabilityBlockResponse;
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
import org.springframework.web.bind.annotation.RestController;

/** The coach's optional availability blocks on the weekly calendar. */
@RestController
@RequestMapping("/api/availability")
public class AvailabilityController {

    private final AvailabilityService service;

    public AvailabilityController(AvailabilityService service) {
        this.service = service;
    }

    @GetMapping
    public List<AvailabilityBlockResponse> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<AvailabilityBlockResponse> create(@Valid @RequestBody AvailabilityBlockRequest request) {
        AvailabilityBlockResponse created = service.create(request);
        return ResponseEntity.created(URI.create("/api/availability/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public AvailabilityBlockResponse update(@PathVariable UUID id, @Valid @RequestBody AvailabilityBlockRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

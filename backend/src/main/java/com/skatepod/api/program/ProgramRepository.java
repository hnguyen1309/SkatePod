package com.skatepod.api.program;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgramRepository extends JpaRepository<Program, UUID> {

    Optional<Program> findByStudentId(UUID studentId);
}

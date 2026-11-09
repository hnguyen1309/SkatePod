package com.skatepod.api.program;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgramRepository extends JpaRepository<Program, UUID> {

    /** A student's programs, oldest first (the order the Programs tab shows them in). */
    List<Program> findByStudentIdOrderByCreatedAtAsc(UUID studentId);

    List<Program> findAllByOrderByCreatedAtAsc();

    /** How many programs use a music file, so a file is only deleted once nothing uses it. */
    long countByMusicFileId(UUID musicFileId);
}

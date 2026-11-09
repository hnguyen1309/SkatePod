package com.skatepod.api.note;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface NoteRepository extends JpaRepository<Note, UUID> {

    /** Every note from `since` on. Used when filling in the history, to see which lessons already have one. */
    List<Note> findAllByTimeGreaterThanEqual(Instant since);
}

package com.skatepod.api.music;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MusicFileRepository extends JpaRepository<MusicFile, UUID> {
}

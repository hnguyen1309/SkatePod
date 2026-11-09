package com.skatepod.api.music;

import com.skatepod.api.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * A music file a coach uploaded for a program (an MP3 or other audio). The file itself is on disk in
 * skatepod.music.dir, named by this row's id; the row remembers its original name and type.
 */
@Entity
@Table(name = "music_files")
public class MusicFile extends BaseEntity {

    @Column(name = "file_name", nullable = false, length = 200)
    private String fileName;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    protected MusicFile() {
        // Required by JPA.
    }

    public MusicFile(String fileName, String contentType, long sizeBytes) {
        update(fileName, contentType, sizeBytes);
    }

    // Files aren't edited after upload, but every entity follows the same pattern (see CLAUDE.md).
    private void update(String fileName, String contentType, long sizeBytes) {
        this.fileName = fileName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
    }

    public String getFileName() {
        return fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }
}

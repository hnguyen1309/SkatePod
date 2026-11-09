-- Programs, version 2 (Nov 2026):
--  - A student can have several programs (a free skate, a showcase...), so student_id is no longer unique.
--  - Each program has a name the coach types, like "Free skate 2026-27".
--  - The music can be a link (YouTube, Apple Music, Spotify...) and/or an uploaded audio file.

-- Uploaded music files. The file itself is kept on disk (skatepod.music.dir), named by its id;
-- this table remembers what it was called and what kind of file it is.
CREATE TABLE music_files (
    id            UUID PRIMARY KEY,
    file_name     VARCHAR(200) NOT NULL, -- the name it had on the phone, like "Clair de Lune.mp3"
    content_type  VARCHAR(100) NOT NULL, -- like "audio/mpeg"
    size_bytes    BIGINT       NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL
);

ALTER TABLE programs DROP CONSTRAINT programs_student_id_key;
CREATE INDEX programs_student_id_idx ON programs (student_id);

-- Programs saved before this get the name "Program". The default also lets the sample data insert without one.
ALTER TABLE programs ADD COLUMN name VARCHAR(80) NOT NULL DEFAULT 'Program';
ALTER TABLE programs ADD COLUMN music_link VARCHAR(500);
-- Deleting a file row (only done when no program uses it) never deletes a program.
ALTER TABLE programs ADD COLUMN music_file_id UUID REFERENCES music_files (id) ON DELETE SET NULL;

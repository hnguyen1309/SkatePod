-- Brings the database in line with the app (Nov 2026):
--   1. Lessons repeat weekly again, with optional start and end dates (like the app's calendar).
--   2. Notes: the training history on the Lessons tab, one entry per lesson that happened.
--   3. Programs: one program layout per student (Programs tab).
--   4. Availability blocks: optional "I can coach here" times on the weekly calendar.

-- 1. Weekly lessons ---------------------------------------------------------------------------

ALTER TABLE lessons ADD COLUMN day_of_week VARCHAR(9);
ALTER TABLE lessons ADD COLUMN start_date DATE;
ALTER TABLE lessons ADD COLUMN end_date DATE;

-- A dated lesson becomes a weekly lesson that runs for just that one day, so it keeps its meaning.
-- FMDay gives 'MONDAY', 'TUESDAY', ... (FM drops the padding spaces).
UPDATE lessons
SET day_of_week = UPPER(TO_CHAR(lesson_date, 'FMDay')),
    start_date  = lesson_date,
    end_date    = lesson_date;

ALTER TABLE lessons ALTER COLUMN day_of_week SET NOT NULL;
ALTER TABLE lessons ADD CONSTRAINT lessons_day_of_week_check
    CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'));
-- No start date means "always on" (older lessons in the app). An end date can't be before the start.
ALTER TABLE lessons ADD CONSTRAINT lessons_dates_check
    CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date);

DROP INDEX idx_lessons_lesson_date;
ALTER TABLE lessons DROP COLUMN lesson_date;
-- The color always follows the type now (Freestyle = teal, ...), so it's worked out in code, not stored.
ALTER TABLE lessons DROP COLUMN color;

CREATE INDEX idx_lessons_day_of_week ON lessons (day_of_week);

-- 2. Notes (training history) ------------------------------------------------------------------

CREATE TABLE notes (
    id                UUID PRIMARY KEY,
    student_id        UUID         NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    -- The calendar lesson this note was written for. Empty for "Add a past lesson" notes.
    -- If the lesson is deleted later, the note stays in the history and just loses the link.
    lesson_id         UUID         REFERENCES lessons (id) ON DELETE SET NULL,
    note_time         TIMESTAMPTZ  NOT NULL,
    title             VARCHAR(120) NOT NULL,
    lesson_type       VARCHAR(40)  NOT NULL CHECK (lesson_type IN ('Public', 'Freestyle', 'Off-ice')),
    duration_minutes  INTEGER      NOT NULL CHECK (duration_minutes BETWEEN 5 AND 240),
    overall           VARCHAR(40),
    focus             VARCHAR(200),
    observations      TEXT,
    next_steps        TEXT,
    shared            BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ  NOT NULL,
    updated_at        TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_notes_student_id ON notes (student_id);
CREATE INDEX idx_notes_note_time ON notes (note_time);
CREATE INDEX idx_notes_lesson_id ON notes (lesson_id);

-- The skills worked on in a lesson, in the order the coach added them.
CREATE TABLE note_skills (
    note_id   UUID        NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
    position  INTEGER     NOT NULL,
    skill     VARCHAR(80) NOT NULL,
    PRIMARY KEY (note_id, position)
);

-- When the history was last brought up to date, so a history entry the coach deleted doesn't come back.
-- There's only ever one row (id = 1) until coaches have their own accounts.
CREATE TABLE history_check (
    id          INTEGER     PRIMARY KEY CHECK (id = 1),
    checked_at  TIMESTAMPTZ NOT NULL
);

-- 3. Programs ----------------------------------------------------------------------------------

CREATE TABLE programs (
    id           UUID PRIMARY KEY,
    student_id   UUID         NOT NULL UNIQUE REFERENCES students (id) ON DELETE CASCADE,
    music_title  VARCHAR(120) NOT NULL,
    artist       VARCHAR(120),
    duration     VARCHAR(5)   NOT NULL, -- like "2:10"
    track        VARCHAR(20)  NOT NULL, -- CHAMPIONSHIP, EXCEL or ADULT (Track.java)
    level        VARCHAR(60)  NOT NULL, -- a level of that track (Track.java)
    created_at   TIMESTAMPTZ  NOT NULL,
    updated_at   TIMESTAMPTZ  NOT NULL
);

-- The program's elements in skating order, by code (e.g. "2S"). The catalog is in ElementCatalog.java.
CREATE TABLE program_elements (
    program_id  UUID        NOT NULL REFERENCES programs (id) ON DELETE CASCADE,
    position    INTEGER     NOT NULL,
    code        VARCHAR(10) NOT NULL,
    PRIMARY KEY (program_id, position)
);

-- Lines drawn on the rink map. Each point says which line it belongs to (path_index).
-- x and y are in the rink drawing's own units, like the app.
CREATE TABLE program_path_points (
    program_id  UUID             NOT NULL REFERENCES programs (id) ON DELETE CASCADE,
    position    INTEGER          NOT NULL,
    path_index  INTEGER          NOT NULL,
    x           DOUBLE PRECISION NOT NULL,
    y           DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (program_id, position)
);

-- Element markers placed on the rink map. placement_key is the app's own id for the marker.
CREATE TABLE program_placements (
    program_id     UUID             NOT NULL REFERENCES programs (id) ON DELETE CASCADE,
    position       INTEGER          NOT NULL,
    placement_key  VARCHAR(40)      NOT NULL,
    code           VARCHAR(10)      NOT NULL,
    x              DOUBLE PRECISION NOT NULL,
    y              DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (program_id, position)
);

-- 4. Availability blocks -----------------------------------------------------------------------

CREATE TABLE availability_blocks (
    id           UUID PRIMARY KEY,
    day_of_week  VARCHAR(9)  NOT NULL
        CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')),
    start_time   TIME        NOT NULL,
    end_time     TIME        NOT NULL,
    place        VARCHAR(60), -- optional, e.g. "North Rink"
    created_at   TIMESTAMPTZ NOT NULL,
    updated_at   TIMESTAMPTZ NOT NULL,
    CHECK (end_time > start_time)
);

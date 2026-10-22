-- Students a coach teaches. Keep personal data minimal: many skaters are minors.
CREATE TABLE students (
    id          UUID PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    level       VARCHAR(60)  NOT NULL,
    discipline  VARCHAR(60)  NOT NULL,
    focus       VARCHAR(200),
    progress    INTEGER      NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    created_at  TIMESTAMPTZ  NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL
);

-- A coach's recurring weekly schedule. One row per lesson slot.
CREATE TABLE lessons (
    id                UUID PRIMARY KEY,
    student_id        UUID        NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    day_of_week       VARCHAR(9)  NOT NULL,
    start_time        TIME        NOT NULL,
    duration_minutes  INTEGER     NOT NULL CHECK (duration_minutes BETWEEN 5 AND 240),
    lesson_type       VARCHAR(40) NOT NULL,
    color             VARCHAR(20) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL,
    updated_at        TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_lessons_student_id ON lessons (student_id);

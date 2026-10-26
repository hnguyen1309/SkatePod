-- A student can train in several disciplines, with a different level in each one
-- (e.g. Pre-Gold in Standard Freeskate and Bronze in Pattern Dance).
-- Which disciplines and levels exist is decided in code (Discipline.java), not here.
CREATE TABLE student_disciplines (
    student_id  UUID        NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    discipline  VARCHAR(40) NOT NULL,
    level       VARCHAR(60) NOT NULL,
    -- One level per discipline per student.
    PRIMARY KEY (student_id, discipline)
);

-- The old single level and discipline were free text that doesn't match the new levels,
-- and only made-up sample data exists so far, so they are dropped instead of copied.
ALTER TABLE students DROP COLUMN level;
ALTER TABLE students DROP COLUMN discipline;

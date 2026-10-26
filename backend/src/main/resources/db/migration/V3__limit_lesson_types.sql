-- Lessons now come in three types only: Public, Freestyle and Off-ice.
-- Older types (Moves, Program, Spins, ...) get one of the three at random.
-- random() runs once per row, so each lesson gets its own pick.
UPDATE lessons
SET lesson_type = (ARRAY['Public', 'Freestyle', 'Off-ice'])[floor(random() * 3)::INTEGER + 1]
WHERE lesson_type NOT IN ('Public', 'Freestyle', 'Off-ice');

-- From now on the database itself refuses any other type.
ALTER TABLE lessons
    ADD CONSTRAINT lessons_lesson_type_check CHECK (lesson_type IN ('Public', 'Freestyle', 'Off-ice'));

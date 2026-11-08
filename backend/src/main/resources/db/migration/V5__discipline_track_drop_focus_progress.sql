-- Each discipline a student trains in now also has a track: CHAMPIONSHIP, EXCEL or ADULT
-- (the same tracks as the Programs panel in the app). Which tracks exist is decided in code
-- (Track.java), like disciplines and levels.
-- The track is not shown on the student profile. It's stored so the Programs panel can be
-- filled in with the student's track.
ALTER TABLE student_disciplines ADD COLUMN track VARCHAR(20);

-- Existing rows: the adult disciplines get ADULT, everything else CHAMPIONSHIP.
-- A coach can change it to EXCEL later.
UPDATE student_disciplines
SET track = CASE WHEN discipline LIKE 'ADULT\_%' THEN 'ADULT' ELSE 'CHAMPIONSHIP' END;

ALTER TABLE student_disciplines ALTER COLUMN track SET NOT NULL;

-- Focus and progress are gone from the app (Nov 2026), so the database drops them too.
-- The progress CHECK constraint goes away with its column.
ALTER TABLE students DROP COLUMN focus;
ALTER TABLE students DROP COLUMN progress;

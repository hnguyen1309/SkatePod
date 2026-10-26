-- Lessons become dated calendar entries instead of a repeating weekly slot,
-- so students can have lessons twice a week, once a month, or just once.
ALTER TABLE lessons ADD COLUMN lesson_date DATE;

-- Existing weekly slots become a single lesson on the next matching day (today included).
UPDATE lessons SET lesson_date = CURRENT_DATE + ((
    CASE day_of_week
        WHEN 'MONDAY'    THEN 1
        WHEN 'TUESDAY'   THEN 2
        WHEN 'WEDNESDAY' THEN 3
        WHEN 'THURSDAY'  THEN 4
        WHEN 'FRIDAY'    THEN 5
        WHEN 'SATURDAY'  THEN 6
        WHEN 'SUNDAY'    THEN 7
    END - EXTRACT(ISODOW FROM CURRENT_DATE)::INTEGER + 7) % 7);

ALTER TABLE lessons ALTER COLUMN lesson_date SET NOT NULL;
ALTER TABLE lessons DROP COLUMN day_of_week;

CREATE INDEX idx_lessons_lesson_date ON lessons (lesson_date);

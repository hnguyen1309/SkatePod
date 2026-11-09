-- Sample programs, version 2 (after V8): Lily's program gets a name and a music link, and she gets a
-- second program, so the Programs tab shows how a student with several programs looks.
-- All made up, like the rest of the sample data.
UPDATE programs SET name = 'Free skate 2026-27', music_link = 'https://www.youtube.com/results?search_query=clair+de+lune+debussy'
WHERE id = '55555555-5555-5555-5555-000000000001';

INSERT INTO programs (id, student_id, name, music_title, artist, duration, track, level, created_at, updated_at) VALUES
    ('55555555-5555-5555-5555-000000000002', '11111111-1111-1111-1111-000000000002', 'Spring showcase', 'The Swan', 'Camille Saint-Saëns', '2:00', 'EXCEL', 'Excel Juvenile', now(), now());

INSERT INTO program_elements (program_id, position, code) VALUES
    ('55555555-5555-5555-5555-000000000002', 0, '1A'),
    ('55555555-5555-5555-5555-000000000002', 1, '2S+2T'),
    ('55555555-5555-5555-5555-000000000002', 2, 'ChSq'),
    ('55555555-5555-5555-5555-000000000002', 3, 'CSp');

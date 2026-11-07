-- Made-up sample data, loaded only with the "dev" profile. It mirrors the app's sample data
-- (SAMPLE_STUDENTS, SAMPLE_LESSONS and SAMPLE_NOTES in mobile/src/data.ts), plus a few extras
-- so every feature has something to show: lessons with start and end dates, availability blocks
-- and one saved program.
INSERT INTO students (id, name, created_at, updated_at) VALUES
    ('11111111-1111-1111-1111-000000000001', 'Emma Miller',  now(), now()),
    ('11111111-1111-1111-1111-000000000002', 'Lily Kim',     now(), now()),
    ('11111111-1111-1111-1111-000000000003', 'Jonah Reed',   now(), now()),
    ('11111111-1111-1111-1111-000000000004', 'Sofia Chen',   now(), now()),
    ('11111111-1111-1111-1111-000000000005', 'Noah Bennett', now(), now()),
    ('11111111-1111-1111-1111-000000000006', 'Amelia Park',  now(), now());

-- Each student's disciplines, with their track and level in each. Amelia has none yet.
-- Lily is on the Excel track; the track is used by the Programs panel, not the profile.
INSERT INTO student_disciplines (student_id, discipline, track, level) VALUES
    ('11111111-1111-1111-1111-000000000001', 'STANDARD_FREESKATE', 'CHAMPIONSHIP', 'Pre-Gold'),
    ('11111111-1111-1111-1111-000000000001', 'STANDARD_SKILLS',    'CHAMPIONSHIP', 'Gold'),
    ('11111111-1111-1111-1111-000000000002', 'STANDARD_FREESKATE', 'EXCEL',        'Silver'),
    ('11111111-1111-1111-1111-000000000002', 'PATTERN_DANCE',      'EXCEL',        'Bronze'),
    ('11111111-1111-1111-1111-000000000003', 'STANDARD_SKILLS',    'CHAMPIONSHIP', 'Preliminary'),
    ('11111111-1111-1111-1111-000000000004', 'STANDARD_FREESKATE', 'CHAMPIONSHIP', 'Gold'),
    ('11111111-1111-1111-1111-000000000004', 'FREE_DANCE',         'CHAMPIONSHIP', 'Juvenile'),
    ('11111111-1111-1111-1111-000000000005', 'ADULT_FREESKATE',    'ADULT',        'Adult Gold'),
    ('11111111-1111-1111-1111-000000000005', 'ADULT_SKILLS',       'ADULT',        'Adult Silver');

-- Weekly lessons. The first seven are the app's sample lessons (l1-l7), which have no dates
-- ("always on"). Then: Sofia's lessons start in two weeks, and Noah's ended last week,
-- so he shows "Not scheduled". Amelia has none.
INSERT INTO lessons (id, student_id, day_of_week, start_time, duration_minutes, lesson_type, start_date, end_date, created_at, updated_at) VALUES
    ('22222222-2222-2222-2222-000000000001', '11111111-1111-1111-1111-000000000003', 'MONDAY',    '11:00', 45, 'Public',    NULL, NULL, now(), now()),
    ('22222222-2222-2222-2222-000000000002', '11111111-1111-1111-1111-000000000002', 'TUESDAY',   '09:00', 60, 'Freestyle', NULL, NULL, now(), now()),
    ('22222222-2222-2222-2222-000000000003', '11111111-1111-1111-1111-000000000001', 'WEDNESDAY', '15:00', 30, 'Off-ice',   NULL, NULL, now(), now()),
    ('22222222-2222-2222-2222-000000000004', '11111111-1111-1111-1111-000000000001', 'THURSDAY',  '07:00', 60, 'Freestyle', NULL, NULL, now(), now()),
    ('22222222-2222-2222-2222-000000000005', '11111111-1111-1111-1111-000000000002', 'THURSDAY',  '13:00', 45, 'Freestyle', NULL, NULL, now(), now()),
    ('22222222-2222-2222-2222-000000000006', '11111111-1111-1111-1111-000000000003', 'FRIDAY',    '11:00', 45, 'Off-ice',   NULL, NULL, now(), now()),
    ('22222222-2222-2222-2222-000000000007', '11111111-1111-1111-1111-000000000001', 'SATURDAY',  '09:00', 60, 'Public',    NULL, NULL, now(), now()),
    ('22222222-2222-2222-2222-000000000008', '11111111-1111-1111-1111-000000000004', 'FRIDAY',    '13:00', 45, 'Freestyle', CURRENT_DATE + 14, NULL, now(), now()),
    ('22222222-2222-2222-2222-000000000009', '11111111-1111-1111-1111-000000000005', 'SUNDAY',    '07:00', 45, 'Freestyle', CURRENT_DATE - 35, CURRENT_DATE - 7, now(), now());

-- The app's sample notes (n1-n4): written history entries from the last week.
INSERT INTO notes (id, student_id, lesson_id, note_time, title, lesson_type, duration_minutes, overall, focus, observations, next_steps, shared, created_at, updated_at) VALUES
    ('33333333-3333-3333-3333-000000000001', '11111111-1111-1111-1111-000000000001', NULL, now(),                     'Freestyle lesson',    'Freestyle', 60, 'Strong progress', 'Double loop, flying camel spin',
     'Much stronger check on the double loop today. Landing was controlled on 4 of 6 attempts. Keep the free leg extended longer through the exit.',
     'Start next lesson with loop entrance drills, then connect the jump into the opening program section.', TRUE, now(), now()),
    ('33333333-3333-3333-3333-000000000002', '11111111-1111-1111-1111-000000000002', NULL, now() - INTERVAL '2 days', 'Spin session',        'Public',    45, 'Steady',          'Flying camel, spin combinations',
     'Flying camel entry is more consistent from speed. Centering improved when the entry edge stayed patient.',
     'Practice three controlled entries before adding the change-foot combination.', TRUE, now(), now()),
    ('33333333-3333-3333-3333-000000000003', '11111111-1111-1111-1111-000000000003', NULL, now() - INTERVAL '3 days', 'Moves in the field',  'Public',    45, 'Steady',          'Power pulls and edge quality',
     'Continue working on knee action through power pulls. Stronger flow on the right side.',
     'Complete two sets on each foot with emphasis on rhythm.', TRUE, now(), now()),
    ('33333333-3333-3333-3333-000000000004', '11111111-1111-1111-1111-000000000004', NULL, now() - INTERVAL '6 days', 'Program run-through', 'Freestyle', 60, 'Strong progress', 'Free skate run-through',
     'Great musical timing. Rework the final jump entrance to preserve speed into the last section.',
     'Mark the revised entrance twice, then complete one full run-through.', TRUE, now(), now());

INSERT INTO note_skills (note_id, position, skill) VALUES
    ('33333333-3333-3333-3333-000000000001', 0, 'Double loop'),
    ('33333333-3333-3333-3333-000000000001', 1, 'Flying camel'),
    ('33333333-3333-3333-3333-000000000001', 2, 'Program transitions'),
    ('33333333-3333-3333-3333-000000000002', 0, 'Flying camel'),
    ('33333333-3333-3333-3333-000000000002', 1, 'Combination spin'),
    ('33333333-3333-3333-3333-000000000003', 0, 'Power pulls'),
    ('33333333-3333-3333-3333-000000000003', 1, 'Outside edges'),
    ('33333333-3333-3333-3333-000000000004', 0, 'Program transitions'),
    ('33333333-3333-3333-3333-000000000004', 1, 'Double axel');

-- Availability blocks (the app starts with none; these show places on lessons).
-- Emma's Thursday 7:00 lesson is at North Rink, her Saturday 9:00 lesson at South Rink.
INSERT INTO availability_blocks (id, day_of_week, start_time, end_time, place, created_at, updated_at) VALUES
    ('44444444-4444-4444-4444-000000000001', 'TUESDAY',  '15:00', '18:00', 'North Rink', now(), now()),
    ('44444444-4444-4444-4444-000000000002', 'THURSDAY', '06:30', '10:00', 'North Rink', now(), now()),
    ('44444444-4444-4444-4444-000000000003', 'SATURDAY', '08:00', '12:00', 'South Rink', now(), now());

-- One saved program: Lily's, on her Excel track. Everyone else gets the starting program.
INSERT INTO programs (id, student_id, music_title, artist, duration, track, level, created_at, updated_at) VALUES
    ('55555555-5555-5555-5555-000000000001', '11111111-1111-1111-1111-000000000002', 'Clair de Lune', 'Claude Debussy', '2:30', 'EXCEL', 'Excel Juvenile', now(), now());

INSERT INTO program_elements (program_id, position, code) VALUES
    ('55555555-5555-5555-5555-000000000001', 0, '2S'),
    ('55555555-5555-5555-5555-000000000001', 1, 'FCSp'),
    ('55555555-5555-5555-5555-000000000001', 2, '2Lo'),
    ('55555555-5555-5555-5555-000000000001', 3, 'StSq'),
    ('55555555-5555-5555-5555-000000000001', 4, 'CCoSp');

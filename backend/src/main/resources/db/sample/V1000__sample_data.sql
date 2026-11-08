-- Made-up sample data, loaded only with the "dev" profile.
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

-- Dated calendar entries, relative to the day the database is created so there's always
-- something upcoming. Emma: twice a week. Lily: weekly. Jonah: every other week.
-- Sofia: one lesson in three weeks. Noah: only a past lesson. Amelia: none.
INSERT INTO lessons (id, student_id, lesson_date, start_time, duration_minutes, lesson_type, color, created_at, updated_at) VALUES
    ('22222222-2222-2222-2222-000000000001', '11111111-1111-1111-1111-000000000001', CURRENT_DATE - 2,  '15:00', 30, 'Off-ice',   'PURPLE', now(), now()),
    ('22222222-2222-2222-2222-000000000002', '11111111-1111-1111-1111-000000000001', CURRENT_DATE + 1,  '07:00', 60, 'Freestyle', 'TEAL',   now(), now()),
    ('22222222-2222-2222-2222-000000000003', '11111111-1111-1111-1111-000000000001', CURRENT_DATE + 3,  '09:00', 60, 'Public',    'SAND',   now(), now()),
    ('22222222-2222-2222-2222-000000000004', '11111111-1111-1111-1111-000000000001', CURRENT_DATE + 8,  '07:00', 60, 'Freestyle', 'TEAL',   now(), now()),
    ('22222222-2222-2222-2222-000000000005', '11111111-1111-1111-1111-000000000002', CURRENT_DATE + 2,  '09:00', 60, 'Freestyle', 'TEAL',   now(), now()),
    ('22222222-2222-2222-2222-000000000006', '11111111-1111-1111-1111-000000000002', CURRENT_DATE + 9,  '09:00', 60, 'Freestyle', 'TEAL',   now(), now()),
    ('22222222-2222-2222-2222-000000000007', '11111111-1111-1111-1111-000000000003', CURRENT_DATE + 4,  '11:00', 45, 'Off-ice',   'PURPLE', now(), now()),
    ('22222222-2222-2222-2222-000000000008', '11111111-1111-1111-1111-000000000003', CURRENT_DATE + 18, '11:00', 45, 'Public',    'SAND',   now(), now()),
    ('22222222-2222-2222-2222-000000000009', '11111111-1111-1111-1111-000000000004', CURRENT_DATE + 21, '13:00', 45, 'Freestyle', 'TEAL',   now(), now()),
    ('22222222-2222-2222-2222-000000000010', '11111111-1111-1111-1111-000000000005', CURRENT_DATE - 5,  '07:00', 45, 'Freestyle', 'TEAL',   now(), now());

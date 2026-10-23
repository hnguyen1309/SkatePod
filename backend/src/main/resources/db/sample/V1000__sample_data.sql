-- Made-up sample data, loaded only with the "dev" profile.
INSERT INTO students (id, name, level, discipline, focus, progress, created_at, updated_at) VALUES
    ('11111111-1111-1111-1111-000000000001', 'Emma Miller',  'Pre-Gold',     'Freestyle', 'Double loop',      74, now(), now()),
    ('11111111-1111-1111-1111-000000000002', 'Lily Kim',     'Juvenile',     'Freestyle', 'Flying camel',     61, now(), now()),
    ('11111111-1111-1111-1111-000000000003', 'Jonah Reed',   'Preliminary',  'Moves',     'Power pulls',      82, now(), now()),
    ('11111111-1111-1111-1111-000000000004', 'Sofia Chen',   'Intermediate', 'Freestyle', 'Double axel',      57, now(), now()),
    ('11111111-1111-1111-1111-000000000005', 'Noah Bennett', 'Adult Gold',   'Freestyle', 'Combination spin', 69, now(), now()),
    ('11111111-1111-1111-1111-000000000006', 'Amelia Park',  'Preliminary',  'Freestyle', 'Axel',             46, now(), now());

-- Dated calendar entries, relative to the day the database is created so there's always
-- something upcoming. Emma: twice a week. Lily: weekly. Jonah: every other week.
-- Sofia: one lesson in three weeks. Noah: only a past lesson. Amelia: none.
INSERT INTO lessons (id, student_id, lesson_date, start_time, duration_minutes, lesson_type, color, created_at, updated_at) VALUES
    ('22222222-2222-2222-2222-000000000001', '11111111-1111-1111-1111-000000000001', CURRENT_DATE - 2,  '15:00', 30, 'Off-ice',   'PURPLE', now(), now()),
    ('22222222-2222-2222-2222-000000000002', '11111111-1111-1111-1111-000000000001', CURRENT_DATE + 1,  '07:00', 60, 'Freestyle', 'TEAL',   now(), now()),
    ('22222222-2222-2222-2222-000000000003', '11111111-1111-1111-1111-000000000001', CURRENT_DATE + 3,  '09:00', 60, 'Program',   'TEAL',   now(), now()),
    ('22222222-2222-2222-2222-000000000004', '11111111-1111-1111-1111-000000000001', CURRENT_DATE + 8,  '07:00', 60, 'Freestyle', 'TEAL',   now(), now()),
    ('22222222-2222-2222-2222-000000000005', '11111111-1111-1111-1111-000000000002', CURRENT_DATE + 2,  '09:00', 60, 'Freestyle', 'SAND',   now(), now()),
    ('22222222-2222-2222-2222-000000000006', '11111111-1111-1111-1111-000000000002', CURRENT_DATE + 9,  '09:00', 60, 'Freestyle', 'SAND',   now(), now()),
    ('22222222-2222-2222-2222-000000000007', '11111111-1111-1111-1111-000000000003', CURRENT_DATE + 4,  '11:00', 45, 'Moves',     'PURPLE', now(), now()),
    ('22222222-2222-2222-2222-000000000008', '11111111-1111-1111-1111-000000000003', CURRENT_DATE + 18, '11:00', 45, 'Moves',     'PURPLE', now(), now()),
    ('22222222-2222-2222-2222-000000000009', '11111111-1111-1111-1111-000000000004', CURRENT_DATE + 21, '13:00', 45, 'Spins',     'SAND',   now(), now()),
    ('22222222-2222-2222-2222-000000000010', '11111111-1111-1111-1111-000000000005', CURRENT_DATE - 5,  '07:00', 45, 'Freestyle', 'TEAL',   now(), now());

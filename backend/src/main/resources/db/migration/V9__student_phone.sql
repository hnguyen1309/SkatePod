-- An optional phone number per student (Nov 2026), so the coach can call or text the skater or their family.
-- Kept as typed ("+1 (555) 010-2030"); the app and StudentService check it has 7 to 15 digits.
ALTER TABLE students ADD COLUMN phone VARCHAR(30);

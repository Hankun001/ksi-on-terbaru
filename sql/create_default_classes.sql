-- Script untuk membuat kelas default PKBM
-- Jalankan ini di Supabase SQL Editor

-- Pastikan tabel classes ada (dari complete_schema.sql atau pkbm_administration.sql)

-- Insert kelas default untuk SD
INSERT INTO classes (name, education_level, grade_level, schedule, room_number, academic_year, is_active)
VALUES
  ('Kelas 1 A SD', 'sd', 1, 'Senin-Rabu 08:00-10:00', 'R101', '2024/2025', true),
  ('Kelas 2 A SD', 'sd', 2, 'Senin-Rabu 10:00-12:00', 'R102', '2024/2025', true),
  ('Kelas 3 A SD', 'sd', 3, 'Selasa-Kamis 08:00-10:00', 'R103', '2024/2025', true),
  ('Kelas 4 A SD', 'sd', 4, 'Selasa-Kamis 10:00-12:00', 'R104', '2024/2025', true),
  ('Kelas 5 A SD', 'sd', 5, 'Rabu-Jumat 08:00-10:00', 'R105', '2024/2025', true),
  ('Kelas 6 A SD', 'sd', 6, 'Rabu-Jumat 10:00-12:00', 'R106', '2024/2025', true)
ON CONFLICT DO NOTHING;

-- Insert kelas default untuk SMP
INSERT INTO classes (name, education_level, grade_level, schedule, room_number, academic_year, is_active)
VALUES
  ('Kelas 7 A SMP', 'smp', 1, 'Senin-Rabu 13:00-15:00', 'R201', '2024/2025', true),
  ('Kelas 8 A SMP', 'smp', 2, 'Senin-Rabu 15:00-17:00', 'R202', '2024/2025', true),
  ('Kelas 9 A SMP', 'smp', 3, 'Selasa-Kamis 13:00-15:00', 'R203', '2024/2025', true)
ON CONFLICT DO NOTHING;

-- Insert kelas default untuk SMA
INSERT INTO classes (name, education_level, grade_level, schedule, room_number, academic_year, is_active)
VALUES
  ('Kelas 10 A SMA', 'sma', 1, 'Senin-Rabu 07:00-09:00', 'R301', '2024/2025', true),
  ('Kelas 11 A SMA', 'sma', 2, 'Senin-Rabu 09:00-11:00', 'R302', '2024/2025', true),
  ('Kelas 12 A SMA', 'sma', 3, 'Selasa-Kamis 07:00-09:00', 'R303', '2024/2025', true)
ON CONFLICT DO NOTHING;

-- Tampilkan pesan berhasil
SELECT '✅ Kelas default PKBM berhasil dibuat!' as status;
SELECT COUNT(*) as total_classes_created FROM classes;
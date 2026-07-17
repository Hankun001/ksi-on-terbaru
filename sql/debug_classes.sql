-- DEBUG: Test query untuk memastikan data kelas bisa diakses
-- Jalankan di Supabase SQL Editor

-- 1. Cek tabel classes ada dan memiliki data
SELECT COUNT(*) as total_classes FROM classes;

-- 2. Lihat semua data kelas
SELECT id, name, education_level, grade_level, teacher_id, is_active, created_at
FROM classes
ORDER BY created_at DESC;

-- 3. Cek apakah user admin ada
SELECT id, email, role, full_name
FROM profiles
WHERE role = 'admin';

-- 4. Test query yang sama seperti di aplikasi
SELECT *
FROM classes
ORDER BY created_at DESC;

-- 5. Cek RLS policies aktif
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'classes' AND schemaname = 'public';

-- 6. Cek policies yang aktif untuk classes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'classes';
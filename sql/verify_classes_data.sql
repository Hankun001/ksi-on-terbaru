-- VERIFIKASI DATA KELAS
-- Jalankan script ini di Supabase SQL Editor untuk memastikan data kelas tersimpan dengan benar

-- 1. CEK TOTAL KELAS
SELECT COUNT(*) as total_classes FROM classes;

-- 2. LIHAT SEMUA KELAS (terbaru dulu)
SELECT
    id,
    name,
    education_level,
    grade_level,
    teacher_id,
    schedule,
    room_number,
    academic_year,
    is_active,
    created_at,
    updated_at
FROM classes
ORDER BY created_at DESC;

-- 3. CEK KELAS YANG BARU DIBUAT (dalam 1 jam terakhir)
SELECT
    id,
    name,
    education_level,
    grade_level,
    created_at
FROM classes
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 4. CEK APAKAH ADA KELAS DENGAN NAMA TERTENTU
-- Ganti 'Nama Kelas Anda' dengan nama kelas yang baru dibuat
-- SELECT * FROM classes WHERE name ILIKE '%Nama Kelas Anda%';

-- 5. TEST QUERY YANG SAMA DENGAN APLIKASI
SELECT * FROM classes ORDER BY created_at DESC;

-- 6. CEK RLS POLICIES
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'classes';

-- 7. CEK USER ADMIN
SELECT id, email, role FROM profiles WHERE role = 'admin';

-- 8. CEK AUTH UID (untuk debugging RLS)
-- SELECT auth.uid() as current_user_id;
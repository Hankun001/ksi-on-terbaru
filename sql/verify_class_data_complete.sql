-- VERIFIKASI DATA KELAS LENGKAP
-- Jalankan di Supabase SQL Editor untuk memeriksa apakah data tersimpan dengan benar

-- 1. CEK SEMUA DATA KELAS
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

-- 2. CEK KELAS DENGAN DATA LENGKAP
SELECT
    c.id,
    c.name,
    c.education_level,
    c.grade_level,
    c.schedule,
    c.room_number,
    c.academic_year,
    p.full_name as teacher_name,
    p.email as teacher_email
FROM classes c
LEFT JOIN profiles p ON c.teacher_id = p.id
WHERE c.schedule IS NOT NULL
   OR c.room_number IS NOT NULL
   OR c.academic_year IS NOT NULL
ORDER BY c.created_at DESC;

-- 3. CEK KELAS YANG BELUM LENGKAP DATANYA
SELECT
    c.id,
    c.name,
    c.education_level,
    c.grade_level,
    CASE WHEN c.schedule IS NULL OR c.schedule = '' THEN 'Belum diisi' ELSE c.schedule END as schedule_status,
    CASE WHEN c.room_number IS NULL OR c.room_number = '' THEN 'Belum diisi' ELSE c.room_number END as room_status,
    CASE WHEN c.academic_year IS NULL OR c.academic_year = '' THEN 'Belum diisi' ELSE c.academic_year END as academic_year_status,
    CASE WHEN c.teacher_id IS NULL THEN 'Belum ada wali kelas' ELSE 'Ada wali kelas' END as teacher_status
FROM classes c
ORDER BY c.created_at DESC;

-- 4. UPDATE DATA KELAS CONTOH (ganti dengan ID kelas yang sebenarnya)
-- UPDATE classes
-- SET schedule = 'Senin-Rabu 08:00-10:00',
--     room_number = 'R101',
--     academic_year = '2024/2025'
-- WHERE id = 'your-class-id-here';

-- 5. CEK DEFAULT CLASSES
SELECT COUNT(*) as total_classes FROM classes;

-- 6. CEK RLS POLICIES
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'classes';
-- UPDATE DATA KELAS DENGAN INFORMASI LENGKAP
-- Jalankan di Supabase SQL Editor untuk menambahkan data yang hilang

-- 1. UPDATE KELAS SD DENGAN DATA LENGKAP
UPDATE classes
SET
    schedule = CASE
        WHEN name LIKE '%1%' THEN 'Senin-Rabu 08:00-10:00'
        WHEN name LIKE '%2%' THEN 'Senin-Rabu 10:00-12:00'
        WHEN name LIKE '%3%' THEN 'Selasa-Kamis 08:00-10:00'
        WHEN name LIKE '%4%' THEN 'Selasa-Kamis 10:00-12:00'
        WHEN name LIKE '%5%' THEN 'Rabu-Jumat 08:00-10:00'
        WHEN name LIKE '%6%' THEN 'Rabu-Jumat 10:00-12:00'
        ELSE 'Senin-Rabu 08:00-10:00'
    END,
    room_number = CASE
        WHEN name LIKE '%1%' THEN 'R101'
        WHEN name LIKE '%2%' THEN 'R102'
        WHEN name LIKE '%3%' THEN 'R103'
        WHEN name LIKE '%4%' THEN 'R104'
        WHEN name LIKE '%5%' THEN 'R105'
        WHEN name LIKE '%6%' THEN 'R106'
        ELSE 'R101'
    END,
    academic_year = '2024/2025'
WHERE education_level = 'sd' AND (schedule IS NULL OR room_number IS NULL OR academic_year IS NULL);

-- 2. UPDATE KELAS SMP DENGAN DATA LENGKAP
UPDATE classes
SET
    schedule = CASE
        WHEN name LIKE '%7%' THEN 'Senin-Rabu 13:00-15:00'
        WHEN name LIKE '%8%' THEN 'Senin-Rabu 15:00-17:00'
        WHEN name LIKE '%9%' THEN 'Selasa-Kamis 13:00-15:00'
        ELSE 'Senin-Rabu 13:00-15:00'
    END,
    room_number = CASE
        WHEN name LIKE '%7%' THEN 'R201'
        WHEN name LIKE '%8%' THEN 'R202'
        WHEN name LIKE '%9%' THEN 'R203'
        ELSE 'R201'
    END,
    academic_year = '2024/2025'
WHERE education_level = 'smp' AND (schedule IS NULL OR room_number IS NULL OR academic_year IS NULL);

-- 3. UPDATE KELAS SMA DENGAN DATA LENGKAP
UPDATE classes
SET
    schedule = CASE
        WHEN name LIKE '%10%' THEN 'Senin-Rabu 07:00-09:00'
        WHEN name LIKE '%11%' THEN 'Senin-Rabu 09:00-11:00'
        WHEN name LIKE '%12%' THEN 'Selasa-Kamis 07:00-09:00'
        ELSE 'Senin-Rabu 07:00-09:00'
    END,
    room_number = CASE
        WHEN name LIKE '%10%' THEN 'R301'
        WHEN name LIKE '%11%' THEN 'R302'
        WHEN name LIKE '%12%' THEN 'R303'
        ELSE 'R301'
    END,
    academic_year = '2024/2025'
WHERE education_level = 'sma' AND (schedule IS NULL OR room_number IS NULL OR academic_year IS NULL);

-- 4. VERIFIKASI UPDATE
SELECT
    name,
    education_level,
    schedule,
    room_number,
    academic_year
FROM classes
ORDER BY education_level, grade_level;

-- 5. CEK JUMLAH KELAS YANG SUDAH LENGKAP
SELECT
    COUNT(*) as total_classes,
    COUNT(CASE WHEN schedule IS NOT NULL AND schedule != '' THEN 1 END) as classes_with_schedule,
    COUNT(CASE WHEN room_number IS NOT NULL AND room_number != '' THEN 1 END) as classes_with_room,
    COUNT(CASE WHEN academic_year IS NOT NULL AND academic_year != '' THEN 1 END) as classes_with_academic_year,
    COUNT(CASE WHEN teacher_id IS NOT NULL THEN 1 END) as classes_with_teacher
FROM classes;
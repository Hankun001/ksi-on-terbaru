-- MENAMBAHKAN KOLOM YANG HILANG KE TABEL CLASSES
-- Jalankan di Supabase SQL Editor jika kolom tertentu belum ada

-- 1. CEK KOLOM YANG SUDAH ADA
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'classes'
ORDER BY column_name;

-- 2. TAMBAHKAN KOLOM TEACHER_ID JIKA BELUM ADA
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'classes'
                   AND column_name = 'teacher_id') THEN

        ALTER TABLE classes ADD COLUMN teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
        RAISE NOTICE 'Kolom teacher_id berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom teacher_id sudah ada';
    END IF;
END $$;

-- 3. TAMBAHKAN KOLOM SCHEDULE JIKA BELUM ADA
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'classes'
                   AND column_name = 'schedule') THEN

        ALTER TABLE classes ADD COLUMN schedule TEXT;
        RAISE NOTICE 'Kolom schedule berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom schedule sudah ada';
    END IF;
END $$;

-- 4. TAMBAHKAN KOLOM ROOM_NUMBER JIKA BELUM ADA
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'classes'
                   AND column_name = 'room_number') THEN

        ALTER TABLE classes ADD COLUMN room_number TEXT;
        RAISE NOTICE 'Kolom room_number berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom room_number sudah ada';
    END IF;
END $$;

-- 5. TAMBAHKAN KOLOM ACADEMIC_YEAR JIKA BELUM ADA
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'classes'
                   AND column_name = 'academic_year') THEN

        ALTER TABLE classes ADD COLUMN academic_year TEXT;
        RAISE NOTICE 'Kolom academic_year berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom academic_year sudah ada';
    END IF;
END $$;

-- 6. TAMBAHKAN KOLOM IS_ACTIVE JIKA BELUM ADA
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'classes'
                   AND column_name = 'is_active') THEN

        ALTER TABLE classes ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Kolom is_active berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom is_active sudah ada';
    END IF;
END $$;

-- 7. TAMBAHKAN UPDATED_AT JIKA BELUM ADA
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'classes'
                   AND column_name = 'updated_at') THEN

        ALTER TABLE classes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Kolom updated_at berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom updated_at sudah ada';
    END IF;
END $$;

-- 8. VERIFIKASI AKHIR
SELECT
    'Total kolom di tabel classes: ' || COUNT(*) as info
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'classes';

SELECT
    column_name,
    data_type,
    is_nullable,
    CASE WHEN column_default IS NOT NULL THEN 'YES' ELSE 'NO' END as has_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'classes'
ORDER BY ordinal_position;
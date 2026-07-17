-- VERIFIKASI STRUKTUR TABEL CLASSES
-- Jalankan di Supabase SQL Editor untuk memeriksa apakah tabel classes sudah benar

-- 1. CEK APAKAH TABEL CLASSES ADA
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'classes'
);

-- 2. CEK STRUKTUR TABEL CLASSES (semua kolom)
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'classes'
ORDER BY ordinal_position;

-- 3. CEK CONSTRAINTS DAN FOREIGN KEYS
SELECT
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'classes';

-- 4. CEK INDEXES
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'classes';

-- 5. CEK RLS POLICIES
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
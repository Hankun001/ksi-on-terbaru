-- SCRIPT LENGKAP PEMBUATAN TABEL CLASSES DENGAN SEMUA KOLOM
-- Jalankan di Supabase SQL Editor untuk membuat tabel classes yang lengkap

-- 1. HAPUS TABEL LAMA JIKA ADA (HATI-HATI!)
-- DROP TABLE IF EXISTS classes CASCADE;

-- 2. BUAT TABEL CLASSES YANG LENGKAP
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    education_level TEXT,
    grade_level INTEGER,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    schedule TEXT,
    room_number TEXT,
    academic_year TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT classes_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 3. BUAT INDEXES UNTUK PERFORMA
CREATE INDEX IF NOT EXISTS idx_classes_active ON public.classes USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes USING btree (teacher_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_classes_education_level ON public.classes USING btree (education_level) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_classes_grade_level ON public.classes USING btree (grade_level) TABLESPACE pg_default;

-- 4. BUAT TRIGGER UNTUK UPDATED_AT
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- 6. BUAT RLS POLICIES
-- Hapus policies lama jika ada
DROP POLICY IF EXISTS "admin_all_classes" ON classes;
DROP POLICY IF EXISTS "teacher_view_own_classes" ON classes;
DROP POLICY IF EXISTS "student_view_enrolled_classes" ON classes;

-- Policy untuk admin: bisa melakukan semua operasi
CREATE POLICY "admin_all_classes" ON classes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Policy untuk guru: bisa melihat kelas yang mereka ajar
CREATE POLICY "teacher_view_own_classes" ON classes
    FOR SELECT USING (
        teacher_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru')
    );

-- Policy untuk siswa: bisa melihat kelas yang mereka ikuti
CREATE POLICY "student_view_enrolled_classes" ON classes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM class_students cs
            WHERE cs.class_id = classes.id AND cs.student_id = auth.uid()
        )
    );

-- 7. VERIFIKASI PEMBUATAN TABEL
SELECT 'Tabel classes berhasil dibuat dengan ' || COUNT(*) || ' kolom' as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'classes';

-- 8. TAMPILKAN STRUKTUR TABEL
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'classes'
ORDER BY ordinal_position;
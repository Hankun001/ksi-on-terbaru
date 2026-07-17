-- =============================================
-- KSI-ON LMS - CLASSES MANAGEMENT SYSTEM
-- File SQL Lengkap untuk Sistem Manajemen Kelas
-- =============================================
-- File ini berisi semua script yang diperlukan untuk:
-- - Membuat tabel classes lengkap
-- - Migrasi tabel existing
-- - Menambahkan data default
-- - Verifikasi dan troubleshooting
-- =============================================

-- =============================================
-- SECTION 1: VERIFIKASI STATUS DATABASE
-- =============================================

-- 1.1 Cek apakah tabel classes sudah ada
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'classes'
) as classes_table_exists;

-- 1.2 Cek struktur tabel classes saat ini
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'classes'
ORDER BY ordinal_position;

-- 1.3 Cek constraints dan foreign keys
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'classes';

-- =============================================
-- SECTION 2: BUAT TABEL CLASSES LENGKAP
-- =============================================

-- 2.1 Buat tabel classes dengan semua kolom yang diperlukan
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'public' AND table_name = 'classes') THEN
        CREATE TABLE public.classes (
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
    END IF;
END $$;

-- 2.2 Buat indexes untuk performa
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_classes_active') THEN
        CREATE INDEX idx_classes_active ON public.classes USING btree (is_active);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_classes_teacher') THEN
        CREATE INDEX idx_classes_teacher ON public.classes USING btree (teacher_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_classes_education_level') THEN
        CREATE INDEX idx_classes_education_level ON public.classes USING btree (education_level);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_classes_grade_level') THEN
        CREATE INDEX idx_classes_grade_level ON public.classes USING btree (grade_level);
    END IF;
END $$;

-- 2.3 Buat trigger untuk updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger conditionally (PostgreSQL compatible)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_classes_updated_at') THEN
        CREATE TRIGGER trg_classes_updated_at
            BEFORE UPDATE ON classes
            FOR EACH ROW
            EXECUTE FUNCTION handle_updated_at();
    END IF;
END $$;

-- =============================================
-- SECTION 3: TAMBAHKAN KOLOM YANG HILANG (JIKA PERLU)
-- =============================================

-- 3.1 Tambahkan kolom teacher_id jika belum ada
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

-- 3.2 Tambahkan kolom schedule jika belum ada
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

-- 3.3 Tambahkan kolom room_number jika belum ada
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

-- 3.4 Tambahkan kolom academic_year jika belum ada
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

-- 3.5 Tambahkan kolom is_active jika belum ada
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

-- =============================================
-- SECTION 4: SETUP ROW LEVEL SECURITY (RLS)
-- =============================================

-- 4.1 Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- 4.2 Hapus policies lama jika ada
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage all classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view classes they teach via enrollment" ON classes;
DROP POLICY IF EXISTS "Students can view enrolled classes" ON classes;
DROP POLICY IF EXISTS "Teachers can manage their classes" ON classes;
DROP POLICY IF EXISTS "admin_all_classes" ON classes;
DROP POLICY IF EXISTS "teacher_view_own_classes" ON classes;

-- 4.3 Buat policies baru yang aman
CREATE POLICY "admin_all_classes" ON classes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "teacher_view_own_classes" ON classes
    FOR SELECT USING (
        teacher_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru')
    );

CREATE POLICY "student_view_enrolled_classes" ON classes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM class_students cs
            WHERE cs.class_id = classes.id AND cs.student_id = auth.uid()
        )
    );

-- =============================================
-- SECTION 5: ISI DATA KELAS DEFAULT
-- =============================================

-- 5.1 Kelas SD (1-6)
INSERT INTO classes (name, education_level, grade_level, schedule, room_number, academic_year, is_active)
VALUES
  ('Kelas 1 A SD', 'sd', 1, 'Senin-Rabu 08:00-10:00', 'R101', '2024/2025', true),
  ('Kelas 2 A SD', 'sd', 2, 'Senin-Rabu 10:00-12:00', 'R102', '2024/2025', true),
  ('Kelas 3 A SD', 'sd', 3, 'Selasa-Kamis 08:00-10:00', 'R103', '2024/2025', true),
  ('Kelas 4 A SD', 'sd', 4, 'Selasa-Kamis 10:00-12:00', 'R104', '2024/2025', true),
  ('Kelas 5 A SD', 'sd', 5, 'Rabu-Jumat 08:00-10:00', 'R105', '2024/2025', true),
  ('Kelas 6 A SD', 'sd', 6, 'Rabu-Jumat 10:00-12:00', 'R106', '2024/2025', true)
ON CONFLICT DO NOTHING;

-- 5.2 Kelas SMP (7-9)
INSERT INTO classes (name, education_level, grade_level, schedule, room_number, academic_year, is_active)
VALUES
  ('Kelas 7 A SMP', 'smp', 1, 'Senin-Rabu 13:00-15:00', 'R201', '2024/2025', true),
  ('Kelas 8 A SMP', 'smp', 2, 'Senin-Rabu 15:00-17:00', 'R202', '2024/2025', true),
  ('Kelas 9 A SMP', 'smp', 3, 'Selasa-Kamis 13:00-15:00', 'R203', '2024/2025', true)
ON CONFLICT DO NOTHING;

-- 5.3 Kelas SMA (10-12)
INSERT INTO classes (name, education_level, grade_level, schedule, room_number, academic_year, is_active)
VALUES
  ('Kelas 10 A SMA', 'sma', 1, 'Senin-Rabu 07:00-09:00', 'R301', '2024/2025', true),
  ('Kelas 11 A SMA', 'sma', 2, 'Senin-Rabu 09:00-11:00', 'R302', '2024/2025', true),
  ('Kelas 12 A SMA', 'sma', 3, 'Selasa-Kamis 07:00-09:00', 'R303', '2024/2025', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- SECTION 6: VERIFIKASI SETUP
-- =============================================

-- 6.1 Cek jumlah kolom di tabel classes
SELECT
    'Tabel classes memiliki ' || COUNT(*) || ' kolom' as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'classes';

-- 6.2 Cek detail kolom
SELECT
    column_name,
    data_type,
    is_nullable,
    CASE WHEN column_default IS NOT NULL THEN 'YES' ELSE 'NO' END as has_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'classes'
ORDER BY ordinal_position;

-- 6.3 Cek jumlah data kelas
SELECT
    COUNT(*) as total_classes,
    COUNT(CASE WHEN education_level = 'sd' THEN 1 END) as sd_classes,
    COUNT(CASE WHEN education_level = 'smp' THEN 1 END) as smp_classes,
    COUNT(CASE WHEN education_level = 'sma' THEN 1 END) as sma_classes
FROM classes;

-- 6.4 Cek RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'classes'
ORDER BY policyname;

-- =============================================
-- SECTION 7: TROUBLESHOOTING & TESTING
-- =============================================

-- 7.1 Test query untuk memastikan data bisa diakses
SELECT
    c.id,
    c.name,
    c.education_level,
    c.grade_level,
    c.schedule,
    c.room_number,
    c.academic_year,
    p.full_name as teacher_name
FROM classes c
LEFT JOIN profiles p ON c.teacher_id = p.id
ORDER BY c.education_level, c.grade_level
LIMIT 5;

-- 7.2 Cek data yang belum lengkap
SELECT
    name,
    CASE WHEN teacher_id IS NULL THEN 'Belum ada wali kelas' ELSE 'Ada wali kelas' END as teacher_status,
    CASE WHEN schedule IS NULL OR schedule = '' THEN 'Belum ada jadwal' ELSE 'Ada jadwal' END as schedule_status,
    CASE WHEN room_number IS NULL OR room_number = '' THEN 'Belum ada ruangan' ELSE 'Ada ruangan' END as room_status,
    CASE WHEN academic_year IS NULL OR academic_year = '' THEN 'Belum ada tahun ajaran' ELSE 'Ada tahun ajaran' END as academic_year_status
FROM classes
ORDER BY created_at DESC;

-- =============================================
-- SETUP SELESAI - STATUS REPORT
-- =============================================

SELECT
    '✅ Setup tabel classes selesai!' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'classes') as total_columns,
    (SELECT COUNT(*) FROM classes) as total_classes,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'classes') as total_policies;
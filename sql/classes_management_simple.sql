-- =============================================
-- KSI-ON LMS - CLASSES MANAGEMENT SYSTEM (SIMPLE VERSION)
-- File SQL Lengkap untuk Sistem Manajemen Kelas
-- =============================================
-- VERSI SEDERHANA: Bisa dijalankan berulang tanpa error
-- =============================================

-- =============================================
-- SETUP TABEL CLASSES
-- =============================================

-- Buat tabel classes (akan dilewati jika sudah ada)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    education_level TEXT,
    grade_level INTEGER,
    teacher_id UUID,
    schedule TEXT,
    room_number TEXT,
    academic_year TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT classes_pkey PRIMARY KEY (id)
);

-- Tambahkan foreign key jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'classes_teacher_id_fkey') THEN
        ALTER TABLE public.classes
        ADD CONSTRAINT classes_teacher_id_fkey
        FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =============================================
-- TAMBAHKAN KOLOM YANG HILANG (AMAN UNTUK DIJALANKAN BERULANG)
-- =============================================

-- Tambahkan kolom schedule jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'classes'
                   AND column_name = 'schedule') THEN
        ALTER TABLE classes ADD COLUMN schedule TEXT;
        RAISE NOTICE 'Kolom schedule berhasil ditambahkan';
    END IF;
END $$;

-- Tambahkan kolom room_number jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'classes'
                   AND column_name = 'room_number') THEN
        ALTER TABLE classes ADD COLUMN room_number TEXT;
        RAISE NOTICE 'Kolom room_number berhasil ditambahkan';
    END IF;
END $$;

-- Tambahkan kolom academic_year jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'classes'
                   AND column_name = 'academic_year') THEN
        ALTER TABLE classes ADD COLUMN academic_year TEXT;
        RAISE NOTICE 'Kolom academic_year berhasil ditambahkan';
    END IF;
END $$;

-- Tambahkan kolom is_active jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'classes'
                   AND column_name = 'is_active') THEN
        ALTER TABLE classes ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Kolom is_active berhasil ditambahkan';
    END IF;
END $$;

-- Tambahkan kolom updated_at jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'classes'
                   AND column_name = 'updated_at') THEN
        ALTER TABLE classes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Kolom updated_at berhasil ditambahkan';
    END IF;
END $$;

-- =============================================
-- SETUP FUNCTION & TRIGGER
-- =============================================

-- Buat function untuk handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Buat trigger (akan dilewati jika sudah ada)
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
-- SETUP RLS (ROW LEVEL SECURITY)
-- =============================================

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Hapus policies lama jika ada (safe to run)
DROP POLICY IF EXISTS "admin_all_classes" ON classes;
DROP POLICY IF EXISTS "teacher_view_own_classes" ON classes;
DROP POLICY IF EXISTS "student_view_enrolled_classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage all classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view classes they teach via enrollment" ON classes;

-- Buat policies baru
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
-- ISI DATA KELAS DEFAULT
-- =============================================

-- Kelas SD (akan dilewati jika sudah ada)
INSERT INTO classes (name, education_level, grade_level, schedule, room_number, academic_year, is_active)
VALUES
  ('Kelas 1 A SD', 'sd', 1, 'Senin-Rabu 08:00-10:00', 'R101', '2024/2025', true),
  ('Kelas 2 A SD', 'sd', 2, 'Senin-Rabu 10:00-12:00', 'R102', '2024/2025', true),
  ('Kelas 3 A SD', 'sd', 3, 'Selasa-Kamis 08:00-10:00', 'R103', '2024/2025', true),
  ('Kelas 4 A SD', 'sd', 4, 'Selasa-Kamis 10:00-12:00', 'R104', '2024/2025', true),
  ('Kelas 5 A SD', 'sd', 5, 'Rabu-Jumat 08:00-10:00', 'R105', '2024/2025', true),
  ('Kelas 6 A SD', 'sd', 6, 'Rabu-Jumat 10:00-12:00', 'R106', '2024/2025', true)
ON CONFLICT DO NOTHING;

-- Kelas SMP (akan dilewati jika sudah ada)
INSERT INTO classes (name, education_level, grade_level, schedule, room_number, academic_year, is_active)
VALUES
  ('Kelas 7 A SMP', 'smp', 1, 'Senin-Rabu 13:00-15:00', 'R201', '2024/2025', true),
  ('Kelas 8 A SMP', 'smp', 2, 'Senin-Rabu 15:00-17:00', 'R202', '2024/2025', true),
  ('Kelas 9 A SMP', 'smp', 3, 'Selasa-Kamis 13:00-15:00', 'R203', '2024/2025', true)
ON CONFLICT DO NOTHING;

-- Kelas SMA (akan dilewati jika sudah ada)
INSERT INTO classes (name, education_level, grade_level, schedule, room_number, academic_year, is_active)
VALUES
  ('Kelas 10 A SMA', 'sma', 1, 'Senin-Rabu 07:00-09:00', 'R301', '2024/2025', true),
  ('Kelas 11 A SMA', 'sma', 2, 'Senin-Rabu 09:00-11:00', 'R302', '2024/2025', true),
  ('Kelas 12 A SMA', 'sma', 3, 'Selasa-Kamis 07:00-09:00', 'R303', '2024/2025', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- VERIFIKASI SETUP
-- =============================================

-- Cek struktur tabel
SELECT
    'Tabel classes memiliki ' || COUNT(*) || ' kolom' as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'classes';

-- Cek jumlah data
SELECT
    COUNT(*) as total_classes,
    COUNT(CASE WHEN education_level = 'sd' THEN 1 END) as sd_classes,
    COUNT(CASE WHEN education_level = 'smp' THEN 1 END) as smp_classes,
    COUNT(CASE WHEN education_level = 'sma' THEN 1 END) as sma_classes
FROM classes;

-- Cek RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'classes'
ORDER BY policyname;

-- =============================================
-- STATUS REPORT
-- =============================================

SELECT
    '✅ Setup tabel classes selesai!' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'classes') as total_columns,
    (SELECT COUNT(*) FROM classes) as total_classes,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'classes') as total_policies;
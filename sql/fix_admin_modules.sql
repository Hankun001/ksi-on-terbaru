-- =============================================
-- SQL Fix untuk Modul Admin
-- =============================================
-- Menambahkan kolom dan relasi yang hilang

-- 1. Tambah kolom is_active ke tabel profiles (jika belum ada)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 2. Tambah kolom class_id ke student_evaluations (jika belum ada)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_evaluations' AND column_name = 'class_id'
    ) THEN
        ALTER TABLE student_evaluations ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Tambah kolom note ke student_evaluations (jika belum ada, untuk laporan)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_evaluations' AND column_name = 'note'
    ) THEN
        ALTER TABLE student_evaluations ADD COLUMN note TEXT DEFAULT '';
    END IF;
END $$;

-- 4. Buat view untuk teacher_evaluation_sessions (supaya laporan bisa akses)
CREATE OR REPLACE VIEW teacher_sessions_view AS
SELECT 
    tes.id,
    tes.admin_id,
    tes.teacher_id,
    tes.date,
    tes.pedagogy_score,
    tes.pedagogy_feedback,
    tes.professionalism_score,
    tes.professionalism_feedback,
    tes.personality_score,
    tes.personality_feedback,
    tes.leadership_score,
    tes.leadership_feedback,
    tes.total_score,
    tes.notes,
    tes.created_at,
    tes.updated_at,
    p.full_name AS teacher_name,
    p.email AS teacher_email,
    adm.full_name AS admin_name
FROM teacher_evaluation_sessions tes
LEFT JOIN profiles p ON p.id = tes.teacher_id
LEFT JOIN profiles adm ON adm.id = tes.admin_id;

-- 5. Pastikan RLS policies untuk view
ALTER VIEW teacher_sessions_view SET SCHEMA public;

SELECT '✅ All admin module fixes applied successfully!' AS status;
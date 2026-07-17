-- QUICK FIX FOR CLASSES RLS RECURSION
-- Jalankan di Supabase SQL Editor

-- 1. DISABLE RLS UNTUK CLASSES (SEMENTARA)
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;

-- 2. DROP PROBLEMATIC POLICIES
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage all classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view classes they teach via enrollment" ON classes;
DROP POLICY IF EXISTS "Students can view enrolled classes" ON classes;
DROP POLICY IF EXISTS "Teachers can manage their classes" ON classes;

-- 3. ENABLE RLS KEMBALI
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- 4. CREATE SIMPLE, SAFE POLICIES

-- Admin dapat melakukan semua operasi
CREATE POLICY "admin_all_classes" ON classes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Guru dapat melihat kelas yang mereka ajar
CREATE POLICY "teacher_view_own_classes" ON classes
    FOR SELECT USING (
        teacher_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru')
    );

-- Siswa dapat melihat kelas yang mereka ikuti
CREATE POLICY "student_view_enrolled_classes" ON classes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM class_students cs
            WHERE cs.class_id = classes.id AND cs.student_id = auth.uid()
        )
    );

-- 5. TEST INSERT
-- INSERT INTO classes (name, education_level, grade_level, is_active)
-- VALUES ('Test Class Quick Fix', 'sd', 1, true);

-- 6. VERIFICATION
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'classes';
-- FIX INFINITE RECURSION IN CLASSES POLICIES
-- Jalankan di Supabase SQL Editor untuk memperbaiki RLS policies

-- 1. DROP EXISTING POLICIES THAT CAUSE RECURSION
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage all classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view classes they teach via enrollment" ON classes;

-- 2. CREATE SAFE POLICIES WITHOUT RECURSION

-- Policy untuk admin: bisa melakukan semua operasi
CREATE POLICY "Admins can manage all classes" ON classes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy untuk guru: bisa melihat dan mengelola kelas yang mereka ajar
CREATE POLICY "Teachers can manage their classes" ON classes
    FOR ALL USING (
        teacher_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'guru'
        )
    );

-- Policy untuk siswa: bisa melihat kelas yang mereka ikuti
-- (Ini menggunakan subquery yang aman tanpa recursion)
CREATE POLICY "Students can view enrolled classes" ON classes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM class_students cs
            WHERE cs.class_id = classes.id
            AND cs.student_id = auth.uid()
        ) AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'murid'
        )
    );

-- 3. VERIFICATION QUERIES
-- Cek policies yang aktif
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'classes'
ORDER BY policyname;

-- Test query sebagai admin
-- SELECT * FROM classes LIMIT 5;

-- 4. ALTERNATIVE: DISABLE RLS UNTUK DEBUGGING (TIDAK DIREKOMENDASIKAN UNTUK PRODUCTION)
-- ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
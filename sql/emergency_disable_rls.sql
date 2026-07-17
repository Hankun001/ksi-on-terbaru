-- EMERGENCY FIX: DISABLE RLS TEMPORARILY FOR CLASSES
-- Jalankan ini jika fix policies di atas tidak berhasil
-- HATI-HATI: Ini akan membuat tabel classes dapat diakses oleh semua orang!

-- 1. DISABLE RLS (UNTUK TESTING SAJA)
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;

-- 2. TEST INSERT MANUAL
-- INSERT INTO classes (name, education_level, grade_level, is_active)
-- VALUES ('Test Class', 'sd', 1, true);

-- 3. CEK DATA TERSEMPAN
-- SELECT * FROM classes WHERE name = 'Test Class';

-- 4. ENABLE RLS KEMBALI SETELAH TESTING
-- ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- 5. RE-CREATE SAFE POLICIES
-- Jalankan sql/fix_classes_policies.sql setelah enable RLS kembali

-- =================================================================
-- INSTRUKSI PENGGUNAAN:
-- 1. Jalankan ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
-- 2. Test buat kelas di aplikasi
-- 3. Jika berhasil, jalankan sql/fix_classes_policies.sql
-- 4. Enable RLS kembali: ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
-- =================================================================
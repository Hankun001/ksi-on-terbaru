-- =============================================
-- SETUP ADMIN USER - KSI-ON LMS
-- =============================================

-- Script untuk memeriksa dan mengatur role admin
-- Jalankan di Supabase SQL Editor

-- 1. CEK SEMUA USER DAN ROLE MEREKA
SELECT
    id,
    email,
    role,
    full_name,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- 2. CEK JUMLAH USER PER ROLE
SELECT
    role,
    COUNT(*) as jumlah_user
FROM profiles
GROUP BY role
ORDER BY jumlah_user DESC;

-- 3. PROMOTE USER MENJADI ADMIN
-- GANTI 'your-admin-email@example.com' dengan email user yang ingin dijadikan admin
-- UPDATE profiles
-- SET role = 'admin'
-- WHERE email = 'your-admin-email@example.com';

-- 4. VERIFIKASI ADMIN BERHASIL DIPROMOTE
-- SELECT id, email, role, full_name
-- FROM profiles
-- WHERE role = 'admin';

-- 5. ALTERNATIF: SET ADMIN BERDASARKAN ID USER
-- Jika tahu ID user, gunakan ini:
-- UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid-here';

-- =============================================
-- INSTRUKSI PENGGUNAAN:
-- 1. Uncomment (hapus --) pada query UPDATE yang diinginkan
-- 2. Ganti email/ID dengan yang benar
-- 3. Jalankan query
-- 4. Refresh browser dan login ulang
-- =============================================
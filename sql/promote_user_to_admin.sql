-- Script untuk mengubah role user menjadi admin
-- Ganti 'user@example.com' dengan email user yang ingin dijadikan admin

-- Cara penggunaan:
-- 1. Ganti 'user@example.com' dengan email user yang sebenarnya
-- 2. Jalankan script ini di Supabase SQL Editor

UPDATE profiles
SET role = 'admin'
WHERE email = 'user@example.com';

-- Verifikasi perubahan
SELECT id, email, role, full_name
FROM profiles
WHERE email = 'user@example.com';

-- Atau lihat semua user dengan role admin
SELECT id, email, role, full_name
FROM profiles
WHERE role = 'admin';
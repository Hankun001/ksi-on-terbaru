-- Script untuk mempromosikan user menjadi admin
-- Ganti 'user@example.com' dengan email user yang ingin dijadikan admin

-- UPDATE profiles
-- SET role = 'admin'
-- WHERE email = 'user@example.com';

-- Atau untuk membuat user tertentu sebagai admin (ganti dengan ID user yang sebenarnya):
-- UPDATE profiles
-- SET role = 'admin'
-- WHERE id = 'user-uuid-here';

-- Cek semua user dan role mereka
SELECT id, email, role, full_name, created_at
FROM profiles
ORDER BY created_at DESC;

-- Cek berapa banyak admin yang ada
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role;
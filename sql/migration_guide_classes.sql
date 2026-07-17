-- PANDUAN MIGRASI DATABASE CLASSES
-- Jalankan langkah demi langkah di Supabase SQL Editor

-- =================================================================
-- LANGKAH 1: CEK STATUS TABEL CLASSES SAAT INI
-- =================================================================

-- Cek apakah tabel classes ada
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'classes'
) as table_exists;

-- Jika table_exists = true, lanjut ke Langkah 2
-- Jika table_exists = false, langsung ke Langkah 3

-- =================================================================
-- LANGKAH 2: CEK STRUKTUR TABEL YANG SUDAH ADA
-- =================================================================

-- Lihat kolom yang sudah ada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'classes'
ORDER BY column_name;

-- Bandingkan dengan kolom yang diperlukan:
-- id (uuid, not null)
-- name (text, not null)
-- education_level (text, nullable)
-- grade_level (integer, nullable)
-- teacher_id (uuid, nullable) - FK ke profiles(id)
-- schedule (text, nullable)
-- room_number (text, nullable)
-- academic_year (text, nullable)
-- is_active (boolean, nullable, default true)
-- created_at (timestamp, nullable, default now)
-- updated_at (timestamp, nullable, default now)

-- Jika ada kolom yang hilang, jalankan sql/add_missing_columns.sql

-- =================================================================
-- LANGKAH 3: BUAT TABEL CLASSES DARI AWAL (JIKA BELUM ADA)
-- =================================================================

-- Jalankan sql/create_classes_table_complete.sql
-- Script ini akan membuat tabel lengkap dengan semua kolom dan konfigurasi

-- =================================================================
-- LANGKAH 4: VERIFIKASI STRUKTUR TABEL
-- =================================================================

-- Jalankan sql/verify_table_structure.sql
-- Pastikan semua kolom ada dan benar

-- =================================================================
-- LANGKAH 5: ISI DATA DEFAULT (OPSIONAL)
-- =================================================================

-- Jalankan sql/create_default_classes.sql
-- Untuk membuat kelas default SD, SMP, SMA

-- =================================================================
-- LANGKAH 6: TEST DI APLIKASI
-- =================================================================

-- 1. Login sebagai admin
-- 2. Buka menu "Data Kelas"
-- 3. Buat kelas baru dengan semua field terisi
-- 4. Pastikan data tersimpan dan tampil lengkap

-- =================================================================
-- TROUBLESHOOTING
-- =================================================================

-- Jika masih ada error:
-- 1. Jalankan sql/quick_fix_classes_rls.sql (untuk RLS issues)
-- 2. Cek console browser untuk error details
-- 3. Jalankan sql/verify_class_data_complete.sql untuk cek data

SELECT 'Panduan migrasi database classes selesai. Jalankan langkah-langkah di atas sesuai kondisi database Anda.' as status;
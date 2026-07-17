-- =============================================
-- Hapus resources terkait Monitoring Mengajar
-- =============================================
-- CATATAN: Tabel teaching_journals dan student_attendance TIDAK dihapus
-- karena masih digunakan oleh ReportsModule untuk laporan Absensi dan Aktivitas.
-- Hanya menu sidebar dan routing di frontend yang dihapus.

SELECT '✅ Monitoring Mengajar feature removed from frontend.' AS status;
SELECT 'ℹ️ Tables teaching_journals and student_attendance are preserved for ReportsModule.' AS info;
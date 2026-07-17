-- =============================================
-- Hapus tabel yang berhubungan dengan fitur Data Kelas
-- =============================================
-- Dijalankan jika fitur Data Kelas tidak digunakan lagi

-- Hapus data dan tabel class_students terlebih dahulu (karena bergantung pada classes)
DROP TABLE IF EXISTS class_students CASCADE;

-- Hapus foreign key di teaching_journals yang merujuk ke classes
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'teaching_journals_class_id_fkey'
    ) THEN
        ALTER TABLE teaching_journals DROP CONSTRAINT teaching_journals_class_id_fkey;
    END IF;
END $$;

-- Hapus foreign key di student_evaluations yang merujuk ke classes
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'student_evaluations_class_id_fkey'
    ) THEN
        ALTER TABLE student_evaluations DROP CONSTRAINT student_evaluations_class_id_fkey;
    END IF;
END $$;

-- Hapus file yang tidak dipakai
SELECT '✅ Database class tables dropped successfully!' AS status;
SELECT '📝 Note: teaching_journals and student_evaluations tables are preserved.' AS info;
SELECT '⚠️ classes table no longer exists in the schema.' AS warning;
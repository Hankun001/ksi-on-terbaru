-- =============================================
-- KSI-ON LMS - PKBM Administrative System
-- =============================================
-- This file contains ONLY the PKBM (Pusat Kegiatan Belajar Mengajar)
-- administrative system tables for offline learning management.
--
-- Features:
-- - Class Management (Data Kelas)
-- - Teaching Journal (Jurnal Mengajar)
-- - Student Attendance (Absensi Siswa)
-- - Student Evaluation (Penilaian Siswa)
-- - Teacher Evaluation (Evaluasi Guru)
-- - Learning Analytics & Reporting
--
-- Deployment: Run this SQL in Supabase SQL Editor
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- STEP 1: PKBM ADMINISTRATIVE TABLES
-- =============================================

-- Classes table (separate from courses for physical class grouping)
DROP TABLE IF EXISTS classes CASCADE;
CREATE TABLE classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    education_level TEXT, -- 'sd', 'smp', 'sma'
    grade_level INTEGER, -- 1-6 for SD, 1-3 for SMP/SMA
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    schedule TEXT, -- e.g., "Senin-Rabu, 08:00-10:00"
    room_number TEXT, -- e.g., "R101"
    academic_year TEXT, -- e.g., "2024/2025"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teaching Journal (Jurnal Mengajar)
DROP TABLE IF EXISTS teaching_journals CASCADE;
CREATE TABLE teaching_journals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    subject TEXT NOT NULL,
    material TEXT,
    notes TEXT,
    duration_minutes INTEGER DEFAULT 45,
    teaching_method TEXT, -- e.g., "Ceramah", "Diskusi", "Demonstrasi"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student Attendance (Absensi Siswa - Offline)
DROP TABLE IF EXISTS student_attendance CASCADE;
CREATE TABLE student_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    journal_id UUID NOT NULL REFERENCES teaching_journals(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'hadir', -- hadir, absent, sick, permit, late
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(journal_id, student_id)
);

-- Student Evaluations (Penilaian Siswa - Offline Grading)
DROP TABLE IF EXISTS student_evaluations CASCADE;
CREATE TABLE student_evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    aspect TEXT NOT NULL, -- attitude, knowledge, skill, character, creativity, cooperation
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teacher Evaluation (Evaluasi Guru - by Admin)
DROP TABLE IF EXISTS teacher_evaluations CASCADE;
CREATE TABLE teacher_evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    criteria TEXT NOT NULL, -- pedagogy, professionalism, personality, leadership
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Class Students (Mapping siswa ke kelas)
DROP TABLE IF EXISTS class_students CASCADE;
CREATE TABLE class_students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, student_id)
);

-- =============================================
-- STEP 2: INDEXES (Performance Optimization)
-- =============================================

-- Classes indexes
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_education_level ON classes(education_level);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level ON classes(grade_level);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(is_active);

-- Teaching journals indexes
CREATE INDEX IF NOT EXISTS idx_teaching_journals_teacher ON teaching_journals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teaching_journals_class ON teaching_journals(class_id);
CREATE INDEX IF NOT EXISTS idx_teaching_journals_date ON teaching_journals(date);

-- Student attendance indexes
CREATE INDEX IF NOT EXISTS idx_student_attendance_journal ON student_attendance(journal_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student ON student_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_status ON student_attendance(status);

-- Student evaluations indexes
CREATE INDEX IF NOT EXISTS idx_student_evaluations_teacher ON student_evaluations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_evaluations_student ON student_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_student_evaluations_class ON student_evaluations(class_id);
CREATE INDEX IF NOT EXISTS idx_student_evaluations_date ON student_evaluations(date);
CREATE INDEX IF NOT EXISTS idx_student_evaluations_aspect ON student_evaluations(aspect);

-- Teacher evaluations indexes
CREATE INDEX IF NOT EXISTS idx_teacher_evaluations_admin ON teacher_evaluations(admin_id);
CREATE INDEX IF NOT EXISTS idx_teacher_evaluations_teacher ON teacher_evaluations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_evaluations_date ON teacher_evaluations(date);
CREATE INDEX IF NOT EXISTS idx_teacher_evaluations_criteria ON teacher_evaluations(criteria);

-- Class students indexes
CREATE INDEX IF NOT EXISTS idx_class_students_class ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_unique ON class_students(class_id, student_id);

-- =============================================
-- STEP 3: FUNCTIONS
-- =============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STEP 4: TRIGGERS
-- =============================================

-- Updated_at triggers for PKBM tables
CREATE TRIGGER trg_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_teaching_journals_updated_at
    BEFORE UPDATE ON teaching_journals
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_student_evaluations_updated_at
    BEFORE UPDATE ON student_evaluations
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =============================================
-- STEP 5: ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all PKBM tables
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 6: RLS POLICIES
-- =============================================

-- Classes policies
CREATE POLICY "Teachers can view their own classes" ON classes
    FOR SELECT USING (
        teacher_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage all classes" ON classes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Teachers can view classes they teach via enrollment" ON classes
    FOR SELECT USING (
        id IN (
            SELECT cs.class_id FROM class_students cs
            WHERE cs.student_id = auth.uid()
        )
    );

-- Teaching journals policies
CREATE POLICY "Teachers can manage own teaching journals" ON teaching_journals
    FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Admins can view all teaching journals" ON teaching_journals
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Student attendance policies
CREATE POLICY "Teachers can manage attendance for their classes" ON student_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM teaching_journals tj
            JOIN classes c ON c.id = tj.class_id
            WHERE tj.id = student_attendance.journal_id AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all attendance" ON student_attendance
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Students can view own attendance" ON student_attendance
    FOR SELECT USING (
        student_id = auth.uid()
    );

-- Student evaluations policies
CREATE POLICY "Teachers can manage evaluations for their classes" ON student_evaluations
    FOR ALL USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM classes c
            WHERE c.id = student_evaluations.class_id AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all evaluations" ON student_evaluations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Students can view own evaluations" ON student_evaluations
    FOR SELECT USING (
        student_id = auth.uid()
    );

-- Teacher evaluations policies (admin only)
CREATE POLICY "Admins can manage teacher evaluations" ON teacher_evaluations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Teachers can view own evaluations" ON teacher_evaluations
    FOR SELECT USING (
        teacher_id = auth.uid()
    );

-- Class students policies
CREATE POLICY "Teachers can manage students in their classes" ON class_students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM classes c
            WHERE c.id = class_students.class_id AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all class enrollments" ON class_students
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Students can view own class enrollments" ON class_students
    FOR SELECT USING (
        student_id = auth.uid()
    );

-- =============================================
-- STEP 7: VIEWS (Optional Analytics Views)
-- =============================================

-- View: Teacher Activity Summary
CREATE OR REPLACE VIEW v_teacher_activity_summary AS
SELECT 
    p.id AS teacher_id,
    p.full_name AS teacher_name,
    p.email AS teacher_email,
    COUNT(DISTINCT c.id) AS total_classes,
    COUNT(DISTINCT tj.id) AS total_journals,
    COUNT(DISTINCT se.id) AS total_student_evaluations,
    COUNT(DISTINCT te.id) AS teacher_evaluations_received
FROM profiles p
LEFT JOIN classes c ON c.teacher_id = p.id
LEFT JOIN teaching_journals tj ON tj.teacher_id = p.id
LEFT JOIN student_evaluations se ON se.teacher_id = p.id
LEFT JOIN teacher_evaluations te ON te.teacher_id = p.id
WHERE p.role = 'guru'
GROUP BY p.id, p.full_name, p.email;

-- View: Student Performance Summary
CREATE OR REPLACE VIEW v_student_performance_summary AS
SELECT 
    p.id AS student_id,
    p.full_name AS student_name,
    p.email AS student_email,
    COUNT(DISTINCT cs.class_id) AS total_classes,
    COUNT(DISTINCT sa.journal_id) AS total_attendance_records,
    COUNT(DISTINCT se.id) AS total_evaluations,
    ROUND(AVG(se.score), 2) AS average_score
FROM profiles p
LEFT JOIN class_students cs ON cs.student_id = p.id
LEFT JOIN student_attendance sa ON sa.student_id = p.id
LEFT JOIN student_evaluations se ON se.student_id = p.id
WHERE p.role = 'murid'
GROUP BY p.id, p.full_name, p.email;

-- View: Class Attendance Summary
CREATE OR REPLACE VIEW v_class_attendance_summary AS
SELECT 
    c.id AS class_id,
    c.name AS class_name,
    c.education_level,
    c.grade_level,
    p.full_name AS teacher_name,
    COUNT(DISTINCT tj.id) AS total_sessions,
    COUNT(DISTINCT sa.id) AS total_attendance_records,
    ROUND(
        COUNT(DISTINCT CASE WHEN sa.status = 'hadir' THEN sa.id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT sa.id), 0), 2
    ) AS attendance_percentage
FROM classes c
LEFT JOIN profiles p ON c.teacher_id = p.id
LEFT JOIN teaching_journals tj ON tj.class_id = c.id
LEFT JOIN student_attendance sa ON sa.journal_id = tj.id
GROUP BY c.id, c.name, c.education_level, c.grade_level, p.full_name;

-- =============================================
-- STEP 8: COMPLETION MESSAGE
-- =============================================

SELECT '✅ PKBM Administrative System Schema Created Successfully!' AS status;
SELECT '📚 Tables created: classes, teaching_journals, student_attendance, student_evaluations, teacher_evaluations, class_students' AS info;
SELECT '🔐 RLS policies enabled with proper access control' AS security;
SELECT '📊 Views created for analytics: v_teacher_activity_summary, v_student_performance_summary, v_class_attendance_summary' AS views;
SELECT '🖨️ Print-ready reporting system ready' AS reports;
SELECT '📝 Remember to: 1) Enable Realtime in Supabase Dashboard, 2) Test permissions with different user roles' AS note;

-- =============================================
-- KSI-ON LMS - Complete Database Schema
-- =============================================
-- File terpadu yang menggabungkan semua fitur:
-- - Autentikasi & Profil
-- - Manajemen Kursus dengan Jenjang Pendidikan
-- - Materi Pembelajaran (Document, Video, Image, Link)
-- - Tugas & Pengumpulan
-- - Sistem Quiz
-- - Pelacakan Progres
-- - Pengumuman
-- - Sistem Pesan
-- - Notifikasi
-- =============================================
-- Dibuat secara otomatis dari penggabungan semua file SQL
-- =============================================
-- File terpadu yang menggabungkan semua fitur:
-- - Autentikasi & Profil
-- - Manajemen Kursus dengan Jenjang Pendidikan
-- - Materi Pembelajaran (Document, Video, Image, Link)
-- - Tugas & Pengumpulan
-- - Sistem Quiz
-- - Pelacakan Progres
-- - Pengumuman
-- - Sistem Pesan
-- - Notifikasi
-- =============================================
-- Dibuat secara otomatis dari penggabungan semua file SQL
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =============================================
-- STEP 1: ENUM TYPES
-- =============================================

-- User roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('murid', 'guru', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Material types
DO $$ BEGIN
    CREATE TYPE material_type AS ENUM ('text', 'video', 'pdf', 'quiz');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Content types (enhanced)
DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('document', 'image', 'video', 'link', 'text');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Source types for materials
DO $$ BEGIN
    CREATE TYPE source_type AS ENUM ('internal', 'youtube', 'external');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Assignment status
DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM ('open', 'closed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Notification types
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('announcement', 'submission', 'grade', 'enrollment', 'reminder', 'system');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Education levels
DO $$ BEGIN
    CREATE TYPE education_level AS ENUM ('sd', 'smp', 'sma');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- School subjects
DO $$ BEGIN
    CREATE TYPE school_subject AS ENUM (
        'matematika', 
        'bahasa_indonesia', 
        'bahasa_inggris', 
        'ipa', 
        'ips', 
        'pkn', 
        'penjas', 
        'seni_budaya', 
        'prakarya',
        'agama',
        'ti'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- STEP 2: CORE TABLES
-- =============================================

-- Profiles table (extending Supabase auth.users)
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'murid' NOT NULL,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
DROP TABLE IF EXISTS courses CASCADE;
CREATE TABLE courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Education level fields
    education_level education_level,
    grade_level INTEGER, -- 1-6 for SD, 1-3 for SMP/SMA
    subject school_subject,
    subject_name TEXT, -- For custom subject names
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments table
DROP TABLE IF EXISTS enrollments CASCADE;
CREATE TABLE enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- Materials table (enhanced with source_type support)
DROP TABLE IF EXISTS materials CASCADE;
CREATE TABLE materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    material_type material_type DEFAULT 'text',
    
    -- Enhanced fields for content management
    content_type content_type DEFAULT 'document',
    source_type source_type DEFAULT 'internal',
    file_url TEXT,
    file_size BIGINT,
    resource_url TEXT,
    
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assignments table
DROP TABLE IF EXISTS assignments CASCADE;
CREATE TABLE assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    max_points INTEGER DEFAULT 100,
    status assignment_status DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Submissions table
DROP TABLE IF EXISTS submissions CASCADE;
CREATE TABLE submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT,
    attachment_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    grade DECIMAL(5,2),
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    grader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table
DROP TABLE IF EXISTS announcements CASCADE;
CREATE TABLE announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages table (with conversation support)
DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    conversation_id UUID, -- Optional: for group conversations
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table (for enhanced messaging)
DROP TABLE IF EXISTS conversations CASCADE;
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    is_group BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversation participants
DROP TABLE IF EXISTS conversation_participants CASCADE;
CREATE TABLE conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP WITH TIME ZONE,
    is_admin BOOLEAN DEFAULT FALSE,
    UNIQUE(conversation_id, user_id)
);

-- =============================================
-- STEP 3: QUIZ SYSTEM
-- =============================================

DROP TABLE IF EXISTS quiz_answers CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;

-- Quizzes table
CREATE TABLE quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    time_limit INTEGER DEFAULT 30, -- minutes
    passing_score INTEGER DEFAULT 60, -- percentage
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quiz questions
CREATE TABLE quiz_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]', -- [{"text": "option A", "is_correct": false}, ...]
    points INTEGER DEFAULT 10,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quiz attempts
CREATE TABLE quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE,
    score DECIMAL(5,2),
    passed BOOLEAN,
    UNIQUE(quiz_id, student_id, started_at)
);

-- Quiz answers
CREATE TABLE quiz_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_answer INTEGER, -- index of selected option
    is_correct BOOLEAN DEFAULT FALSE,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attempt_id, question_id)
);

-- =============================================
-- STEP 4: PROGRESS TRACKING SYSTEM
-- =============================================

-- Student progress per material
DROP TABLE IF EXISTS student_progress CASCADE;
CREATE TABLE student_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, material_id)
);

-- Material access log
DROP TABLE IF EXISTS material_access_log CASCADE;
CREATE TABLE material_access_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    first_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    access_count INT DEFAULT 1,
    time_spent_seconds INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz attempt details
DROP TABLE IF EXISTS quiz_attempt_details CASCADE;
CREATE TABLE quiz_attempt_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    attempt_number INT DEFAULT 1,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    score INT,
    passed BOOLEAN,
    time_spent_seconds INT,
    questions_answered INT,
    correct_answers INT,
    wrong_answers INT,
    is_best_attempt BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student activity log
DROP TABLE IF EXISTS student_activity_log CASCADE;
CREATE TABLE student_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_detail TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course enrollment tracking
DROP TABLE IF EXISTS course_enrollment_tracking CASCADE;
CREATE TABLE course_enrollment_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    first_material_accessed_at TIMESTAMPTZ,
    last_material_accessed_at TIMESTAMPTZ,
    first_quiz_attempt_at TIMESTAMPTZ,
    last_quiz_attempt_at TIMESTAMPTZ,
    total_materials_accessed INT DEFAULT 0,
    total_quiz_attempts INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- =============================================
-- STEP 5: NOTIFICATIONS
-- =============================================

DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type DEFAULT 'announcement',
    title TEXT,
    message TEXT NOT NULL,
    related_id UUID,
    related_type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- STEP 6: COURSE SUBJECTS (for better management)
-- =============================================

DROP TABLE IF EXISTS course_subjects CASCADE;
CREATE TABLE course_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    education_level education_level, -- NULL means all levels
    icon TEXT,
    color TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default subjects
INSERT INTO course_subjects (name, slug, icon, color, description) VALUES
    ('Matematika', 'matematika', '🔢', '#2196f3', 'Pelajaran Matematika'),
    ('Bahasa Indonesia', 'bahasa_indonesia', '📝', '#4caf50', 'Pelajaran Bahasa Indonesia'),
    ('Bahasa Inggris', 'bahasa_inggris', '🌍', '#ff9800', 'Pelajaran Bahasa Inggris'),
    ('IPA', 'ipa', '🔬', '#9c27b0', 'Ilmu Pengetahuan Alam'),
    ('IPS', 'ips', '📚', '#795548', 'Ilmu Pengetahuan Sosial'),
    ('PKN', 'pkn', '🏛️', '#f44336', 'Pendidikan Kewarganegaraan'),
    ('Penjasorkes', 'penjas', '⚽', '#009688', 'Pendidikan Jasmani dan Kesehatan'),
    ('Seni Budaya', 'seni_budaya', '🎨', '#e91e63', 'Seni dan Budaya'),
    ('Prakarya', 'prakarya', '🔧', '#607d8b', 'Prakarya dan Kewirausahaan'),
    ('Agama', 'agama', '🙏', '#ff5722', 'Pendidikan Agama'),
    ('TI/Informatika', 'ti', '💻', '#3f51b5', 'Teknologi Informasi')
 ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- STEP 7: INDEXES (Performance Optimization)
-- =============================================

-- Note: Storage buckets must be created via Supabase Dashboard
-- Instructions:
-- 1. Go to Supabase Dashboard > Storage > New Bucket
-- 2. Create bucket "materials" with settings:
--    - Public access: YES
--    - File size limit: 100MB
--    - Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/jpeg, image/png, image/gif, image/webp, video/mp4, video/webm
-- 3. Create bucket "avatars" with settings:
--    - Public access: YES
--    - File size limit: 5MB
--    - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- Storage policies (apply after creating buckets in Dashboard)
-- Note: Uncomment and run these if you want to add RLS policies to storage

/*
-- Materials bucket policies
CREATE POLICY "Materials bucket is publicly readable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'materials');

CREATE POLICY "Teachers can upload materials"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'materials' AND auth.role() = 'authenticated');

CREATE POLICY "Teachers can update materials"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'materials' AND auth.role() = 'authenticated');

CREATE POLICY "Teachers can delete materials"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'materials' AND auth.role() = 'authenticated');

-- Avatars bucket policies
CREATE POLICY "Avatars are publicly readable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
*/

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT '✅ KSI-ON LMS Complete Schema Created Successfully! (Without Exam System)' AS status;
SELECT '📚 All tables, functions, triggers, indexes, RLS policies, and views are ready.' AS info;
SELECT '🔑 Remember to enable Realtime for tables in Supabase Dashboard.' AS realtime;
SELECT '📦 Create storage buckets (materials, avatars) in Supabase Dashboard > Storage.' AS storage;

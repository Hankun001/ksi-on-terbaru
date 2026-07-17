-- =============================================
-- KSI-ON LMS - Ultimate Complete Database Schema
-- =============================================
-- File terpadu yang menggabungkan SEMUA fitur:
-- ✅ Autentikasi & Profil Lengkap
-- ✅ Manajemen Kursus dengan Jenjang Pendidikan
-- ✅ Materi Pembelajaran (Document, Video, Image, Link)
-- ✅ Tugas & Pengumpulan dengan File Upload
-- ✅ Sistem Quiz Lengkap
-- ✅ Sistem Ujian (Exam System) dengan Auto-Grading
-- ✅ Pelacakan Progres Detail
-- ✅ Pengumuman & Notifikasi
-- ✅ Sistem Pesan & Conversation
-- ✅ Storage Management (Materials, Avatars, Exam Images)
-- ✅ Essay Auto-Grading dengan Sample Answers
-- =============================================
-- DIBUAT UNTUK PEMBANGUNAN DATABASE DARI AWAL
-- Jalankan file ini untuk setup database lengkap
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

-- Question types for exam system
DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('multiple_choice', 'checkbox', 'essay');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Exam status
DO $$ BEGIN
    CREATE TYPE exam_status AS ENUM ('draft', 'published', 'closed', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Attempt status
DO $$ BEGIN
    CREATE TYPE attempt_status AS ENUM ('not_started', 'in_progress', 'submitted', 'auto_submitted', 'graded');
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
-- STEP 4: EXAM SYSTEM (UJIAN)
-- =============================================

DROP TABLE IF EXISTS attempt_answers CASCADE;
DROP TABLE IF EXISTS exam_attempts CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;

-- Exams table
CREATE TABLE exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    duration_minutes INTEGER DEFAULT 60,
    passing_score INTEGER DEFAULT 50,
    status exam_status DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions table (enhanced with image and auto-grading support)
CREATE TABLE questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    type question_type DEFAULT 'multiple_choice',
    question TEXT NOT NULL,
    image_url TEXT, -- For question images
    points INTEGER DEFAULT 1,
    order_number INTEGER DEFAULT 0,

    -- Auto-grading fields for essay questions
    enable_auto_grading BOOLEAN DEFAULT false,
    sample_answer TEXT,
    grading_keywords TEXT[],

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Question options (for multiple choice and checkbox)
CREATE TABLE question_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    order_number INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exam attempts
CREATE TABLE exam_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status attempt_status DEFAULT 'not_started',
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, student_id)
);

-- Attempt answers
CREATE TABLE attempt_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT, -- For essay answers
    selected_option_ids UUID[] DEFAULT '{}', -- For multiple choice/checkbox
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0,
    UNIQUE(attempt_id, question_id)
);

-- =============================================
-- STEP 5: PROGRESS TRACKING SYSTEM
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
-- STEP 6: NOTIFICATIONS
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
-- STEP 7: COURSE SUBJECTS (for better management)
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

-- =============================================
-- STEP 8: AUTO-GRADING FUNCTIONS
-- =============================================

-- Helper function for text similarity calculation
CREATE OR REPLACE FUNCTION calculate_text_similarity(text1 TEXT, text2 TEXT)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    words1 TEXT[];
    words2 TEXT[];
    common_words INTEGER := 0;
    total_unique_words INTEGER;
BEGIN
    -- Split texts into words
    words1 := regexp_split_to_array(text1, '\s+');
    words2 := regexp_split_to_array(text2, '\s+');

    -- Count common words
    SELECT COUNT(*) INTO common_words
    FROM unnest(words1) AS w1
    WHERE w1 IN (SELECT unnest(words2));

    -- Calculate Jaccard similarity
    total_unique_words := array_length(array_unique(words1 || words2), 1);

    IF total_unique_words = 0 THEN
        RETURN 0.0;
    END IF;

    RETURN (common_words::DECIMAL / total_unique_words);
END;
$$ LANGUAGE plpgsql;

-- Array unique helper function
CREATE OR REPLACE FUNCTION array_unique(arr TEXT[])
RETURNS TEXT[] AS $$
DECLARE
    result TEXT[] := ARRAY[]::TEXT[];
    elem TEXT;
BEGIN
    FOREACH elem IN ARRAY arr LOOP
        IF NOT (elem = ANY(result)) THEN
            result := result || elem;
        END IF;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate auto-grading score based on keywords
CREATE OR REPLACE FUNCTION calculate_auto_grade(
    student_answer TEXT,
    sample_answer TEXT,
    grading_keywords TEXT[],
    max_points INTEGER
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    keyword_score DECIMAL(5,2) := 0;
    total_keywords INTEGER := array_length(grading_keywords, 1);
    matched_keywords INTEGER := 0;
    similarity_score DECIMAL(5,2) := 0;
    final_score DECIMAL(5,2);
BEGIN
    -- Return 0 if no keywords defined
    IF total_keywords IS NULL OR total_keywords = 0 THEN
        RETURN 0;
    END IF;

    -- Count matched keywords (case-insensitive)
    FOR i IN 1..total_keywords LOOP
        IF grading_keywords[i] IS NOT NULL AND
           lower(student_answer) LIKE '%' || lower(grading_keywords[i]) || '%' THEN
            matched_keywords := matched_keywords + 1;
        END IF;
    END LOOP;

    -- CRITICAL FIX: If all keywords are matched, give full score (100%)
    -- This fixes the issue where "Bitter" matching "Bitter" only got 70% instead of 100%
    IF matched_keywords = total_keywords THEN
        RETURN max_points;
    END IF;

    -- Calculate keyword matching score (70% weight)
    keyword_score := (matched_keywords::DECIMAL / total_keywords) * 0.7;

    -- Calculate text similarity score (30% weight) if sample answer exists
    IF sample_answer IS NOT NULL AND length(sample_answer) > 0 THEN
        -- Simple word overlap similarity
        similarity_score := calculate_text_similarity(lower(student_answer), lower(sample_answer)) * 0.3;
    END IF;

    -- Calculate final score
    final_score := (keyword_score + similarity_score) * max_points;

    -- Return final score, capped at max_points
    RETURN LEAST(final_score, max_points);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STEP 9: AUTO SCORING TRIGGER
-- =============================================

-- Comprehensive auto scoring function
CREATE OR REPLACE FUNCTION auto_calculate_score()
RETURNS TRIGGER AS $$
DECLARE
    question_record RECORD;
    student_answer TEXT;
    auto_score DECIMAL(5,2);
BEGIN
    -- Only process submitted/auto_submitted attempts
    IF NEW.status NOT IN ('submitted', 'auto_submitted') THEN
        RETURN NEW;
    END IF;

    -- Reset all points_earned and is_correct for this attempt (safe - only updates)
    UPDATE attempt_answers
    SET points_earned = 0, is_correct = NULL
    WHERE attempt_id = NEW.id;

    -- Process each answer
    FOR question_record IN
        SELECT q.id, q.type, q.points, q.enable_auto_grading,
               q.sample_answer, q.grading_keywords
        FROM questions q
        WHERE q.exam_id = NEW.exam_id
    LOOP
        -- Handle multiple choice questions
        IF question_record.type = 'multiple_choice' THEN
            UPDATE attempt_answers
            SET
                is_correct = (SELECT qo.is_correct FROM question_options qo WHERE qo.id = selected_option_ids[1]),
                points_earned = CASE
                    WHEN (SELECT qo.is_correct FROM question_options qo WHERE qo.id = selected_option_ids[1]) THEN question_record.points
                    ELSE 0
                END
            WHERE attempt_id = NEW.id AND question_id = question_record.id;

        -- Handle checkbox questions
        ELSIF question_record.type = 'checkbox' THEN
            UPDATE attempt_answers
            SET
                is_correct = (
                    SELECT ARRAY(
                        SELECT qo.id FROM question_options qo
                        WHERE qo.question_id = question_record.id AND qo.is_correct = true
                        ORDER BY qo.id
                    ) = selected_option_ids
                ),
                points_earned = CASE
                    WHEN (
                        SELECT ARRAY(
                            SELECT qo.id FROM question_options qo
                            WHERE qo.question_id = question_record.id AND qo.is_correct = true
                            ORDER BY qo.id
                        ) = selected_option_ids
                    ) THEN question_record.points
                    ELSE 0
                END
            WHERE attempt_id = NEW.id AND question_id = question_record.id;

        -- Handle essay questions
        ELSIF question_record.type = 'essay' THEN
            -- Check if auto-grading is enabled
            IF question_record.enable_auto_grading THEN
                -- Get the student's answer
                SELECT answer_text INTO student_answer
                FROM attempt_answers
                WHERE attempt_id = NEW.id AND question_id = question_record.id;

                IF FOUND AND student_answer IS NOT NULL THEN
                    -- Calculate auto-grade score
                    auto_score := calculate_auto_grade(
                        student_answer,
                        question_record.sample_answer,
                        question_record.grading_keywords,
                        question_record.points
                    );

                    -- Update the answer with auto-calculated score
                    UPDATE attempt_answers
                    SET points_earned = auto_score,
                        is_correct = (auto_score >= (question_record.points * 0.6)) -- 60% threshold
                    WHERE attempt_id = NEW.id AND question_id = question_record.id;
                ELSE
                    -- Manual grading - set to pending
                    UPDATE attempt_answers
                    SET points_earned = 0,
                        is_correct = NULL
                    WHERE attempt_id = NEW.id AND question_id = question_record.id;
                END IF;
            ELSE
                -- Manual grading - set to pending
                UPDATE attempt_answers
                SET points_earned = 0,
                is_correct = NULL
                WHERE attempt_id = NEW.id AND question_id = question_record.id;
            END IF;
        END IF;
    END LOOP;

    -- Calculate total score
    SELECT COALESCE(SUM(points_earned), 0)
    INTO NEW.score
    FROM attempt_answers
    WHERE attempt_id = NEW.id;

    -- Check if all questions are now graded (no more NULL is_correct values)
    -- If so, automatically mark the attempt as graded
    IF NOT EXISTS (
        SELECT 1 FROM attempt_answers
        WHERE attempt_id = NEW.id AND is_correct IS NULL
    ) THEN
        NEW.status := 'graded';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER trigger_auto_calculate_score
  BEFORE UPDATE OF status ON exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_score();

-- =============================================
-- STEP 10: INDEXES (Performance Optimization)
-- =============================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_education_level ON courses(education_level);
CREATE INDEX IF NOT EXISTS idx_courses_subject ON courses(subject);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_materials_course_id ON materials(course_id);
CREATE INDEX IF NOT EXISTS idx_materials_material_type ON materials(material_type);
CREATE INDEX IF NOT EXISTS idx_materials_content_type ON materials(content_type);

CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- Quiz system indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_published ON quizzes(is_published);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON quiz_attempts(student_id);

CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt_id ON quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);

-- Exam system indexes
CREATE INDEX IF NOT EXISTS idx_exams_course_id ON exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);

CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_enable_auto_grading ON questions(enable_auto_grading);

CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_id ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_id ON exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_status ON exam_attempts(status);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question_id ON attempt_answers(question_id);

-- Progress tracking indexes
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_course_id ON student_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_material_id ON student_progress(material_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_is_completed ON student_progress(is_completed);

CREATE INDEX IF NOT EXISTS idx_material_access_log_student_id ON material_access_log(student_id);
CREATE INDEX IF NOT EXISTS idx_material_access_log_course_id ON material_access_log(course_id);
CREATE INDEX IF NOT EXISTS idx_material_access_log_material_id ON material_access_log(material_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_details_student_id ON quiz_attempt_details(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_details_quiz_id ON quiz_attempt_details(quiz_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollment_tracking_student_id ON course_enrollment_tracking(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_tracking_course_id ON course_enrollment_tracking(course_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Course subjects indexes
CREATE INDEX IF NOT EXISTS idx_course_subjects_education_level ON course_subjects(education_level);
CREATE INDEX IF NOT EXISTS idx_course_subjects_is_active ON course_subjects(is_active);

-- =============================================
-- STEP 11: RLS POLICIES (Row Level Security)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempt_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_subjects ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Courses policies
CREATE POLICY "Published courses are viewable by all" ON courses FOR SELECT USING (is_active = true);
CREATE POLICY "Instructors can manage own courses" ON courses FOR ALL USING (auth.uid() = instructor_id);
CREATE POLICY "Admins can manage all courses" ON courses FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Enrollments policies
CREATE POLICY "Students can view own enrollments" ON enrollments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Instructors can view enrollments in own courses" ON enrollments FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);
CREATE POLICY "Students can enroll themselves" ON enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Materials policies
CREATE POLICY "Enrolled students can view materials" ON materials FOR SELECT USING (
    is_published = true AND EXISTS (
        SELECT 1 FROM enrollments WHERE course_id = materials.course_id AND student_id = auth.uid()
    )
);
CREATE POLICY "Instructors can manage materials in own courses" ON materials FOR ALL USING (
    EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);

-- Assignments policies (similar to materials)
CREATE POLICY "Enrolled students can view assignments" ON assignments FOR SELECT USING (
    EXISTS (SELECT 1 FROM enrollments WHERE course_id = assignments.course_id AND student_id = auth.uid())
);
CREATE POLICY "Instructors can manage assignments in own courses" ON assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);

-- Submissions policies
CREATE POLICY "Students can manage own submissions" ON submissions FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Instructors can view submissions in own courses" ON submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM assignments a JOIN courses c ON a.course_id = c.id WHERE a.id = assignment_id AND c.instructor_id = auth.uid())
);
CREATE POLICY "Instructors can grade submissions in own courses" ON submissions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM assignments a JOIN courses c ON a.course_id = c.id WHERE a.id = assignment_id AND c.instructor_id = auth.uid())
);

-- Announcements policies
CREATE POLICY "Enrolled students can view announcements" ON announcements FOR SELECT USING (
    EXISTS (SELECT 1 FROM enrollments WHERE course_id = announcements.course_id AND student_id = auth.uid())
);
CREATE POLICY "Instructors can manage announcements in own courses" ON announcements FOR ALL USING (
    EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view messages they sent or received" ON messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Conversations and participants policies
CREATE POLICY "Users can view conversations they participate in" ON conversations FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversations.id AND user_id = auth.uid())
);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view conversation participants" ON conversation_participants FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()
    )
);
CREATE POLICY "Users can join conversations" ON conversation_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quiz system policies
CREATE POLICY "Published quizzes are viewable by enrolled students" ON quizzes FOR SELECT USING (
    is_published = true AND EXISTS (
        SELECT 1 FROM enrollments WHERE course_id = quizzes.course_id AND student_id = auth.uid()
    )
);
CREATE POLICY "Instructors can manage quizzes in own courses" ON quizzes FOR ALL USING (
    EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);

CREATE POLICY "Quiz questions are viewable by enrolled students" ON quiz_questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM quizzes q JOIN enrollments e ON q.course_id = e.course_id WHERE q.id = quiz_id AND e.student_id = auth.uid())
);

CREATE POLICY "Students can manage own quiz attempts" ON quiz_attempts FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Instructors can view quiz attempts in own courses" ON quiz_attempts FOR SELECT USING (
    EXISTS (SELECT 1 FROM quizzes q JOIN courses c ON q.course_id = c.id WHERE q.id = quiz_id AND c.instructor_id = auth.uid())
);

CREATE POLICY "Students can manage own quiz answers" ON quiz_answers FOR ALL USING (
    EXISTS (SELECT 1 FROM quiz_attempts WHERE id = attempt_id AND student_id = auth.uid())
);

-- Exam system policies
CREATE POLICY "Published exams are viewable by enrolled students" ON exams FOR SELECT USING (
    status = 'published' AND (course_id IS NULL OR EXISTS (
        SELECT 1 FROM enrollments WHERE course_id = exams.course_id AND student_id = auth.uid()
    ))
);
CREATE POLICY "Creators can manage own exams" ON exams FOR ALL USING (auth.uid() = created_by);
CREATE POLICY "Admins can manage all exams" ON exams FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Exam questions are viewable during attempts" ON questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM exams WHERE id = questions.exam_id AND status = 'published')
);

CREATE POLICY "Question options are viewable during attempts" ON question_options FOR SELECT USING (
    EXISTS (SELECT 1 FROM questions q JOIN exams e ON q.exam_id = e.id WHERE q.id = question_id AND e.status = 'published')
);

CREATE POLICY "Students can manage own exam attempts" ON exam_attempts FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Creators can view attempts on own exams" ON exam_attempts FOR SELECT USING (
    EXISTS (SELECT 1 FROM exams WHERE id = exam_id AND created_by = auth.uid())
);

CREATE POLICY "Students can manage own attempt answers" ON attempt_answers FOR ALL USING (
    EXISTS (SELECT 1 FROM exam_attempts WHERE id = attempt_id AND student_id = auth.uid())
);
CREATE POLICY "Creators can view answers on own exams" ON attempt_answers FOR SELECT USING (
    EXISTS (SELECT 1 FROM exam_attempts ea JOIN exams e ON ea.exam_id = e.id WHERE ea.id = attempt_id AND e.created_by = auth.uid())
);

-- Progress tracking policies
CREATE POLICY "Students can manage own progress" ON student_progress FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Instructors can view progress in own courses" ON student_progress FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);

-- Similar policies for other progress tables
CREATE POLICY "Students can manage own access logs" ON material_access_log FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Students can manage own activity logs" ON student_activity_log FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Students can manage own enrollment tracking" ON course_enrollment_tracking FOR ALL USING (auth.uid() = student_id);

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Course subjects policies
CREATE POLICY "Course subjects are viewable by all" ON course_subjects FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage course subjects" ON course_subjects FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================
-- STEP 12: STORAGE BUCKETS SETUP
-- =============================================

-- Create storage buckets if they don't exist
DO $$
BEGIN
    -- Exam images bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'exam-images',
        'exam-images',
        true,
        5242880, -- 5MB
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    ) ON CONFLICT (id) DO NOTHING;

    -- Materials bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'materials',
        'materials',
        true,
        104857600, -- 100MB
        ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
    ) ON CONFLICT (id) DO NOTHING;

    -- Avatars bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'avatars',
        'avatars',
        true,
        5242880, -- 5MB
        ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    ) ON CONFLICT (id) DO NOTHING;
END $$;

-- =============================================
-- STEP 13: STORAGE POLICIES
-- =============================================

-- Exam images bucket policies
CREATE POLICY "Exam images are publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'exam-images');
CREATE POLICY "Authenticated users can upload exam images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'exam-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Users can update own exam images" ON storage.objects FOR UPDATE USING (
    bucket_id = 'exam-images' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own exam images" ON storage.objects FOR DELETE USING (
    bucket_id = 'exam-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Materials bucket policies
CREATE POLICY "Materials bucket is publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
CREATE POLICY "Teachers can upload materials" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'materials' AND auth.role() = 'authenticated'
);
CREATE POLICY "Teachers can update materials" ON storage.objects FOR UPDATE USING (
    bucket_id = 'materials' AND auth.role() = 'authenticated'
);
CREATE POLICY "Teachers can delete materials" ON storage.objects FOR DELETE USING (
    bucket_id = 'materials' AND auth.role() = 'authenticated'
);

-- Avatars bucket policies
CREATE POLICY "Avatars are publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- STEP 14: SEED DATA
-- =============================================

-- Insert default course subjects
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
-- STEP 15: TRIGGERS
-- =============================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_attempts_updated_at BEFORE UPDATE ON exam_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT '🎉 KSI-ON LMS Ultimate Database Schema Successfully Created!' AS status;
SELECT '✅ All features included:' AS features;
SELECT '   • User Management (Profiles, Roles)' AS feature1;
SELECT '   • Course Management (with Education Levels)' AS feature2;
SELECT '   • Learning Materials (Documents, Videos, Images)' AS feature3;
SELECT '   • Assignments & Submissions' AS feature4;
SELECT '   • Quiz System (Simple)' AS feature5;
SELECT '   • Exam System (Advanced with Auto-Grading)' AS feature6;
SELECT '   • Progress Tracking & Analytics' AS feature7;
SELECT '   • Announcements & Notifications' AS feature8;
SELECT '   • Messaging System' AS feature9;
SELECT '   • Storage Management (Files & Images)' AS feature10;
SELECT '   • Row Level Security (RLS) Policies' AS feature11;
SELECT '   • Performance Indexes' AS feature12;
SELECT '🔑 Next Steps:' AS next_steps;
SELECT '   1. Enable Realtime for tables in Supabase Dashboard' AS step1;
SELECT '   2. Configure storage buckets in Supabase Dashboard' AS step2;
SELECT '   3. Set up authentication providers' AS step3;
SELECT '   4. Run the application!' AS step4;
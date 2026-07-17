-- =============================================
-- Teacher Evaluation Sessions
-- Menyimpan semua kriteria dalam 1 record per sesi
-- =============================================

-- Create enum for evaluation aspects
DO $$ BEGIN
    CREATE TYPE evaluation_aspect AS ENUM ('pedagogy', 'professionalism', 'personality', 'leadership');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create table for evaluation sessions (1 baris = 1 sesi evaluasi lengkap)
CREATE TABLE IF NOT EXISTS teacher_evaluation_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Pedagogy
    pedagogy_score INTEGER NOT NULL CHECK (pedagogy_score >= 1 AND pedagogy_score <= 5),
    pedagogy_feedback TEXT DEFAULT '',
    
    -- Professionalism
    professionalism_score INTEGER NOT NULL CHECK (professionalism_score >= 1 AND professionalism_score <= 5),
    professionalism_feedback TEXT DEFAULT '',
    
    -- Personality
    personality_score INTEGER NOT NULL CHECK (personality_score >= 1 AND personality_score <= 5),
    personality_feedback TEXT DEFAULT '',
    
    -- Leadership
    leadership_score INTEGER NOT NULL CHECK (leadership_score >= 1 AND leadership_score <= 5),
    leadership_feedback TEXT DEFAULT '',
    
    -- Computed total
    total_score DECIMAL(4,1) GENERATED ALWAYS AS (
        (pedagogy_score + professionalism_score + personality_score + leadership_score) / 4.0
    ) STORED,
    
    notes TEXT DEFAULT '',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE teacher_evaluation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin can insert evaluation sessions"
    ON teacher_evaluation_sessions FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin can view all evaluation sessions"
    ON teacher_evaluation_sessions FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Teachers can view their own evaluation sessions"
    ON teacher_evaluation_sessions FOR SELECT
    USING (teacher_id = auth.uid());

CREATE POLICY "Admin can update evaluation sessions"
    ON teacher_evaluation_sessions FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can delete evaluation sessions"
    ON teacher_evaluation_sessions FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_eval_sessions_admin_id ON teacher_evaluation_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_eval_sessions_teacher_id ON teacher_evaluation_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_eval_sessions_date ON teacher_evaluation_sessions(date DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_eval_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_eval_session_timestamp ON teacher_evaluation_sessions;
CREATE TRIGGER trg_update_eval_session_timestamp
    BEFORE UPDATE ON teacher_evaluation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_eval_session_timestamp();

-- View for easy reporting
CREATE OR REPLACE VIEW teacher_evaluation_summary AS
SELECT 
    teacher_id,
    p.full_name AS teacher_name,
    p.email AS teacher_email,
    COUNT(*) AS total_sessions,
    ROUND(AVG(pedagogy_score)::numeric, 1) AS avg_pedagogy,
    ROUND(AVG(professionalism_score)::numeric, 1) AS avg_professionalism,
    ROUND(AVG(personality_score)::numeric, 1) AS avg_personality,
    ROUND(AVG(leadership_score)::numeric, 1) AS avg_leadership,
    ROUND(AVG(total_score)::numeric, 1) AS avg_total
FROM teacher_evaluation_sessions
JOIN profiles p ON p.id = teacher_evaluation_sessions.teacher_id
GROUP BY teacher_id, p.full_name, p.email;

SELECT '✅ Teacher Evaluation Sessions table created successfully!' AS status;
SELECT '📋 All 4 criteria are now stored in 1 row per evaluation session.' AS info;
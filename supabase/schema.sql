-- ============================================================
-- Supabase Schema for Physics Exam Practice Website
-- Run this in the Supabase SQL Editor to set up all tables,
-- triggers, and RLS policies.
-- ============================================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  year_group INTEGER CHECK (year_group BETWEEN 7 AND 13),
  exam_board TEXT CHECK (exam_board IN ('AQA','Edexcel','OCR','WJEC','SQA','Other')),
  school_name TEXT,
  target_grade TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free','individual','school')),
  tier_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup (reads metadata passed via options.data)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, year_group, exam_board, school_name, target_grade)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.raw_user_meta_data->>'year_group' ~ '^\d+$'
         THEN (NEW.raw_user_meta_data->>'year_group')::INTEGER
         ELSE NULL END,
    NULLIF(NEW.raw_user_meta_data->>'exam_board', ''),
    NULLIF(NEW.raw_user_meta_data->>'school_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'target_grade', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. QUESTION ATTEMPTS (analytics - every completed attempt)
CREATE TABLE public.question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  subtopic_id TEXT NOT NULL,
  main_topic_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  difficulty TEXT,
  time_spent_seconds INTEGER,
  attempt_number INTEGER DEFAULT 1,
  part_scores JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own attempts"
  ON public.question_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON public.question_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- 3. USER SCORES (best score per question - replaces cookie)
CREATE TABLE public.user_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  subtopic_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  attempts INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scores"
  ON public.user_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores"
  ON public.user_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scores"
  ON public.user_scores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scores"
  ON public.user_scores FOR DELETE
  USING (auth.uid() = user_id);


-- 4. SAVED ANSWERS (replaces localStorage)
CREATE TABLE public.saved_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.saved_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own answers"
  ON public.saved_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers"
  ON public.saved_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON public.saved_answers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own answers"
  ON public.saved_answers FOR DELETE
  USING (auth.uid() = user_id);


-- 5. SESSION LOGS (time-on-site tracking)
CREATE TABLE public.session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  questions_attempted INTEGER DEFAULT 0
);

ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON public.session_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.session_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.session_logs FOR UPDATE
  USING (auth.uid() = user_id);


-- 6. CONTENT ACCESS (configures free question limits per subtopic)
CREATE TABLE public.content_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id TEXT NOT NULL UNIQUE,
  free_question_limit INTEGER DEFAULT 3,
  tier_required TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.content_access ENABLE ROW LEVEL SECURITY;

-- Everyone (including anonymous) can read content access rules
CREATE POLICY "Anyone can read content access"
  ON public.content_access FOR SELECT
  USING (true);


-- 7. INDEXES for common queries
CREATE INDEX idx_question_attempts_user ON public.question_attempts(user_id);
CREATE INDEX idx_question_attempts_question ON public.question_attempts(question_id);
CREATE INDEX idx_question_attempts_subtopic ON public.question_attempts(subtopic_id);
CREATE INDEX idx_user_scores_user ON public.user_scores(user_id);
CREATE INDEX idx_user_scores_subtopic ON public.user_scores(subtopic_id);
CREATE INDEX idx_saved_answers_user ON public.saved_answers(user_id);
CREATE INDEX idx_session_logs_user ON public.session_logs(user_id);


-- 8. ANALYTICS VIEWS (for site owner dashboard in Supabase)

-- Active users in last 7 and 30 days
CREATE OR REPLACE VIEW public.analytics_active_users AS
SELECT
  COUNT(DISTINCT CASE WHEN sa.created_at > NOW() - INTERVAL '7 days' THEN sa.user_id END) AS active_7d,
  COUNT(DISTINCT CASE WHEN sa.created_at > NOW() - INTERVAL '30 days' THEN sa.user_id END) AS active_30d
FROM public.question_attempts sa;

-- Average scores by subtopic
CREATE OR REPLACE VIEW public.analytics_subtopic_scores AS
SELECT
  subtopic_id,
  main_topic_id,
  COUNT(*) AS total_attempts,
  ROUND(AVG(score::NUMERIC / NULLIF(max_score, 0) * 100), 1) AS avg_pct,
  COUNT(DISTINCT user_id) AS unique_users
FROM public.question_attempts
GROUP BY subtopic_id, main_topic_id;

-- Weakest questions (lowest average scores)
CREATE OR REPLACE VIEW public.analytics_weakest_questions AS
SELECT
  question_id,
  subtopic_id,
  COUNT(*) AS total_attempts,
  ROUND(AVG(score::NUMERIC / NULLIF(max_score, 0) * 100), 1) AS avg_pct
FROM public.question_attempts
GROUP BY question_id, subtopic_id
ORDER BY avg_pct ASC;

-- User retention (signups by week, return rate)
CREATE OR REPLACE VIEW public.analytics_user_retention AS
SELECT
  DATE_TRUNC('week', p.created_at) AS signup_week,
  COUNT(*) AS signups,
  COUNT(DISTINCT qa.user_id) AS returned_users
FROM public.profiles p
LEFT JOIN public.question_attempts qa
  ON qa.user_id = p.id AND qa.created_at > p.created_at + INTERVAL '1 day'
GROUP BY DATE_TRUNC('week', p.created_at)
ORDER BY signup_week DESC;

-- ============================================================
-- Anonymous Analytics Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. anon_visitors — one row per unique anonymous user
CREATE TABLE IF NOT EXISTS anon_visitors (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  anon_id     TEXT NOT NULL UNIQUE,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_visits  INTEGER NOT NULL DEFAULT 1,
  total_time_seconds INTEGER NOT NULL DEFAULT 0
);

-- 2. anon_sessions — one row per visit
CREATE TABLE IF NOT EXISTS anon_sessions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  anon_id         TEXT NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  questions_viewed  INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  questions_skipped  INTEGER NOT NULL DEFAULT 0
);

-- 3. anon_question_events — per-question interactions
CREATE TABLE IF NOT EXISTS anon_question_events (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  anon_id         TEXT NOT NULL,
  session_id      UUID,
  question_id     TEXT NOT NULL,
  subtopic_id     TEXT,
  main_topic_id   TEXT,
  event_type      TEXT NOT NULL CHECK (event_type IN ('view', 'answer', 'skip')),
  score           INTEGER,
  max_score       INTEGER,
  parts_answered  INTEGER,
  parts_total     INTEGER,
  parts_blank     INTEGER,
  time_spent_seconds INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_anon_sessions_anon_id ON anon_sessions(anon_id);
CREATE INDEX IF NOT EXISTS idx_anon_question_events_question_id ON anon_question_events(question_id);
CREATE INDEX IF NOT EXISTS idx_anon_question_events_event_type ON anon_question_events(event_type);
CREATE INDEX IF NOT EXISTS idx_anon_question_events_created_at ON anon_question_events(created_at);
CREATE INDEX IF NOT EXISTS idx_anon_sessions_started_at ON anon_sessions(started_at);

-- ============================================================
-- Row Level Security — allow anon insert + select
-- ============================================================

ALTER TABLE anon_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE anon_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anon_question_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts and updates
CREATE POLICY "anon_visitors_insert" ON anon_visitors FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_visitors_update" ON anon_visitors FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_visitors_select" ON anon_visitors FOR SELECT TO anon USING (true);

CREATE POLICY "anon_sessions_insert" ON anon_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_sessions_update" ON anon_sessions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_sessions_select" ON anon_sessions FOR SELECT TO anon USING (true);

CREATE POLICY "anon_question_events_insert" ON anon_question_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_question_events_select" ON anon_question_events FOR SELECT TO anon USING (true);

-- ============================================================
-- RPC Functions (SECURITY DEFINER to bypass RLS)
-- ============================================================

-- Upsert anonymous visitor: insert or increment visit count
CREATE OR REPLACE FUNCTION upsert_anon_visitor(p_anon_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO anon_visitors (anon_id, first_seen_at, last_seen_at, total_visits)
  VALUES (p_anon_id, now(), now(), 1)
  ON CONFLICT (anon_id) DO UPDATE SET
    last_seen_at = now(),
    total_visits = anon_visitors.total_visits + 1;
END;
$$;

-- Atomically increment session counters
CREATE OR REPLACE FUNCTION increment_session_counters(
  p_session_id UUID,
  p_views INTEGER DEFAULT 0,
  p_answers INTEGER DEFAULT 0,
  p_skips INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE anon_sessions SET
    questions_viewed = questions_viewed + p_views,
    questions_answered = questions_answered + p_answers,
    questions_skipped = questions_skipped + p_skips
  WHERE id = p_session_id;
END;
$$;

-- Summary analytics: unique users, total visits, avg session, avg questions
CREATE OR REPLACE FUNCTION analytics_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'unique_users', (SELECT COUNT(*) FROM anon_visitors),
    'total_visits', (SELECT COALESCE(SUM(total_visits), 0) FROM anon_visitors),
    'avg_session_duration', (SELECT COALESCE(ROUND(AVG(duration_seconds)), 0) FROM anon_sessions WHERE duration_seconds > 0),
    'avg_questions_per_session', (SELECT COALESCE(ROUND(AVG(questions_answered)::numeric, 1), 0) FROM anon_sessions WHERE questions_answered > 0)
  ) INTO result;
  RETURN result;
END;
$$;

-- Daily analytics for the last N days
CREATE OR REPLACE FUNCTION analytics_daily(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  day DATE,
  unique_users BIGINT,
  total_sessions BIGINT,
  avg_duration NUMERIC,
  total_answers BIGINT,
  total_views BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.day::DATE,
    COUNT(DISTINCT s.anon_id) AS unique_users,
    COUNT(s.id) AS total_sessions,
    COALESCE(ROUND(AVG(s.duration_seconds)), 0) AS avg_duration,
    COALESCE(SUM(s.questions_answered), 0) AS total_answers,
    COALESCE(SUM(s.questions_viewed), 0) AS total_views
  FROM generate_series(
    (now() - (days_back || ' days')::INTERVAL)::DATE,
    now()::DATE,
    '1 day'::INTERVAL
  ) AS d(day)
  LEFT JOIN anon_sessions s ON s.started_at::DATE = d.day::DATE
  GROUP BY d.day
  ORDER BY d.day;
END;
$$;

-- Per-question completion stats
CREATE OR REPLACE FUNCTION analytics_question_completion()
RETURNS TABLE(
  question_id TEXT,
  subtopic_id TEXT,
  views BIGINT,
  answers BIGINT,
  skips BIGINT,
  completion_pct NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.question_id,
    MAX(e.subtopic_id) AS subtopic_id,
    COUNT(*) FILTER (WHERE e.event_type = 'view') AS views,
    COUNT(*) FILTER (WHERE e.event_type = 'answer') AS answers,
    COUNT(*) FILTER (WHERE e.event_type = 'skip') AS skips,
    CASE
      WHEN COUNT(*) FILTER (WHERE e.event_type = 'view') = 0 THEN 0
      ELSE ROUND(
        COUNT(*) FILTER (WHERE e.event_type = 'answer')::NUMERIC /
        COUNT(*) FILTER (WHERE e.event_type = 'view') * 100, 1
      )
    END AS completion_pct
  FROM anon_question_events e
  GROUP BY e.question_id
  ORDER BY views DESC;
END;
$$;

-- Top N most-skipped questions
CREATE OR REPLACE FUNCTION analytics_most_skipped(lim INTEGER DEFAULT 20)
RETURNS TABLE(
  question_id TEXT,
  subtopic_id TEXT,
  skips BIGINT,
  views BIGINT,
  skip_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.question_id,
    MAX(e.subtopic_id) AS subtopic_id,
    COUNT(*) FILTER (WHERE e.event_type = 'skip') AS skips,
    COUNT(*) FILTER (WHERE e.event_type = 'view') AS views,
    CASE
      WHEN COUNT(*) FILTER (WHERE e.event_type = 'view') = 0 THEN 0
      ELSE ROUND(
        COUNT(*) FILTER (WHERE e.event_type = 'skip')::NUMERIC /
        COUNT(*) FILTER (WHERE e.event_type = 'view') * 100, 1
      )
    END AS skip_rate
  FROM anon_question_events e
  GROUP BY e.question_id
  HAVING COUNT(*) FILTER (WHERE e.event_type = 'skip') > 0
  ORDER BY skips DESC
  LIMIT lim;
END;
$$;

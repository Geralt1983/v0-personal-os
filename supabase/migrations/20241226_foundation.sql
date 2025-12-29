-- Foundation Migration: Core LifeOS Tables
-- Created: 2024-12-26
-- This migration establishes the base schema for LifeOS

-- ============================================
-- TASKS TABLE (Core module)
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  original_text TEXT,
  energy_level TEXT DEFAULT 'medium' CHECK (energy_level IN ('peak', 'medium', 'low')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  deadline TIMESTAMPTZ,
  estimated_minutes INTEGER DEFAULT 30,
  surveillance BOOLEAN DEFAULT FALSE,
  days_overdue INTEGER DEFAULT 0,
  context TEXT,
  eta TEXT,
  eta_minutes INTEGER,
  friction TEXT DEFAULT 'medium' CHECK (friction IN ('low', 'medium', 'high')),
  best_time TEXT DEFAULT 'anytime' CHECK (best_time IN ('now', 'morning_meeting_window', 'focus_block', 'evening_wind_down', 'weekend', 'anytime')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'delegated', 'deleted')),
  completed BOOLEAN DEFAULT FALSE,
  quick_win BOOLEAN DEFAULT FALSE,
  delegate_candidate BOOLEAN DEFAULT FALSE,
  vendor_candidate BOOLEAN DEFAULT FALSE,
  hire_out_candidate BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  ai_recommendation TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  pattern_match TEXT,
  micro_moves TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- RLS for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FEATURE FLAGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default feature flags
INSERT INTO feature_flags (flag, enabled, description) VALUES
  ('ENABLE_HABITS', false, 'Enable habits tracking module'),
  ('ENABLE_PROJECTS', false, 'Enable projects management module'),
  ('ENABLE_GOALS', false, 'Enable OKR-style goals module'),
  ('ENABLE_NOTES', false, 'Enable quick notes module'),
  ('ENABLE_AI_INSIGHTS', true, 'Enable AI-powered task insights'),
  ('ENABLE_OFFLINE_MODE', true, 'Enable offline-first PWA mode'),
  ('ENABLE_PUSH_NOTIFICATIONS', false, 'Enable push notifications')
ON CONFLICT (flag) DO NOTHING;

-- RLS for feature_flags (public read, admin write)
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature flags"
  ON feature_flags FOR SELECT
  USING (true);

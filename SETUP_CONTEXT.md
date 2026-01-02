# LifeOS Setup Context (Resume After Restart)

## Current Task
Set up the Supabase Cloud database tables for LifeOS personal mode (no auth).

## Supabase Project
- URL: https://ktouykzykkxuowwlhiub.supabase.co
- Project ref: ktouykzykkxuowwlhiub

## SQL to Run
Run this SQL using the Supabase MCP `execute_sql` or `apply_migration` tool:

```sql
-- Drop existing tables
DROP TABLE IF EXISTS habit_completions CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;

-- 1. USER STATS TABLE
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_skipped INTEGER DEFAULT 0,
  trust_score INTEGER DEFAULT 50,
  last_completed_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
INSERT INTO user_stats (user_id, current_streak, total_completed, total_skipped, trust_score)
VALUES ('00000000-0000-0000-0000-000000000001', 0, 0, 0, 50);

-- 2. TASKS TABLE
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  energy_level TEXT DEFAULT 'medium',
  priority TEXT DEFAULT 'medium',
  deadline TIMESTAMPTZ,
  estimated_minutes INTEGER DEFAULT 25,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT FALSE,
  skip_reason TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- 3. HABITS TABLE
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#06b6d4',
  frequency JSONB NOT NULL DEFAULT '{"type": "daily"}'::jsonb,
  reminder_time TEXT,
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;

-- 4. HABIT COMPLETIONS TABLE
CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);
ALTER TABLE habit_completions DISABLE ROW LEVEL SECURITY;

-- 5. REMINDERS TABLE
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;

-- INDEXES
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
```

## After DB Setup
- The app at http://localhost:3001 should work
- Vercel deployment at https://v0-personal-os.vercel.app should also work
- Tasks and habits will save to the cloud Supabase

## What Was Already Done
1. TypeScript errors fixed and pushed to GitHub
2. Supabase MCP server added to Claude config
3. App configured to use cloud Supabase (ktouykzykkxuowwlhiub.supabase.co)

## Resume Command
After restart, say: "Read /Users/jeremy/Projects/LifeOS/SETUP_CONTEXT.md and run the SQL"

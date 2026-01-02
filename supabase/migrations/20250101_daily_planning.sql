-- Daily Planning Migration
-- Created: 2025-01-01
-- Implements daily planning mode for structured task execution
-- Note: Uses PERSONAL_USER_ID (00000000-0000-0000-0000-000000000001) for single-user mode

-- ============================================
-- DAILY PLANS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  date DATE NOT NULL,
  energy_level TEXT NOT NULL CHECK (energy_level IN ('high', 'normal', 'low')),
  available_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- One plan per user per day
  UNIQUE(user_id, date)
);

-- Indexes for daily_plans
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date ON daily_plans(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_plans_status ON daily_plans(status);

-- ============================================
-- PLANNED TASKS TABLE (Join table with order and status)
-- ============================================

CREATE TABLE IF NOT EXISTS planned_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'deferred')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  actual_minutes INTEGER,

  -- Each task can only be in a plan once
  UNIQUE(plan_id, task_id)
);

-- Indexes for planned_tasks
CREATE INDEX IF NOT EXISTS idx_planned_tasks_plan ON planned_tasks(plan_id, "order");
CREATE INDEX IF NOT EXISTS idx_planned_tasks_task ON planned_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_planned_tasks_status ON planned_tasks(status);

-- ============================================
-- ADD CARRY OVER TRACKING TO TASKS
-- ============================================

-- Add carried_from_date column to track tasks carried over from previous days
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS carried_from_date DATE;

-- Add index for carried tasks
CREATE INDEX IF NOT EXISTS idx_tasks_carried_from ON tasks(carried_from_date) WHERE carried_from_date IS NOT NULL;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  
  const adminKey = process.env.ADMIN_API_KEY || "fix-runner-2026";
  if (key !== adminKey) {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results: { step: string; status: string; error?: string }[] = [];

  // Check/create training_plans table
  try {
    const { error: checkError } = await supabase
      .from("training_plans")
      .select("id")
      .limit(1);
    
    if (checkError && checkError.code === "42P01") {
      results.push({
        step: "training_plans table",
        status: "needs_creation",
        error: "Run the SQL below in Supabase SQL Editor"
      });
    } else if (checkError) {
      results.push({
        step: "training_plans table",
        status: "error",
        error: checkError.message
      });
    } else {
      results.push({
        step: "training_plans table",
        status: "exists"
      });
    }
  } catch (e) {
    results.push({
      step: "training_plans table",
      status: "error",
      error: String(e)
    });
  }

  // Check/create planned_workouts table
  try {
    const { error: checkError } = await supabase
      .from("planned_workouts")
      .select("id")
      .limit(1);
    
    if (checkError && checkError.code === "42P01") {
      results.push({
        step: "planned_workouts table",
        status: "needs_creation",
        error: "Run the SQL below in Supabase SQL Editor"
      });
    } else if (checkError) {
      results.push({
        step: "planned_workouts table",
        status: "error",
        error: checkError.message
      });
    } else {
      results.push({
        step: "planned_workouts table",
        status: "exists"
      });
    }
  } catch (e) {
    results.push({
      step: "planned_workouts table",
      status: "error",
      error: String(e)
    });
  }

  // Check/create life_events table
  try {
    const { error: checkError } = await supabase
      .from("life_events")
      .select("id")
      .limit(1);
    
    if (checkError && checkError.code === "42P01") {
      results.push({
        step: "life_events table",
        status: "needs_creation",
        error: "Run the SQL below in Supabase SQL Editor"
      });
    } else if (checkError) {
      results.push({
        step: "life_events table",
        status: "error",
        error: checkError.message
      });
    } else {
      results.push({
        step: "life_events table",
        status: "exists"
      });
    }
  } catch (e) {
    results.push({
      step: "life_events table",
      status: "error",
      error: String(e)
    });
  }

  const sqlToRun = `
-- =====================================================
-- RUNNER WELLNESS: TRAINING PLAN SYSTEM
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =====================================================

-- 1. TRAINING PLANS TABLE
-- Stores the overall training plan linked to a race goal
CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  
  -- Plan details
  plan_type TEXT NOT NULL, -- '5K', '10K', 'Half Marathon', 'Marathon'
  experience_level TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL, -- Race day
  target_time TEXT, -- Target finish time e.g. "3:30:00"
  
  -- Training parameters
  peak_weekly_miles NUMERIC(5,2), -- Maximum mileage week
  starting_weekly_miles NUMERIC(5,2), -- Current/starting mileage
  training_days_per_week INTEGER DEFAULT 5,
  long_run_day TEXT DEFAULT 'Sunday', -- Preferred long run day
  
  -- Plan structure (JSON for flexibility)
  weekly_structure JSONB, -- Array of week plans with targets
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'cancelled'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_plans_user ON training_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_status ON training_plans(status);
CREATE INDEX IF NOT EXISTS idx_training_plans_goal ON training_plans(goal_id);

-- 2. PLANNED WORKOUTS TABLE
-- Individual workouts within a training plan
CREATE TABLE IF NOT EXISTS planned_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  original_date DATE, -- If rescheduled, keep track of original
  week_number INTEGER, -- Week of training plan (1-indexed)
  day_of_week TEXT, -- 'Monday', 'Tuesday', etc.
  
  -- Workout details
  workout_type TEXT NOT NULL, -- 'easy', 'long', 'tempo', 'intervals', 'recovery', 'rest', 'cross_train'
  title TEXT, -- "Easy Run", "Long Run", "Tempo Thursday"
  description TEXT, -- Detailed instructions
  
  -- Targets
  target_miles NUMERIC(5,2),
  target_duration_minutes INTEGER,
  target_pace_zone TEXT, -- 'easy', 'moderate', 'tempo', 'threshold', 'race'
  target_pace TEXT, -- Specific pace like "8:30/mi"
  
  -- For interval workouts
  intervals JSONB, -- { sets: 6, distance: "800m", rest: "2:00", pace: "6:30" }
  
  -- Completion tracking
  status TEXT DEFAULT 'planned', -- 'planned', 'completed', 'skipped', 'rescheduled', 'modified'
  completed_run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  
  -- Adjustment tracking
  adjustment_reason TEXT, -- 'low_readiness', 'travel', 'illness', 'user_request', 'weather'
  adjusted_at TIMESTAMPTZ,
  adjusted_by TEXT, -- 'ai', 'user'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planned_workouts_plan ON planned_workouts(plan_id);
CREATE INDEX IF NOT EXISTS idx_planned_workouts_user ON planned_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_planned_workouts_date ON planned_workouts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_planned_workouts_status ON planned_workouts(status);

-- 3. LIFE EVENTS TABLE
-- Track travel, illness, busy periods that affect training
CREATE TABLE IF NOT EXISTS life_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL, -- 'travel', 'illness', 'busy', 'vacation', 'injury', 'other'
  title TEXT,
  description TEXT,
  
  -- Date range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Impact on training
  training_impact TEXT DEFAULT 'reduced', -- 'none', 'reduced', 'no_training'
  can_run BOOLEAN DEFAULT TRUE,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_life_events_user ON life_events(user_id);
CREATE INDEX IF NOT EXISTS idx_life_events_dates ON life_events(start_date, end_date);

-- 4. ADD COLUMN TO GOALS TABLE (if not exists)
-- Link goals to training plans
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'has_training_plan'
  ) THEN
    ALTER TABLE goals ADD COLUMN has_training_plan BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_events ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- Training Plans: Users can only see/modify their own plans
DROP POLICY IF EXISTS "Users can view own training plans" ON training_plans;
CREATE POLICY "Users can view own training plans" ON training_plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own training plans" ON training_plans;
CREATE POLICY "Users can create own training plans" ON training_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own training plans" ON training_plans;
CREATE POLICY "Users can update own training plans" ON training_plans
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own training plans" ON training_plans;
CREATE POLICY "Users can delete own training plans" ON training_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Planned Workouts: Users can only see/modify their own workouts
DROP POLICY IF EXISTS "Users can view own planned workouts" ON planned_workouts;
CREATE POLICY "Users can view own planned workouts" ON planned_workouts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own planned workouts" ON planned_workouts;
CREATE POLICY "Users can create own planned workouts" ON planned_workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own planned workouts" ON planned_workouts;
CREATE POLICY "Users can update own planned workouts" ON planned_workouts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own planned workouts" ON planned_workouts;
CREATE POLICY "Users can delete own planned workouts" ON planned_workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Life Events: Users can only see/modify their own events
DROP POLICY IF EXISTS "Users can view own life events" ON life_events;
CREATE POLICY "Users can view own life events" ON life_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own life events" ON life_events;
CREATE POLICY "Users can create own life events" ON life_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own life events" ON life_events;
CREATE POLICY "Users can update own life events" ON life_events
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own life events" ON life_events;
CREATE POLICY "Users can delete own life events" ON life_events
  FOR DELETE USING (auth.uid() = user_id);

-- 7. CREATE UPDATED_AT TRIGGER FUNCTION (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. ADD UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS update_training_plans_updated_at ON training_plans;
CREATE TRIGGER update_training_plans_updated_at
    BEFORE UPDATE ON training_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_planned_workouts_updated_at ON planned_workouts;
CREATE TRIGGER update_planned_workouts_updated_at
    BEFORE UPDATE ON planned_workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_life_events_updated_at ON life_events;
CREATE TRIGGER update_life_events_updated_at
    BEFORE UPDATE ON life_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Done! Your training plan system tables are ready.
`;

  return NextResponse.json({
    message: "Training plan schema check complete. Run the SQL below in Supabase SQL Editor to create the required tables.",
    results,
    sql: sqlToRun
  });
}

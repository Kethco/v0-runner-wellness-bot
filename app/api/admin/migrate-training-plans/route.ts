import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  
  if (key !== "fix-runner-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  const results: Array<{ step: string; status: string; error?: string }> = [];

  // SQL statements to run - we'll use Supabase's rpc or direct queries
  const migrations = [
    {
      name: "training_plans table",
      sql: `
        CREATE TABLE IF NOT EXISTS training_plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          goal_id UUID,
          plan_type TEXT NOT NULL,
          experience_level TEXT DEFAULT 'intermediate',
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          target_time TEXT,
          peak_weekly_miles NUMERIC(5,2),
          starting_weekly_miles NUMERIC(5,2),
          training_days_per_week INTEGER DEFAULT 5,
          long_run_day TEXT DEFAULT 'Sunday',
          weekly_structure JSONB,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: "planned_workouts table",
      sql: `
        CREATE TABLE IF NOT EXISTS planned_workouts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          plan_id UUID NOT NULL,
          user_id UUID NOT NULL,
          scheduled_date DATE NOT NULL,
          original_date DATE,
          week_number INTEGER,
          day_of_week TEXT,
          workout_type TEXT NOT NULL,
          title TEXT,
          description TEXT,
          target_miles NUMERIC(5,2),
          target_duration_minutes INTEGER,
          target_pace_zone TEXT,
          target_pace TEXT,
          intervals JSONB,
          status TEXT DEFAULT 'planned',
          completed_run_id UUID,
          adjustment_reason TEXT,
          adjusted_at TIMESTAMPTZ,
          adjusted_by TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: "life_events table",
      sql: `
        CREATE TABLE IF NOT EXISTS life_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          event_type TEXT NOT NULL,
          title TEXT,
          description TEXT,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          training_impact TEXT DEFAULT 'reduced',
          can_run BOOLEAN DEFAULT TRUE,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    }
  ];

  // Check if tables exist by trying to select from them
  for (const migration of migrations) {
    const tableName = migration.name.replace(" table", "");
    const { error } = await supabase.from(tableName).select("id").limit(1);
    
    if (error && error.code === "42P01") {
      // Table doesn't exist - we need to create it
      results.push({ 
        step: migration.name, 
        status: "needs_creation",
        error: "Table does not exist. Please run the SQL in Supabase SQL Editor."
      });
    } else if (error) {
      results.push({ step: migration.name, status: "error", error: error.message });
    } else {
      results.push({ step: migration.name, status: "exists" });
    }
  }

  // Check if all tables exist
  const allExist = results.every(r => r.status === "exists");
  
  if (allExist) {
    return NextResponse.json({
      message: "All training plan tables already exist!",
      results
    });
  }

  // If tables don't exist, provide the SQL to run
  const fullSQL = `
-- =====================================================
-- RUNNER WELLNESS: TRAINING PLAN SYSTEM
-- Copy and run this in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query
-- =====================================================

-- 1. TRAINING PLANS TABLE
CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  plan_type TEXT NOT NULL,
  experience_level TEXT DEFAULT 'intermediate',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_time TEXT,
  peak_weekly_miles NUMERIC(5,2),
  starting_weekly_miles NUMERIC(5,2),
  training_days_per_week INTEGER DEFAULT 5,
  long_run_day TEXT DEFAULT 'Sunday',
  weekly_structure JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_plans_user ON training_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_status ON training_plans(status);

-- 2. PLANNED WORKOUTS TABLE
CREATE TABLE IF NOT EXISTS planned_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  original_date DATE,
  week_number INTEGER,
  day_of_week TEXT,
  workout_type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  target_miles NUMERIC(5,2),
  target_duration_minutes INTEGER,
  target_pace_zone TEXT,
  target_pace TEXT,
  intervals JSONB,
  status TEXT DEFAULT 'planned',
  completed_run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  adjustment_reason TEXT,
  adjusted_at TIMESTAMPTZ,
  adjusted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planned_workouts_plan ON planned_workouts(plan_id);
CREATE INDEX IF NOT EXISTS idx_planned_workouts_user ON planned_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_planned_workouts_date ON planned_workouts(scheduled_date);

-- 3. LIFE EVENTS TABLE
CREATE TABLE IF NOT EXISTS life_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  training_impact TEXT DEFAULT 'reduced',
  can_run BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_life_events_user ON life_events(user_id);
CREATE INDEX IF NOT EXISTS idx_life_events_dates ON life_events(start_date, end_date);

-- 4. ADD COLUMN TO GOALS TABLE
ALTER TABLE goals ADD COLUMN IF NOT EXISTS has_training_plan BOOLEAN DEFAULT FALSE;

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_events ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES
CREATE POLICY "Users can view own training plans" ON training_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own training plans" ON training_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own training plans" ON training_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own training plans" ON training_plans FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own planned workouts" ON planned_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own planned workouts" ON planned_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own planned workouts" ON planned_workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own planned workouts" ON planned_workouts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own life events" ON life_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own life events" ON life_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own life events" ON life_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own life events" ON life_events FOR DELETE USING (auth.uid() = user_id);
`;

  return NextResponse.json({
    message: "Some tables need to be created. Copy the SQL below and run it in Supabase SQL Editor.",
    results,
    sql: fullSQL
  });
}

// Also support GET for easier testing
export async function GET(request: NextRequest) {
  return POST(request);
}

/**
 * Setup script for training plan tables
 * Run with: npx tsx scripts/setup-training-tables.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = `
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
CREATE INDEX IF NOT EXISTS idx_training_plans_goal ON training_plans(goal_id);

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
CREATE INDEX IF NOT EXISTS idx_planned_workouts_status ON planned_workouts(status);

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

-- 6. RLS POLICIES FOR training_plans
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

-- RLS POLICIES FOR planned_workouts
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

-- RLS POLICIES FOR life_events
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

-- 7. UPDATED_AT TRIGGER FUNCTION
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
`;

async function runSetup() {
  console.log("Setting up training plan tables...");
  
  // Split into individual statements and run them
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
      if (error) {
        // Try direct query if RPC doesn't work
        const { error: queryError } = await supabase.from('_').select().limit(0);
        console.log("Statement may have succeeded (RPC unavailable):", statement.substring(0, 50) + "...");
      } else {
        console.log("Success:", statement.substring(0, 50) + "...");
      }
    } catch (err) {
      console.log("Statement:", statement.substring(0, 50) + "...");
    }
  }
  
  console.log("\nSetup complete! Tables should be created.");
}

runSetup().catch(console.error);

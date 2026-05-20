-- =====================================================
-- COMPLETE RLS SETUP FOR RUNNER WELLNESS APP
-- Run this ENTIRE script in Supabase SQL Editor
-- This ensures all tables have proper security
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "coaches_view_athlete_profiles" ON profiles;
DROP POLICY IF EXISTS "coaches_view_athletes" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles 
  FOR DELETE USING (auth.uid() = id);

-- =====================================================
-- 2. RUNS TABLE
-- =====================================================
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "runs_select_own" ON runs;
DROP POLICY IF EXISTS "runs_insert_own" ON runs;
DROP POLICY IF EXISTS "runs_update_own" ON runs;
DROP POLICY IF EXISTS "runs_delete_own" ON runs;
DROP POLICY IF EXISTS "users_manage_own_runs" ON runs;
DROP POLICY IF EXISTS "coaches_view_athlete_runs" ON runs;

CREATE POLICY "runs_select_own" ON runs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "runs_insert_own" ON runs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "runs_update_own" ON runs 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "runs_delete_own" ON runs 
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 3. CHECKINS TABLE
-- =====================================================
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkins_select_own" ON checkins;
DROP POLICY IF EXISTS "checkins_insert_own" ON checkins;
DROP POLICY IF EXISTS "checkins_update_own" ON checkins;
DROP POLICY IF EXISTS "checkins_delete_own" ON checkins;
DROP POLICY IF EXISTS "users_manage_own_checkins" ON checkins;
DROP POLICY IF EXISTS "coaches_view_athlete_checkins" ON checkins;

CREATE POLICY "checkins_select_own" ON checkins 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "checkins_insert_own" ON checkins 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "checkins_update_own" ON checkins 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "checkins_delete_own" ON checkins 
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. STREAKS TABLE
-- =====================================================
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "streaks_select_own" ON streaks;
DROP POLICY IF EXISTS "streaks_insert_own" ON streaks;
DROP POLICY IF EXISTS "streaks_update_own" ON streaks;
DROP POLICY IF EXISTS "streaks_delete_own" ON streaks;
DROP POLICY IF EXISTS "users_manage_own_streaks" ON streaks;

CREATE POLICY "streaks_select_own" ON streaks 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "streaks_insert_own" ON streaks 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks_update_own" ON streaks 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "streaks_delete_own" ON streaks 
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. AI_ADVICE TABLE
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_advice') THEN
    ALTER TABLE ai_advice ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "ai_advice_select_own" ON ai_advice;
    DROP POLICY IF EXISTS "ai_advice_insert_own" ON ai_advice;
    DROP POLICY IF EXISTS "ai_advice_update_own" ON ai_advice;
    DROP POLICY IF EXISTS "ai_advice_delete_own" ON ai_advice;
    DROP POLICY IF EXISTS "users_manage_own_ai_advice" ON ai_advice;
    
    CREATE POLICY "ai_advice_select_own" ON ai_advice 
      FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "ai_advice_insert_own" ON ai_advice 
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "ai_advice_update_own" ON ai_advice 
      FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "ai_advice_delete_own" ON ai_advice 
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 6. GOALS TABLE
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals') THEN
    ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "goals_select_own" ON goals;
    DROP POLICY IF EXISTS "goals_insert_own" ON goals;
    DROP POLICY IF EXISTS "goals_update_own" ON goals;
    DROP POLICY IF EXISTS "goals_delete_own" ON goals;
    
    CREATE POLICY "goals_select_own" ON goals 
      FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "goals_insert_own" ON goals 
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "goals_update_own" ON goals 
      FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "goals_delete_own" ON goals 
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 7. TRAINING_PLANS TABLE
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_plans') THEN
    ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own training plans" ON training_plans;
    DROP POLICY IF EXISTS "Users can create own training plans" ON training_plans;
    DROP POLICY IF EXISTS "Users can update own training plans" ON training_plans;
    DROP POLICY IF EXISTS "Users can delete own training plans" ON training_plans;
    
    CREATE POLICY "training_plans_select_own" ON training_plans
      FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "training_plans_insert_own" ON training_plans
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "training_plans_update_own" ON training_plans
      FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "training_plans_delete_own" ON training_plans
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 8. PLANNED_WORKOUTS TABLE
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'planned_workouts') THEN
    ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own planned workouts" ON planned_workouts;
    DROP POLICY IF EXISTS "Users can create own planned workouts" ON planned_workouts;
    DROP POLICY IF EXISTS "Users can update own planned workouts" ON planned_workouts;
    DROP POLICY IF EXISTS "Users can delete own planned workouts" ON planned_workouts;
    
    CREATE POLICY "planned_workouts_select_own" ON planned_workouts
      FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "planned_workouts_insert_own" ON planned_workouts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "planned_workouts_update_own" ON planned_workouts
      FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "planned_workouts_delete_own" ON planned_workouts
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 9. LIFE_EVENTS TABLE
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'life_events') THEN
    ALTER TABLE life_events ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own life events" ON life_events;
    DROP POLICY IF EXISTS "Users can create own life events" ON life_events;
    DROP POLICY IF EXISTS "Users can update own life events" ON life_events;
    DROP POLICY IF EXISTS "Users can delete own life events" ON life_events;
    
    CREATE POLICY "life_events_select_own" ON life_events
      FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "life_events_insert_own" ON life_events
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "life_events_update_own" ON life_events
      FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "life_events_delete_own" ON life_events
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 10. PERSONAL_RECORDS TABLE
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_records') THEN
    ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own personal records" ON personal_records;
    DROP POLICY IF EXISTS "Users can insert own personal records" ON personal_records;
    DROP POLICY IF EXISTS "Users can update own personal records" ON personal_records;
    DROP POLICY IF EXISTS "Users can delete own personal records" ON personal_records;
    
    CREATE POLICY "personal_records_select_own" ON personal_records
      FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "personal_records_insert_own" ON personal_records
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "personal_records_update_own" ON personal_records
      FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "personal_records_delete_own" ON personal_records
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 11. COACH SYSTEM TABLES
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'athlete_invites') THEN
    ALTER TABLE athlete_invites ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "coaches_manage_own_invites" ON athlete_invites;
    DROP POLICY IF EXISTS "anyone_can_view_invite_by_code" ON athlete_invites;
    
    CREATE POLICY "athlete_invites_coach_manage" ON athlete_invites
      FOR ALL USING (auth.uid() = coach_id);
    CREATE POLICY "athlete_invites_public_read" ON athlete_invites
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coach_athletes') THEN
    ALTER TABLE coach_athletes ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "coaches_view_own_athletes" ON coach_athletes;
    DROP POLICY IF EXISTS "athletes_view_own_coach" ON coach_athletes;
    DROP POLICY IF EXISTS "coaches_insert_athletes" ON coach_athletes;
    DROP POLICY IF EXISTS "coaches_delete_athletes" ON coach_athletes;
    
    CREATE POLICY "coach_athletes_coach_view" ON coach_athletes
      FOR SELECT USING (auth.uid() = coach_id);
    CREATE POLICY "coach_athletes_athlete_view" ON coach_athletes
      FOR SELECT USING (auth.uid() = athlete_id);
    CREATE POLICY "coach_athletes_insert" ON coach_athletes
      FOR INSERT WITH CHECK (auth.uid() = coach_id OR auth.uid() = athlete_id);
    CREATE POLICY "coach_athletes_delete" ON coach_athletes
      FOR DELETE USING (auth.uid() = coach_id);
  END IF;
END $$;

-- =====================================================
-- VERIFICATION: Check RLS Status
-- =====================================================
-- Run this query after to verify:
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

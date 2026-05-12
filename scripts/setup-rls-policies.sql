-- Comprehensive RLS (Row Level Security) Policies
-- Run this in Supabase SQL Editor to secure all tables
-- This script is idempotent - safe to run multiple times

-- ============================================
-- PROFILES TABLE
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "coaches_view_athlete_profiles" ON profiles;

-- Users can view their own profile
CREATE POLICY "users_view_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for signup trigger)
CREATE POLICY "users_insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Coaches can view their athletes' profiles
CREATE POLICY "coaches_view_athlete_profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_athletes 
      WHERE coach_athletes.coach_id = auth.uid() 
      AND coach_athletes.athlete_id = profiles.id
    )
  );

-- ============================================
-- CHECKINS TABLE
-- ============================================
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_checkins" ON checkins;
DROP POLICY IF EXISTS "coaches_view_athlete_checkins" ON checkins;

-- Users can fully manage their own checkins
CREATE POLICY "users_manage_own_checkins" ON checkins
  FOR ALL USING (auth.uid() = user_id);

-- Coaches can view their athletes' checkins (read only)
CREATE POLICY "coaches_view_athlete_checkins" ON checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_athletes 
      WHERE coach_athletes.coach_id = auth.uid() 
      AND coach_athletes.athlete_id = checkins.user_id
    )
  );

-- ============================================
-- RUNS TABLE
-- ============================================
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_runs" ON runs;
DROP POLICY IF EXISTS "coaches_view_athlete_runs" ON runs;

-- Users can fully manage their own runs
CREATE POLICY "users_manage_own_runs" ON runs
  FOR ALL USING (auth.uid() = user_id);

-- Coaches can view their athletes' runs (read only)
CREATE POLICY "coaches_view_athlete_runs" ON runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_athletes 
      WHERE coach_athletes.coach_id = auth.uid() 
      AND coach_athletes.athlete_id = runs.user_id
    )
  );

-- ============================================
-- AI_ADVICE TABLE
-- ============================================
ALTER TABLE ai_advice ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_ai_advice" ON ai_advice;
DROP POLICY IF EXISTS "coaches_view_athlete_ai_advice" ON ai_advice;

-- Users can view and manage their own AI advice
CREATE POLICY "users_manage_own_ai_advice" ON ai_advice
  FOR ALL USING (auth.uid() = user_id);

-- Coaches can view their athletes' AI advice
CREATE POLICY "coaches_view_athlete_ai_advice" ON ai_advice
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_athletes 
      WHERE coach_athletes.coach_id = auth.uid() 
      AND coach_athletes.athlete_id = ai_advice.user_id
    )
  );

-- ============================================
-- STREAKS TABLE
-- ============================================
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_streaks" ON streaks;
DROP POLICY IF EXISTS "coaches_view_athlete_streaks" ON streaks;

-- Users can manage their own streaks
CREATE POLICY "users_manage_own_streaks" ON streaks
  FOR ALL USING (auth.uid() = user_id);

-- Coaches can view their athletes' streaks
CREATE POLICY "coaches_view_athlete_streaks" ON streaks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_athletes 
      WHERE coach_athletes.coach_id = auth.uid() 
      AND coach_athletes.athlete_id = streaks.user_id
    )
  );

-- ============================================
-- GOALS TABLE (if exists)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'goals') THEN
    ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "users_manage_own_goals" ON goals;
    CREATE POLICY "users_manage_own_goals" ON goals
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- REFLECTIONS TABLE (if exists)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reflections') THEN
    ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "users_manage_own_reflections" ON reflections;
    CREATE POLICY "users_manage_own_reflections" ON reflections
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- ATHLETE_INVITES TABLE
-- ============================================
ALTER TABLE athlete_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coaches_manage_own_invites" ON athlete_invites;
DROP POLICY IF EXISTS "anyone_can_view_invite_by_code" ON athlete_invites;

-- Coaches can fully manage their own invites
CREATE POLICY "coaches_manage_own_invites" ON athlete_invites
  FOR ALL USING (auth.uid() = coach_id);

-- Anyone can view an invite (needed for the join flow - invite code validates access)
CREATE POLICY "anyone_can_view_invite_by_code" ON athlete_invites
  FOR SELECT USING (true);

-- ============================================
-- COACH_ATHLETES TABLE
-- ============================================
ALTER TABLE coach_athletes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coaches_view_own_athletes" ON coach_athletes;
DROP POLICY IF EXISTS "athletes_view_own_coach" ON coach_athletes;
DROP POLICY IF EXISTS "coaches_insert_athletes" ON coach_athletes;
DROP POLICY IF EXISTS "coaches_delete_athletes" ON coach_athletes;

-- Coaches can view their athletes
CREATE POLICY "coaches_view_own_athletes" ON coach_athletes
  FOR SELECT USING (auth.uid() = coach_id);

-- Athletes can view their coach relationship
CREATE POLICY "athletes_view_own_coach" ON coach_athletes
  FOR SELECT USING (auth.uid() = athlete_id);

-- Coaches can insert relationships (when athlete accepts invite)
CREATE POLICY "coaches_insert_athletes" ON coach_athletes
  FOR INSERT WITH CHECK (auth.uid() = coach_id OR auth.uid() = athlete_id);

-- Coaches can delete relationships
CREATE POLICY "coaches_delete_athletes" ON coach_athletes
  FOR DELETE USING (auth.uid() = coach_id);

-- ============================================
-- SMS_SESSIONS TABLE (if exists)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sms_sessions') THEN
    ALTER TABLE sms_sessions ENABLE ROW LEVEL SECURITY;
    
    -- SMS sessions are managed by service role only (no user access needed)
    DROP POLICY IF EXISTS "service_role_only_sms_sessions" ON sms_sessions;
  END IF;
END $$;

-- ============================================
-- TEAMS TABLE (if exists)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'teams') THEN
    ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "users_view_own_teams" ON teams;
    CREATE POLICY "users_view_own_teams" ON teams
      FOR SELECT USING (
        auth.uid() = owner_id OR 
        auth.uid() IN (SELECT user_id FROM team_members WHERE team_id = teams.id)
      );
  END IF;
END $$;

-- ============================================
-- VERIFICATION: List all RLS-enabled tables
-- ============================================
-- Run this query to verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) SETUP FOR RUNNER WELLNESS APP
-- Run this script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "coaches_view_athletes" ON profiles;

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON profiles 
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "profiles_delete_own" ON profiles 
  FOR DELETE USING (auth.uid() = id);

-- Coaches can view their athletes' profiles
CREATE POLICY "coaches_view_athletes" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles coach 
      WHERE coach.id = auth.uid() 
      AND coach.role = 'coach'
      AND profiles.coach_id = coach.id
    )
  );

-- =====================================================
-- 2. RUNS TABLE
-- =====================================================
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "runs_select_own" ON runs;
DROP POLICY IF EXISTS "runs_insert_own" ON runs;
DROP POLICY IF EXISTS "runs_update_own" ON runs;
DROP POLICY IF EXISTS "runs_delete_own" ON runs;
DROP POLICY IF EXISTS "coaches_view_athlete_runs" ON runs;

-- Users can view their own runs
CREATE POLICY "runs_select_own" ON runs 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own runs
CREATE POLICY "runs_insert_own" ON runs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own runs
CREATE POLICY "runs_update_own" ON runs 
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own runs
CREATE POLICY "runs_delete_own" ON runs 
  FOR DELETE USING (auth.uid() = user_id);

-- Coaches can view their athletes' runs
CREATE POLICY "coaches_view_athlete_runs" ON runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles athlete 
      WHERE athlete.id = runs.user_id 
      AND athlete.coach_id = auth.uid()
    )
  );

-- =====================================================
-- 3. CHECKINS TABLE
-- =====================================================
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkins_select_own" ON checkins;
DROP POLICY IF EXISTS "checkins_insert_own" ON checkins;
DROP POLICY IF EXISTS "checkins_update_own" ON checkins;
DROP POLICY IF EXISTS "checkins_delete_own" ON checkins;
DROP POLICY IF EXISTS "coaches_view_athlete_checkins" ON checkins;

-- Users can view their own checkins
CREATE POLICY "checkins_select_own" ON checkins 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own checkins
CREATE POLICY "checkins_insert_own" ON checkins 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own checkins
CREATE POLICY "checkins_update_own" ON checkins 
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own checkins
CREATE POLICY "checkins_delete_own" ON checkins 
  FOR DELETE USING (auth.uid() = user_id);

-- Coaches can view their athletes' checkins
CREATE POLICY "coaches_view_athlete_checkins" ON checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles athlete 
      WHERE athlete.id = checkins.user_id 
      AND athlete.coach_id = auth.uid()
    )
  );

-- =====================================================
-- 4. STREAKS TABLE
-- =====================================================
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "streaks_select_own" ON streaks;
DROP POLICY IF EXISTS "streaks_insert_own" ON streaks;
DROP POLICY IF EXISTS "streaks_update_own" ON streaks;
DROP POLICY IF EXISTS "streaks_delete_own" ON streaks;

-- Users can view their own streaks
CREATE POLICY "streaks_select_own" ON streaks 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own streaks
CREATE POLICY "streaks_insert_own" ON streaks 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own streaks
CREATE POLICY "streaks_update_own" ON streaks 
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own streaks
CREATE POLICY "streaks_delete_own" ON streaks 
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. AI_ADVICE TABLE
-- =====================================================
ALTER TABLE ai_advice ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_advice_select_own" ON ai_advice;
DROP POLICY IF EXISTS "ai_advice_insert_own" ON ai_advice;
DROP POLICY IF EXISTS "ai_advice_delete_own" ON ai_advice;

-- Users can view their own AI advice
CREATE POLICY "ai_advice_select_own" ON ai_advice 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own AI advice
CREATE POLICY "ai_advice_insert_own" ON ai_advice 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own AI advice
CREATE POLICY "ai_advice_delete_own" ON ai_advice 
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. GOALS TABLE (if exists)
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals') THEN
    ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "goals_select_own" ON goals;
    DROP POLICY IF EXISTS "goals_insert_own" ON goals;
    DROP POLICY IF EXISTS "goals_update_own" ON goals;
    DROP POLICY IF EXISTS "goals_delete_own" ON goals;
    
    CREATE POLICY "goals_select_own" ON goals FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "goals_insert_own" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "goals_update_own" ON goals FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "goals_delete_own" ON goals FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 7. BUDDIES TABLE (if exists)
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buddies') THEN
    ALTER TABLE buddies ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "buddies_select_own" ON buddies;
    DROP POLICY IF EXISTS "buddies_insert_own" ON buddies;
    DROP POLICY IF EXISTS "buddies_update_own" ON buddies;
    DROP POLICY IF EXISTS "buddies_delete_own" ON buddies;
    
    -- Users can see buddies where they are user or buddy
    CREATE POLICY "buddies_select_own" ON buddies 
      FOR SELECT USING (auth.uid() = user_id OR auth.uid() = buddy_id);
    CREATE POLICY "buddies_insert_own" ON buddies 
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "buddies_update_own" ON buddies 
      FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = buddy_id);
    CREATE POLICY "buddies_delete_own" ON buddies 
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 8. INVITE_CODES TABLE (if exists)
-- =====================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invite_codes') THEN
    ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "invite_codes_select_own" ON invite_codes;
    DROP POLICY IF EXISTS "invite_codes_insert_own" ON invite_codes;
    DROP POLICY IF EXISTS "invite_codes_public_read" ON invite_codes;
    
    -- Coaches can view their own invite codes
    CREATE POLICY "invite_codes_select_own" ON invite_codes 
      FOR SELECT USING (auth.uid() = coach_id);
    
    -- Coaches can create invite codes
    CREATE POLICY "invite_codes_insert_own" ON invite_codes 
      FOR INSERT WITH CHECK (auth.uid() = coach_id);
    
    -- Anyone can read invite codes (for joining)
    CREATE POLICY "invite_codes_public_read" ON invite_codes 
      FOR SELECT USING (true);
  END IF;
END $$;

-- =====================================================
-- 9. UNIQUE CONSTRAINTS FOR EMAIL/PHONE
-- =====================================================
-- Note: Email uniqueness is handled by Supabase Auth
-- Phone uniqueness - add constraint if not exists
DO $$ 
BEGIN
  -- Add unique index on phone in profiles if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' AND indexname = 'profiles_phone_unique'
  ) THEN
    CREATE UNIQUE INDEX profiles_phone_unique ON profiles(phone) 
    WHERE phone IS NOT NULL AND phone != '';
  END IF;
END $$;

-- =====================================================
-- 10. SERVICE ROLE BYPASS
-- Note: Service role key bypasses RLS by default
-- This is needed for admin operations and triggers
-- =====================================================

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify RLS is enabled
-- =====================================================
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

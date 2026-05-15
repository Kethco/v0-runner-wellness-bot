import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  
  // Check admin key
  const adminKey = process.env.ADMIN_API_KEY || "setup-rls-2026";
  if (key !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return the RLS SQL that needs to be run
  const rlsSQL = `
-- =====================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. PROFILES TABLE
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "coaches_view_athletes" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (auth.uid() = id);

-- Coaches can view their athletes' profiles
CREATE POLICY "coaches_view_athletes" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles coach 
    WHERE coach.id = auth.uid() 
    AND coach.role = 'coach'
    AND profiles.coach_id = coach.id
  )
);

-- 2. RUNS TABLE
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "runs_select_own" ON runs;
DROP POLICY IF EXISTS "runs_insert_own" ON runs;
DROP POLICY IF EXISTS "runs_update_own" ON runs;
DROP POLICY IF EXISTS "runs_delete_own" ON runs;
DROP POLICY IF EXISTS "coaches_view_athlete_runs" ON runs;

CREATE POLICY "runs_select_own" ON runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "runs_insert_own" ON runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "runs_update_own" ON runs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "runs_delete_own" ON runs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "coaches_view_athlete_runs" ON runs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles athlete 
    WHERE athlete.id = runs.user_id 
    AND athlete.coach_id = auth.uid()
  )
);

-- 3. CHECKINS TABLE
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkins_select_own" ON checkins;
DROP POLICY IF EXISTS "checkins_insert_own" ON checkins;
DROP POLICY IF EXISTS "checkins_update_own" ON checkins;
DROP POLICY IF EXISTS "checkins_delete_own" ON checkins;
DROP POLICY IF EXISTS "coaches_view_athlete_checkins" ON checkins;

CREATE POLICY "checkins_select_own" ON checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "checkins_insert_own" ON checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "checkins_update_own" ON checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "checkins_delete_own" ON checkins FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "coaches_view_athlete_checkins" ON checkins FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles athlete 
    WHERE athlete.id = checkins.user_id 
    AND athlete.coach_id = auth.uid()
  )
);

-- 4. STREAKS TABLE
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "streaks_select_own" ON streaks;
DROP POLICY IF EXISTS "streaks_insert_own" ON streaks;
DROP POLICY IF EXISTS "streaks_update_own" ON streaks;
DROP POLICY IF EXISTS "streaks_delete_own" ON streaks;

CREATE POLICY "streaks_select_own" ON streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "streaks_insert_own" ON streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "streaks_update_own" ON streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "streaks_delete_own" ON streaks FOR DELETE USING (auth.uid() = user_id);

-- 5. AI_ADVICE TABLE
ALTER TABLE ai_advice ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_advice_select_own" ON ai_advice;
DROP POLICY IF EXISTS "ai_advice_insert_own" ON ai_advice;
DROP POLICY IF EXISTS "ai_advice_delete_own" ON ai_advice;

CREATE POLICY "ai_advice_select_own" ON ai_advice FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_advice_insert_own" ON ai_advice FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_advice_delete_own" ON ai_advice FOR DELETE USING (auth.uid() = user_id);

-- 6. Add unique constraint on phone (prevent duplicate phone signups)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique ON profiles(phone) 
  WHERE phone IS NOT NULL AND phone != '';

-- Done! Verify with:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
`;

  return NextResponse.json({
    message: "Copy and run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)",
    sql: rlsSQL,
  });
}

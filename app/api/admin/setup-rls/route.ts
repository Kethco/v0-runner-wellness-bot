import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  // Verify user is admin via session
  const authSupabase = await createServerClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await authSupabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
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

-- 6. TRAINING_PLANS TABLE
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "training_plans_select_own" ON training_plans;
DROP POLICY IF EXISTS "training_plans_insert_own" ON training_plans;
DROP POLICY IF EXISTS "training_plans_update_own" ON training_plans;
DROP POLICY IF EXISTS "training_plans_delete_own" ON training_plans;

CREATE POLICY "training_plans_select_own" ON training_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "training_plans_insert_own" ON training_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "training_plans_update_own" ON training_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "training_plans_delete_own" ON training_plans FOR DELETE USING (auth.uid() = user_id);

-- 7. WORKOUTS TABLE
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workouts_select_own" ON workouts;
DROP POLICY IF EXISTS "workouts_insert_own" ON workouts;
DROP POLICY IF EXISTS "workouts_update_own" ON workouts;
DROP POLICY IF EXISTS "workouts_delete_own" ON workouts;

CREATE POLICY "workouts_select_own" ON workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workouts_insert_own" ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "workouts_update_own" ON workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "workouts_delete_own" ON workouts FOR DELETE USING (auth.uid() = user_id);

-- 8. LIFE_EVENTS TABLE
ALTER TABLE life_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "life_events_select_own" ON life_events;
DROP POLICY IF EXISTS "life_events_insert_own" ON life_events;
DROP POLICY IF EXISTS "life_events_update_own" ON life_events;
DROP POLICY IF EXISTS "life_events_delete_own" ON life_events;

CREATE POLICY "life_events_select_own" ON life_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "life_events_insert_own" ON life_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "life_events_update_own" ON life_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "life_events_delete_own" ON life_events FOR DELETE USING (auth.uid() = user_id);

-- 9. GOALS TABLE
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goals_select_own" ON goals;
DROP POLICY IF EXISTS "goals_insert_own" ON goals;
DROP POLICY IF EXISTS "goals_update_own" ON goals;
DROP POLICY IF EXISTS "goals_delete_own" ON goals;

CREATE POLICY "goals_select_own" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert_own" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update_own" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goals_delete_own" ON goals FOR DELETE USING (auth.uid() = user_id);

-- 10. SHOES TABLE
ALTER TABLE shoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shoes_select_own" ON shoes;
DROP POLICY IF EXISTS "shoes_insert_own" ON shoes;
DROP POLICY IF EXISTS "shoes_update_own" ON shoes;
DROP POLICY IF EXISTS "shoes_delete_own" ON shoes;

CREATE POLICY "shoes_select_own" ON shoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shoes_insert_own" ON shoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shoes_update_own" ON shoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "shoes_delete_own" ON shoes FOR DELETE USING (auth.uid() = user_id);

-- 11. PERSONAL_RECORDS TABLE
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "personal_records_select_own" ON personal_records;
DROP POLICY IF EXISTS "personal_records_insert_own" ON personal_records;
DROP POLICY IF EXISTS "personal_records_update_own" ON personal_records;
DROP POLICY IF EXISTS "personal_records_delete_own" ON personal_records;

CREATE POLICY "personal_records_select_own" ON personal_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "personal_records_insert_own" ON personal_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "personal_records_update_own" ON personal_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "personal_records_delete_own" ON personal_records FOR DELETE USING (auth.uid() = user_id);

-- 12. RESILIENCE_JOURNAL TABLE
ALTER TABLE resilience_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resilience_journal_select_own" ON resilience_journal;
DROP POLICY IF EXISTS "resilience_journal_insert_own" ON resilience_journal;
DROP POLICY IF EXISTS "resilience_journal_update_own" ON resilience_journal;
DROP POLICY IF EXISTS "resilience_journal_delete_own" ON resilience_journal;

CREATE POLICY "resilience_journal_select_own" ON resilience_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "resilience_journal_insert_own" ON resilience_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "resilience_journal_update_own" ON resilience_journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "resilience_journal_delete_own" ON resilience_journal FOR DELETE USING (auth.uid() = user_id);

-- 13. REFLECTIONS TABLE
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reflections_select_own" ON reflections;
DROP POLICY IF EXISTS "reflections_insert_own" ON reflections;
DROP POLICY IF EXISTS "reflections_update_own" ON reflections;
DROP POLICY IF EXISTS "reflections_delete_own" ON reflections;

CREATE POLICY "reflections_select_own" ON reflections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reflections_insert_own" ON reflections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reflections_update_own" ON reflections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reflections_delete_own" ON reflections FOR DELETE USING (auth.uid() = user_id);

-- 14. DAILY_INTENTIONS TABLE
ALTER TABLE daily_intentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_intentions_select_own" ON daily_intentions;
DROP POLICY IF EXISTS "daily_intentions_insert_own" ON daily_intentions;
DROP POLICY IF EXISTS "daily_intentions_update_own" ON daily_intentions;
DROP POLICY IF EXISTS "daily_intentions_delete_own" ON daily_intentions;

CREATE POLICY "daily_intentions_select_own" ON daily_intentions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_intentions_insert_own" ON daily_intentions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_intentions_update_own" ON daily_intentions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "daily_intentions_delete_own" ON daily_intentions FOR DELETE USING (auth.uid() = user_id);

-- 15. AI_COACH_MESSAGES TABLE
ALTER TABLE ai_coach_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_coach_messages_select_own" ON ai_coach_messages;
DROP POLICY IF EXISTS "ai_coach_messages_insert_own" ON ai_coach_messages;
DROP POLICY IF EXISTS "ai_coach_messages_delete_own" ON ai_coach_messages;

CREATE POLICY "ai_coach_messages_select_own" ON ai_coach_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_coach_messages_insert_own" ON ai_coach_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_coach_messages_delete_own" ON ai_coach_messages FOR DELETE USING (auth.uid() = user_id);

-- 16. ACCOUNTABILITY_BUDDIES TABLE
ALTER TABLE accountability_buddies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accountability_buddies_select_own" ON accountability_buddies;
DROP POLICY IF EXISTS "accountability_buddies_insert_own" ON accountability_buddies;
DROP POLICY IF EXISTS "accountability_buddies_update_own" ON accountability_buddies;
DROP POLICY IF EXISTS "accountability_buddies_delete_own" ON accountability_buddies;

CREATE POLICY "accountability_buddies_select_own" ON accountability_buddies FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = buddy_id);
CREATE POLICY "accountability_buddies_insert_own" ON accountability_buddies FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accountability_buddies_update_own" ON accountability_buddies FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() = buddy_id);
CREATE POLICY "accountability_buddies_delete_own" ON accountability_buddies FOR DELETE 
  USING (auth.uid() = user_id);

-- 17. JOURNAL TABLE
ALTER TABLE journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_select_own" ON journal;
DROP POLICY IF EXISTS "journal_insert_own" ON journal;
DROP POLICY IF EXISTS "journal_update_own" ON journal;
DROP POLICY IF EXISTS "journal_delete_own" ON journal;

CREATE POLICY "journal_select_own" ON journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "journal_insert_own" ON journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_update_own" ON journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "journal_delete_own" ON journal FOR DELETE USING (auth.uid() = user_id);

-- 18. Add unique constraint on phone (prevent duplicate phone signups)
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

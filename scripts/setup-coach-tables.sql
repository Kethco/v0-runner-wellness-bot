-- Run this SQL in your Supabase SQL Editor to set up coach tables
-- Go to: https://supabase.com/dashboard > Your Project > SQL Editor > New Query

-- 1. Create athlete_invites table
CREATE TABLE IF NOT EXISTS athlete_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_name TEXT NOT NULL,
  athlete_email TEXT,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_athlete_invites_coach ON athlete_invites(coach_id);
CREATE INDEX IF NOT EXISTS idx_athlete_invites_code ON athlete_invites(invite_code);

-- 2. Create coach_athletes table (links coaches to their athletes)
CREATE TABLE IF NOT EXISTS coach_athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, athlete_id)
);

CREATE INDEX IF NOT EXISTS idx_coach_athletes_coach ON coach_athletes(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_athletes_athlete ON coach_athletes(athlete_id);

-- 3. Ensure profiles table has role column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'athlete';
  END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE athlete_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_athletes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for athlete_invites
DROP POLICY IF EXISTS "Coaches can view their own invites" ON athlete_invites;
CREATE POLICY "Coaches can view their own invites" ON athlete_invites
  FOR SELECT USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can insert invites" ON athlete_invites;
CREATE POLICY "Coaches can insert invites" ON athlete_invites
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can delete their own invites" ON athlete_invites;
CREATE POLICY "Coaches can delete their own invites" ON athlete_invites
  FOR DELETE USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Anyone can view invite by code" ON athlete_invites;
CREATE POLICY "Anyone can view invite by code" ON athlete_invites
  FOR SELECT USING (true);

-- 6. RLS Policies for coach_athletes
DROP POLICY IF EXISTS "Coaches can view their athletes" ON coach_athletes;
CREATE POLICY "Coaches can view their athletes" ON coach_athletes
  FOR SELECT USING (auth.uid() = coach_id OR auth.uid() = athlete_id);

DROP POLICY IF EXISTS "Can insert coach_athletes" ON coach_athletes;
CREATE POLICY "Can insert coach_athletes" ON coach_athletes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Coaches can delete their athletes" ON coach_athletes;
CREATE POLICY "Coaches can delete their athletes" ON coach_athletes
  FOR DELETE USING (auth.uid() = coach_id);

-- Done!
SELECT 'Coach tables created successfully!' as result;

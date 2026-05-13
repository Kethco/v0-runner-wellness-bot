-- Coach System Database Schema
-- Run this in Supabase SQL Editor

-- Add role column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'athlete' CHECK (role IN ('athlete', 'coach', 'admin'));

-- Add coach_id column for athletes invited by a coach (links to their coach's subscription)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Update plan check to include coach_athlete (athletes covered by coach subscription)
-- Plans: free_trial, coach_trial, pro, coach_pro, coach_athlete
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check 
  CHECK (plan IN ('free_trial', 'coach_trial', 'pro', 'coach_pro', 'coach_athlete'));

-- Create athlete_invites table for tracking invitations
CREATE TABLE IF NOT EXISTS athlete_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_name TEXT NOT NULL,
  athlete_email TEXT,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  athlete_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create coach_athletes relationship table
CREATE TABLE IF NOT EXISTS coach_athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_id UUID REFERENCES athlete_invites(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, athlete_id)
);

-- Enable RLS on new tables
ALTER TABLE athlete_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_athletes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for athlete_invites
-- Coaches can manage their own invites
CREATE POLICY "coaches_manage_own_invites" ON athlete_invites
  FOR ALL USING (auth.uid() = coach_id);

-- Anyone can view an invite by code (for accepting)
CREATE POLICY "anyone_can_view_invite_by_code" ON athlete_invites
  FOR SELECT USING (true);

-- RLS Policies for coach_athletes
-- Coaches can view their athletes
CREATE POLICY "coaches_view_own_athletes" ON coach_athletes
  FOR SELECT USING (auth.uid() = coach_id);

-- Athletes can view their coach relationship
CREATE POLICY "athletes_view_own_coach" ON coach_athletes
  FOR SELECT USING (auth.uid() = athlete_id);

-- Coaches can insert relationships
CREATE POLICY "coaches_insert_athletes" ON coach_athletes
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

-- Coaches can delete relationships
CREATE POLICY "coaches_delete_athletes" ON coach_athletes
  FOR DELETE USING (auth.uid() = coach_id);

-- Update profiles RLS to allow coaches to view their athletes' profiles
CREATE POLICY "coaches_view_athlete_profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_athletes 
      WHERE coach_athletes.coach_id = auth.uid() 
      AND coach_athletes.athlete_id = profiles.id
    )
  );

-- Allow coaches to view their athletes' checkins
CREATE POLICY "coaches_view_athlete_checkins" ON checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_athletes 
      WHERE coach_athletes.coach_id = auth.uid() 
      AND coach_athletes.athlete_id = checkins.user_id
    )
  );

-- Allow coaches to view their athletes' runs
CREATE POLICY "coaches_view_athlete_runs" ON runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_athletes 
      WHERE coach_athletes.coach_id = auth.uid() 
      AND coach_athletes.athlete_id = runs.user_id
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_athlete_invites_coach ON athlete_invites(coach_id);
CREATE INDEX IF NOT EXISTS idx_athlete_invites_code ON athlete_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_coach_athletes_coach ON coach_athletes(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_athletes_athlete ON coach_athletes(athlete_id);

-- Update the profile trigger to set role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_coach_id UUID;
BEGIN
  -- Get coach_id from metadata if this is a coach-invited athlete
  v_coach_id := (NEW.raw_user_meta_data ->> 'coach_id')::UUID;
  
  INSERT INTO public.profiles (id, first_name, last_name, email, phone, role, plan, coach_id, notification_morning, trial_ends_at, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', NEW.raw_user_meta_data ->> 'user_type', 'athlete'),
    COALESCE(NEW.raw_user_meta_data ->> 'plan', 'free_trial'),
    v_coach_id,
    TRUE, -- Enable morning SMS by default for new users
    -- Athletes invited by coach don't have trial expiration (coach pays)
    CASE WHEN NEW.raw_user_meta_data ->> 'plan' = 'coach_athlete' THEN NULL ELSE NOW() + INTERVAL '7 days' END,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = COALESCE(EXCLUDED.role, profiles.role),
    plan = COALESCE(EXCLUDED.plan, profiles.plan),
    coach_id = COALESCE(EXCLUDED.coach_id, profiles.coach_id),
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), profiles.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), profiles.last_name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), profiles.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix existing users: enable morning notifications if not explicitly set
-- This ensures all existing users with phones will receive SMS reminders
UPDATE profiles 
SET notification_morning = TRUE 
WHERE notification_morning IS NULL AND phone IS NOT NULL;

-- Phone Verification Table for OTP
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);

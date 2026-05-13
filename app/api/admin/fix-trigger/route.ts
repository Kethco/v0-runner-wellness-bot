import { NextRequest, NextResponse } from "next/server";

// This endpoint provides SQL to fix the database trigger
// The trigger is failing because it references columns that don't exist

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== "fix-runner-2026") {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  const fixSQL = `
-- First, disable the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a simpler trigger that only inserts essential columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, phone, role, plan, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', NEW.raw_user_meta_data ->> 'user_type', 'athlete'),
    COALESCE(NEW.raw_user_meta_data ->> 'plan', 'free_trial'),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

  return NextResponse.json({
    message: "Run this SQL in your Supabase SQL Editor to fix the trigger",
    sql: fixSQL,
    instructions: [
      "1. Go to your Supabase Dashboard (https://supabase.com/dashboard)",
      "2. Select your project",
      "3. Click 'SQL Editor' in the left sidebar",
      "4. Click 'New Query'",
      "5. Paste the SQL below and click 'Run'",
    ]
  });
}

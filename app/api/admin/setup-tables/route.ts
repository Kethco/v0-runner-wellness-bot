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

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results: { table: string; status: string; error?: string }[] = [];

  // Create phone_verifications table
  try {
    // First check if table exists by trying to select from it
    const { error: checkError } = await supabase
      .from("phone_verifications")
      .select("id")
      .limit(1);
    
    if (checkError && checkError.code === "42P01") {
      // Table doesn't exist - we need to create it via raw SQL
      // Since we can't run DDL directly, we'll use a workaround
      // Create via the REST API by inserting a test row (will fail but might trigger creation)
      
      // Actually, let's just report what needs to be done
      results.push({
        table: "phone_verifications",
        status: "needs_creation",
        error: "Table does not exist. Please create it manually in Supabase SQL Editor."
      });
    } else if (checkError) {
      results.push({
        table: "phone_verifications",
        status: "error",
        error: checkError.message
      });
    } else {
      results.push({
        table: "phone_verifications",
        status: "exists"
      });
    }
  } catch (e) {
    results.push({
      table: "phone_verifications",
      status: "error",
      error: String(e)
    });
  }

  // Check if profiles table has required columns
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, notification_morning, coach_id")
      .limit(1);
    
    if (error) {
      results.push({
        table: "profiles",
        status: "error",
        error: error.message
      });
    } else {
      results.push({
        table: "profiles",
        status: "exists"
      });
    }
  } catch (e) {
    results.push({
      table: "profiles",
      status: "error", 
      error: String(e)
    });
  }

  // Provide the SQL that needs to be run
  const sqlToRun = `
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Create phone_verifications table
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
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);

-- 2. Add missing columns to profiles (if needed)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_morning BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS program_name TEXT;

-- 3. Fix existing users notification settings
UPDATE profiles SET notification_morning = TRUE WHERE notification_morning IS NULL AND phone IS NOT NULL;
`;

  return NextResponse.json({
    results,
    message: "Table check complete. If any tables need creation, run the SQL below in Supabase SQL Editor.",
    sql: sqlToRun
  });
}

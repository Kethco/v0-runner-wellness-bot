import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    return NextResponse.json({ error: "No database connection string" }, { status: 500 });
  }

  try {
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    // Create all required tables
    const results: string[] = [];

    // 1. athlete_invites table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS athlete_invites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        coach_id UUID NOT NULL,
        athlete_name TEXT NOT NULL,
        athlete_email TEXT,
        invite_code TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        accepted_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_athlete_invites_coach ON athlete_invites(coach_id);
      CREATE INDEX IF NOT EXISTS idx_athlete_invites_code ON athlete_invites(invite_code);
    `);
    results.push("athlete_invites table created");

    // 2. coach_athletes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coach_athletes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        coach_id UUID NOT NULL,
        athlete_id UUID NOT NULL,
        connected_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(coach_id, athlete_id)
      );
      CREATE INDEX IF NOT EXISTS idx_coach_athletes_coach ON coach_athletes(coach_id);
      CREATE INDEX IF NOT EXISTS idx_coach_athletes_athlete ON coach_athletes(athlete_id);
    `);
    results.push("coach_athletes table created");

    // 3. sms_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sms_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone TEXT UNIQUE NOT NULL,
        user_id UUID,
        current_step TEXT,
        session_data JSONB DEFAULT '{}',
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sms_sessions_phone ON sms_sessions(phone);
    `);
    results.push("sms_sessions table created");

    // 4. streaks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS streaks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_checkin_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);
    `);
    results.push("streaks table created");

    // 5. ai_advice table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_advice (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        checkin_id UUID,
        advice TEXT NOT NULL,
        source TEXT DEFAULT 'app',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_advice_user ON ai_advice(user_id);
    `);
    results.push("ai_advice table created");

    // 6. checkins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        sleep_rating INTEGER,
        feeling TEXT,
        energy INTEGER,
        soreness INTEGER,
        readiness INTEGER,
        notes TEXT,
        is_afternoon_update BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, date);
    `);
    results.push("checkins table created");

    // 7. runs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        miles DECIMAL(5,2) NOT NULL,
        pace TEXT,
        duration_minutes INTEGER,
        feeling TEXT,
        source TEXT DEFAULT 'app',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_runs_user_date ON runs(user_id, date);
    `);
    results.push("runs table created");

    // 8. Ensure profiles has role column
    await pool.query(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'athlete';
    `);
    results.push("profiles.role column ensured");

    await pool.end();

    return NextResponse.json({ 
      success: true, 
      message: "All tables created successfully",
      results 
    });
  } catch (error) {
    console.error("Database setup error:", error);
    return NextResponse.json({ 
      error: "Failed to setup database",
      details: String(error)
    }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Pool } from "pg";

// Get direct Postgres connection (bypasses Supabase schema cache issues)
function getPool() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("No database connection string");
  return new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
}

// Ensure required tables exist
async function ensureTablesExist(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS athlete_invites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      coach_id UUID NOT NULL,
      athlete_name TEXT NOT NULL,
      athlete_email TEXT,
      invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      accepted_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_athlete_invites_coach ON athlete_invites(coach_id);
    CREATE INDEX IF NOT EXISTS idx_athlete_invites_code ON athlete_invites(invite_code);
  `);
  
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
}

// GET - Fetch all pending invites for a coach
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = getPool();
  
  try {
    await ensureTablesExist(pool);
    
    const result = await pool.query(
      `SELECT * FROM athlete_invites WHERE coach_id = $1 ORDER BY created_at DESC`,
      [user.id]
    );
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.runnerwellnessapp.com";
    const invitesWithUrls = result.rows.map(invite => ({
      ...invite,
      inviteUrl: `${baseUrl}/join/${invite.invite_code}`,
    }));

    return NextResponse.json({ invites: invitesWithUrls });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 });
  } finally {
    await pool.end();
  }
}

// POST - Create new invites (bulk)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is a coach
  const userMetadata = user.user_metadata;
  const isCoach = userMetadata?.role === "coach" || userMetadata?.user_type === "coach";
    
  if (!isCoach) {
    // Also check profile table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (profile?.role !== "coach") {
      return NextResponse.json({ error: "Not a coach" }, { status: 403 });
    }
  }

  const { athletes } = await request.json();
  
  if (!athletes || !Array.isArray(athletes) || athletes.length === 0) {
    return NextResponse.json({ error: "Athletes array required" }, { status: 400 });
  }

  const pool = getPool();
  
  try {
    await ensureTablesExist(pool);
    
    // Check athlete limit
    const countResult = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM coach_athletes WHERE coach_id = $1) as connected,
        (SELECT COUNT(*) FROM athlete_invites WHERE coach_id = $1 AND status = 'pending') as pending`,
      [user.id]
    );
    
    const existingCount = parseInt(countResult.rows[0]?.connected || 0);
    const pendingCount = parseInt(countResult.rows[0]?.pending || 0);
    const totalAthletes = existingCount + pendingCount + athletes.length;
    
    const athleteLimit = 30;
    if (totalAthletes > athleteLimit) {
      return NextResponse.json({ 
        error: `Athlete limit exceeded. You can have up to ${athleteLimit} athletes.` 
      }, { status: 400 });
    }

    // Create invites
    const createdInvites = [];
    for (const athlete of athletes) {
      const result = await pool.query(
        `INSERT INTO athlete_invites (coach_id, athlete_name, athlete_email, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING *`,
        [user.id, athlete.name.trim(), athlete.email?.trim() || null]
      );
      createdInvites.push(result.rows[0]);
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.runnerwellnessapp.com";
    const invitesWithUrls = createdInvites.map(invite => ({
      ...invite,
      inviteUrl: `${baseUrl}/join/${invite.invite_code}`,
    }));

    return NextResponse.json({ invites: invitesWithUrls });
  } catch (error) {
    console.error("Error creating invites:", error);
    return NextResponse.json({ error: "Failed to create invites" }, { status: 500 });
  } finally {
    await pool.end();
  }
}

// DELETE - Cancel an invite
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const inviteId = searchParams.get("inviteId");

  if (!inviteId) {
    return NextResponse.json({ error: "Invite ID required" }, { status: 400 });
  }

  const pool = getPool();
  
  try {
    await pool.query(
      `DELETE FROM athlete_invites WHERE id = $1 AND coach_id = $2`,
      [inviteId, user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invite:", error);
    return NextResponse.json({ error: "Failed to delete invite" }, { status: 500 });
  } finally {
    await pool.end();
  }
}

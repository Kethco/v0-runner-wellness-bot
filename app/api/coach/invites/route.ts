import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Admin client with service role for bypassing RLS
const supabaseAdmin = createAdminClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check if user is a coach
function isCoach(user: { user_metadata?: { role?: string; user_type?: string } }): boolean {
  return user.user_metadata?.role === "coach" || user.user_metadata?.user_type === "coach";
}

// GET - Fetch all pending invites for a coach
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCoach(user)) {
    return NextResponse.json({ error: "Not a coach" }, { status: 403 });
  }

  try {
    const { data: invites, error } = await supabaseAdmin
      .from("athlete_invites")
      .select("*")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      // Table doesn't exist - return empty array
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.code === "PGRST204") {
        return NextResponse.json({ invites: [], tableNotExists: true });
      }
      console.error("Error fetching invites:", error);
      return NextResponse.json({ invites: [] });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.runnerwellnessapp.com";
    const invitesWithUrls = (invites || []).map(invite => ({
      ...invite,
      inviteUrl: `${baseUrl}/join/${invite.invite_code}`,
    }));

    return NextResponse.json({ invites: invitesWithUrls });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json({ invites: [] });
  }
}

// POST - Create new invites (bulk)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCoach(user)) {
    return NextResponse.json({ error: "Not a coach" }, { status: 403 });
  }

  try {
    const { athletes } = await request.json();

    if (!athletes || !Array.isArray(athletes) || athletes.length === 0) {
      return NextResponse.json({ error: "No athletes provided" }, { status: 400 });
    }

    // Create invite records with generated codes
    const inviteRecords = athletes.map((athlete: { name: string; email?: string }) => ({
      coach_id: user.id,
      athlete_name: athlete.name.trim(),
      athlete_email: athlete.email?.trim() || null,
      invite_code: generateInviteCode(),
      status: "pending",
    }));

    const { data: createdInvites, error } = await supabaseAdmin
      .from("athlete_invites")
      .insert(inviteRecords)
      .select();

    if (error) {
      console.error("Insert error:", error);
      
      // If table doesn't exist, provide helpful message
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ 
          error: "Database setup required. Please run the setup script.",
          setupRequired: true 
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: "Failed to create invites" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.runnerwellnessapp.com";
    const invitesWithUrls = (createdInvites || []).map(invite => ({
      ...invite,
      inviteUrl: `${baseUrl}/join/${invite.invite_code}`,
    }));

    return NextResponse.json({ invites: invitesWithUrls });
  } catch (error) {
    console.error("Error creating invites:", error);
    return NextResponse.json({ error: "Failed to create invites" }, { status: 500 });
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

  try {
    const { error } = await supabaseAdmin
      .from("athlete_invites")
      .delete()
      .eq("id", inviteId)
      .eq("coach_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invite:", error);
    return NextResponse.json({ error: "Failed to delete invite" }, { status: 500 });
  }
}

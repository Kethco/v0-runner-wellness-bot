import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Admin client bypasses RLS policies (fixes infinite recursion in teams policy)
const supabaseAdmin = createAdminClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate a random 6-character invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET - Fetch pending invites for the coach's team
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get coach's team (use admin to bypass RLS)
  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("id, name, invite_code")
    .eq("coach_id", user.id)
    .single();

  if (!team) {
    return NextResponse.json({ invites: [], team: null });
  }

  // Get pending invites for this team
  const { data: invites, error } = await supabaseAdmin
    .from("team_invites")
    .select("*")
    .eq("team_id", team.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json({ invites: [], team });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.runnerwellnessapp.com";
  const invitesWithUrls = (invites || []).map(invite => ({
    ...invite,
    invite_code: team.invite_code,
    inviteUrl: `${baseUrl}/join?code=${team.invite_code}`,
  }));

  return NextResponse.json({ invites: invitesWithUrls, team });
}

// POST - Create new invites (bulk) for athletes
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { athletes } = await request.json();

  if (!athletes || !Array.isArray(athletes) || athletes.length === 0) {
    return NextResponse.json({ error: "Athlete names are required" }, { status: 400 });
  }

  // Get or create coach's team (use admin to bypass RLS)
  let { data: team } = await supabaseAdmin
    .from("teams")
    .select("id, name, invite_code")
    .eq("coach_id", user.id)
    .single();

  if (!team) {
    // Create a default team for the coach
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const teamName = profile?.last_name 
      ? `${profile.last_name}'s Team` 
      : "My Team";

    const { data: newTeam, error: createError } = await supabaseAdmin
      .from("teams")
      .insert({
        coach_id: user.id,
        name: teamName,
        invite_code: generateInviteCode(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating team:", createError);
      return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }

    team = newTeam;
  }

  // Create invite records for each athlete
  const inviteRecords = athletes.map((athlete: { name: string; email?: string }) => ({
    team_id: team!.id,
    athlete_name: athlete.name.trim(),
    email: athlete.email?.trim() || null,
    status: "pending",
  }));

  const { data: createdInvites, error: insertError } = await supabaseAdmin
    .from("team_invites")
    .insert(inviteRecords)
    .select();

  if (insertError) {
    console.error("Insert error:", insertError);
    return NextResponse.json({ error: "Failed to create invites" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.runnerwellnessapp.com";
  const invitesWithUrls = (createdInvites || []).map(invite => ({
    ...invite,
    invite_code: team!.invite_code,
    inviteUrl: `${baseUrl}/join?code=${team!.invite_code}`,
  }));

  return NextResponse.json({ 
    invites: invitesWithUrls,
    team,
  });
}

// DELETE - Remove an invite
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const inviteId = searchParams.get("id") || searchParams.get("inviteId");

  if (!inviteId) {
    return NextResponse.json({ error: "Invite ID required" }, { status: 400 });
  }

  // Verify the invite belongs to coach's team (use admin to bypass RLS)
  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("id")
    .eq("coach_id", user.id)
    .single();

  if (!team) {
    return NextResponse.json({ error: "No team found" }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from("team_invites")
    .delete()
    .eq("id", inviteId)
    .eq("team_id", team.id);

  if (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete invite" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

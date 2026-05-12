import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Validate an invite code and return invite details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();
  
  // Get invite details
  const { data: invite, error } = await supabase
    .from("athlete_invites")
    .select(`
      id,
      athlete_name,
      status,
      expires_at,
      coach:profiles!athlete_invites_coach_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq("invite_code", code)
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  // Check if expired
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  // Check if already used
  if (invite.status === "accepted") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  }

  const coach = invite.coach as { id: string; first_name: string; last_name: string } | null;

  return NextResponse.json({
    invite: {
      id: invite.id,
      athleteName: invite.athlete_name,
      coachName: coach ? `${coach.first_name || ""} ${coach.last_name || ""}`.trim() : "Your Coach",
      coachId: coach?.id,
    }
  });
}

// POST - Accept an invite (after user signs up)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Must be logged in to accept invite" }, { status: 401 });
  }

  // Get invite
  const { data: invite, error: inviteError } = await supabase
    .from("athlete_invites")
    .select("id, coach_id, status, expires_at")
    .eq("invite_code", code)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  if (invite.status === "accepted") {
    return NextResponse.json({ error: "Invite already used" }, { status: 410 });
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }

  // Update invite status
  const { error: updateError } = await supabase
    .from("athlete_invites")
    .update({ 
      status: "accepted", 
      athlete_id: user.id,
      accepted_at: new Date().toISOString()
    })
    .eq("id", invite.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Create coach-athlete relationship
  const { error: relationError } = await supabase
    .from("coach_athletes")
    .insert({
      coach_id: invite.coach_id,
      athlete_id: user.id,
      invite_id: invite.id,
    });

  if (relationError) {
    // If already exists, that's fine
    if (!relationError.message.includes("duplicate")) {
      return NextResponse.json({ error: relationError.message }, { status: 500 });
    }
  }

  // Ensure user profile has athlete role
  await supabase
    .from("profiles")
    .update({ role: "athlete" })
    .eq("id", user.id);

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch all pending invites for a coach
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: invites, error } = await supabase
    .from("athlete_invites")
    .select("*")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate full invite URLs
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.runnerwellnessapp.com";
  const invitesWithUrls = invites?.map(invite => ({
    ...invite,
    inviteUrl: `${baseUrl}/join/${invite.invite_code}`,
  }));

  return NextResponse.json({ invites: invitesWithUrls });
}

// POST - Create new invites (bulk)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is a coach
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  if (profile?.role !== "coach") {
    return NextResponse.json({ error: "Not a coach" }, { status: 403 });
  }

  const { athletes } = await request.json();
  
  if (!athletes || !Array.isArray(athletes) || athletes.length === 0) {
    return NextResponse.json({ error: "Athletes array required" }, { status: 400 });
  }

  // Check athlete limit based on plan (simplified - you'd check subscription)
  const { count: existingCount } = await supabase
    .from("coach_athletes")
    .select("*", { count: "exact", head: true })
    .eq("coach_id", user.id);

  const { count: pendingCount } = await supabase
    .from("athlete_invites")
    .select("*", { count: "exact", head: true })
    .eq("coach_id", user.id)
    .eq("status", "pending");

  const totalAthletes = (existingCount || 0) + (pendingCount || 0) + athletes.length;
  
  // Default limit is 30 for trial/pro, check profile for actual limit
  const athleteLimit = 30;
  if (totalAthletes > athleteLimit) {
    return NextResponse.json({ 
      error: `Athlete limit exceeded. You can have up to ${athleteLimit} athletes. Currently: ${(existingCount || 0) + (pendingCount || 0)}` 
    }, { status: 400 });
  }

  // Create invites for each athlete
  const inviteRecords = athletes.map((athlete: { name: string; email?: string }) => ({
    coach_id: user.id,
    athlete_name: athlete.name.trim(),
    athlete_email: athlete.email?.trim() || null,
    status: "pending",
  }));

  const { data: newInvites, error } = await supabase
    .from("athlete_invites")
    .insert(inviteRecords)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate full invite URLs
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.runnerwellnessapp.com";
  const invitesWithUrls = newInvites?.map(invite => ({
    ...invite,
    inviteUrl: `${baseUrl}/join/${invite.invite_code}`,
  }));

  return NextResponse.json({ invites: invitesWithUrls });
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

  const { error } = await supabase
    .from("athlete_invites")
    .delete()
    .eq("id", inviteId)
    .eq("coach_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

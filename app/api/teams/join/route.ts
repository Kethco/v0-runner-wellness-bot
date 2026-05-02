import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST - Join a team with invite code
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteCode } = await request.json();

  if (!inviteCode || inviteCode.trim().length < 4) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  }

  // Find team by invite code
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, coach_id")
    .eq("invite_code", inviteCode.toUpperCase().trim())
    .single();

  if (teamError || !team) {
    return NextResponse.json({ error: "Team not found. Check your invite code." }, { status: 404 });
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", team.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "You're already a member of this team" }, { status: 400 });
  }

  // Add user to team
  const { error: joinError } = await supabase
    .from("team_members")
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: "athlete",
    });

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 500 });
  }

  return NextResponse.json({ 
    message: `You've joined ${team.name}!`,
    team: { id: team.id, name: team.name }
  });
}

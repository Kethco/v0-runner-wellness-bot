import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Generate a random 6-character invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like 0, O, I, 1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET - Get coach's teams
export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: teams, error } = await supabase
    .from("teams")
    .select(`
      *,
      team_members (
        id,
        user_id,
        role,
        joined_at,
        profiles:user_id (
          id,
          first_name,
          last_name,
          email
        )
      )
    `)
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ teams });
}

// POST - Create a new team
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description } = await request.json();

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
  }

  // Generate unique invite code
  let inviteCode = generateInviteCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from("teams")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();
    
    if (!existing) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      coach_id: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      invite_code: inviteCode,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ team }, { status: 201 });
}

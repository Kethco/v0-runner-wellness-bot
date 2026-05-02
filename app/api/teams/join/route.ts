import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/lib/products";

// Helper to get max athletes for a coach's plan
function getMaxAthletesForPlan(plan: string | undefined): number {
  if (!plan) return 15; // Default to starter
  const product = getProduct(plan);
  return product?.maxAthletes || 15;
}

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

  // Get coach's plan to check athlete limit
  const { data: coachProfile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", team.coach_id)
    .single();

  const maxAthletes = getMaxAthletesForPlan(coachProfile?.plan);

  // Count current athletes across ALL coach's teams
  const { data: coachTeams } = await supabase
    .from("teams")
    .select("id")
    .eq("coach_id", team.coach_id);

  const teamIds = coachTeams?.map(t => t.id) || [];
  
  const { count: currentAthletes } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .in("team_id", teamIds)
    .eq("role", "athlete");

  if ((currentAthletes || 0) >= maxAthletes) {
    return NextResponse.json({ 
      error: `This coach has reached their athlete limit (${maxAthletes}). Please ask your coach to upgrade their plan.` 
    }, { status: 403 });
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

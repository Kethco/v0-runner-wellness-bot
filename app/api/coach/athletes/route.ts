import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch all athletes for a coach's team
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get coach's team with members
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, invite_code")
    .eq("coach_id", user.id)
    .single();

  if (teamError || !team) {
    // No team yet - return empty
    return NextResponse.json({ athletes: [], team: null });
  }

  // Get all team members (athletes)
  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select("id, user_id, joined_at")
    .eq("team_id", team.id);

  if (membersError) {
    console.error("Error fetching members:", membersError);
    return NextResponse.json({ athletes: [], team });
  }

  // For each member, get their profile and wellness data
  const athletesWithData = await Promise.all(
    (members || []).map(async (member) => {
      // Get athlete profile
      const { data: athlete } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone")
        .eq("id", member.user_id)
        .single();

      if (!athlete) return null;

      // Get latest checkin
      const { data: latestCheckin } = await supabase
        .from("checkins")
        .select("*")
        .eq("user_id", athlete.id)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get this week's runs
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: weeklyRuns } = await supabase
        .from("runs")
        .select("miles")
        .eq("user_id", athlete.id)
        .gte("date", weekAgo.toISOString().split("T")[0]);

      // Get streak
      const { data: streak } = await supabase
        .from("streaks")
        .select("current_streak")
        .eq("user_id", athlete.id)
        .maybeSingle();

      // Calculate risk level based on wellness metrics
      let riskLevel: "low" | "medium" | "high" = "low";
      if (latestCheckin) {
        const avgScore = (
          (latestCheckin.sleep_rating || 3) +
          (latestCheckin.energy || 3) +
          (6 - (latestCheckin.soreness || 3)) +
          (latestCheckin.readiness || 3)
        ) / 4;
        
        if (avgScore < 2.5) riskLevel = "high";
        else if (avgScore < 3.5) riskLevel = "medium";
      }

      return {
        id: athlete.id,
        name: `${athlete.first_name || ""} ${athlete.last_name || ""}`.trim() || "Unnamed Athlete",
        email: athlete.email,
        phone: athlete.phone,
        latestCheckin,
        weeklyMiles: weeklyRuns?.reduce((sum, r) => sum + Number(r.miles), 0) || 0,
        streak: streak?.current_streak || 0,
        riskLevel,
        connectedAt: member.joined_at,
      };
    })
  );

  return NextResponse.json({ 
    athletes: athletesWithData.filter(Boolean),
    team 
  });
}

// DELETE - Remove an athlete from coach's team
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const athleteId = searchParams.get("athleteId");

  if (!athleteId) {
    return NextResponse.json({ error: "Athlete ID required" }, { status: 400 });
  }

  // Get coach's team
  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("coach_id", user.id)
    .single();

  if (!team) {
    return NextResponse.json({ error: "No team found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", team.id)
    .eq("user_id", athleteId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

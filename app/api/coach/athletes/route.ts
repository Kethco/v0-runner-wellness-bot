import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch all athletes for a coach
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is a coach (check both profile and user_metadata)
  const userMetadata = user.user_metadata;
  const isCoach = userMetadata?.role === "coach" || userMetadata?.user_type === "coach";
  
  if (!isCoach) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
      
    if (profile?.role !== "coach") {
      return NextResponse.json({ error: "Not a coach" }, { status: 403 });
    }
  }

  // Get all athletes connected to this coach via coach_athletes table
  const { data: connections, error } = await supabase
    .from("coach_athletes")
    .select("id, created_at, athlete_id")
    .eq("coach_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // For each athlete, get their profile and wellness data
  const athletesWithData = await Promise.all(
    (connections || []).map(async (conn) => {
      // Get athlete profile
      const { data: athlete } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone")
        .eq("id", conn.athlete_id)
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
        connectedAt: conn.created_at,
      };
    })
  );

  return NextResponse.json({ athletes: athletesWithData.filter(Boolean) });
}

// DELETE - Remove an athlete from coach's roster
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

  const { error } = await supabase
    .from("coach_athletes")
    .delete()
    .eq("coach_id", user.id)
    .eq("athlete_id", athleteId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Admin client bypasses RLS policies
const supabaseAdmin = createAdminClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all athletes linked to this coach via coach_id in profiles
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all athletes where coach_id matches this coach
  const { data: athletes, error } = await supabaseAdmin
    .from("profiles")
    .select("id, first_name, last_name, email, phone, created_at")
    .eq("coach_id", user.id);

  if (error) {
    console.error("Error fetching athletes:", error);
    return NextResponse.json({ athletes: [] });
  }

  // For each athlete, get their wellness data
  const athletesWithData = await Promise.all(
    (athletes || []).map(async (athlete) => {
      // Get latest checkin
      const { data: latestCheckin } = await supabaseAdmin
        .from("checkins")
        .select("*")
        .eq("user_id", athlete.id)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get this week's runs
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: weeklyRuns } = await supabaseAdmin
        .from("runs")
        .select("miles")
        .eq("user_id", athlete.id)
        .gte("date", weekAgo.toISOString().split("T")[0]);

      // Get streak
      const { data: streak } = await supabaseAdmin
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
        connectedAt: athlete.created_at,
      };
    })
  );

  return NextResponse.json({ athletes: athletesWithData });
}

// DELETE - Remove athlete from coach (clear their coach_id)
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

  // Clear the coach_id for this athlete (only if they belong to this coach)
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ coach_id: null })
    .eq("id", athleteId)
    .eq("coach_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

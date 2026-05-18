import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  try {
    // Get all users and filter by coach_id in their metadata
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    const linkedAthletes = allUsers?.users?.filter(u => 
      u.user_metadata?.coach_id === user.id
    ) || [];

    // Get wellness data for each athlete
    const athletesWithData = await Promise.all(
      linkedAthletes.map(async (athlete) => {
        const { data: latestCheckin } = await supabaseAdmin
          .from("checkins")
          .select("*")
          .eq("user_id", athlete.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { data: weeklyRuns } = await supabaseAdmin
          .from("runs")
          .select("miles")
          .eq("user_id", athlete.id)
          .gte("date", weekAgo.toISOString().split("T")[0]);

        const { data: streak } = await supabaseAdmin
          .from("streaks")
          .select("current_streak")
          .eq("user_id", athlete.id)
          .maybeSingle();

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
          name: `${athlete.user_metadata?.first_name || ""} ${athlete.user_metadata?.last_name || ""}`.trim() || athlete.email?.split("@")[0] || "Athlete",
          email: athlete.email,
          latestCheckin,
          weeklyMiles: weeklyRuns?.reduce((sum, r) => sum + Number(r.miles || 0), 0) || 0,
          streak: streak?.current_streak || 0,
          riskLevel,
          connectedAt: athlete.created_at,
        };
      })
    );

    return NextResponse.json({ athletes: athletesWithData });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ athletes: [] });
  }
}

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

  try {
    await supabaseAdmin.auth.admin.updateUserById(athleteId, {
      user_metadata: { coach_id: null }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove athlete" }, { status: 500 });
  }
}

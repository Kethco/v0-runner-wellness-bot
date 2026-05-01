import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is a coach
  const { data: coachProfile } = await supabase
    .from("profiles")
    .select("is_coach")
    .eq("id", user.id)
    .single();

  if (!coachProfile?.is_coach) {
    return NextResponse.json({ error: "Not a coach" }, { status: 403 });
  }

  // Get athletes who have this coach and share data
  const { data: athletes, error } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      phone,
      privacy_mode
    `)
    .eq("coach_id", user.id)
    .eq("privacy_mode", "coach");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get latest check-in for each athlete
  const athletesWithCheckins = await Promise.all(
    (athletes || []).map(async (athlete) => {
      const { data: latestCheckin } = await supabase
        .from("checkins")
        .select("*")
        .eq("user_id", athlete.id)
        .eq("is_afternoon_update", false)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      const { data: streak } = await supabase
        .from("streaks")
        .select("current_streak")
        .eq("user_id", athlete.id)
        .single();

      return {
        ...athlete,
        latestCheckin,
        currentStreak: streak?.current_streak || 0,
      };
    })
  );

  return NextResponse.json({ athletes: athletesWithCheckins });
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch the latest AI advice for today
  const { data: advice, error } = await supabase
    .from("ai_advice")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also check if user has checked in today
  const { data: todayCheckin } = await supabase
    .from("checkins")
    .select("id, sleep_rating, energy, soreness, readiness")
    .eq("user_id", user.id)
    .eq("date", today.toISOString().split("T")[0])
    .single();

  return NextResponse.json({ 
    advice: advice?.advice || null,
    source: advice?.source || null,
    hasCheckedInToday: !!todayCheckin,
    todayCheckin: todayCheckin || null,
  });
}

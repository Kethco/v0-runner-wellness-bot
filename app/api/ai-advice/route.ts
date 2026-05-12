import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get today's date string (YYYY-MM-DD format)
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Also get 24 hours ago for timezone-safe queries
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Check if user has checked in today
  const { data: todayCheckin } = await supabase
    .from("checkins")
    .select("id, sleep_rating, energy, soreness, readiness, created_at")
    .eq("user_id", user.id)
    .eq("date", todayStr)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Find the most recent AI advice from the last 24 hours
  // This handles timezone issues where "today" might be different on server vs client
  const { data: advice } = await supabase
    .from("ai_advice")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", last24Hours)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ 
    advice: advice?.advice || null,
    source: advice?.source || null,
    hasCheckedInToday: !!todayCheckin,
    todayCheckin: todayCheckin || null,
  });
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get today's date in user's local timezone (use date string for comparison)
  const todayStr = new Date().toISOString().split("T")[0];

  // Fetch the latest AI advice for today by created_at date range
  const { data: advice, error } = await supabase
    .from("ai_advice")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", todayStr + "T00:00:00.000Z")
    .lte("created_at", todayStr + "T23:59:59.999Z")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("[v0] AI advice fetch error:", error);
  }

  // Also check if user has checked in today
  const { data: todayCheckin } = await supabase
    .from("checkins")
    .select("id, sleep_rating, energy, soreness, readiness")
    .eq("user_id", user.id)
    .eq("date", todayStr)
    .maybeSingle();

  return NextResponse.json({ 
    advice: advice?.advice || null,
    source: advice?.source || null,
    hasCheckedInToday: !!todayCheckin,
    todayCheckin: todayCheckin || null,
  });
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get client's local date from query param (YYYY-MM-DD format)
  const { searchParams } = new URL(request.url);
  const clientDate = searchParams.get("clientDate");
  
  // Use client date if provided, otherwise fall back to server date
  const todayStr = clientDate || new Date().toISOString().split("T")[0];

  // Check if user has checked in today (using client's local date)
  const { data: todayCheckin } = await supabase
    .from("checkins")
    .select("id, sleep_rating, energy, soreness, readiness, created_at, date")
    .eq("user_id", user.id)
    .eq("date", todayStr)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Find AI advice for today (using client's local date)
  // First try to find advice where the created_at date matches today
  const { data: advice } = await supabase
    .from("ai_advice")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", `${todayStr}T00:00:00`)
    .lt("created_at", `${todayStr}T23:59:59.999`)
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

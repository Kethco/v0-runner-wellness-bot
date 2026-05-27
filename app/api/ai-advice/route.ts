import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Get most recent checkin from last 24 hours
  const { data: recentCheckin } = await supabase
    .from("checkins")
    .select("id, sleep_rating, energy, soreness, readiness, created_at, date")
    .eq("user_id", user.id)
    .gte("created_at", last24Hours)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get most recent advice from last 24 hours
  const { data: recentAdvice } = await supabase
    .from("ai_advice")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", last24Hours)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ 
    advice: recentAdvice?.advice || null,
    source: recentAdvice?.source || null,
    hasCheckedInToday: !!recentCheckin,
    todayCheckin: recentCheckin || null,
  });
}

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service client to bypass RLS
  const serviceClient = createServiceClient();

  // Extend to 48 hours to handle timezone edge cases
  const last48Hours = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // Get most recent checkin from last 48 hours
  const { data: recentCheckin } = await serviceClient
    .from("checkins")
    .select("id, sleep_rating, energy, soreness, readiness, created_at, date")
    .eq("user_id", user.id)
    .gte("created_at", last48Hours)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get most recent advice from last 48 hours
  const { data: recentAdvice } = await serviceClient
    .from("ai_advice")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", last48Hours)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Check if checkin was within last 24 hours for "checked in today" status
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).getTime();
  const checkinTime = recentCheckin?.created_at ? new Date(recentCheckin.created_at).getTime() : 0;
  const checkedInRecently = checkinTime > last24Hours;

  return NextResponse.json({ 
    advice: recentAdvice?.advice || null,
    source: recentAdvice?.source || null,
    hasCheckedInToday: checkedInRecently,
    todayCheckin: recentCheckin || null,
  });
}

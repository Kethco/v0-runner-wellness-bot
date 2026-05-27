import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get client's date from query param
  const { searchParams } = new URL(request.url);
  const clientDate = searchParams.get("clientDate");
  
  // Use service client to bypass RLS
  const serviceClient = createServiceClient();

  // Get today's checkin using client's date
  let todayCheckin = null;
  
  if (clientDate) {
    // First try exact date match
    const { data: checkinByDate } = await serviceClient
      .from("checkins")
      .select("id, sleep_rating, energy, soreness, readiness, created_at, date")
      .eq("user_id", user.id)
      .eq("date", clientDate)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    todayCheckin = checkinByDate;
  }
  
  // Fallback: check within last 24 hours
  if (!todayCheckin) {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentCheckin } = await serviceClient
      .from("checkins")
      .select("id, sleep_rating, energy, soreness, readiness, created_at, date")
      .eq("user_id", user.id)
      .gte("created_at", last24Hours)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    todayCheckin = recentCheckin;
  }

  // Get advice that matches today's checkin
  let advice = null;
  
  if (todayCheckin?.id) {
    // Get advice linked to this specific checkin
    const { data: adviceByCheckin } = await serviceClient
      .from("ai_advice")
      .select("*")
      .eq("checkin_id", todayCheckin.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    advice = adviceByCheckin;
  }

  return NextResponse.json({ 
    advice: advice?.advice || null,
    source: advice?.source || null,
    hasCheckedInToday: !!todayCheckin,
    todayCheckin: todayCheckin || null,
  });
}

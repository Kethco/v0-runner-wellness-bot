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
  
  // Calculate yesterday for timezone mismatch handling
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // Check if user has checked in today (using client's local date)
  // Also check yesterday to handle timezone mismatches from old checkins
  let todayCheckin = null;
  
  // First try today's date
  const { data: checkinToday } = await supabase
    .from("checkins")
    .select("id, sleep_rating, energy, soreness, readiness, created_at, date")
    .eq("user_id", user.id)
    .eq("date", todayStr)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  todayCheckin = checkinToday;
  
  // If not found, check yesterday (timezone mismatch case)
  if (!todayCheckin) {
    const { data: checkinYesterday } = await supabase
      .from("checkins")
      .select("id, sleep_rating, energy, soreness, readiness, created_at, date")
      .eq("user_id", user.id)
      .eq("date", yesterdayStr)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Only use yesterday's checkin if it was created within last 24 hours
    if (checkinYesterday) {
      const checkinTime = new Date(checkinYesterday.created_at).getTime();
      const hoursSinceCheckin = (Date.now() - checkinTime) / (1000 * 60 * 60);
      if (hoursSinceCheckin < 24) {
        todayCheckin = checkinYesterday;
      }
    }
  }

  // Find AI advice for today's checkin (linked by checkin_id for reliability)
  let advice = null;
  if (todayCheckin?.id) {
    const { data: adviceByCheckin } = await supabase
      .from("ai_advice")
      .select("*")
      .eq("checkin_id", todayCheckin.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    advice = adviceByCheckin;
  }
  
  // Fallback: if no advice found by checkin_id, try by date range
  if (!advice) {
    const { data: adviceByDate } = await supabase
      .from("ai_advice")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", `${todayStr}T00:00:00`)
      .lt("created_at", `${todayStr}T23:59:59.999`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    advice = adviceByDate;
  }

  return NextResponse.json({ 
    advice: advice?.advice || null,
    source: advice?.source || null,
    hasCheckedInToday: !!todayCheckin,
    todayCheckin: todayCheckin || null,
  });
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get("days") || "7");

  // Get date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: checkins, error } = await supabase
    .from("checkins")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate averages
  const morningCheckins = checkins?.filter(c => !c.is_afternoon_update) || [];
  
  const avgSleep = morningCheckins.length > 0
    ? morningCheckins.reduce((sum, c) => sum + (c.sleep_rating || 0), 0) / morningCheckins.length
    : 0;
  
  const avgEnergy = morningCheckins.length > 0
    ? morningCheckins.reduce((sum, c) => sum + (c.energy || 0), 0) / morningCheckins.length
    : 0;
  
  const avgSoreness = morningCheckins.length > 0
    ? morningCheckins.reduce((sum, c) => sum + (c.soreness || 0), 0) / morningCheckins.length
    : 0;
  
  const avgReadiness = morningCheckins.length > 0
    ? morningCheckins.reduce((sum, c) => sum + (c.readiness || 0), 0) / morningCheckins.length
    : 0;

  // Check for injury risk (high soreness trend)
  const recentSoreness = morningCheckins.slice(-3);
  const injuryRisk = recentSoreness.length >= 2 && 
    recentSoreness.every(c => (c.soreness || 0) >= 4);

  return NextResponse.json({
    checkins,
    averages: {
      sleep: Math.round(avgSleep * 10) / 10,
      energy: Math.round(avgEnergy * 10) / 10,
      soreness: Math.round(avgSoreness * 10) / 10,
      readiness: Math.round(avgReadiness * 10) / 10,
    },
    injuryRisk,
    totalCheckins: morningCheckins.length,
  });
}

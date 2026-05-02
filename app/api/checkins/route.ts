import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateShortCoachAdvice } from "@/lib/ai/coach";

export async function GET(request: NextRequest) {
  console.log("[v0] GET /api/checkins - starting");
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log("[v0] GET /api/checkins - user:", user?.id, "authError:", authError?.message);
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "30");
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data: checkins, error } = await supabase
    .from("checkins")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  console.log("[v0] GET /api/checkins - found:", checkins?.length, "checkins, error:", error?.message);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ checkins });
}

export async function POST(request: NextRequest) {
  console.log("[v0] POST /api/checkins - starting");
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log("[v0] POST /api/checkins - user:", user?.id, "authError:", authError?.message);
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  console.log("[v0] POST /api/checkins - body:", body);
  
  const checkinData = {
    user_id: user.id,
    date: body.date || new Date().toISOString().split("T")[0],
    sleep_rating: body.sleepRating,
    sleep_hours: body.sleepHours,
    feeling: body.feeling,
    energy: body.energy,
    soreness: body.soreness,
    soreness_location: body.sorenessLocation,
    readiness: body.readiness,
    notes: body.notes,
    is_afternoon_update: body.isAfternoonUpdate || false,
  };

  console.log("[v0] POST /api/checkins - inserting:", checkinData);

  const { data: checkin, error } = await supabase
    .from("checkins")
    .insert(checkinData)
    .select()
    .single();

  console.log("[v0] POST /api/checkins - result:", checkin, "error:", error?.message);

  if (error) {
    // Handle duplicate check-in for the day
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You have already checked in today" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate AI coaching advice based on check-in
  let aiAdvice = null;
  try {
    // Get recent data for AI
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: recentCheckins } = await supabase
      .from("checkins")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", weekAgo.toISOString().split("T")[0]);
    
    const { data: recentRuns } = await supabase
      .from("runs")
      .select("miles")
      .eq("user_id", user.id)
      .gte("date", weekAgo.toISOString().split("T")[0]);
    
    const avg = (arr: (number | null | undefined)[]) => {
      const valid = arr.filter((n): n is number => n != null);
      return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : "3";
    };

    console.log("[v0] Generating AI advice...");
    aiAdvice = await generateShortCoachAdvice({
      todayCheckin: {
        sleep_quality: body.sleepRating || 3,
        energy_level: body.energy || 3,
        soreness_level: body.soreness || 1,
        readiness_score: body.readiness || 3,
        overall_feeling: body.feeling,
      },
      weeklyAverages: {
        sleep: avg(recentCheckins?.map(c => c.sleep_rating)),
        energy: avg(recentCheckins?.map(c => c.energy)),
        soreness: avg(recentCheckins?.map(c => c.soreness)),
        readiness: avg(recentCheckins?.map(c => c.readiness)),
      },
      weeklyMiles: recentRuns?.reduce((sum, r) => sum + Number(r.miles), 0) || 0,
      totalRuns: recentRuns?.length || 0,
    });
    console.log("[v0] AI advice generated:", aiAdvice?.substring(0, 50));
  } catch (aiError) {
    console.error("[v0] AI advice generation failed:", aiError);
  }

  console.log("[v0] Returning response with aiAdvice:", !!aiAdvice);
  return NextResponse.json({ checkin, aiAdvice }, { status: 201 });
}

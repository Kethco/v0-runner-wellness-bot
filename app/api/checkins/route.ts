import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ checkins });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  
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

  const { data: checkin, error } = await supabase
    .from("checkins")
    .insert(checkinData)
    .select()
    .single();

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

  return NextResponse.json({ checkin }, { status: 201 });
}

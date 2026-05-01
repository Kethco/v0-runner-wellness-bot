import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("target_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goals });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  
  const goalData = {
    user_id: user.id,
    distance: body.distance,
    race_name: body.raceName,
    target_date: body.targetDate,
    target_time: body.targetTime,
    status: "active",
  };

  const { data: goal, error } = await supabase
    .from("goals")
    .insert(goalData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goal }, { status: 201 });
}

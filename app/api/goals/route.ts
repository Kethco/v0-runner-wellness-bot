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
    .order("race_date", { ascending: true });

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
    race_name: body.raceName || body.race_name,
    race_date: body.raceDate || body.race_date,
    target_time: body.targetTime || body.target_time,
    status: body.status || "upcoming",
    notes: body.notes,
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

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
  }

  // Map camelCase to snake_case
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.raceName !== undefined) dbUpdates.race_name = updates.raceName;
  if (updates.race_name !== undefined) dbUpdates.race_name = updates.race_name;
  if (updates.raceDate !== undefined) dbUpdates.race_date = updates.raceDate;
  if (updates.race_date !== undefined) dbUpdates.race_date = updates.race_date;
  if (updates.targetTime !== undefined) dbUpdates.target_time = updates.targetTime;
  if (updates.target_time !== undefined) dbUpdates.target_time = updates.target_time;
  if (updates.actualTime !== undefined) dbUpdates.actual_time = updates.actualTime;
  if (updates.actual_time !== undefined) dbUpdates.actual_time = updates.actual_time;
  if (updates.distance !== undefined) dbUpdates.distance = updates.distance;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { data: goal, error } = await supabase
    .from("goals")
    .update(dbUpdates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goal });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { rescheduleForLifeEvent } from "@/lib/training-plan-adjuster";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  let query = supabase
    .from("life_events")
    .select("*")
    .eq("user_id", user.id)
    .order("start_date", { ascending: true });

  // Filter by date range if provided
  if (startDate) {
    query = query.gte("end_date", startDate);
  }
  if (endDate) {
    query = query.lte("start_date", endDate);
  }

  const { data: events, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  
  const {
    eventType,
    title,
    description,
    startDate,
    endDate,
    trainingImpact = "reduced",
    canRun = true,
    notes,
  } = body;

  if (!eventType || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Event type, start date, and end date are required" },
      { status: 400 }
    );
  }

  const { data: event, error } = await supabase
    .from("life_events")
    .insert({
      user_id: user.id,
      event_type: eventType,
      title,
      description,
      start_date: startDate,
      end_date: endDate,
      training_impact: trainingImpact,
      can_run: canRun,
      notes,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Automatically reschedule affected workouts
  let adjustmentResult = null;
  if (!canRun || trainingImpact === "reduced" || trainingImpact === "none") {
    adjustmentResult = await rescheduleForLifeEvent(user.id, {
      id: event.id,
      start_date: startDate,
      end_date: endDate,
      event_type: eventType,
      training_impact: trainingImpact,
      can_run: canRun,
    });
  }

  return NextResponse.json({ 
    event, 
    adjustments: adjustmentResult 
  }, { status: 201 });
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
    return NextResponse.json({ error: "Event ID required" }, { status: 400 });
  }

  const dbUpdates: Record<string, unknown> = {};
  if (updates.eventType !== undefined) dbUpdates.event_type = updates.eventType;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
  if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
  if (updates.trainingImpact !== undefined) dbUpdates.training_impact = updates.trainingImpact;
  if (updates.canRun !== undefined) dbUpdates.can_run = updates.canRun;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { data: event, error } = await supabase
    .from("life_events")
    .update(dbUpdates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event });
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
    return NextResponse.json({ error: "Event ID required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("life_events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

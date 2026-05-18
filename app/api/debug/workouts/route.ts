import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the active plan
  const { data: plan } = await supabase
    .from("training_plans")
    .select("id, start_date, end_date")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!plan) {
    return NextResponse.json({ error: "No active plan" });
  }

  // Get all workouts for this plan
  const { data: workouts, error } = await supabase
    .from("planned_workouts")
    .select("id, scheduled_date, original_date, status, workout_type, title, adjustment_reason")
    .eq("plan_id", plan.id)
    .order("scheduled_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also get life events
  const { data: events } = await supabase
    .from("life_events")
    .select("*")
    .eq("user_id", user.id);

  return NextResponse.json({
    plan,
    totalWorkouts: workouts?.length,
    workouts: workouts?.map(w => ({
      id: w.id.slice(0, 8),
      date: w.scheduled_date,
      originalDate: w.original_date,
      status: w.status,
      type: w.workout_type,
      reason: w.adjustment_reason,
    })),
    events: events?.map(e => ({
      type: e.event_type,
      start: e.start_date,
      end: e.end_date,
      canRun: e.can_run,
    })),
  });
}

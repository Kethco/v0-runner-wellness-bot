import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { rescheduleForLifeEvent } from "@/lib/training-plan-adjuster";

// POST: Manually trigger reschedule for an existing life event
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { eventId } = body;

  if (!eventId) {
    return NextResponse.json({ error: "Event ID required" }, { status: 400 });
  }

  // Get the event
  const { data: event, error: eventError } = await supabase
    .from("life_events")
    .select("*")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Trigger reschedule
  const result = await rescheduleForLifeEvent(user.id, {
    id: event.id,
    start_date: event.start_date,
    end_date: event.end_date,
    event_type: event.event_type,
    training_impact: event.training_impact,
    can_run: event.can_run,
  });

  return NextResponse.json(result);
}

// GET: Resync all life events (useful for existing events before the feature was built)
export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all future life events
  const today = new Date().toISOString().split("T")[0];
  console.log("[v0] Resync API called, today:", today);
  
  const { data: events, error: eventsError } = await supabase
    .from("life_events")
    .select("*")
    .eq("user_id", user.id)
    .gte("end_date", today)
    .order("start_date", { ascending: true });

  console.log("[v0] Found life events:", events?.length, events);

  if (eventsError) {
    console.log("[v0] Events error:", eventsError.message);
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ message: "No upcoming life events found", results: [] });
  }

  // Process each event
  const results = [];
  for (const event of events) {
    console.log("[v0] Processing event:", event.event_type, event.start_date, "-", event.end_date, "can_run:", event.can_run, "impact:", event.training_impact);
    
    // Process events where can_run is false OR training_impact is not "none"
    if (!event.can_run || event.training_impact !== "none") {
      console.log("[v0] Rescheduling for event:", event.id);
      const result = await rescheduleForLifeEvent(user.id, {
        id: event.id,
        start_date: event.start_date,
        end_date: event.end_date,
        event_type: event.event_type,
        training_impact: event.training_impact,
        can_run: event.can_run,
      });
      console.log("[v0] Reschedule result:", result);
      results.push({
        event: event.title || event.event_type,
        dates: `${event.start_date} to ${event.end_date}`,
        ...result,
      });
    } else {
      console.log("[v0] Skipping event - can_run is true and impact is none");
    }
  }

  return NextResponse.json({ 
    message: `Processed ${results.length} life event(s)`,
    results,
  });
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data: entries, error } = await supabase
    .from("resilience_journal")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching resilience journal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get count of entries for stats
  const { count } = await supabase
    .from("resilience_journal")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Calculate average mood improvement
  const { data: moodStats } = await supabase
    .from("resilience_journal")
    .select("mood_before, mood_after")
    .eq("user_id", user.id)
    .not("mood_before", "is", null)
    .not("mood_after", "is", null);

  let avgMoodImprovement = 0;
  if (moodStats && moodStats.length > 0) {
    const totalImprovement = moodStats.reduce((sum, entry) => {
      return sum + ((entry.mood_after || 0) - (entry.mood_before || 0));
    }, 0);
    avgMoodImprovement = totalImprovement / moodStats.length;
  }

  return NextResponse.json({
    entries: entries || [],
    total: count || 0,
    avgMoodImprovement: Math.round(avgMoodImprovement * 10) / 10,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      trigger_type,
      situation,
      initial_feelings,
      friend_advice,
      reframe,
      kindness_action,
      kindness_completed,
      mood_before,
      mood_after,
      run_id,
    } = body;

    const { data: entry, error } = await supabase
      .from("resilience_journal")
      .insert({
        user_id: user.id,
        trigger_type,
        situation,
        initial_feelings,
        friend_advice,
        reframe,
        kindness_action,
        kindness_completed: kindness_completed || false,
        mood_before,
        mood_after,
        run_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating resilience entry:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entry });
  } catch (err) {
    console.error("Error in resilience journal POST:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
    }

    const { data: entry, error } = await supabase
      .from("resilience_journal")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating resilience entry:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entry });
  } catch (err) {
    console.error("Error in resilience journal PATCH:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

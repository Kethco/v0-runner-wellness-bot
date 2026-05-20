import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  // Check if user has set an intention today
  const { data: todayIntention } = await supabase
    .from("daily_intentions")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", todayStr)
    .maybeSingle();

  // Get recent intentions for streaks/patterns
  const { data: recentIntentions } = await supabase
    .from("daily_intentions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(7);

  // Calculate most common value
  const valueCounts: Record<string, number> = {};
  recentIntentions?.forEach(i => {
    if (i.value) {
      valueCounts[i.value] = (valueCounts[i.value] || 0) + 1;
    }
  });
  const topValue = Object.entries(valueCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return NextResponse.json({ 
    todayIntention,
    recentIntentions: recentIntentions || [],
    topValue,
    streak: recentIntentions?.length || 0
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { value, customNote } = body;
  const todayStr = new Date().toISOString().split("T")[0];

  // Check if intention already exists for today
  const { data: existing } = await supabase
    .from("daily_intentions")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", todayStr)
    .maybeSingle();

  let result;
  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("daily_intentions")
      .update({ value, custom_note: customNote, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    result = data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from("daily_intentions")
      .insert({
        user_id: user.id,
        date: todayStr,
        value,
        custom_note: customNote,
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    result = data;
  }

  return NextResponse.json({ intention: result });
}

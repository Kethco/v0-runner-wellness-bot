import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try to get existing streak
  const { data: streak, error } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // If no streak exists, create one
  if (error && error.code === "PGRST116") {
    const { data: newStreak, error: createError } = await supabase
      .from("streaks")
      .insert({
        user_id: user.id,
        current_streak: 0,
        longest_streak: 0,
        last_checkin_date: null
      })
      .select()
      .single();
    
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    
    return NextResponse.json({ streak: newStreak });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ streak });
}

// Reset streak
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const newStreak = body.streak ?? 0;

  const { data, error } = await supabase
    .from("streaks")
    .update({ 
      current_streak: newStreak,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ streak: data });
}

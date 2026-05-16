import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "10");

  const { data: entries, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // Table might not exist yet
    return NextResponse.json({ entries: [] });
  }

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  
  // Ensure table exists (create if not)
  const { error: tableError } = await supabase.rpc("create_journal_entries_if_not_exists").maybeSingle();
  
  const entryData = {
    user_id: user.id,
    entry_type: body.entryType || "gratitude", // gratitude, reflection, intention, visualization
    content: body.content,
    mood: body.mood,
    run_id: body.runId || null,
    prompt: body.prompt || null,
    date: body.date || new Date().toISOString().split("T")[0],
  };

  const { data: entry, error } = await supabase
    .from("journal_entries")
    .insert(entryData)
    .select()
    .single();

  if (error) {
    console.error("Journal entry error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry }, { status: 201 });
}

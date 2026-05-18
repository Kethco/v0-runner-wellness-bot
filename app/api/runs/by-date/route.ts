import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/runs/by-date?date=2026-05-18 - Delete all runs for a specific date
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Date parameter required" }, { status: 400 });
  }

  // First get the runs to return count
  const { data: runs } = await supabase
    .from("runs")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", date);

  // Delete the runs
  const { error } = await supabase
    .from("runs")
    .delete()
    .eq("user_id", user.id)
    .eq("date", date);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    deleted: runs?.length || 0,
    date 
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: runs, error } = await supabase
      .from("runs")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching runs:", error);
      return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 });
    }

    // Calculate weekly total
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const weeklyRuns = runs?.filter(r => new Date(r.date) >= startOfWeek) || [];
    const weeklyTotal = weeklyRuns.reduce((sum, r) => sum + Number(r.miles), 0);

    return NextResponse.json({ 
      runs: runs || [], 
      weeklyTotal: parseFloat(weeklyTotal.toFixed(1))
    });
  } catch (error) {
    console.error("Error in runs API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { miles, pace, duration_minutes, feeling, notes, date } = body;

    if (!miles || miles <= 0) {
      return NextResponse.json({ error: "Miles is required and must be positive" }, { status: 400 });
    }

    const { data: run, error } = await supabase
      .from("runs")
      .insert({
        user_id: user.id,
        date: date || new Date().toISOString().split("T")[0],
        miles: parseFloat(miles),
        pace,
        duration_minutes: duration_minutes ? parseInt(duration_minutes) : null,
        feeling,
        notes,
        source: "app",
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging run:", error);
      return NextResponse.json({ error: "Failed to log run" }, { status: 500 });
    }

    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    console.error("Error in runs API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

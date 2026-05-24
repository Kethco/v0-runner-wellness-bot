import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAndRecordPR } from "@/lib/personal-records";

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
    const { miles, pace, duration_minutes, runType, feeling, notes, date, shoeId } = body;

    if (!miles || miles <= 0) {
      return NextResponse.json({ error: "Miles is required and must be positive" }, { status: 400 });
    }

    // Build the insert object
    const runData: Record<string, unknown> = {
      user_id: user.id,
      date: date || new Date().toISOString().split("T")[0],
      miles: parseFloat(miles),
      pace,
      duration_minutes: duration_minutes ? parseInt(duration_minutes) : null,
      run_type: runType || "easy",
      feeling,
      notes,
      source: "app",
    };

    // Add shoe_id if provided and not "none"
    if (shoeId && shoeId !== "none") {
      runData.shoe_id = shoeId;
    }

    const { data: run, error } = await supabase
      .from("runs")
      .insert(runData)
      .select()
      .single();

    if (error) {
      console.error("Error logging run:", error);
      return NextResponse.json({ error: "Failed to log run" }, { status: 500 });
    }

    // Update shoe mileage if a shoe was selected
    if (shoeId && shoeId !== "none") {
      try {
        const { data: shoe } = await supabase
          .from("shoes")
          .select("total_miles")
          .eq("id", shoeId)
          .eq("user_id", user.id)
          .single();
        
        if (shoe) {
          await supabase
            .from("shoes")
            .update({ 
              total_miles: (shoe.total_miles || 0) + parseFloat(miles),
              updated_at: new Date().toISOString()
            })
            .eq("id", shoeId)
            .eq("user_id", user.id);
        }
      } catch (shoeError) {
        console.error("Error updating shoe mileage:", shoeError);
        // Don't fail the run log if shoe update fails
      }
    }

    // Check if this run is a new PR
    let prResult = null;
    try {
      prResult = await checkAndRecordPR(supabase, user.id, {
        id: run.id,
        miles: run.miles,
        duration_minutes: run.duration_minutes,
        pace: run.pace,
        date: run.date,
      });
    } catch (prError) {
      console.error("Error checking PR:", prError);
      // Don't fail the run log if PR check fails
    }

    return NextResponse.json({ 
      run, 
      pr: prResult 
    }, { status: 201 });
  } catch (error) {
    console.error("Error in runs API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

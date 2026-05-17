import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "all"; // "checkins", "runs", or "all"

  const results: Record<string, unknown> = {};

  if (type === "checkins" || type === "all") {
    const { data: checkins } = await supabase
      .from("checkins")
      .select("date, sleep_rating, energy, soreness, readiness, feeling, notes, created_at")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(1000);
    results.checkins = checkins || [];
  }

  if (type === "runs" || type === "all") {
    const { data: runs } = await supabase
      .from("runs")
      .select("date, miles, pace, duration_minutes, run_type, feeling, notes, created_at")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(1000);
    results.runs = runs || [];
  }

  // Convert to CSV
  if (searchParams.get("format") === "csv") {
    const lines: string[] = [];

    if (results.checkins && Array.isArray(results.checkins)) {
      lines.push("--- CHECK-INS ---");
      lines.push("Date,Sleep Rating,Energy,Soreness,Readiness,Feeling,Notes");
      (results.checkins as Record<string, unknown>[]).forEach((c) => {
        lines.push(`${c.date},${c.sleep_rating},${c.energy},${c.soreness},${c.readiness},${c.feeling || ""},${(c.notes as string || "").replace(/,/g, ";")}`);
      });
    }

    if (results.runs && Array.isArray(results.runs)) {
      lines.push("");
      lines.push("--- RUNS ---");
      lines.push("Date,Miles,Pace,Duration (min),Type,Feeling,Notes");
      (results.runs as Record<string, unknown>[]).forEach((r) => {
        lines.push(`${r.date},${r.miles},${r.pace || ""},${r.duration_minutes || ""},${r.run_type || ""},${r.feeling || ""},${(r.notes as string || "").replace(/,/g, ";")}`);
      });
    }

    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="runner-wellness-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return NextResponse.json(results);
}

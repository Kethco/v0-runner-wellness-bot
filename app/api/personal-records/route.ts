import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPRs, getPRHistory, RACE_DISTANCES, DistanceKey } from "@/lib/personal-records";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const distance = searchParams.get("distance") as DistanceKey | null;

    if (distance) {
      // Get history for specific distance
      const history = await getPRHistory(supabase, user.id, distance);
      return NextResponse.json({ history });
    }

    // Get all current best PRs
    const prs = await getUserPRs(supabase, user.id);
    
    // Format response with all distances (even if no PR yet)
    const formattedPRs = Object.entries(RACE_DISTANCES).map(([key, config]) => {
      const pr = prs.find(p => p.distance === key);
      return {
        distance: key,
        label: config.label,
        shortName: config.shortName,
        miles: config.miles,
        hasPR: !!pr,
        time: pr?.time_display || null,
        timeSeconds: pr?.time_seconds || null,
        pace: pr?.pace || null,
        achievedAt: pr?.achieved_at || null,
        improvementSeconds: pr?.improvement_seconds || null,
      };
    });

    return NextResponse.json({ prs: formattedPRs });
  } catch (error) {
    console.error("Error fetching PRs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const WRONG_USER_ID = "09b728c4-a45b-4ab6-96e5-f4f76632f22c";
const CORRECT_USER_ID = "3a30f9f9-0a85-4dc1-8e00-be39e5fa01fd";

export async function GET(request: NextRequest) {
  // Require secret key in URL for security
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  
  if (key !== "fix-runner-2026") {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results: string[] = [];

  try {
    // Get check-ins with wrong user ID
    const { data: wrongCheckins, error: checkinsError } = await supabase
      .from("checkins")
      .select("id, date, is_afternoon_update")
      .eq("user_id", WRONG_USER_ID);

    if (checkinsError) {
      return NextResponse.json({ error: checkinsError.message }, { status: 500 });
    }

    results.push(`Found ${wrongCheckins?.length || 0} check-ins with wrong user ID`);

    // Get check-ins with correct user ID to avoid duplicates
    const { data: correctCheckins } = await supabase
      .from("checkins")
      .select("date, is_afternoon_update")
      .eq("user_id", CORRECT_USER_ID);

    const correctDates = new Set(
      correctCheckins?.map((c) => `${c.date}-${c.is_afternoon_update}`) || []
    );

    // Delete duplicates and update others
    let deleted = 0;
    let updated = 0;
    for (const checkin of wrongCheckins || []) {
      const key = `${checkin.date}-${checkin.is_afternoon_update}`;
      if (correctDates.has(key)) {
        await supabase.from("checkins").delete().eq("id", checkin.id);
        deleted++;
      } else {
        await supabase.from("checkins").update({ user_id: CORRECT_USER_ID }).eq("id", checkin.id);
        updated++;
      }
    }
    results.push(`Deleted ${deleted} duplicate check-ins, updated ${updated} check-ins`);

    // Fix AI advice
    const { data: wrongAdvice } = await supabase
      .from("ai_advice")
      .select("id")
      .eq("user_id", WRONG_USER_ID);

    results.push(`Found ${wrongAdvice?.length || 0} AI advice with wrong user ID`);

    await supabase
      .from("ai_advice")
      .update({ user_id: CORRECT_USER_ID })
      .eq("user_id", WRONG_USER_ID);

    results.push("Updated all AI advice to correct user ID");

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If weekly_goal not in profile, check user metadata
  const finalProfile = {
    ...profile,
    weekly_goal: profile?.weekly_goal ?? user.user_metadata?.weekly_goal ?? null
  };

  return NextResponse.json({ profile: finalProfile, email: user.email });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  
  const updateData: Record<string, unknown> = {};
  if (body.firstName !== undefined) updateData.first_name = body.firstName;
  if (body.lastName !== undefined) updateData.last_name = body.lastName;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.timezone !== undefined) updateData.timezone = body.timezone;
  if (body.privacyMode !== undefined) updateData.privacy_mode = body.privacyMode;
  if (body.notificationMorning !== undefined) updateData.notification_morning = body.notificationMorning;
  if (body.notificationAfternoon !== undefined) updateData.notification_afternoon = body.notificationAfternoon;
  if (body.weekly_goal !== undefined) updateData.weekly_goal = body.weekly_goal;

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    // If weekly_goal column doesn't exist, try without it
    if (error.message.includes("weekly_goal") && body.weekly_goal !== undefined) {
      const { weekly_goal, ...restData } = updateData;
      // Save weekly_goal to user metadata as fallback
      await supabase.auth.updateUser({
        data: { weekly_goal: body.weekly_goal }
      });
      
      if (Object.keys(restData).length > 0) {
        const { data: fallbackProfile, error: fallbackError } = await supabase
          .from("profiles")
          .update(restData)
          .eq("id", user.id)
          .select()
          .single();
        
        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message }, { status: 500 });
        }
        return NextResponse.json({ profile: { ...fallbackProfile, weekly_goal: body.weekly_goal } });
      }
      return NextResponse.json({ profile: { weekly_goal: body.weekly_goal } });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

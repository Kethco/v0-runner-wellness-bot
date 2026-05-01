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

  return NextResponse.json({ profile, email: user.email });
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

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

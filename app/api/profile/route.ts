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

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  
  // Parse name into first and last
  const nameParts = body.name?.trim().split(" ") || [];
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      name: body.name,
      gender: body.gender,
      birth_year: body.birth_year,
      location: body.location,
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

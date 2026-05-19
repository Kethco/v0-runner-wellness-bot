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
  
  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  
  if (body.name !== undefined) {
    const nameParts = body.name?.trim().split(" ") || [];
    updateData.first_name = nameParts[0] || "";
    updateData.last_name = nameParts.slice(1).join(" ") || "";
    updateData.name = body.name;
  }
  if (body.gender !== undefined) updateData.gender = body.gender;
  if (body.birth_year !== undefined) updateData.birth_year = body.birth_year;
  if (body.location !== undefined) updateData.location = body.location;

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

// Also support PATCH for partial updates
export async function PATCH(request: NextRequest) {
  return PUT(request);
}

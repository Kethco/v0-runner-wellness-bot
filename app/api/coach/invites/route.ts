import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Invites are generated client-side - no database needed
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ invites: [], team: null });
}

export async function POST() {
  return NextResponse.json({ invites: [] });
}

export async function DELETE() {
  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const supabase = await createClient();
  
  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use service client to get stats
  const serviceClient = createServiceClient();

  // Get total users
  const { count: totalUsers } = await serviceClient
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Get users who checked in today
  const today = new Date().toISOString().split("T")[0];
  const { count: activeToday } = await serviceClient
    .from("checkins")
    .select("*", { count: "exact", head: true })
    .eq("date", today);

  // Get total check-ins
  const { count: totalCheckins } = await serviceClient
    .from("checkins")
    .select("*", { count: "exact", head: true });

  // Pro subscribers - would come from Stripe, for now return 0
  const proSubscribers = 0;

  return NextResponse.json({
    totalUsers: totalUsers || 0,
    activeToday: activeToday || 0,
    totalCheckins: totalCheckins || 0,
    proSubscribers,
  });
}

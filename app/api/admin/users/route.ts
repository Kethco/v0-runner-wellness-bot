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

  // Use service client to get all users with their streaks
  const serviceClient = createServiceClient();

  const { data: users, error } = await serviceClient
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      phone,
      is_coach,
      created_at,
      streaks (
        current_streak
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get emails from auth.users via admin API
  const { data: authUsers } = await serviceClient.auth.admin.listUsers();

  // Merge email data
  const usersWithEmail = users?.map(user => {
    const authUser = authUsers?.users?.find(au => au.id === user.id);
    return {
      ...user,
      email: authUser?.email || "No email",
      current_streak: user.streaks?.[0]?.current_streak || 0,
    };
  });

  return NextResponse.json(usersWithEmail || []);
}

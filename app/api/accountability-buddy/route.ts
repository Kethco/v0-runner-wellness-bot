import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch buddy connection and stats (simplified queries without FK joins)
export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get active buddy connection - check both directions separately to avoid or() issues
  const { data: connectionAsInviter } = await supabase
    .from("accountability_buddies")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const { data: connectionAsBuddy } = await supabase
    .from("accountability_buddies")
    .select("*")
    .eq("buddy_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const connection = connectionAsInviter || connectionAsBuddy;

  if (!connection) {
    // Check for pending invites sent TO this user
    const { data: pendingInvite } = await supabase
      .from("accountability_buddies")
      .select("*")
      .eq("buddy_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    // Get inviter profile if there's a pending invite
    let inviterProfile = null;
    if (pendingInvite) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", pendingInvite.user_id)
        .maybeSingle();
      inviterProfile = profile;
    }

    // Check for pending invites sent BY this user
    const { data: sentInvite } = await supabase
      .from("accountability_buddies")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    return NextResponse.json({ 
      connection: null, 
      buddy: null,
      buddyStats: null,
      pendingInvite: pendingInvite ? { ...pendingInvite, inviter: inviterProfile } : null,
      sentInvite,
    });
  }

  // Determine who the buddy is
  const iAmInviter = connection.user_id === user.id;
  const buddyId = iAmInviter ? connection.buddy_id : connection.user_id;

  // Get buddy's profile separately
  const { data: buddyProfile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("id", buddyId)
    .single();

  // Get buddy's streak and recent activity
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: buddyCheckins } = await supabase
    .from("checkins")
    .select("id, created_at, date")
    .eq("user_id", buddyId)
    .gte("date", weekAgo)
    .order("date", { ascending: false });

  const { data: buddyRuns } = await supabase
    .from("runs")
    .select("id, miles, date")
    .eq("user_id", buddyId)
    .gte("date", weekAgo)
    .order("date", { ascending: false });

  // Calculate buddy streak (consecutive days with check-ins)
  let buddyStreak = 0;
  if (buddyCheckins && buddyCheckins.length > 0) {
    const uniqueDates = [...new Set(buddyCheckins.map(c => c.date))].sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    const todayDate = new Date(today);
    for (let i = 0; i < uniqueDates.length; i++) {
      const checkDate = new Date(uniqueDates[i]);
      const expectedDate = new Date(todayDate);
      expectedDate.setDate(todayDate.getDate() - i);
      
      if (checkDate.toISOString().split("T")[0] === expectedDate.toISOString().split("T")[0]) {
        buddyStreak++;
      } else {
        break;
      }
    }
  }

  // Check if buddy has been active today
  const buddyActiveToday = buddyCheckins?.some(c => c.date === today) || false;
  const buddyRanToday = buddyRuns?.some(r => r.date === today) || false;

  // Weekly miles
  const weeklyMiles = buddyRuns?.reduce((sum, r) => sum + (r.miles || 0), 0) || 0;

  return NextResponse.json({
    connection: {
      id: connection.id,
      connectedSince: connection.created_at,
    },
    buddy: {
      id: buddyId,
      name: buddyProfile ? `${buddyProfile.first_name || ""} ${buddyProfile.last_name || ""}`.trim() || "Your Buddy" : "Your Buddy",
      firstName: buddyProfile?.first_name || "Buddy",
      avatarUrl: buddyProfile?.avatar_url,
    },
    buddyStats: {
      streak: buddyStreak,
      activeToday: buddyActiveToday,
      ranToday: buddyRanToday,
      weeklyMiles: Math.round(weeklyMiles * 10) / 10,
      lastCheckin: buddyCheckins?.[0]?.date || null,
      lastRun: buddyRuns?.[0] || null,
    },
    pendingInvite: null,
    sentInvite: null,
  });
}

// POST - Send buddy invite or accept/decline invite
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, email, inviteId } = body;

  if (action === "invite") {
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // First try to find user by email in profiles table
    let { data: buddyProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    // If not found in profiles, try using admin client to look up in auth.users
    if (!buddyProfile) {
      // Use service role to query auth users
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      
      if (serviceRoleKey) {
        const { createClient } = await import("@supabase/supabase-js");
        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        
        // List users and find by email
        const { data: authData } = await adminClient.auth.admin.listUsers();
        const authUser = authData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
        
        if (authUser) {
          // User exists in auth but profile might not have email - update it
          await supabase
            .from("profiles")
            .update({ email: normalizedEmail })
            .eq("id", authUser.id);
          
          buddyProfile = { id: authUser.id, email: normalizedEmail };
        }
      }
    }

    if (!buddyProfile) {
      return NextResponse.json({ error: "User not found. They need to sign up first." }, { status: 404 });
    }

    if (buddyProfile.id === user.id) {
      return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
    }

    // Check for existing connection for either user (check separately)
    const { data: existingAsInviter } = await supabase
      .from("accountability_buddies")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["active", "pending"])
      .maybeSingle();

    const { data: existingAsBuddy } = await supabase
      .from("accountability_buddies")
      .select("id")
      .eq("buddy_id", user.id)
      .in("status", ["active", "pending"])
      .maybeSingle();

    const { data: targetAsInviter } = await supabase
      .from("accountability_buddies")
      .select("id")
      .eq("user_id", buddyProfile.id)
      .in("status", ["active", "pending"])
      .maybeSingle();

    const { data: targetAsBuddy } = await supabase
      .from("accountability_buddies")
      .select("id")
      .eq("buddy_id", buddyProfile.id)
      .in("status", ["active", "pending"])
      .maybeSingle();

    const existingConnection = existingAsInviter || existingAsBuddy || targetAsInviter || targetAsBuddy;

    if (existingConnection) {
      return NextResponse.json({ 
        error: "You or they already have an active buddy or pending invite"
      }, { status: 400 });
    }

    // Create invite
    const { data: invite, error } = await supabase
      .from("accountability_buddies")
      .insert({
        user_id: user.id,
        buddy_id: buddyProfile.id,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create invite:", error);
      return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
    }

    return NextResponse.json({ success: true, invite });
  }

  if (action === "accept") {
    if (!inviteId) {
      return NextResponse.json({ error: "Invite ID required" }, { status: 400 });
    }
    
    console.log("[v0] Accepting invite:", inviteId, "for user:", user.id);
    
    const { data: connection, error } = await supabase
      .from("accountability_buddies")
      .update({ status: "active" })
      .eq("id", inviteId)
      .eq("buddy_id", user.id)
      .eq("status", "pending")
      .select()
      .single();
    
    if (error) {
      console.error("[v0] Accept invite error:", error);
      return NextResponse.json({ error: "Failed to accept invite: " + error.message }, { status: 500 });
    }
    
    if (!connection) {
      console.error("[v0] No connection found after update");
      return NextResponse.json({ error: "Invite not found or already accepted" }, { status: 404 });
    }
    
    console.log("[v0] Invite accepted successfully:", connection);
    return NextResponse.json({ success: true, connection });
  }

  if (action === "decline" || action === "cancel") {
    if (!inviteId) {
      return NextResponse.json({ error: "Invite ID required" }, { status: 400 });
    }

    const { error: err1 } = await supabase
      .from("accountability_buddies")
      .delete()
      .eq("id", inviteId)
      .eq("user_id", user.id);

    const { error: err2 } = await supabase
      .from("accountability_buddies")
      .delete()
      .eq("id", inviteId)
      .eq("buddy_id", user.id);

    if (err1 && err2) {
      return NextResponse.json({ error: "Failed to cancel/decline invite" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// DELETE - Remove buddy connection
export async function DELETE() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete where user is inviter
  await supabase
    .from("accountability_buddies")
    .delete()
    .eq("user_id", user.id)
    .eq("status", "active");

  // Delete where user is buddy
  await supabase
    .from("accountability_buddies")
    .delete()
    .eq("buddy_id", user.id)
    .eq("status", "active");

  return NextResponse.json({ success: true });
}

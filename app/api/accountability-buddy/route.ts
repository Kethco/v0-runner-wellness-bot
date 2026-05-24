import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch buddy connection and stats
export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get active buddy connection
  const { data: connection } = await supabase
    .from("accountability_buddies")
    .select(`
      *,
      buddy:profiles!accountability_buddies_buddy_id_fkey(
        id, first_name, last_name, avatar_url, email
      ),
      inviter:profiles!accountability_buddies_user_id_fkey(
        id, first_name, last_name, avatar_url, email
      )
    `)
    .or(`user_id.eq.${user.id},buddy_id.eq.${user.id}`)
    .eq("status", "active")
    .single();

  if (!connection) {
    // Check for pending invites sent TO this user
    const { data: pendingInvite } = await supabase
      .from("accountability_buddies")
      .select("*, inviter:profiles!accountability_buddies_user_id_fkey(first_name, last_name, email)")
      .eq("buddy_id", user.id)
      .eq("status", "pending")
      .single();

    // Check for pending invites sent BY this user
    const { data: sentInvite } = await supabase
      .from("accountability_buddies")
      .select("*, invited:profiles!accountability_buddies_buddy_id_fkey(first_name, last_name, email)")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .single();

    return NextResponse.json({ 
      connection: null, 
      buddy: null,
      buddyStats: null,
      pendingInvite,
      sentInvite,
    });
  }

  // Determine who the buddy is
  const iAmInviter = connection.user_id === user.id;
  const buddyId = iAmInviter ? connection.buddy_id : connection.user_id;
  const buddyProfile = iAmInviter ? connection.buddy : connection.inviter;

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

    // Find user by email in profiles
    const { data: buddyProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!buddyProfile) {
      return NextResponse.json({ error: "User not found. They need to sign up first." }, { status: 404 });
    }

    if (buddyProfile.id === user.id) {
      return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
    }

    // Check for existing connection for either user
    const { data: existingConnection } = await supabase
      .from("accountability_buddies")
      .select("id, status")
      .or(`and(user_id.eq.${user.id},status.in.(active,pending)),and(buddy_id.eq.${user.id},status.in.(active,pending)),and(user_id.eq.${buddyProfile.id},status.in.(active,pending)),and(buddy_id.eq.${buddyProfile.id},status.in.(active,pending))`)
      .limit(1)
      .single();

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

    const { data: connection, error } = await supabase
      .from("accountability_buddies")
      .update({ status: "active", accepted_at: new Date().toISOString() })
      .eq("id", inviteId)
      .eq("buddy_id", user.id)
      .eq("status", "pending")
      .select()
      .single();

    if (error || !connection) {
      return NextResponse.json({ error: "Invite not found or already accepted" }, { status: 404 });
    }

    return NextResponse.json({ success: true, connection });
  }

  if (action === "decline" || action === "cancel") {
    if (!inviteId) {
      return NextResponse.json({ error: "Invite ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("accountability_buddies")
      .delete()
      .eq("id", inviteId)
      .or(`user_id.eq.${user.id},buddy_id.eq.${user.id}`);

    if (error) {
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

  const { error } = await supabase
    .from("accountability_buddies")
    .delete()
    .or(`user_id.eq.${user.id},buddy_id.eq.${user.id}`)
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ error: "Failed to remove buddy" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

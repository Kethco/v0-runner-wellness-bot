import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const WRONG_USER_ID = "09b728c4-a45b-4ab6-96e5-f4f76632f22c";
const CORRECT_USER_ID = "3a30f9f9-0a85-4dc1-8e00-be39e5fa01fd";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const action = searchParams.get("action");
  
  if (key !== "fix-runner-2026") {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Debug: check what user ID the session has
  if (action === "debug-session") {
    const { createClient } = await import("@/lib/supabase/server");
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    return NextResponse.json({
      sessionUserId: user?.id || "no session",
      sessionEmail: user?.email || "no email",
      expectedUserId: CORRECT_USER_ID,
      match: user?.id === CORRECT_USER_ID
    });
  }

  // Sync all data to a specific user ID
  if (action === "sync-to-user") {
    const targetUserId = searchParams.get("userId");
    if (!targetUserId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    
    // Update all checkins from old profile ID to target user ID
    const { data: updatedCheckins, error: e1 } = await supabase
      .from("checkins")
      .update({ user_id: targetUserId })
      .eq("user_id", CORRECT_USER_ID)
      .select();
    
    // Update all ai_advice
    const { data: updatedAdvice, error: e2 } = await supabase
      .from("ai_advice")
      .update({ user_id: targetUserId })
      .eq("user_id", CORRECT_USER_ID)
      .select();
    
    // Update all runs
    const { data: updatedRuns, error: e3 } = await supabase
      .from("runs")
      .update({ user_id: targetUserId })
      .eq("user_id", CORRECT_USER_ID)
      .select();
    
    // Update all goals
    const { data: updatedGoals, error: e4 } = await supabase
      .from("goals")
      .update({ user_id: targetUserId })
      .eq("user_id", CORRECT_USER_ID)
      .select();
      
    return NextResponse.json({
      success: true,
      checkins_synced: updatedCheckins?.length || 0,
      advice_synced: updatedAdvice?.length || 0,
      runs_synced: updatedRuns?.length || 0,
      goals_synced: updatedGoals?.length || 0,
      errors: [e1?.message, e2?.message, e3?.message, e4?.message].filter(Boolean)
    });
  }

  // Get current auth user ID (call from within app)
  if (action === "get-my-id") {
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    const authSupabase = await createServerClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    
    return NextResponse.json({
      authUserId: user?.id || null,
      email: user?.email || null,
      currentProfileId: CORRECT_USER_ID,
      needsSync: user?.id && user.id !== CORRECT_USER_ID
    });
  }

  // Make a user an admin by email
  if (action === "make-admin") {
    const email = searchParams.get("email");
    
    // First ensure is_admin column exists
    await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;`
    }).catch(() => {}); // Ignore if RPC doesn't exist
    
    // If no email provided, make the current logged-in user admin
    if (!email) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabaseAuth = await createClient();
      const { data: { user } } = await supabaseAuth.auth.getUser();
      
      if (!user) {
        return NextResponse.json({ error: "No user logged in and no email provided" }, { status: 400 });
      }
      
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: true })
        .eq("id", user.id);
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Made ${user.email} an admin`,
        adminLoginUrl: "/admin/login"
      });
    }
    
    // Find user by email and make them admin
    const { data: users } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .limit(1);
    
    if (!users || users.length === 0) {
      // Try to find in auth.users
      const { data: authUser } = await supabase.auth.admin.getUserByEmail(email);
      
      if (authUser?.user) {
        const { error } = await supabase
          .from("profiles")
          .update({ is_admin: true })
          .eq("id", authUser.user.id);
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: true, 
          message: `Made ${email} an admin`,
          adminLoginUrl: "/admin/login"
        });
      }
      
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", users[0].id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Made ${email} an admin`,
      adminLoginUrl: "/admin/login"
    });
  }

  // Add weekly_goal column to profiles table
  if (action === "add-weekly-goal-column") {
    // Check if column exists first
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("weekly_goal")
      .limit(1);
    
    if (existingProfile !== null) {
      return NextResponse.json({ success: true, message: "Column already exists" });
    }
    
    // Add the column using raw SQL via service role
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_goal INTEGER DEFAULT 25;`
    });
    
    if (error) {
      // If RPC doesn't exist, provide manual SQL
      return NextResponse.json({ 
        message: "Run this SQL in Supabase dashboard",
        sql: "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_goal INTEGER DEFAULT 25;",
        error: error.message
      });
    }
    
    return NextResponse.json({ success: true, message: "weekly_goal column added" });
  }

  // Create reflections table for mental wellness feature
  if (action === "create-reflections-table") {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS reflections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK (type IN ('pre_run', 'post_run', 'gratitude')),
          enjoyment INTEGER CHECK (enjoyment >= 1 AND enjoyment <= 5),
          gratitude TEXT,
          intention TEXT,
          energy TEXT,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Users can view own reflections" ON reflections
          FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY IF NOT EXISTS "Users can insert own reflections" ON reflections
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      `
    });
    
    if (error) {
      // Try direct SQL if RPC doesn't exist
      const createResult = await supabase.from('reflections').select('id').limit(1);
      if (createResult.error?.code === '42P01') {
        return NextResponse.json({ 
          error: "Table doesn't exist. Please create it manually in Supabase dashboard.",
          sql: `CREATE TABLE reflections (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            type TEXT NOT NULL,
            enjoyment INTEGER,
            gratitude TEXT,
            intention TEXT,
            energy TEXT,
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );`
        });
      }
      return NextResponse.json({ tableExists: true });
    }
    
    return NextResponse.json({ success: true, message: "Reflections table created" });
  }

  // Debug AI advice for a specific user
  if (action === "debug-advice") {
    const { createClient } = await import("@/lib/supabase/server");
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    const userId = user?.id || CORRECT_USER_ID;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    // Get all advice for this user in last 2 days
    const { data: recentAdvice } = await supabase
      .from("ai_advice")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", yesterday)
      .order("created_at", { ascending: false });
    
    // Get all checkins for this user in last 2 days
    const { data: recentCheckins } = await supabase
      .from("checkins")
      .select("*")
      .eq("user_id", userId)
      .gte("date", yesterday)
      .order("date", { ascending: false });
    
    // Get all advice regardless of user to see if there's a mismatch
    const { data: allRecentAdvice } = await supabase
      .from("ai_advice")
      .select("*")
      .gte("created_at", yesterday)
      .order("created_at", { ascending: false });
    
    return NextResponse.json({
      currentUserId: userId,
      userEmail: user?.email,
      today,
      yesterday,
      recentAdviceForUser: recentAdvice,
      recentCheckinsForUser: recentCheckins,
      allRecentAdvice: allRecentAdvice,
    });
  }

  // Check today's data
  if (action === "check-today") {
    const today = new Date().toISOString().split("T")[0];
    
    const { data: todayCheckins } = await supabase
      .from("checkins")
      .select("*")
      .eq("date", today);
    
    const { data: todayAdvice } = await supabase
      .from("ai_advice")
      .select("*")
      .gte("created_at", today);
    
    const { data: allCheckins } = await supabase
      .from("checkins")
      .select("id, user_id, date")
      .order("date", { ascending: false })
      .limit(10);
    
    return NextResponse.json({
      today,
      correctUserId: CORRECT_USER_ID,
      todayCheckins,
      todayAdvice,
      recentCheckins: allCheckins
    });
  }
  
  // Fix today's check-in if it has wrong user ID
  if (action === "fix-today") {
    const today = new Date().toISOString().split("T")[0];
    
    // Update any check-ins from today with wrong user ID
    const { data: updated, error } = await supabase
      .from("checkins")
      .update({ user_id: CORRECT_USER_ID })
      .eq("date", today)
      .neq("user_id", CORRECT_USER_ID)
      .select();
    
    // Also update AI advice from today
    const { data: updatedAdvice } = await supabase
      .from("ai_advice")
      .update({ user_id: CORRECT_USER_ID })
      .gte("created_at", today)
      .neq("user_id", CORRECT_USER_ID)
      .select();
    
    return NextResponse.json({
      success: true,
      checkins_fixed: updated?.length || 0,
      advice_fixed: updatedAdvice?.length || 0,
      error: error?.message
    });
  }

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

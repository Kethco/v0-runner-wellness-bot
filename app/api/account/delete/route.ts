import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Use service role to delete user data and account
    const serviceSupabase = createServiceClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Delete user data from all tables (cascade should handle most)
    // But explicitly delete to be sure
    await serviceSupabase.from("ai_advice").delete().eq("user_id", user.id);
    await serviceSupabase.from("checkins").delete().eq("user_id", user.id);
    await serviceSupabase.from("runs").delete().eq("user_id", user.id);
    await serviceSupabase.from("streaks").delete().eq("user_id", user.id);
    await serviceSupabase.from("coach_athletes").delete().eq("athlete_id", user.id);
    await serviceSupabase.from("coach_athletes").delete().eq("coach_id", user.id);
    await serviceSupabase.from("athlete_invites").delete().eq("coach_id", user.id);
    await serviceSupabase.from("profiles").delete().eq("id", user.id);
    
    // Delete the auth user
    const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }
    
    // Sign out the user
    await supabase.auth.signOut();
    
    return NextResponse.json({ 
      success: true, 
      message: "Account deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}

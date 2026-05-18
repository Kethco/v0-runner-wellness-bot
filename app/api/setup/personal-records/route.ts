import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// This endpoint creates the personal_records table if it doesn't exist
// Run once to set up the table
export async function POST() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated (for security)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the personal_records table using raw SQL via RPC
    // Note: This requires the table to not exist yet
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS personal_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          distance TEXT NOT NULL,
          distance_miles NUMERIC(5,2) NOT NULL,
          time_seconds INTEGER NOT NULL,
          time_display TEXT NOT NULL,
          pace TEXT,
          run_id UUID,
          achieved_at DATE NOT NULL,
          is_current_best BOOLEAN DEFAULT true,
          previous_best_seconds INTEGER,
          improvement_seconds INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_personal_records_user_distance 
          ON personal_records(user_id, distance);
        
        CREATE INDEX IF NOT EXISTS idx_personal_records_current_best 
          ON personal_records(user_id, is_current_best) 
          WHERE is_current_best = true;
      `
    });

    if (createError) {
      // If RPC doesn't exist, try direct insert to test if table exists
      console.log("RPC not available, table may already exist:", createError.message);
      
      // Test if table exists by trying a select
      const { error: testError } = await supabase
        .from("personal_records")
        .select("id")
        .limit(1);
      
      if (testError) {
        return NextResponse.json({ 
          error: "Table doesn't exist and couldn't be created. Please run the SQL script manually in Supabase dashboard.",
          details: testError.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        message: "Table already exists",
        status: "ready" 
      });
    }

    return NextResponse.json({ 
      message: "Personal records table created successfully",
      status: "created" 
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test if table exists
    const { error } = await supabase
      .from("personal_records")
      .select("id")
      .limit(1);
    
    if (error) {
      return NextResponse.json({ 
        status: "not_ready",
        message: "Personal records table not found. POST to this endpoint to create it, or run the SQL script manually."
      });
    }
    
    return NextResponse.json({ 
      status: "ready",
      message: "Personal records table exists and is ready"
    });
  } catch (error) {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

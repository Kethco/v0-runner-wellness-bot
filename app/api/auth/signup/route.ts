import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Track if database has been fixed
let dbFixed = false;

async function ensureDatabaseReady(): Promise<boolean> {
  if (dbFixed) return true;
  
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("No direct database connection available");
    return false;
  }
  
  try {
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    
    // Step 1: Add all potentially missing columns to profiles table
    await pool.query(`
      DO $$ 
      BEGIN
        -- Add columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notification_morning') THEN
          ALTER TABLE profiles ADD COLUMN notification_morning BOOLEAN DEFAULT TRUE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trial_ends_at') THEN
          ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMPTZ;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'coach_id') THEN
          ALTER TABLE profiles ADD COLUMN coach_id UUID;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
          ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'athlete';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plan') THEN
          ALTER TABLE profiles ADD COLUMN plan TEXT DEFAULT 'free_trial';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
          ALTER TABLE profiles ADD COLUMN first_name TEXT DEFAULT '';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
          ALTER TABLE profiles ADD COLUMN last_name TEXT DEFAULT '';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
          ALTER TABLE profiles ADD COLUMN phone TEXT DEFAULT '';
        END IF;
      END $$;
    `);
    
    // Step 2: Create athlete_invites table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS athlete_invites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        athlete_name TEXT NOT NULL,
        athlete_email TEXT,
        invite_code TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        accepted_at TIMESTAMPTZ
      );
      
      CREATE INDEX IF NOT EXISTS idx_athlete_invites_coach ON athlete_invites(coach_id);
      CREATE INDEX IF NOT EXISTS idx_athlete_invites_code ON athlete_invites(invite_code);
    `);
    
    // Step 3: Create coach_athletes relationship table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coach_athletes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        connected_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(coach_id, athlete_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_coach_athletes_coach ON coach_athletes(coach_id);
      CREATE INDEX IF NOT EXISTS idx_coach_athletes_athlete ON coach_athletes(athlete_id);
    `);

    // Step 4: Drop and recreate trigger with a simple, safe function
    await pool.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.profiles (
          id, first_name, last_name, email, phone, role, plan, created_at
        )
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
          COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
          NEW.email,
          COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
          COALESCE(NEW.raw_user_meta_data ->> 'role', 'athlete'),
          COALESCE(NEW.raw_user_meta_data ->> 'plan', 'free_trial'),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
      END;
      $$;
      
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);
    
    await pool.end();
    dbFixed = true;
    console.log("Database ready!");
    return true;
  } catch (error) {
    console.error("Database setup error:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, first_name, last_name, phone, user_type, plan, program_name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Normalize phone
    const normalizedPhone = phone?.replace(/\D/g, "") || "";
    const formattedPhone = normalizedPhone 
      ? (normalizedPhone.startsWith("1") ? `+${normalizedPhone}` : `+1${normalizedPhone}`)
      : "";

    // Ensure database is ready before creating user
    await ensureDatabaseReady();

    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    if (existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ 
        error: "An account with this email already exists",
      }, { status: 400 });
    }

    // Create user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone: formattedPhone || undefined,
      phone_confirm: true,
      user_metadata: {
        first_name: first_name || "",
        last_name: last_name || "",
        phone: formattedPhone,
        user_type: user_type || "athlete",
        role: user_type || "athlete",
        plan: plan || "free_trial",
        ...(program_name && { program_name }),
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      
      // If database error, reset and retry once
      if (authError.message?.includes("Database error")) {
        dbFixed = false;
        const fixed = await ensureDatabaseReady();
        
        if (fixed) {
          const { data: retryData, error: retryError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            phone: formattedPhone || undefined,
            phone_confirm: true,
            user_metadata: {
              first_name: first_name || "",
              last_name: last_name || "",
              phone: formattedPhone,
              user_type: user_type || "athlete",
              role: user_type || "athlete",
              plan: plan || "free_trial",
              ...(program_name && { program_name }),
            },
          });
          
          if (!retryError && retryData?.user) {
            return NextResponse.json({ 
              success: true, 
              userId: retryData.user.id,
              userType: user_type || "athlete",
            });
          }
        }
        
        return NextResponse.json({ 
          error: "Unable to create account right now. Please try again.",
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: authError.message || "Failed to create account",
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      userId: authData?.user?.id,
      userType: user_type || "athlete",
    });
    
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ 
      error: "Something went wrong. Please try again.",
    }, { status: 500 });
  }
}

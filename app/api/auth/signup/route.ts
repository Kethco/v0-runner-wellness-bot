import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Track if trigger has been fixed this session
let triggerFixed = false;

async function fixDatabaseTrigger(): Promise<boolean> {
  if (triggerFixed) return true;
  
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("No DATABASE_URL available, cannot fix trigger");
    return false;
  }
  
  try {
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    
    // Drop the problematic trigger and create a simpler one that only uses existing columns
    await pool.query(`
      -- First, drop the existing trigger
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      
      -- Create a simpler function that only uses columns that exist
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.profiles (id, first_name, last_name, email, phone, role, plan, created_at)
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
          COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
          NEW.email,
          COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
          COALESCE(NEW.raw_user_meta_data ->> 'role', NEW.raw_user_meta_data ->> 'user_type', 'athlete'),
          COALESCE(NEW.raw_user_meta_data ->> 'plan', 'free_trial'),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
      END;
      $$;
      
      -- Recreate the trigger
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);
    
    await pool.end();
    triggerFixed = true;
    console.log("Database trigger fixed successfully!");
    return true;
  } catch (error) {
    console.error("Failed to fix trigger:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, first_name, last_name, phone, user_type, plan, program_name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Normalize phone number
    const normalizedPhone = phone?.replace(/\D/g, "") || "";
    const formattedPhone = normalizedPhone 
      ? (normalizedPhone.startsWith("1") ? `+${normalizedPhone}` : `+1${normalizedPhone}`)
      : "";

    // Fix the database trigger before creating user
    await fixDatabaseTrigger();

    // Create user directly with Supabase Admin API
    // email_confirm: true skips email verification
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification
      phone: formattedPhone || undefined,
      phone_confirm: true, // Skip phone verification
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
      
      // Check if user already exists
      if (authError.message?.includes("already") || authError.message?.includes("exists")) {
        return NextResponse.json({ 
          error: "An account with this email already exists. Please log in instead.",
        }, { status: 400 });
      }
      
      // If database trigger fails, fix it and retry
      if (authError.message?.includes("Database error")) {
        console.log("Database error detected, fixing trigger and retrying...");
        
        // Reset flag and fix trigger
        triggerFixed = false;
        const fixed = await fixDatabaseTrigger();
        
        if (fixed) {
          // Retry user creation
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
            await createProfile(retryData.user.id, {
              first_name, last_name, email, phone: formattedPhone, user_type, plan, program_name
            });
            
            return NextResponse.json({ 
              success: true, 
              message: "Account created successfully",
              userId: retryData.user.id,
              userType: user_type || "athlete",
            });
          }
          
          console.error("Retry also failed:", retryError);
        }
        
        // Check if user was created despite error
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === email);
        
        if (existingUser) {
          await createProfile(existingUser.id, {
            first_name, last_name, email, phone: formattedPhone, user_type, plan, program_name
          });
          
          return NextResponse.json({ 
            success: true, 
            message: "Account created successfully",
            userId: existingUser.id,
            userType: user_type || "athlete",
          });
        }
        
        return NextResponse.json({ 
          error: "Database setup issue. Please contact support.",
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: authError.message || "Failed to create account",
      }, { status: 500 });
    }

    // Create profile manually (in case trigger doesn't work)
    if (authData?.user) {
      await createProfile(authData.user.id, {
        first_name, last_name, email, phone: formattedPhone, user_type, plan, program_name
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Account created successfully",
      userId: authData?.user?.id,
      userType: user_type || "athlete",
    });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

async function createProfile(userId: string, data: {
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  user_type?: string;
  plan?: string;
  program_name?: string;
}) {
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    email: data.email,
    phone: data.phone,
    role: data.user_type || "athlete",
    plan: data.plan || "free_trial",
    trial_ends_at: data.plan === "coach_athlete" ? null : trialEndsAt,
    created_at: new Date().toISOString(),
  }, { onConflict: "id" });
  
  if (error) {
    console.error("Profile creation error (non-fatal):", error);
  }
}

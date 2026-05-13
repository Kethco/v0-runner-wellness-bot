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
      
      // First, try to create user with Supabase auth
      // The database trigger might fail, so we'll handle profile creation manually if needed
      let authData;
      let authError;
      
      try {
        const result = await supabase.auth.admin.createUser({
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
        authData = result.data;
        authError = result.error;
      } catch (e) {
        console.error("Auth creation exception:", e);
        authError = e;
      }

      // If there's a database error from the trigger, try a different approach
      if (authError && String(authError).includes("Database error")) {
        console.log("Trigger failed, trying signUp approach instead");
        
        // Use regular signUp which doesn't require admin and might skip the trigger
        const { createClient: createAuthClient } = await import("@/lib/supabase/server");
        const authSupabase = await createAuthClient();
        
        const { data: signUpData, error: signUpError } = await authSupabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name,
              last_name,
              phone: formattedPhone,
              user_type,
              role: user_type,
              plan,
              phone_verified: true,
              ...(program_name && { program_name }),
            },
          },
        });
        
        if (signUpError) {
          console.error("SignUp also failed:", signUpError);
          return NextResponse.json({ 
            error: "Failed to create account. Please try again or contact support." 
          }, { status: 500 });
        }
        
        // Manually create profile if user was created
        if (signUpData.user) {
          const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          
          await supabase.from("profiles").upsert({
            id: signUpData.user.id,
            first_name: first_name || "",
            last_name: last_name || "",
            email,
            phone: formattedPhone,
            role: user_type,
            plan,
            trial_ends_at: plan === "coach_athlete" ? null : trialEndsAt,
            created_at: new Date().toISOString(),
          }, { onConflict: "id" });
        }
        
        return NextResponse.json({ 
          success: true, 
          message: "Account created successfully. Please check your email to confirm.",
          userId: signUpData.user?.id,
          userType: user_type,
          requiresEmailConfirm: true,
        });
      }

      if (authError) {
        console.error("Failed to create user:", authError);
        return NextResponse.json({ 
          error: "Failed to create account" 
        }, { status: 500 });
      }

      // Admin createUser succeeded - manually ensure profile exists
      if (authData?.user) {
        const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
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
          // Continue anyway - user exists, profile might be created by trigger
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

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
      
      // Create user with Supabase auth (marking both email and phone as verified)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email verification since phone is verified
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
        return NextResponse.json({ 
          error: authError.message || "Failed to create account" 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: "Account created successfully",
        userId: authData.user?.id,
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

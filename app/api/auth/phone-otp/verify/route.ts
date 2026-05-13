import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { phone, code, userData } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone and code are required" }, { status: 400 });
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, "");
    const formattedPhone = normalizedPhone.startsWith("1") 
      ? `+${normalizedPhone}` 
      : `+1${normalizedPhone}`;

    // Get stored OTP
    const { data: verification, error: fetchError } = await supabase
      .from("phone_verifications")
      .select("*")
      .eq("phone", formattedPhone)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json({ error: "No verification found for this phone" }, { status: 400 });
    }

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json({ error: "Verification code expired. Please request a new one." }, { status: 400 });
    }

    // Check attempts (max 5)
    if (verification.attempts >= 5) {
      return NextResponse.json({ error: "Too many attempts. Please request a new code." }, { status: 400 });
    }

    // Increment attempts
    await supabase
      .from("phone_verifications")
      .update({ attempts: verification.attempts + 1 })
      .eq("phone", formattedPhone);

    // Verify code
    if (verification.otp_code !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // Mark as verified
    await supabase
      .from("phone_verifications")
      .update({ verified: true })
      .eq("phone", formattedPhone);

    // If userData is provided, create the user account
    if (userData) {
      const { email, password, first_name, last_name, user_type, plan, program_name } = userData;
      
      // Create user with Supabase auth (using email but marking phone as verified)
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
          ...(program_name && { program_name }), // Include program name for coaches
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      // Clean up verification record
      await supabase
        .from("phone_verifications")
        .delete()
        .eq("phone", formattedPhone);

      return NextResponse.json({ 
        success: true, 
        message: "Phone verified and account created",
        userId: authData.user?.id,
        userType: user_type,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Phone verified successfully" 
    });
  } catch (error) {
    console.error("Phone verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

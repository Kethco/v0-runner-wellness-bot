import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// In-memory OTP storage (shared with send route via module scope)
// Note: In serverless, this may not persist. For production, create the database table.
const memoryOtpStore = new Map<string, { otp: string; email?: string; expiresAt: number; attempts: number }>();

// Try to get OTP from database, fallback to memory
async function getStoredOTP(phone: string): Promise<{ otp_code: string; expires_at: string; attempts: number } | null> {
  // Try database first
  const { data: verification, error } = await supabase
    .from("phone_verifications")
    .select("*")
    .eq("phone", phone)
    .single();

  if (!error && verification) {
    return verification;
  }

  // Check memory storage
  const memoryData = memoryOtpStore.get(phone);
  if (memoryData) {
    return {
      otp_code: memoryData.otp,
      expires_at: new Date(memoryData.expiresAt).toISOString(),
      attempts: memoryData.attempts,
    };
  }

  return null;
}

// Update attempts in database or memory
async function updateAttempts(phone: string, attempts: number) {
  // Try database
  const { error } = await supabase
    .from("phone_verifications")
    .update({ attempts })
    .eq("phone", phone);

  if (error) {
    // Update memory
    const memoryData = memoryOtpStore.get(phone);
    if (memoryData) {
      memoryData.attempts = attempts;
    }
  }
}

// Clean up verification record
async function cleanupVerification(phone: string) {
  await supabase
    .from("phone_verifications")
    .delete()
    .eq("phone", phone);
  
  memoryOtpStore.delete(phone);
}

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

    // Get stored OTP (database or memory)
    const verification = await getStoredOTP(formattedPhone);

    if (!verification) {
      return NextResponse.json({ error: "No verification found for this phone. Please request a new code." }, { status: 400 });
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
    await updateAttempts(formattedPhone, verification.attempts + 1);

    // Verify code
    if (verification.otp_code !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

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
      await cleanupVerification(formattedPhone);

      return NextResponse.json({ 
        success: true, 
        message: "Phone verified and account created",
        userId: authData.user?.id,
        userType: user_type,
      });
    }

    // Clean up verification record
    await cleanupVerification(formattedPhone);

    return NextResponse.json({ 
      success: true, 
      message: "Phone verified successfully" 
    });
  } catch (error) {
    console.error("Phone verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

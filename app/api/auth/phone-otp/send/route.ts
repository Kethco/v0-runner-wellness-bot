import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_FROM_NUMBER = process.env.TELNYX_FROM_NUMBER || "+18445030386";

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { phone, email } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, "");
    const formattedPhone = normalizedPhone.startsWith("1") 
      ? `+${normalizedPhone}` 
      : `+1${normalizedPhone}`;

    // Generate OTP and expiry (10 minutes)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store OTP in database (upsert to handle retries)
    const { error: dbError } = await supabase
      .from("phone_verifications")
      .upsert({
        phone: formattedPhone,
        email: email || null,
        otp_code: otp,
        expires_at: expiresAt,
        verified: false,
        attempts: 0,
      }, {
        onConflict: "phone"
      });

    if (dbError) {
      console.error("Failed to store OTP:", dbError);
      // If table doesn't exist, create it
      if (dbError.code === "42P01") {
        return NextResponse.json({ 
          error: "Phone verification not set up. Please run the setup SQL." 
        }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to generate verification code" }, { status: 500 });
    }

    // Send SMS via Telnyx
    const response = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TELNYX_API_KEY}`,
      },
      body: JSON.stringify({
        from: TELNYX_FROM_NUMBER,
        to: formattedPhone,
        text: `Your Runner Wellness verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Telnyx error:", error);
      return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Verification code sent",
      phone: formattedPhone.slice(-4) // Return last 4 digits for confirmation
    });
  } catch (error) {
    console.error("Phone OTP error:", error);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}

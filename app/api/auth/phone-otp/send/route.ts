import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_FROM_NUMBER = process.env.TELNYX_FROM_NUMBER || "+18445030386";

// Secret for signing OTP tokens
const OTP_SECRET = process.env.OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "otp-secret-key-runner-wellness";

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create a signed token that includes the OTP, phone, and expiry
// This allows verification without database storage
export function createOtpToken(phone: string, otp: string, expiresAt: number): string {
  const data = `${phone}:${otp}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", OTP_SECRET).update(data).digest("hex");
  return Buffer.from(JSON.stringify({ phone, otp, expiresAt, sig: signature })).toString("base64");
}

// Verify an OTP token (exported for use in verify route)
export function verifyOtpToken(token: string, phone: string, code: string): { valid: boolean; error?: string } {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    
    // Verify signature
    const data = `${decoded.phone}:${decoded.otp}:${decoded.expiresAt}`;
    const expectedSig = crypto.createHmac("sha256", OTP_SECRET).update(data).digest("hex");
    
    if (decoded.sig !== expectedSig) {
      return { valid: false, error: "Invalid token" };
    }
    
    // Check phone matches
    if (decoded.phone !== phone) {
      return { valid: false, error: "Phone mismatch" };
    }
    
    // Check expiry
    if (Date.now() > decoded.expiresAt) {
      return { valid: false, error: "Code expired. Please request a new one." };
    }
    
    // Check OTP matches
    if (decoded.otp !== code) {
      return { valid: false, error: "Invalid code" };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid verification. Please request a new code." };
  }
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
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Create signed token (contains encrypted OTP - no database needed)
    const otpToken = createOtpToken(formattedPhone, otp, expiresAt);

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

    // Return the token to the client - they'll send it back when verifying
    return NextResponse.json({ 
      success: true, 
      message: "Verification code sent",
      phone: formattedPhone,
      otpToken, // Client stores this and sends back during verification
    });
  } catch (error) {
    console.error("Phone OTP error:", error);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}

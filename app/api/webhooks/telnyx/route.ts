import { NextRequest, NextResponse } from "next/server";
import { handleSMSMessage } from "@/lib/sms/handler";

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_FROM_NUMBER = process.env.TELNYX_FROM_NUMBER || "+18445030386";
const TELNYX_PUBLIC_KEY = process.env.TELNYX_PUBLIC_KEY; // For webhook signature verification

interface TelnyxWebhookPayload {
  data: {
    event_type: string;
    id: string;
    occurred_at: string;
    payload: {
      completed_at: string | null;
      cost: { amount: string; currency: string } | null;
      direction: "inbound" | "outbound";
      encoding: string;
      errors: unknown[];
      from: {
        carrier: string;
        line_type: string;
        phone_number: string;
      };
      id: string;
      media: unknown[];
      messaging_profile_id: string;
      organization_id: string;
      parts: number;
      received_at: string;
      record_type: string;
      sent_at: string | null;
      tags: string[];
      text: string;
      to: {
        carrier: string;
        line_type: string;
        phone_number: string;
        status: string;
      }[];
      type: string;
      valid_until: string | null;
      webhook_failover_url: string | null;
      webhook_url: string;
    };
    record_type: string;
  };
  meta: {
    attempt: number;
    delivered_to: string;
  };
}

export async function POST(request: NextRequest) {
  console.log("[SMS] Webhook received");
  
  // Verify webhook signature if public key is configured
  // Telnyx uses Ed25519 signatures - for production, implement full verification
  // See: https://developers.telnyx.com/docs/api/v2/overview#webhook-signing
  const signature = request.headers.get("telnyx-signature-ed25519");
  const timestamp = request.headers.get("telnyx-timestamp");
  
  if (TELNYX_PUBLIC_KEY && (!signature || !timestamp)) {
    console.warn("[SMS] Missing webhook signature headers");
    // In production, you should reject unsigned requests when public key is configured
    // return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }
  
  try {
    const payload: TelnyxWebhookPayload = await request.json();
    console.log("[SMS] Event type:", payload.data?.event_type);
    
    // Only process inbound messages
    if (payload.data.event_type !== "message.received") {
      console.log("[SMS] Not an inbound message, ignoring");
      return NextResponse.json({ received: true });
    }

    const { from, text } = payload.data.payload;
    const fromPhone = from.phone_number;
    const messageText = text;

    console.log(`[SMS] Received from ${fromPhone}: ${messageText}`);

    // Process the message and get response
    const responseText = await handleSMSMessage(fromPhone, messageText);

    // Send response via Telnyx API
    await sendSMS(fromPhone, responseText);

    return NextResponse.json({ received: true, responded: true });
  } catch (error) {
    console.error("[SMS] Webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

async function sendSMS(to: string, text: string) {
  if (!TELNYX_API_KEY) {
    console.error("[SMS] TELNYX_API_KEY not configured");
    return;
  }

  try {
    const response = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TELNYX_API_KEY}`,
      },
      body: JSON.stringify({
        from: TELNYX_FROM_NUMBER,
        to,
        text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[SMS] Failed to send:", errorData);
    } else {
      console.log(`[SMS] Sent to ${to}: ${text.substring(0, 50)}...`);
    }
  } catch (error) {
    console.error("[SMS] Send error:", error);
  }
}

// Handle GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: "Telnyx webhook endpoint active" });
}

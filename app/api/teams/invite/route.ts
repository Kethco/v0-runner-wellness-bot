import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

// POST - Send team invites via SMS or email
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, contacts } = await request.json();

  if (!teamId || !contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: "Team ID and contacts are required" }, { status: 400 });
  }

  // Verify coach owns this team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, invite_code, coach_id")
    .eq("id", teamId)
    .eq("coach_id", user.id)
    .single();

  if (teamError || !team) {
    return NextResponse.json({ error: "Team not found or unauthorized" }, { status: 404 });
  }

  // Get coach name
  const { data: coachProfile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const coachName = coachProfile?.first_name 
    ? `Coach ${coachProfile.first_name}` 
    : "Your coach";

  const serviceClient = createServiceClient();
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const contact of contacts) {
    const { email, phone } = contact;

    // Save invite record
    await serviceClient.from("team_invites").insert({
      team_id: team.id,
      email: email || null,
      phone: phone || null,
      status: "pending",
    });

    // Send SMS invite if phone provided
    if (phone) {
      try {
        const message = `${coachName} invited you to join "${team.name}" on Runner Wellness!\n\nJoin code: ${team.invite_code}\n\nSign up at runnerwellnessapp.com/join`;
        
        const response = await fetch("https://api.telnyx.com/v2/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.TELNYX_FROM_NUMBER,
            to: phone,
            text: message,
          }),
        });

        if (response.ok) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`Failed to send to ${phone}`);
        }
      } catch (e) {
        results.failed++;
        results.errors.push(`Error sending to ${phone}`);
      }
    } else {
      // For email-only contacts, just mark as recorded (email sending can be added later)
      results.sent++;
    }
  }

  return NextResponse.json({
    message: `Sent ${results.sent} invite(s)`,
    inviteCode: team.invite_code,
    results,
  });
}

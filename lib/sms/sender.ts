"use server";

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_FROM_NUMBER = process.env.TELNYX_FROM_NUMBER;

export async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!TELNYX_API_KEY || !TELNYX_FROM_NUMBER) {
    console.error("[SMS] Missing Telnyx credentials");
    return false;
  }

  try {
    const response = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TELNYX_API_KEY}`,
      },
      body: JSON.stringify({
        from: TELNYX_FROM_NUMBER,
        to: to,
        text: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[SMS] Send failed:", error);
      return false;
    }

    console.log(`[SMS] Sent to ${to}: ${message.substring(0, 50)}...`);
    return true;
  } catch (error) {
    console.error("[SMS] Send error:", error);
    return false;
  }
}

export async function sendWelcomeSMS(phone: string, firstName: string, userType: string = "athlete"): Promise<boolean> {
  if (userType === "coach") {
    return sendCoachWelcomeSMS(phone, firstName);
  }
  
  const message = `Welcome to Runner Wellness, ${firstName}!

Track your wellness daily via text:
- "checkin" - Morning wellness check
- "trends" - See your 7-day stats  
- "streak" - View your streak
- "help" - All commands

Reply "checkin" now to start!`;

  return sendSMS(phone, message);
}

export async function sendCoachWelcomeSMS(phone: string, firstName: string): Promise<boolean> {
  const message = `Welcome to Runner Wellness, Coach ${firstName}!

Your Coach Dashboard includes:
- Team overview with all athlete wellness scores
- At-risk alerts when athletes show warning signs
- Weekly team wellness reports
- Individual athlete trend analysis

Invite your athletes from the dashboard to start monitoring their wellness.

Log in at runnerwellnessapp.com/coach to get started.`;

  return sendSMS(phone, message);
}

export async function sendDailyReminderSMS(phone: string, firstName: string, streak: number): Promise<boolean> {
  const streakText = streak > 0 
    ? `You're on a ${streak}-day streak! ` 
    : "";
  
  const message = `Good morning, ${firstName}! ${streakText}Ready to check in?

Reply "checkin" to log your wellness.`;

  return sendSMS(phone, message);
}

export async function sendStreakMilestoneSMS(phone: string, firstName: string, streak: number): Promise<boolean> {
  let milestone = "";
  if (streak === 7) milestone = "1 week";
  else if (streak === 14) milestone = "2 weeks";
  else if (streak === 30) milestone = "1 month";
  else if (streak === 60) milestone = "2 months";
  else if (streak === 90) milestone = "3 months";
  else if (streak === 180) milestone = "6 months";
  else if (streak === 365) milestone = "1 year";
  else return false;

  const message = `Incredible, ${firstName}! 🎉

You just hit a ${milestone} streak (${streak} days)!

Your consistency is building a healthier you. Keep it up!`;

  return sendSMS(phone, message);
}

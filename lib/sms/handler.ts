import { createServiceClient } from "@/lib/supabase/service";
import { CHECKIN_STEPS, AFTERNOON_STEPS, COMMANDS, CheckinSession } from "./types";

export async function handleSMSMessage(phone: string, message: string): Promise<string> {
  const supabase = createServiceClient();
  const normalizedPhone = normalizePhone(phone);
  const text = message.trim().toLowerCase();

  // Find user by phone
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name")
    .eq("phone", normalizedPhone)
    .single();

  if (!profile) {
    return "Welcome to Runner Wellness! To get started, please sign up at our website and link your phone number. Text HELP for more info.";
  }

  // Check for active session
  const { data: session } = await supabase
    .from("sms_sessions")
    .select("*")
    .eq("phone", normalizedPhone)
    .gt("expires_at", new Date().toISOString())
    .single();

  // Handle active check-in session
  if (session?.current_step && session.current_step !== "complete") {
    return await handleCheckinStep(supabase, session, text, profile.id);
  }

  // Handle commands
  switch (text) {
    case "checkin":
    case "check-in":
    case "check in":
      return await startCheckin(supabase, normalizedPhone, profile.id, profile.first_name);

    case "update":
      return await startAfternoonUpdate(supabase, normalizedPhone, profile.id);

    case "trends":
      return await getTrends(supabase, profile.id);

    case "streak":
      return await getStreak(supabase, profile.id);

    case "help":
    case "?":
      return getHelpMessage();

    default:
      return `Hi${profile.first_name ? ` ${profile.first_name}` : ""}! I didn't understand that.\n\nText one of these commands:\n• checkin - Start daily check-in\n• update - Afternoon update\n• trends - View 7-day trends\n• streak - Check your streak\n• help - All commands`;
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^1/, "+1");
}

async function startCheckin(
  supabase: ReturnType<typeof createServiceClient>,
  phone: string,
  userId: string,
  firstName: string | null
): Promise<string> {
  // Check if already checked in today
  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabase
    .from("checkins")
    .select("id")
    .eq("user_id", userId)
    .eq("date", today)
    .eq("is_afternoon_update", false)
    .single();

  if (existing) {
    return "You've already checked in today! Text 'update' for an afternoon energy/soreness update, or 'trends' to see your progress.";
  }

  // Create session
  const sessionData: CheckinSession = { step: "sleep", data: {} };
  await supabase.from("sms_sessions").upsert({
    phone,
    user_id: userId,
    current_step: "sleep",
    session_data: sessionData,
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });

  const greeting = firstName ? `Good morning, ${firstName}!` : "Good morning!";
  return `${greeting} ${CHECKIN_STEPS.sleep.question}`;
}

async function startAfternoonUpdate(
  supabase: ReturnType<typeof createServiceClient>,
  phone: string,
  userId: string
): Promise<string> {
  const sessionData: CheckinSession = { step: "energy", data: {}, isAfternoonUpdate: true };
  await supabase.from("sms_sessions").upsert({
    phone,
    user_id: userId,
    current_step: "energy",
    session_data: sessionData,
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });

  return AFTERNOON_STEPS.energy.question;
}

async function handleCheckinStep(
  supabase: ReturnType<typeof createServiceClient>,
  session: { phone: string; user_id: string; current_step: string; session_data: unknown },
  input: string,
  userId: string
): Promise<string> {
  const sessionData = session.session_data as CheckinSession;
  const isAfternoon = sessionData.isAfternoonUpdate;
  const steps = isAfternoon ? AFTERNOON_STEPS : CHECKIN_STEPS;
  const currentStep = session.current_step as keyof typeof steps;

  // Validate and store response
  const validation = validateInput(currentStep, input);
  if (!validation.valid) {
    return validation.message!;
  }

  // Update session data
  updateSessionData(sessionData, currentStep, validation.value);

  const nextStep = steps[currentStep as keyof typeof steps]?.nextStep;

  if (nextStep === "complete") {
    // Save check-in to database
    await saveCheckin(supabase, userId, sessionData);
    
    // Clear session
    await supabase.from("sms_sessions").delete().eq("phone", session.phone);

    // Get streak
    const { data: streak } = await supabase
      .from("streaks")
      .select("current_streak")
      .eq("user_id", userId)
      .single();

    const streakMsg = streak?.current_streak 
      ? `\n\nStreak: ${streak.current_streak} day${streak.current_streak > 1 ? "s" : ""}!`
      : "";

    return `Check-in complete! Thanks for logging your wellness today.${streakMsg}\n\nText 'trends' to see your progress.`;
  }

  // Update session with next step
  sessionData.step = nextStep as CheckinSession["step"];
  await supabase
    .from("sms_sessions")
    .update({
      current_step: nextStep,
      session_data: sessionData,
    })
    .eq("phone", session.phone);

  return steps[nextStep as keyof typeof steps].question;
}

function validateInput(step: string, input: string): { valid: boolean; value?: unknown; message?: string } {
  switch (step) {
    case "sleep":
    case "energy":
    case "soreness":
    case "readiness": {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > 5) {
        return { valid: false, message: "Please reply with a number from 1 to 5." };
      }
      return { valid: true, value: num };
    }
    case "feeling": {
      const feelings = ["great", "good", "okay", "tired", "exhausted"];
      if (!feelings.includes(input)) {
        return { valid: false, message: "Please reply with: great, good, okay, tired, or exhausted" };
      }
      return { valid: true, value: input };
    }
    case "notes":
      return { valid: true, value: input === "skip" ? null : input };
    default:
      return { valid: true, value: input };
  }
}

function updateSessionData(sessionData: CheckinSession, step: string, value: unknown) {
  switch (step) {
    case "sleep":
      sessionData.data.sleepRating = value as number;
      break;
    case "feeling":
      sessionData.data.feeling = value as string;
      break;
    case "energy":
      sessionData.data.energy = value as number;
      break;
    case "soreness":
      sessionData.data.soreness = value as number;
      break;
    case "readiness":
      sessionData.data.readiness = value as number;
      break;
    case "notes":
      sessionData.data.notes = value as string | undefined;
      break;
  }
}

async function saveCheckin(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  sessionData: CheckinSession
) {
  const checkinData = {
    user_id: userId,
    date: new Date().toISOString().split("T")[0],
    sleep_rating: sessionData.data.sleepRating,
    feeling: sessionData.data.feeling,
    energy: sessionData.data.energy,
    soreness: sessionData.data.soreness,
    readiness: sessionData.data.readiness,
    notes: sessionData.data.notes,
    is_afternoon_update: sessionData.isAfternoonUpdate || false,
  };

  await supabase.from("checkins").insert(checkinData);
}

async function getTrends(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<string> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const { data: checkins } = await supabase
    .from("checkins")
    .select("sleep_rating, energy, soreness, readiness")
    .eq("user_id", userId)
    .eq("is_afternoon_update", false)
    .gte("date", startDate.toISOString().split("T")[0])
    .order("date", { ascending: false });

  if (!checkins || checkins.length === 0) {
    return "No check-ins in the last 7 days. Text 'checkin' to start tracking!";
  }

  const avg = (arr: (number | null)[]) => {
    const valid = arr.filter((n): n is number => n !== null);
    return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : "N/A";
  };

  return `7-Day Averages (${checkins.length} check-ins):\n\nSleep: ${avg(checkins.map(c => c.sleep_rating))}/5\nEnergy: ${avg(checkins.map(c => c.energy))}/5\nSoreness: ${avg(checkins.map(c => c.soreness))}/5\nReadiness: ${avg(checkins.map(c => c.readiness))}/5\n\nKeep it up!`;
}

async function getStreak(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<string> {
  const { data: streak } = await supabase
    .from("streaks")
    .select("current_streak, longest_streak")
    .eq("user_id", userId)
    .single();

  if (!streak) {
    return "Start your streak today! Text 'checkin' to begin.";
  }

  const { current_streak, longest_streak } = streak;
  
  if (current_streak === 0) {
    return `Your streak is at 0. Text 'checkin' to start building it up!\n\nYour best streak: ${longest_streak} days`;
  }

  const milestones = [3, 7, 14, 21, 30, 60, 100];
  const nextMilestone = milestones.find(m => m > current_streak) || current_streak + 10;
  const daysToMilestone = nextMilestone - current_streak;

  return `Current streak: ${current_streak} day${current_streak > 1 ? "s" : ""}!\nBest streak: ${longest_streak} days\n\n${daysToMilestone} more day${daysToMilestone > 1 ? "s" : ""} to reach ${nextMilestone}!`;
}

function getHelpMessage(): string {
  let msg = "Runner Wellness Commands:\n\n";
  for (const [cmd, desc] of Object.entries(COMMANDS)) {
    msg += `• ${cmd} - ${desc}\n`;
  }
  msg += "\nText any command to get started!";
  return msg;
}

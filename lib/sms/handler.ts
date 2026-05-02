import { createServiceClient } from "@/lib/supabase/service";
import { CHECKIN_STEPS, AFTERNOON_STEPS, COMMANDS, CheckinSession } from "./types";
import { generateShortCoachAdvice } from "@/lib/ai/coach";

// Parse run command: "run 5.2" or "run 3.1 8:30" or "run 5 45min easy"
function parseRunCommand(text: string): { miles: number; pace?: string; duration?: number; feeling?: string } | null {
  const match = text.match(/^run\s+([\d.]+)(?:\s+(\d+:\d+))?(?:\s+(\d+)min)?(?:\s+(easy|moderate|hard|race))?$/i);
  if (!match) return null;
  
  const miles = parseFloat(match[1]);
  if (isNaN(miles) || miles <= 0 || miles > 100) return null;
  
  return {
    miles,
    pace: match[2] || undefined,
    duration: match[3] ? parseInt(match[3]) : undefined,
    feeling: match[4]?.toLowerCase() || undefined,
  };
}

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

    case "miles":
      return await getWeeklyMiles(supabase, profile.id);

    case "ai":
    case "coach":
    case "advice":
      return await getAIAdvice(supabase, profile.id, profile.first_name);

    case "help":
    case "?":
      return getHelpMessage();

    default:
      // Check if it's a run command
      if (text.startsWith("run ")) {
        const runData = parseRunCommand(text);
        if (runData) {
          return await logRun(supabase, profile.id, runData, profile.first_name);
        }
        return "To log a run, text: run [miles]\n\nExamples:\n- run 5.2\n- run 3.1 8:30\n- run 5 45min easy";
      }
      
      // Check if it's a join team command
      if (text.startsWith("join ")) {
        const code = text.replace("join ", "").trim().toUpperCase();
        return await joinTeam(supabase, profile.id, code, profile.first_name);
      }
      
      return `Hi${profile.first_name ? ` ${profile.first_name}` : ""}! I didn't understand that.\n\nText one of these commands:\n• checkin - Start daily check-in\n• run 5.2 - Log a run\n• trends - View 7-day trends\n• streak - Check your streak\n• help - All commands`;
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

    // Generate AI coaching advice based on check-in
    let aiAdvice = "";
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", userId)
        .single();
        
      // Get weekly data for AI
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: recentCheckins } = await supabase
        .from("checkins")
        .select("*")
        .eq("user_id", userId)
        .gte("date", weekAgo.toISOString().split("T")[0]);
      
      const { data: recentRuns } = await supabase
        .from("runs")
        .select("miles")
        .eq("user_id", userId)
        .gte("date", weekAgo.toISOString().split("T")[0]);

      const avg = (arr: (number | null | undefined)[]) => {
        const valid = arr.filter((n): n is number => n != null);
        return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : "3";
      };

      const advice = await generateShortCoachAdvice({
        todayCheckin: {
          sleep_quality: sessionData.data.sleepRating || 3,
          energy_level: sessionData.data.energy || 3,
          soreness_level: sessionData.data.soreness || 3,
          readiness_score: sessionData.data.readiness || 3,
          overall_feeling: sessionData.data.feeling,
        },
        weeklyAverages: {
          sleep: avg(recentCheckins?.map(c => c.sleep_rating)),
          energy: avg(recentCheckins?.map(c => c.energy)),
          soreness: avg(recentCheckins?.map(c => c.soreness)),
          readiness: avg(recentCheckins?.map(c => c.readiness)),
        },
        weeklyMiles: recentRuns?.reduce((sum, r) => sum + Number(r.miles), 0) || 0,
        totalRuns: recentRuns?.length || 0,
        firstName: profile?.first_name || undefined,
      });
      
      aiAdvice = `\n\nAI Coach: ${advice}`;
    } catch (e) {
      // AI advice is optional, don't fail the check-in
      console.error("AI advice generation failed:", e);
    }

    return `Check-in complete! Thanks for logging your wellness today.${streakMsg}${aiAdvice}`;
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

async function logRun(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  runData: { miles: number; pace?: string; duration?: number; feeling?: string },
  firstName: string | null
): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  
  await supabase.from("runs").insert({
    user_id: userId,
    date: today,
    miles: runData.miles,
    pace: runData.pace,
    duration_minutes: runData.duration,
    feeling: runData.feeling,
    source: "sms",
  });

  // Get weekly total
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  
  const { data: weekRuns } = await supabase
    .from("runs")
    .select("miles")
    .eq("user_id", userId)
    .gte("date", startOfWeek.toISOString().split("T")[0]);
  
  const weeklyTotal = weekRuns?.reduce((sum, r) => sum + Number(r.miles), 0) || runData.miles;
  
  let response = `Logged ${runData.miles} miles`;
  if (runData.pace) response += ` at ${runData.pace}/mi`;
  if (runData.feeling) response += ` (${runData.feeling})`;
  response += `!\n\nWeekly total: ${weeklyTotal.toFixed(1)} miles`;
  
  return response;
}

async function joinTeam(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  inviteCode: string,
  firstName: string | null
): Promise<string> {
  if (!inviteCode || inviteCode.length < 4) {
    return "To join a team, text: join [CODE]\n\nExample: join ABC123";
  }

  // Find team by invite code
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name")
    .eq("invite_code", inviteCode)
    .single();

  if (teamError || !team) {
    return `Team not found with code "${inviteCode}". Check the code and try again.`;
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", team.id)
    .eq("user_id", userId)
    .single();

  if (existing) {
    return `You're already a member of ${team.name}!`;
  }

  // Add user to team
  const { error: joinError } = await supabase
    .from("team_members")
    .insert({
      team_id: team.id,
      user_id: userId,
      role: "athlete",
    });

  if (joinError) {
    return "Something went wrong. Please try again.";
  }

  return `Welcome to ${team.name}${firstName ? `, ${firstName}` : ""}! Your coach can now see your wellness data and help optimize your training.`;
}

async function getAIAdvice(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  firstName: string | null
): Promise<string> {
  try {
    // Get today's check-in
    const today = new Date().toISOString().split("T")[0];
    const { data: todayCheckin } = await supabase
      .from("checkins")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    // Get last 7 days of check-ins
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: recentCheckins } = await supabase
      .from("checkins")
      .select("*")
      .eq("user_id", userId)
      .gte("date", weekAgo.toISOString().split("T")[0]);

    // Get recent runs
    const { data: recentRuns } = await supabase
      .from("runs")
      .select("miles")
      .eq("user_id", userId)
      .gte("date", weekAgo.toISOString().split("T")[0]);

    const avg = (arr: (number | null | undefined)[]) => {
      const valid = arr.filter((n): n is number => n != null);
      return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : "N/A";
    };

    const weeklyMiles = recentRuns?.reduce((sum, r) => sum + Number(r.miles), 0) || 0;

    const advice = await generateShortCoachAdvice({
      todayCheckin: todayCheckin ? {
        sleep_quality: todayCheckin.sleep_rating || todayCheckin.sleep_quality,
        energy_level: todayCheckin.energy || todayCheckin.energy_level,
        soreness_level: todayCheckin.soreness || todayCheckin.soreness_level,
        readiness_score: todayCheckin.readiness || todayCheckin.readiness_score,
        overall_feeling: todayCheckin.feeling,
      } : undefined,
      weeklyAverages: {
        sleep: avg(recentCheckins?.map(c => c.sleep_rating || c.sleep_quality)),
        energy: avg(recentCheckins?.map(c => c.energy || c.energy_level)),
        soreness: avg(recentCheckins?.map(c => c.soreness || c.soreness_level)),
        readiness: avg(recentCheckins?.map(c => c.readiness || c.readiness_score)),
      },
      weeklyMiles,
      totalRuns: recentRuns?.length || 0,
      firstName: firstName || undefined,
    });

    return `AI Coach:\n\n${advice}`;
  } catch (error) {
    console.error("AI Coach error:", error);
    return "Unable to generate coaching advice right now. Try again later or text 'checkin' to log your wellness first.";
  }
}

async function getWeeklyMiles(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<string> {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  
  const { data: runs } = await supabase
    .from("runs")
    .select("date, miles, pace, feeling")
    .eq("user_id", userId)
    .gte("date", startOfWeek.toISOString().split("T")[0])
    .order("date", { ascending: true });
  
  if (!runs || runs.length === 0) {
    return "No runs logged this week yet.\n\nText 'run 5.2' to log your first run!";
  }
  
  const total = runs.reduce((sum, r) => sum + Number(r.miles), 0);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  let response = `This Week: ${total.toFixed(1)} miles\n\n`;
  runs.forEach(r => {
    const day = days[new Date(r.date).getDay()];
    response += `${day}: ${r.miles}mi`;
    if (r.pace) response += ` (${r.pace})`;
    response += "\n";
  });
  
  return response;
}

function getHelpMessage(): string {
  let msg = "Runner Wellness Commands:\n\n";
  for (const [cmd, desc] of Object.entries(COMMANDS)) {
    msg += `• ${cmd} - ${desc}\n`;
  }
  msg += "\nText any command to get started!";
  return msg;
}

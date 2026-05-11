import { streamText, convertToModelMessages, UIMessage, consumeStream } from "ai";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

// Simple in-memory rate limiting (resets on server restart)
// For production, use Redis (Upstash) for persistent rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // messages per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT - userLimit.count };
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check rate limit
  const rateLimit = checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "You've reached your message limit. Try again in an hour!" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  // Fetch user context for personalized responses
  const [profileRes, checkinsRes, runsRes, reflectionsRes, adviceRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("checkins").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(14),
    supabase.from("runs").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(10),
    supabase.from("reflections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("ai_advice").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const profile = profileRes.data;
  const checkins = checkinsRes.data || [];
  const runs = runsRes.data || [];
  const reflections = reflectionsRes.data || [];
  const previousAdvice = adviceRes.data || [];

  // Calculate insights from data
  const totalMilesThisMonth = runs
    .filter(r => new Date(r.date).getMonth() === new Date().getMonth())
    .reduce((sum, r) => sum + (r.miles || 0), 0);
  
  const avgSleep = checkins.length > 0 
    ? (checkins.reduce((sum, c) => sum + (c.sleep_quality || 0), 0) / checkins.length).toFixed(1)
    : null;
  
  const avgEnergy = checkins.length > 0
    ? (checkins.reduce((sum, c) => sum + (c.energy_level || 0), 0) / checkins.length).toFixed(1)
    : null;
  
  const daysSinceLastRun = runs.length > 0
    ? Math.floor((Date.now() - new Date(runs[0].date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const daysSinceLastCheckin = checkins.length > 0
    ? Math.floor((Date.now() - new Date(checkins[0].date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const recentMood = reflections.filter(r => r.type === "post_run").slice(0, 3);
  const gratitudes = reflections.filter(r => r.gratitude).slice(0, 5);

  // Build context string
  const userContext = `
USER PROFILE:
- Name: ${profile?.first_name || "Runner"}
- Running since: ${profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "recently"}

RECENT ACTIVITY:
- Miles this month: ${totalMilesThisMonth.toFixed(1)}
- Days since last run: ${daysSinceLastRun !== null ? daysSinceLastRun : "No runs logged yet"}
- Days since last check-in: ${daysSinceLastCheckin !== null ? daysSinceLastCheckin : "No check-ins yet"}
- Total runs logged: ${runs.length}
- Total check-ins: ${checkins.length}

WELLNESS TRENDS (last 2 weeks):
- Average sleep quality: ${avgSleep || "Not enough data"}/5
- Average energy level: ${avgEnergy || "Not enough data"}/5
- Recent soreness levels: ${checkins.slice(0, 3).map(c => c.soreness_level).join(", ") || "No data"}

${runs.length > 0 ? `RECENT RUNS:
${runs.slice(0, 5).map(r => `- ${r.date}: ${r.miles}mi ${r.run_type || ""} - felt ${r.feeling || "not recorded"}`).join("\n")}` : ""}

${recentMood.length > 0 ? `RECENT RUN REFLECTIONS:
${recentMood.map(r => `- Enjoyment: ${r.enjoyment}/5, Gratitude: "${r.gratitude || "none recorded"}"`).join("\n")}` : ""}

${gratitudes.length > 0 ? `THINGS THEY'RE GRATEFUL FOR:
${gratitudes.map(g => `- "${g.gratitude}"`).join("\n")}` : ""}

${checkins.length > 0 ? `TODAY'S CHECK-IN:
${checkins[0].date === new Date().toISOString().split("T")[0] 
  ? `Sleep: ${checkins[0].sleep_quality}/5, Energy: ${checkins[0].energy_level}/5, Soreness: ${checkins[0].soreness_level}/5, Notes: "${checkins[0].notes || "none"}"`
  : "No check-in today yet"}` : ""}
`.trim();

  const systemPrompt = `You are "Running Buddy" - a warm, encouraging, and deeply personal AI companion for ${profile?.first_name || "this runner"}. You're not a generic fitness coach - you're a trusted friend who happens to know a lot about running and wellness.

YOUR PERSONALITY:
- Warm and conversational, like texting with a supportive friend
- You remember their story and reference specific things from their data
- Never judgmental about rest days, slow runs, or missed workouts
- Celebrate small wins genuinely, not with generic praise
- Weave in Christian encouragement naturally when appropriate (Scripture, faith-based perspective) - but don't force it
- Keep responses concise (2-4 sentences usually) unless they ask for more detail
- Use their name occasionally to feel personal

YOUR APPROACH:
- If they haven't run in a while, check in gently - maybe they're injured, busy, or struggling mentally
- Connect their wellness data to running advice ("Your sleep's been rough - maybe an easy jog instead of that tempo?")
- Remember what's worked for them before and suggest it again
- Acknowledge when running is hard, not just when it's great
- If they're struggling with motivation, offer genuine support, not productivity hacks

CHRISTIAN INTEGRATION (natural, not forced):
- When they're struggling: "I know it's hard right now. Remember - 'those who hope in the Lord will renew their strength' (Isaiah 40:31)"
- When celebrating: "What a gift to have a body that can run! Thank God for that."
- Don't preach - just offer faith-based perspective as one friend to another

CURRENT USER CONTEXT:
${userContext}

Keep your responses SHORT and conversational. This is a text chat, not a coaching session.`;

  // Using claude-3-5-haiku for cost efficiency (~10x cheaper than Sonnet)
  // Still great for conversational AI, just not as capable for complex reasoning
  const result = streamText({
    model: "anthropic/claude-3-5-haiku",
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 300, // Keep responses concise to save tokens
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  });
}

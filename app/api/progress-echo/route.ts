import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get date range for this week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  const startStr = startOfWeek.toISOString().split("T")[0];
  const endStr = now.toISOString().split("T")[0];

  const wins: { type: string; text: string; date: string; icon: string }[] = [];

  // 1. Check-ins with positive feelings
  const { data: checkins } = await supabase
    .from("checkins")
    .select("date, readiness, energy, notes")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .lte("date", endStr)
    .order("date", { ascending: false });

  if (checkins) {
    const goodCheckins = checkins.filter(c => c.readiness >= 4 || c.energy >= 4);
    if (goodCheckins.length > 0) {
      wins.push({
        type: "energy",
        text: `You had ${goodCheckins.length} high-energy ${goodCheckins.length === 1 ? "day" : "days"} this week`,
        date: goodCheckins[0].date,
        icon: "zap"
      });
    }
    
    // Check-in streak
    if (checkins.length >= 5) {
      wins.push({
        type: "consistency",
        text: `Checked in ${checkins.length} days - showing up for yourself`,
        date: endStr,
        icon: "check"
      });
    }
  }

  // 2. Intentions set
  const { data: intentions } = await supabase
    .from("daily_intentions")
    .select("date, value, custom_note")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .lte("date", endStr);

  if (intentions && intentions.length > 0) {
    const uniqueValues = [...new Set(intentions.map(i => i.value))];
    wins.push({
      type: "intention",
      text: `Set ${intentions.length} daily ${intentions.length === 1 ? "intention" : "intentions"} - focusing on ${uniqueValues.slice(0, 2).join(" & ")}`,
      date: intentions[0].date,
      icon: "target"
    });
  }

  // 3. Post-run reflections with gratitude
  const { data: reflections } = await supabase
    .from("reflections")
    .select("date, type, enjoyment, gratitude")
    .eq("user_id", user.id)
    .eq("type", "post-run")
    .gte("date", startStr)
    .lte("date", endStr);

  if (reflections) {
    const withGratitude = reflections.filter(r => r.gratitude && r.gratitude.length > 0);
    if (withGratitude.length > 0) {
      wins.push({
        type: "gratitude",
        text: `Found gratitude in ${withGratitude.length} ${withGratitude.length === 1 ? "run" : "runs"} this week`,
        date: withGratitude[0].date,
        icon: "heart"
      });
    }
    
    const enjoyedRuns = reflections.filter(r => r.enjoyment >= 4);
    if (enjoyedRuns.length > 0) {
      wins.push({
        type: "joy",
        text: `Truly enjoyed ${enjoyedRuns.length} ${enjoyedRuns.length === 1 ? "run" : "runs"} - running for the love of it`,
        date: enjoyedRuns[0].date,
        icon: "smile"
      });
    }
  }

  // 4. Resilience journal entries
  const { data: resilience } = await supabase
    .from("resilience_journal")
    .select("date, mood_before, mood_after, kindness_completed")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .lte("date", endStr);

  if (resilience && resilience.length > 0) {
    const moodImprovements = resilience.filter(r => r.mood_after && r.mood_before && r.mood_after > r.mood_before);
    if (moodImprovements.length > 0) {
      wins.push({
        type: "resilience",
        text: `Practiced self-compassion ${resilience.length} ${resilience.length === 1 ? "time" : "times"} and lifted your mood`,
        date: resilience[0].date,
        icon: "shield"
      });
    }
    
    const kindnessCompleted = resilience.filter(r => r.kindness_completed);
    if (kindnessCompleted.length > 0) {
      wins.push({
        type: "kindness",
        text: `Completed ${kindnessCompleted.length} self-kindness ${kindnessCompleted.length === 1 ? "action" : "actions"}`,
        date: kindnessCompleted[0].date,
        icon: "sparkles"
      });
    }
  }

  // 5. Runs with notes (mindful running)
  const { data: runs } = await supabase
    .from("runs")
    .select("date, notes, feeling")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .lte("date", endStr);

  if (runs) {
    const runsWithNotes = runs.filter(r => r.notes && r.notes.length > 20);
    if (runsWithNotes.length > 0) {
      wins.push({
        type: "mindful",
        text: `Reflected mindfully on ${runsWithNotes.length} ${runsWithNotes.length === 1 ? "run" : "runs"}`,
        date: runsWithNotes[0].date,
        icon: "brain"
      });
    }
    
    const greatRuns = runs.filter(r => r.feeling === "great" || r.feeling === "strong");
    if (greatRuns.length > 0) {
      wins.push({
        type: "feeling",
        text: `Felt great on ${greatRuns.length} ${greatRuns.length === 1 ? "run" : "runs"} this week`,
        date: greatRuns[0].date,
        icon: "sun"
      });
    }
  }

  // Sort by most impactful/recent
  const priorityOrder = ["resilience", "gratitude", "joy", "intention", "energy", "consistency", "mindful", "kindness", "feeling"];
  wins.sort((a, b) => priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type));

  return NextResponse.json({
    wins: wins.slice(0, 5), // Max 5 wins
    weekStart: startStr,
    weekEnd: endStr,
    totalWins: wins.length
  });
}

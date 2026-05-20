import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get last 30 days of check-ins with associated runs
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: checkins } = await supabase
    .from("checkins")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  const { data: runs } = await supabase
    .from("runs")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  const { data: reflections } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

  if (!checkins || checkins.length < 3) {
    return NextResponse.json({ 
      patterns: [],
      message: "Keep checking in! We need a few more days of data to find your patterns.",
      dataPoints: checkins?.length || 0
    });
  }

  const patterns: { 
    type: string; 
    insight: string; 
    strength: "strong" | "moderate" | "emerging";
    icon: string;
    color: string;
  }[] = [];

  // Pattern 1: Energy after rest days
  const restDayFollowups = checkins.filter((c, i) => {
    if (i === checkins.length - 1) return false;
    const prevDate = new Date(checkins[i + 1]?.date);
    const currDate = new Date(c.date);
    const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    // Check if previous day had no run (rest day)
    const prevDayRun = runs?.find(r => r.date === checkins[i + 1]?.date);
    return dayDiff === 1 && !prevDayRun;
  });
  
  if (restDayFollowups.length >= 2) {
    const avgEnergyAfterRest = restDayFollowups.reduce((sum, c) => sum + (c.energy || 3), 0) / restDayFollowups.length;
    const overallAvgEnergy = checkins.reduce((sum, c) => sum + (c.energy || 3), 0) / checkins.length;
    
    if (avgEnergyAfterRest > overallAvgEnergy + 0.5) {
      patterns.push({
        type: "rest_recovery",
        insight: "Your energy is noticeably higher after rest days. Your body responds well to recovery.",
        strength: avgEnergyAfterRest > overallAvgEnergy + 1 ? "strong" : "moderate",
        icon: "battery",
        color: "#32D74B"
      });
    }
  }

  // Pattern 2: Mood after easy vs hard runs
  if (runs && runs.length >= 3) {
    const easyRuns = runs.filter(r => r.workout_type === "easy" || r.workout_type === "recovery");
    const hardRuns = runs.filter(r => r.workout_type === "tempo" || r.workout_type === "interval" || r.workout_type === "long");
    
    const getNextDayCheckin = (runDate: string) => {
      const nextDay = new Date(runDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return checkins?.find(c => c.date === nextDay.toISOString().split("T")[0]);
    };

    const easyRunFollowups = easyRuns.map(r => getNextDayCheckin(r.date)).filter(Boolean);
    const hardRunFollowups = hardRuns.map(r => getNextDayCheckin(r.date)).filter(Boolean);

    if (easyRunFollowups.length >= 2) {
      const avgMoodAfterEasy = easyRunFollowups.reduce((sum, c) => sum + (c?.readiness || 3), 0) / easyRunFollowups.length;
      const avgMoodAfterHard = hardRunFollowups.length > 0 
        ? hardRunFollowups.reduce((sum, c) => sum + (c?.readiness || 3), 0) / hardRunFollowups.length
        : 3;

      if (avgMoodAfterEasy > avgMoodAfterHard + 0.5) {
        patterns.push({
          type: "easy_run_mood",
          insight: "You tend to feel mentally stronger the day after easy runs. Consider more easy days when stressed.",
          strength: "moderate",
          icon: "smile",
          color: "#FFD60A"
        });
      }
    }
  }

  // Pattern 3: Morning vs evening runner
  if (runs && runs.length >= 5) {
    const morningRuns = runs.filter(r => {
      const hour = new Date(r.created_at).getHours();
      return hour < 12;
    });
    const eveningRuns = runs.filter(r => {
      const hour = new Date(r.created_at).getHours();
      return hour >= 17;
    });

    if (morningRuns.length > eveningRuns.length * 2 && morningRuns.length >= 3) {
      patterns.push({
        type: "time_preference",
        insight: "You're a morning runner! Studies show morning exercise can boost mood and focus throughout the day.",
        strength: "strong",
        icon: "sunrise",
        color: "#FF9F0A"
      });
    } else if (eveningRuns.length > morningRuns.length * 2 && eveningRuns.length >= 3) {
      patterns.push({
        type: "time_preference", 
        insight: "You prefer evening runs. This can help process the day's stress and improve sleep quality.",
        strength: "strong",
        icon: "sunset",
        color: "#AF52DE"
      });
    }
  }

  // Pattern 4: Soreness and consistency
  const highSorenessDays = checkins.filter(c => c.soreness && c.soreness >= 4);
  const lowSorenessDays = checkins.filter(c => c.soreness && c.soreness <= 2);
  
  if (lowSorenessDays.length > highSorenessDays.length * 2 && checkins.length >= 7) {
    patterns.push({
      type: "soreness_management",
      insight: "Your soreness levels stay low - great recovery habits! Keep up whatever you're doing.",
      strength: "strong",
      icon: "heart",
      color: "#FF375F"
    });
  } else if (highSorenessDays.length >= 3) {
    patterns.push({
      type: "soreness_warning",
      insight: "You've had several high-soreness days recently. Consider adding more recovery or reducing intensity.",
      strength: "moderate",
      icon: "alert",
      color: "#FF9F0A"
    });
  }

  // Pattern 5: Gratitude correlation
  if (reflections && reflections.length >= 3) {
    const gratitudeReflections = reflections.filter(r => r.gratitude && r.gratitude.length > 10);
    const avgEnjoymentWithGratitude = gratitudeReflections.length > 0
      ? gratitudeReflections.reduce((sum, r) => sum + (r.enjoyment || 3), 0) / gratitudeReflections.length
      : 0;
    const avgEnjoymentOverall = reflections.reduce((sum, r) => sum + (r.enjoyment || 3), 0) / reflections.length;

    if (gratitudeReflections.length >= 2 && avgEnjoymentWithGratitude > avgEnjoymentOverall + 0.3) {
      patterns.push({
        type: "gratitude_boost",
        insight: "When you note gratitude after runs, your enjoyment ratings are higher. Mindfulness is working for you!",
        strength: "moderate",
        icon: "sparkles",
        color: "#5E5CE6"
      });
    }
  }

  // Pattern 6: Sleep impact
  const goodSleepDays = checkins.filter(c => c.sleep_rating && c.sleep_rating >= 4);
  const poorSleepDays = checkins.filter(c => c.sleep_rating && c.sleep_rating <= 2);
  
  if (goodSleepDays.length >= 3 && poorSleepDays.length >= 2) {
    const avgEnergyGoodSleep = goodSleepDays.reduce((sum, c) => sum + (c.energy || 3), 0) / goodSleepDays.length;
    const avgEnergyPoorSleep = poorSleepDays.reduce((sum, c) => sum + (c.energy || 3), 0) / poorSleepDays.length;

    if (avgEnergyGoodSleep > avgEnergyPoorSleep + 0.8) {
      patterns.push({
        type: "sleep_energy",
        insight: `Sleep significantly impacts your running energy. Good sleep = ${(avgEnergyGoodSleep - avgEnergyPoorSleep).toFixed(1)} higher energy rating.`,
        strength: "strong",
        icon: "moon",
        color: "#64D2FF"
      });
    }
  }

  // Sort by strength
  const strengthOrder = { strong: 0, moderate: 1, emerging: 2 };
  patterns.sort((a, b) => strengthOrder[a.strength] - strengthOrder[b.strength]);

  return NextResponse.json({
    patterns: patterns.slice(0, 4), // Max 4 patterns
    dataPoints: checkins.length,
    runsAnalyzed: runs?.length || 0,
    message: patterns.length > 0 
      ? "Here's what we've learned about your running wellness:"
      : "Keep tracking! Patterns will emerge as we gather more data."
  });
}

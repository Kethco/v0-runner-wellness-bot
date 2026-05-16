import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface CheckIn {
  id: string;
  date: string;
  sleep_rating: number;
  sleep_hours?: number;
  energy: number;
  soreness: number;
  readiness: number;
  feeling?: string;
  created_at: string;
}

interface Run {
  id: string;
  date: string;
  miles: number;
  duration_minutes?: number;
  run_type?: string;
  effort_level?: number;
}

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get last 30 days of check-ins and runs for pattern analysis
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const [checkinsRes, runsRes, goalsRes] = await Promise.all([
    supabase
      .from("checkins")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", thirtyDaysAgoStr)
      .order("date", { ascending: false }),
    supabase
      .from("runs")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", thirtyDaysAgoStr)
      .order("date", { ascending: false }),
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(3),
  ]);

  const checkins: CheckIn[] = checkinsRes.data || [];
  const runs: Run[] = runsRes.data || [];
  const goals = goalsRes.data || [];

  // Calculate Readiness Score (today)
  const todayStr = new Date().toISOString().split("T")[0];
  const todayCheckin = checkins.find(c => c.date === todayStr);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const yesterdayRun = runs.find(r => r.date?.split("T")[0] === yesterdayStr);
  
  // Get recent runs for recovery calculation
  const last3DaysRuns = runs.filter(r => {
    const runDate = new Date(r.date);
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
    return runDate >= threeDaysAgo;
  });
  const recentMiles = last3DaysRuns.reduce((sum, r) => sum + (r.miles || 0), 0);
  const hardRunsRecently = last3DaysRuns.filter(r => 
    r.run_type === "tempo" || r.run_type === "intervals" || r.run_type === "race" || (r.effort_level && r.effort_level >= 4)
  ).length;

  // Calculate readiness score (0-100)
  let readinessScore = 70; // Base score
  
  if (todayCheckin) {
    // Sleep impact (0-15 points)
    readinessScore += (todayCheckin.sleep_rating - 3) * 5;
    
    // Energy impact (0-15 points)
    readinessScore += (todayCheckin.energy - 3) * 5;
    
    // Soreness impact (negative) - high soreness reduces score
    readinessScore -= (todayCheckin.soreness - 1) * 4;
    
    // Self-reported readiness
    readinessScore += (todayCheckin.readiness - 3) * 3;
  }
  
  // Recent training load impact
  if (recentMiles > 20) readinessScore -= 5;
  if (hardRunsRecently >= 2) readinessScore -= 8;
  if (hardRunsRecently >= 3) readinessScore -= 10;
  
  // Rest day bonus
  if (!yesterdayRun) readinessScore += 5;
  
  // Clamp to 0-100
  readinessScore = Math.max(0, Math.min(100, readinessScore));

  // Determine readiness label
  let readinessLabel = "Moderate";
  let readinessColor = "#FFD60A";
  let readinessAdvice = "Listen to your body today.";
  
  if (readinessScore >= 85) {
    readinessLabel = "Peak";
    readinessColor = "#30D158";
    readinessAdvice = "Great day for a hard workout or long run!";
  } else if (readinessScore >= 70) {
    readinessLabel = "Good";
    readinessColor = "#32D74B";
    readinessAdvice = "You're ready for a solid training session.";
  } else if (readinessScore >= 50) {
    readinessLabel = "Moderate";
    readinessColor = "#FFD60A";
    readinessAdvice = "Consider an easy run or active recovery.";
  } else {
    readinessLabel = "Recovery";
    readinessColor = "#FF9500";
    readinessAdvice = "Rest or very light activity recommended.";
  }

  // Pattern Detection - analyze trends
  const patterns: string[] = [];
  
  // Day-of-week analysis
  const dayStats: Record<string, { totalEnergy: number; count: number; totalMiles: number }> = {};
  checkins.forEach(c => {
    const dayName = new Date(c.date).toLocaleDateString("en-US", { weekday: "long" });
    if (!dayStats[dayName]) dayStats[dayName] = { totalEnergy: 0, count: 0, totalMiles: 0 };
    dayStats[dayName].totalEnergy += c.energy || 0;
    dayStats[dayName].count += 1;
  });
  
  runs.forEach(r => {
    const dayName = new Date(r.date).toLocaleDateString("en-US", { weekday: "long" });
    if (dayStats[dayName]) {
      dayStats[dayName].totalMiles += r.miles || 0;
    }
  });

  // Find best/worst energy days
  let bestDay = "";
  let worstDay = "";
  let bestAvg = 0;
  let worstAvg = 5;
  
  Object.entries(dayStats).forEach(([day, stats]) => {
    if (stats.count >= 2) {
      const avg = stats.totalEnergy / stats.count;
      if (avg > bestAvg) { bestAvg = avg; bestDay = day; }
      if (avg < worstAvg) { worstAvg = avg; worstDay = day; }
    }
  });
  
  if (bestDay && bestAvg > 3.5) {
    patterns.push(`You tend to feel most energized on ${bestDay}s`);
  }
  if (worstDay && worstAvg < 2.5) {
    patterns.push(`${worstDay}s tend to be lower energy days for you`);
  }

  // Sleep-performance correlation
  const goodSleepRuns = runs.filter(r => {
    const checkin = checkins.find(c => c.date === r.date?.split("T")[0]);
    return checkin && checkin.sleep_rating >= 4;
  });
  const poorSleepRuns = runs.filter(r => {
    const checkin = checkins.find(c => c.date === r.date?.split("T")[0]);
    return checkin && checkin.sleep_rating <= 2;
  });
  
  if (goodSleepRuns.length >= 3 && poorSleepRuns.length >= 2) {
    const avgGoodSleep = goodSleepRuns.reduce((sum, r) => sum + r.miles, 0) / goodSleepRuns.length;
    const avgPoorSleep = poorSleepRuns.reduce((sum, r) => sum + r.miles, 0) / poorSleepRuns.length;
    if (avgGoodSleep > avgPoorSleep * 1.2) {
      patterns.push("Your best runs happen when you sleep 7+ hours");
    }
  }

  // Long run fatigue pattern
  const longRuns = runs.filter(r => r.miles >= 8);
  if (longRuns.length >= 2) {
    let fatigueAfterLong = 0;
    longRuns.forEach(longRun => {
      const nextDay = new Date(longRun.date);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split("T")[0];
      const nextCheckin = checkins.find(c => c.date === nextDayStr);
      if (nextCheckin && (nextCheckin.energy <= 2 || nextCheckin.soreness >= 4)) {
        fatigueAfterLong++;
      }
    });
    if (fatigueAfterLong >= 2) {
      patterns.push("You tend to feel tired after long runs - plan recovery days accordingly");
    }
  }

  // Streak correlation
  const { data: streakData } = await supabase
    .from("streaks")
    .select("current_streak")
    .eq("user_id", user.id)
    .single();
  
  const currentStreak = streakData?.current_streak || 0;
  if (currentStreak >= 7) {
    patterns.push(`Your ${currentStreak}-day streak shows great consistency!`);
  }

  // Correlations for the insights card
  const correlations: Array<{
    type: string;
    insight: string;
    strength: "strong" | "moderate" | "weak";
  }> = [];

  // Calculate weekly averages for trends
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];
  
  const thisWeekCheckins = checkins.filter(c => c.date >= weekAgoStr);
  const lastWeekCheckins = checkins.filter(c => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return c.date >= twoWeeksAgo.toISOString().split("T")[0] && c.date < weekAgoStr;
  });

  if (thisWeekCheckins.length >= 3 && lastWeekCheckins.length >= 3) {
    const thisWeekAvgEnergy = thisWeekCheckins.reduce((s, c) => s + c.energy, 0) / thisWeekCheckins.length;
    const lastWeekAvgEnergy = lastWeekCheckins.reduce((s, c) => s + c.energy, 0) / lastWeekCheckins.length;
    
    if (thisWeekAvgEnergy > lastWeekAvgEnergy + 0.5) {
      correlations.push({
        type: "energy",
        insight: "Your energy levels are improving this week",
        strength: "strong",
      });
    } else if (thisWeekAvgEnergy < lastWeekAvgEnergy - 0.5) {
      correlations.push({
        type: "energy",
        insight: "Energy dipping - consider more rest",
        strength: "moderate",
      });
    }
  }

  // Weekly mileage trend
  const thisWeekRuns = runs.filter(r => r.date?.split("T")[0] >= weekAgoStr);
  const thisWeekMiles = thisWeekRuns.reduce((s, r) => s + r.miles, 0);

  // Recovery suggestions based on current state
  const recoverySuggestions: string[] = [];
  
  if (todayCheckin) {
    if (todayCheckin.soreness >= 4) {
      recoverySuggestions.push("Foam rolling or light stretching recommended");
      recoverySuggestions.push("Consider an ice bath or contrast shower");
    }
    if (todayCheckin.sleep_rating <= 2) {
      recoverySuggestions.push("Prioritize sleep tonight - aim for 8+ hours");
      recoverySuggestions.push("Avoid caffeine after 2pm");
    }
    if (todayCheckin.energy <= 2) {
      recoverySuggestions.push("A short walk may boost energy more than a hard run");
      recoverySuggestions.push("Check hydration and nutrition");
    }
  }

  if (hardRunsRecently >= 2) {
    recoverySuggestions.push("You've had multiple hard efforts recently - active recovery advised");
  }

  return NextResponse.json({
    readiness: {
      score: Math.round(readinessScore),
      label: readinessLabel,
      color: readinessColor,
      advice: readinessAdvice,
      hasCheckedIn: !!todayCheckin,
    },
    patterns: patterns.slice(0, 4), // Max 4 patterns
    correlations,
    recoverySuggestions: recoverySuggestions.slice(0, 3),
    weeklyStats: {
      miles: thisWeekMiles,
      runs: thisWeekRuns.length,
      avgEnergy: thisWeekCheckins.length > 0 
        ? (thisWeekCheckins.reduce((s, c) => s + c.energy, 0) / thisWeekCheckins.length).toFixed(1)
        : null,
      avgSleep: thisWeekCheckins.length > 0
        ? (thisWeekCheckins.reduce((s, c) => s + c.sleep_rating, 0) / thisWeekCheckins.length).toFixed(1)
        : null,
    },
    goals: goals.map(g => ({
      type: g.goal_type,
      target: g.target_value,
      date: g.target_date,
    })),
  });
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateCoachAdvice } from "@/lib/ai/coach";
import { getServerToday, getServerYesterday } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "30");
  const offset = parseInt(searchParams.get("offset") || "0");

  // Find the user's profile to get the correct user_id for SMS check-ins
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  // Use profile.id if exists, otherwise fall back to auth user.id
  const userId = profile?.id || user.id;

  const { data: checkins, error } = await supabase
    .from("checkins")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ checkins });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  
  // Map feeling values to match database constraint
  // The DB constraint expects: "great", "good", "okay", "tired", "exhausted"
  const feelingMap: Record<string, string> = {
    "low": "tired",
    "fine": "okay",
    "ok": "okay",
    "good": "good",
    "great": "great",
    "tired": "tired",
    "exhausted": "exhausted",
    "okay": "okay",
  };
  
  // Normalize feeling value to match DB constraint
  let feelingValue: string | undefined = undefined;
  if (body.feeling) {
    const rawFeeling = String(body.feeling).toLowerCase();
    feelingValue = feelingMap[rawFeeling] || "okay";
  }
  
  const checkinData = {
    user_id: user.id,
    date: body.date || new Date().toISOString().split("T")[0],
    sleep_rating: body.sleepRating,
    sleep_hours: body.sleepHours,
    feeling: feelingValue,
    energy: typeof body.energy === 'string' ? parseInt(body.energy) || 3 : body.energy,
    soreness: typeof body.soreness === 'string' ? parseInt(body.soreness) || 1 : body.soreness,
    soreness_location: body.sorenessLocation,
    readiness: typeof body.readiness === 'string' ? parseInt(body.readiness) || 3 : body.readiness,
    notes: body.notes,
    is_afternoon_update: body.isAfternoonUpdate || false,
  };

  const { data: checkin, error } = await supabase
    .from("checkins")
    .insert(checkinData)
    .select()
    .single();

  if (error) {
    // Handle duplicate check-in for the day
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You have already checked in today" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update streak
  const today = getServerToday();
  const yesterday = getServerYesterday();
  
  try {
    // Get current streak
    const { data: currentStreak } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (currentStreak) {
      // Check if this continues the streak
      const lastDate = currentStreak.last_checkin_date;
      let newStreak = currentStreak.current_streak;
      
      if (lastDate === today) {
        // Already checked in today, keep current streak
        newStreak = currentStreak.current_streak;
      } else if (lastDate === yesterday) {
        // Continuing streak from yesterday
        newStreak = currentStreak.current_streak + 1;
      } else {
        // Streak broken (missed a day or more), but today counts as day 1
        newStreak = 1;
      }
      
      await supabase
        .from("streaks")
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, currentStreak.longest_streak),
          last_checkin_date: today,
        })
        .eq("user_id", user.id);
    } else {
      // First check-in, create streak
      await supabase
        .from("streaks")
        .insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_checkin_date: today,
        });
    }
  } catch (streakError) {
    console.error("Streak update failed:", streakError);
    // Don't fail the whole check-in if streak update fails
  }

  // Generate AI coaching advice based on check-in
  let aiAdvice = null;
  try {
    // Get recent data for AI
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const [checkinsRes, runsRes, goalsRes, streakRes, profileRes, trainingPlanRes, lifeEventsRes] = await Promise.all([
      supabase
        .from("checkins")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", weekAgo.toISOString().split("T")[0]),
      supabase
        .from("runs")
        .select("miles, run_type, effort_level, date")
        .eq("user_id", user.id)
        .gte("date", weekAgo.toISOString().split("T")[0])
        .order("date", { ascending: false }),
      supabase
        .from("goals")
        .select("goal_type, target_value, target_date")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(3),
      supabase
        .from("streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single(),
      // Fetch active training plan with weekly structure
      supabase
        .from("training_plans")
        .select("id, plan_type, start_date, weekly_structure")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
      // Fetch upcoming life events
      supabase
        .from("life_events")
        .select("event_type, title, start_date, end_date, training_impact, can_run")
        .eq("user_id", user.id)
        .gte("end_date", today)
        .order("start_date", { ascending: true })
        .limit(5),
    ]);

    const recentCheckins = checkinsRes.data || [];
    const recentRuns = runsRes.data || [];
    const goals = goalsRes.data || [];
    const currentStreak = streakRes.data?.current_streak || 0;
    const firstName = profileRes.data?.first_name;
    const trainingPlan = trainingPlanRes.data;
    const lifeEvents = lifeEventsRes.data || [];

    // Calculate hard runs in last 3 days
    const hardRunsLast3Days = recentRuns.filter(r => {
      const runDate = new Date(r.date);
      return runDate >= threeDaysAgo && 
        (r.run_type === 'tempo' || r.run_type === 'intervals' || r.run_type === 'race' || (r.effort_level && r.effort_level >= 4));
    }).length;

    // Get last run type
    const lastRunType = recentRuns[0]?.run_type;

    // Calculate days until next race goal
    let daysUntilRace: number | undefined;
    const raceGoal = goals.find(g => g.goal_type?.toLowerCase().includes('race') || g.goal_type?.toLowerCase().includes('marathon') || g.goal_type?.toLowerCase().includes('5k') || g.goal_type?.toLowerCase().includes('10k'));
    if (raceGoal?.target_date) {
      const raceDate = new Date(raceGoal.target_date);
      daysUntilRace = Math.ceil((raceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }

    // Calculate readiness score
    let readinessScore = 70;
    if (body.sleepRating) readinessScore += (body.sleepRating - 3) * 5;
    if (body.energy) readinessScore += (body.energy - 3) * 5;
    if (body.soreness) readinessScore -= (body.soreness - 1) * 4;
    if (body.readiness) readinessScore += (body.readiness - 3) * 3;
    if (hardRunsLast3Days >= 2) readinessScore -= 8;
    readinessScore = Math.max(0, Math.min(100, readinessScore));

    // Build training plan context for AI
    let trainingPlanContext = undefined;
    if (trainingPlan && trainingPlan.weekly_structure) {
      const startDate = new Date(trainingPlan.start_date);
      const daysSinceStart = Math.floor((new Date().getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      const currentWeekNumber = daysSinceStart < 0 ? 1 : Math.floor(daysSinceStart / 7) + 1;
      
      const weekStructure = trainingPlan.weekly_structure as any[];
      const currentWeek = weekStructure.find((w: any) => w.weekNumber === currentWeekNumber);
      
      if (currentWeek) {
        // Find today's workout
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayDayName = dayNames[new Date().getDay()];
        const todayWorkout = currentWeek.workouts?.find((w: any) => w.dayOfWeek === todayDayName);
        
        // Calculate weekly progress
        const plannedMilesThisWeek = currentWeek.workouts?.reduce((sum: number, w: any) => sum + (w.targetMiles || 0), 0) || 0;
        const completedMilesThisWeek = recentRuns
          .filter(r => {
            const runDate = new Date(r.date);
            const weekStart = new Date(startDate);
            weekStart.setDate(weekStart.getDate() + (currentWeekNumber - 1) * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return runDate >= weekStart && runDate <= weekEnd;
          })
          .reduce((sum, r) => sum + Number(r.miles), 0);
        
        trainingPlanContext = {
          planType: trainingPlan.plan_type,
          currentWeek: currentWeekNumber,
          totalWeeks: weekStructure.length,
          weekType: currentWeek.weekType || "training",
          weekFocus: currentWeek.weekFocus || currentWeek.theme || "",
          todayWorkout: todayWorkout ? {
            type: todayWorkout.workoutType,
            title: todayWorkout.title,
            targetMiles: todayWorkout.targetMiles,
            description: todayWorkout.description,
          } : undefined,
          plannedMilesThisWeek,
          completedMilesThisWeek,
        };
      }
    }

    // Build life events context for AI
    const upcomingEvents = lifeEvents.map(event => ({
      type: event.event_type,
      title: event.title || event.event_type,
      startDate: event.start_date,
      daysAway: Math.ceil((new Date(event.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      trainingImpact: event.training_impact || (event.can_run ? "reduced" : "no_training"),
    }));
    
    const avg = (arr: (number | null | undefined)[]) => {
      const valid = arr.filter((n): n is number => n != null);
      return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : "3";
    };

    aiAdvice = await generateCoachAdvice({
      todayCheckin: {
        sleep_quality: body.sleepRating || 3,
        energy_level: body.energy || 3,
        soreness_level: body.soreness || 1,
        readiness_score: body.readiness || 3,
        overall_feeling: body.feeling,
        notes: body.notes,
      },
      weeklyAverages: {
        sleep: avg(recentCheckins?.map(c => c.sleep_rating)),
        energy: avg(recentCheckins?.map(c => c.energy)),
        soreness: avg(recentCheckins?.map(c => c.soreness)),
        readiness: avg(recentCheckins?.map(c => c.readiness)),
      },
      weeklyMiles: recentRuns?.reduce((sum, r) => sum + Number(r.miles), 0) || 0,
      totalRuns: recentRuns?.length || 0,
      firstName,
      currentStreak,
      readinessScore: Math.round(readinessScore),
      hardRunsLast3Days,
      lastRunType,
      daysUntilRace,
      goals: goals.map(g => ({
        goal_type: g.goal_type,
        target_value: g.target_value,
        target_date: g.target_date,
      })),
      trainingPlan: trainingPlanContext,
      upcomingEvents: upcomingEvents.length > 0 ? upcomingEvents : undefined,
    });

    // Save AI advice to database so it persists
    if (aiAdvice) {
      await supabase.from("ai_advice").insert({
        user_id: user.id,
        advice: aiAdvice,
        checkin_id: checkin.id,
        source: "app",
      });
    }
  } catch (aiError) {
    console.error("AI advice generation failed:", aiError);
  }

  return NextResponse.json({ checkin, aiAdvice }, { status: 201 });
}

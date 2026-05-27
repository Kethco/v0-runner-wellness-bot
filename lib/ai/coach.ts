import { generateText } from 'ai'

interface WellnessData {
  todayCheckin?: {
    sleep_quality: number
    energy_level: number
    soreness_level: number
    readiness_score: number
    overall_feeling?: string
    notes?: string
  }
  weeklyAverages: {
    sleep: string
    energy: string
    soreness: string
    readiness: string
  }
  weeklyMiles: number
  totalRuns: number
  goals?: Array<{
    goal_type: string
    target_value: string
    target_date: string
  }>
  firstName?: string
  // New context fields
  currentStreak?: number
  recentPatterns?: string[]
  readinessScore?: number
  hardRunsLast3Days?: number
  lastRunType?: string
  daysUntilRace?: number
  // Training Plan Context
  trainingPlan?: {
    planType: string
    currentWeek: number
    totalWeeks: number
    weekType: string
    weekFocus: string
    todayWorkout?: {
      type: string
      title: string
      targetMiles: number
      description: string
    }
    plannedMilesThisWeek: number
    completedMilesThisWeek: number
  }
  // Life Events Context
  upcomingEvents?: Array<{
    type: string
    title: string
    startDate: string
    daysAway: number
    trainingImpact: string
  }>
}

export async function generateCoachAdvice(data: WellnessData): Promise<string> {
  const { todayCheckin, weeklyAverages, weeklyMiles, totalRuns, goals, firstName, currentStreak, recentPatterns, readinessScore, hardRunsLast3Days, lastRunType, daysUntilRace, trainingPlan, upcomingEvents } = data

  // Build context-aware prompt
  let raceContext = '';
  if (daysUntilRace !== undefined && daysUntilRace > 0 && daysUntilRace <= 30) {
    if (daysUntilRace <= 3) {
      raceContext = `RACE IN ${daysUntilRace} DAYS! Focus on rest, hydration, and mental preparation. No hard efforts.`;
    } else if (daysUntilRace <= 7) {
      raceContext = `Race week! ${daysUntilRace} days out. Taper period - reduce volume, maintain some intensity with short pickups.`;
    } else if (daysUntilRace <= 14) {
      raceContext = `${daysUntilRace} days to race. Begin tapering - reduce mileage by 20-30%, keep one quality session.`;
    } else {
      raceContext = `${daysUntilRace} days until race goal. Peak training phase - balance hard work with recovery.`;
    }
  }

  let recoveryContext = '';
  if (hardRunsLast3Days && hardRunsLast3Days >= 2) {
    recoveryContext = `WARNING: ${hardRunsLast3Days} hard sessions in the last 3 days. Recovery is critical to avoid overtraining.`;
  }
  if (lastRunType === 'race' || lastRunType === 'intervals' || lastRunType === 'tempo') {
    recoveryContext += ` Last run was a ${lastRunType} - consider easier effort today.`;
  }

  // Training Plan Context
  let trainingPlanContext = '';
  if (trainingPlan) {
    trainingPlanContext = `
ACTIVE TRAINING PLAN: ${trainingPlan.planType}
- Week ${trainingPlan.currentWeek} of ${trainingPlan.totalWeeks} (${trainingPlan.weekType} phase)
- Week focus: ${trainingPlan.weekFocus}
- Progress: ${trainingPlan.completedMilesThisWeek}/${trainingPlan.plannedMilesThisWeek} miles completed this week
${trainingPlan.todayWorkout ? `
**TODAY'S SCHEDULED WORKOUT (MUST REFERENCE THIS):**
- Workout: ${trainingPlan.todayWorkout.title}
- Distance: ${trainingPlan.todayWorkout.targetMiles} miles
- Type: ${trainingPlan.todayWorkout.type}
- Description: ${trainingPlan.todayWorkout.description}

IMPORTANT: Your advice MUST mention this specific workout. If readiness >= 60, recommend doing the ${trainingPlan.todayWorkout.targetMiles}-mile ${trainingPlan.todayWorkout.title} as planned. If readiness < 60, suggest modifying it.` : '- Rest day or no workout planned today'}`;
  }

  // Life Events Context
  let lifeEventsContext = '';
  if (upcomingEvents && upcomingEvents.length > 0) {
    const eventsList = upcomingEvents.map(e => {
      if (e.daysAway <= 0) {
        return `- CURRENTLY: ${e.title || e.type} (${e.trainingImpact} training impact)`;
      }
      return `- In ${e.daysAway} days: ${e.title || e.type} (${e.trainingImpact} training impact)`;
    }).join('\n');
    lifeEventsContext = `
UPCOMING LIFE EVENTS (plan may need adjustment):
${eventsList}
Consider these when making recommendations - proactively suggest moving workouts if needed.`;
  }

  const prompt = `You are an expert running coach and sports scientist providing personalized guidance. You are proactive about helping runners adapt their training to real life. Analyze this runner's complete wellness data and provide specific, actionable advice.

CRITICAL RULES:
1. If the runner has a scheduled workout today, you MUST mention it by name and distance (e.g., "your 5-mile Easy Run").
2. If readiness score >= 60, recommend completing the scheduled workout as planned.
3. If readiness score < 60, suggest a modified version (reduce distance or intensity).
4. NEVER give generic advice when there's a specific workout scheduled - always reference it.

${firstName ? `Runner's name: ${firstName}` : ''}
${currentStreak ? `Current check-in streak: ${currentStreak} days (acknowledge their consistency!)` : ''}

TODAY'S CHECK-IN:
${todayCheckin ? `
- Sleep Quality: ${todayCheckin.sleep_quality}/5
- Energy Level: ${todayCheckin.energy_level}/5
- Soreness Level: ${todayCheckin.soreness_level}/5 (higher = more sore)
- Readiness Score: ${todayCheckin.readiness_score}/5
- Feeling: ${todayCheckin.overall_feeling || 'Not specified'}
- Notes: ${todayCheckin.notes || 'None'}
` : 'No check-in today yet - encourage them to check in!'}

${readinessScore ? `COMPUTED READINESS: ${readinessScore}/100 - ${readinessScore >= 80 ? 'Great day for hard effort' : readinessScore >= 60 ? 'Moderate training okay' : 'Prioritize recovery'}` : ''}

7-DAY AVERAGES:
- Avg Sleep: ${weeklyAverages.sleep}/5
- Avg Energy: ${weeklyAverages.energy}/5  
- Avg Soreness: ${weeklyAverages.soreness}/5
- Avg Readiness: ${weeklyAverages.readiness}/5
- Weekly Miles: ${weeklyMiles.toFixed(1)} miles
- Total Runs This Week: ${totalRuns}

${recentPatterns?.length ? `PATTERNS DETECTED:\n${recentPatterns.map(p => `- ${p}`).join('\n')}` : ''}

${trainingPlanContext}

${lifeEventsContext}

${raceContext ? `RACE PREPARATION:\n${raceContext}` : ''}

${recoveryContext ? `RECOVERY NOTE:\n${recoveryContext}` : ''}

ACTIVE GOALS:
${goals?.length ? goals.map(g => `- ${g.goal_type}: ${g.target_value} by ${g.target_date}`).join('\n') : 'No active goals set.'}

Based on ALL this context, provide:
1. A brief personalized assessment (1-2 sentences) acknowledging their specific situation
2. ONE specific training recommendation for today - IMPORTANT: If they have a planned workout, recommend that workout's mileage (e.g., "Do your planned 5-mile easy run" or "Complete your scheduled 7-mile tempo"). Only suggest reduced mileage if readiness is below 60.
3. If there are upcoming life events, proactively suggest how to adjust (e.g., "I see you have travel in 3 days - consider doing your long run tomorrow instead")
4. One recovery or wellness tip based on their data

Keep response under 180 words. Be encouraging but data-driven. Be PROACTIVE about suggesting plan adjustments. ${firstName ? `Address ${firstName} by name.` : ''} If they have a race coming up, factor that into your recommendation.

IMPORTANT: Do NOT use asterisks, bullet points, markdown formatting, or numbered lists. Write in natural flowing paragraphs only.`

  const { text } = await generateText({
    model: 'openai/gpt-4o-mini',
    prompt,
    maxOutputTokens: 300,
    temperature: 0.7,
  })

  return text
}

export async function generateShortCoachAdvice(data: WellnessData): Promise<string> {
  const { todayCheckin, weeklyAverages, weeklyMiles } = data

  // For SMS - shorter response
  const prompt = `You are a running coach. Give a quick training tip based on this data:

Today: Sleep ${todayCheckin?.sleep_quality || '?'}/5, Energy ${todayCheckin?.energy_level || '?'}/5, Soreness ${todayCheckin?.soreness_level || '?'}/5
Week: ${weeklyMiles.toFixed(1)} miles, Avg readiness ${weeklyAverages.readiness}/5

Respond in 2-3 sentences max. Be specific about what they should do today. If soreness is high or energy is low, suggest recovery. Do NOT use asterisks, bullet points, or any markdown formatting.`

  try {
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt,
      maxOutputTokens: 100,
      temperature: 0.7,
    })

    return text
  } catch (error) {
    console.error("generateShortCoachAdvice - AI error:", error);
    throw error;
  }
}

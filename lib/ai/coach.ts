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
}

export async function generateCoachAdvice(data: WellnessData): Promise<string> {
  const { todayCheckin, weeklyAverages, weeklyMiles, totalRuns, goals, firstName, currentStreak, recentPatterns, readinessScore, hardRunsLast3Days, lastRunType, daysUntilRace } = data

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

  const prompt = `You are an expert running coach and sports scientist providing personalized guidance. Analyze this runner's complete wellness data and provide specific, actionable advice.

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

${raceContext ? `RACE PREPARATION:\n${raceContext}` : ''}

${recoveryContext ? `RECOVERY NOTE:\n${recoveryContext}` : ''}

ACTIVE GOALS:
${goals?.length ? goals.map(g => `- ${g.goal_type}: ${g.target_value} by ${g.target_date}`).join('\n') : 'No active goals set.'}

Based on ALL this context, provide:
1. A brief personalized assessment (1-2 sentences) acknowledging their specific situation
2. ONE specific training recommendation for today (be precise: pace zones, distance, or activity type)
3. One recovery or wellness tip based on their data

Keep response under 150 words. Be encouraging but data-driven. ${firstName ? `Address ${firstName} by name.` : ''} If they have a race coming up, factor that into your recommendation.`

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

Respond in 2-3 sentences max. Be specific about what they should do today. If soreness is high or energy is low, suggest recovery.`

  try {
    console.log("[v0] generateShortCoachAdvice - calling AI with prompt length:", prompt.length);
    
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt,
      maxOutputTokens: 100,
      temperature: 0.7,
    })

    console.log("[v0] generateShortCoachAdvice - AI response:", text?.substring(0, 50));
    return text
  } catch (error) {
    console.error("[v0] generateShortCoachAdvice - AI error:", error);
    throw error;
  }
}

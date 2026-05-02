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
}

export async function generateCoachAdvice(data: WellnessData): Promise<string> {
  const { todayCheckin, weeklyAverages, weeklyMiles, totalRuns, goals, firstName } = data

  const prompt = `You are an expert running coach and sports scientist. Analyze this runner's wellness data and provide ONE specific, actionable training recommendation for today.

${firstName ? `Runner's name: ${firstName}` : ''}

TODAY'S CHECK-IN:
${todayCheckin ? `
- Sleep Quality: ${todayCheckin.sleep_quality}/5
- Energy Level: ${todayCheckin.energy_level}/5
- Soreness Level: ${todayCheckin.soreness_level}/5 (higher = more sore)
- Readiness Score: ${todayCheckin.readiness_score}/5
- Feeling: ${todayCheckin.overall_feeling || 'Not specified'}
- Notes: ${todayCheckin.notes || 'None'}
` : 'No check-in today yet.'}

7-DAY AVERAGES:
- Avg Sleep: ${weeklyAverages.sleep}/5
- Avg Energy: ${weeklyAverages.energy}/5  
- Avg Soreness: ${weeklyAverages.soreness}/5
- Avg Readiness: ${weeklyAverages.readiness}/5
- Weekly Miles: ${weeklyMiles.toFixed(1)} miles
- Total Runs This Week: ${totalRuns}

ACTIVE GOALS:
${goals?.length ? goals.map(g => `- ${g.goal_type}: ${g.target_value} by ${g.target_date}`).join('\n') : 'No active goals set.'}

Based on this data, provide:
1. A brief assessment (1-2 sentences) of their current state
2. ONE specific training recommendation for today (be specific about pace, distance, or activity type)
3. One recovery or wellness tip

Keep response under 150 words. Be encouraging but honest. If soreness is high (4-5) or readiness is low (1-2), prioritize recovery. ${firstName ? `Address them by name.` : ''}`

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

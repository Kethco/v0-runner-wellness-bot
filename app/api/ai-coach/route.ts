import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get today's check-in
    const today = new Date().toISOString().split('T')[0]
    const { data: todayCheckin } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    // Get last 7 days of check-ins for trends
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { data: recentCheckins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    // Get recent runs
    const { data: recentRuns } = await supabase
      .from('runs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    // Get user's goals
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    // Calculate averages - using correct column names: sleep_rating, energy, soreness, readiness
    const avgSleep = recentCheckins?.length 
      ? (recentCheckins.reduce((sum, c) => sum + (c.sleep_rating || 0), 0) / recentCheckins.length).toFixed(1)
      : 'N/A'
    const avgEnergy = recentCheckins?.length
      ? (recentCheckins.reduce((sum, c) => sum + (c.energy || 0), 0) / recentCheckins.length).toFixed(1)
      : 'N/A'
    const avgSoreness = recentCheckins?.length
      ? (recentCheckins.reduce((sum, c) => sum + (c.soreness || 0), 0) / recentCheckins.length).toFixed(1)
      : 'N/A'
    const avgReadiness = recentCheckins?.length
      ? (recentCheckins.reduce((sum, c) => sum + (c.readiness || 0), 0) / recentCheckins.length).toFixed(1)
      : 'N/A'
    
    const weeklyMiles = recentRuns?.reduce((sum, r) => sum + Number(r.miles), 0) || 0

    const prompt = `You are an expert running coach and sports scientist. Analyze this runner's wellness data and provide ONE specific, actionable training recommendation for today.

TODAY'S CHECK-IN:
${todayCheckin ? `
- Sleep Quality: ${todayCheckin.sleep_rating}/5
- Energy Level: ${todayCheckin.energy}/5
- Soreness Level: ${todayCheckin.soreness}/5 (higher = more sore)
- Readiness Score: ${todayCheckin.readiness}/5
- Feeling: ${todayCheckin.feeling || 'Not specified'}
- Notes: ${todayCheckin.notes || 'None'}
` : 'No check-in today yet.'}

7-DAY AVERAGES:
- Avg Sleep: ${avgSleep}/5
- Avg Energy: ${avgEnergy}/5  
- Avg Soreness: ${avgSoreness}/5
- Avg Readiness: ${avgReadiness}/5
- Weekly Miles: ${weeklyMiles.toFixed(1)} miles
- Total Runs This Week: ${recentRuns?.length || 0}

ACTIVE GOALS:
${goals?.length ? goals.map(g => `- ${g.goal_type}: ${g.target_value} by ${g.target_date}`).join('\n') : 'No active goals set.'}

Based on this data, provide:
1. A brief assessment (1-2 sentences) of their current state
2. ONE specific training recommendation for today (be specific about pace, distance, or activity type)
3. One recovery or wellness tip

Keep response under 150 words. Be encouraging but honest. If soreness is high (4-5) or readiness is low (1-2), prioritize recovery.`

    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt,
      maxOutputTokens: 300,
      temperature: 0.7,
    })

    // Save the advice to database for history
    await supabase.from('ai_advice').insert({
      user_id: user.id,
      advice: text,
      checkin_id: todayCheckin?.id,
    }).select().single().catch(() => null) // Ignore if table doesn't exist

    return NextResponse.json({ 
      advice: text,
      todayCheckin: todayCheckin ? {
        sleep: todayCheckin.sleep_rating,
        energy: todayCheckin.energy,
        soreness: todayCheckin.soreness,
        readiness: todayCheckin.readiness,
      } : null,
      weeklyStats: {
        avgSleep,
        avgEnergy,
        avgSoreness,
        avgReadiness,
        weeklyMiles,
      }
    })
  } catch (error) {
    console.error('AI Coach error:', error)
    return NextResponse.json({ error: 'Failed to generate advice' }, { status: 500 })
  }
}

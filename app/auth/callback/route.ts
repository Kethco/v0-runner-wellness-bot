import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeSMS } from '@/lib/sms/sender'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const inviteCode = searchParams.get('invite')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Send welcome SMS to new users
      const phone = data.user.user_metadata?.phone
      const firstName = data.user.user_metadata?.first_name || 'Runner'
      const userType = data.user.user_metadata?.user_type || 'athlete'
      
      if (phone) {
        // Fire and forget - don't block the redirect
        sendWelcomeSMS(phone, firstName, userType).catch(console.error)
      }
      
      // Check if user signed up via coach invite
      const userInviteCode = inviteCode || data.user.user_metadata?.invite_code
      if (userInviteCode) {
        // Accept the invite
        try {
          const { data: invite } = await supabase
            .from("athlete_invites")
            .select("id, coach_id, status")
            .eq("invite_code", userInviteCode)
            .single()
          
          if (invite && invite.status === "pending") {
            // Update invite status
            await supabase
              .from("athlete_invites")
              .update({ 
                status: "accepted", 
                athlete_id: data.user.id,
                accepted_at: new Date().toISOString()
              })
              .eq("id", invite.id)
            
            // Create coach-athlete relationship
            await supabase
              .from("coach_athletes")
              .insert({
                coach_id: invite.coach_id,
                athlete_id: data.user.id,
                invite_id: invite.id,
              })
            
            // Ensure user profile has athlete role
            await supabase
              .from("profiles")
              .update({ role: "athlete" })
              .eq("id", data.user.id)
          }
        } catch (e) {
          console.error("Error processing invite:", e)
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}

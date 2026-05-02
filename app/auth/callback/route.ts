import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeSMS } from '@/lib/sms/sender'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
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
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}

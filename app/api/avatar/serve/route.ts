import { type NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pathname = request.nextUrl.searchParams.get('pathname')

    if (!pathname) {
      return NextResponse.json({ error: 'Missing pathname' }, { status: 400 })
    }

    // Security: Verify the pathname belongs to the requesting user
    // Avatar pathnames follow pattern: avatars/{userId}/...
    const pathParts = pathname.split('/')
    if (pathParts[0] === 'avatars' && pathParts[1] !== user.id) {
      // Allow if user is viewing someone else's avatar (e.g., accountability buddy)
      // But verify they have a legitimate relationship
      const { data: buddy } = await supabase
        .from('accountability_buddies')
        .select('id')
        .or(`user_id.eq.${user.id},buddy_id.eq.${user.id}`)
        .or(`user_id.eq.${pathParts[1]},buddy_id.eq.${pathParts[1]}`)
        .limit(1)
        .single()
      
      const { data: coachRelation } = await supabase
        .from('coach_athletes')
        .select('id')
        .or(`coach_id.eq.${user.id},athlete_id.eq.${user.id}`)
        .or(`coach_id.eq.${pathParts[1]},athlete_id.eq.${pathParts[1]}`)
        .limit(1)
        .single()
      
      // If no relationship exists, deny access
      if (!buddy && !coachRelation) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const result = await get(pathname, {
      access: 'private',
      ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
    })

    if (!result) {
      return new NextResponse('Not found', { status: 404 })
    }

    // Blob hasn't changed — tell the browser to use its cached copy
    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          'Cache-Control': 'private, no-cache',
        },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        ETag: result.blob.etag,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    console.error('Error serving avatar:', error)
    return NextResponse.json({ error: 'Failed to serve avatar' }, { status: 500 })
  }
}

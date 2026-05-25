import { put, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Upload avatar
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be less than 5MB' }, { status: 400 })
    }

    // Upload to Vercel Blob with user-specific path
    const blob = await put(`avatars/${user.id}/${Date.now()}-${file.name}`, file, {
      access: 'private',
    })

    // For private blobs, we need to store the pathname, not the URL
    // The URL will be served through an API route
    const avatarPath = blob.pathname

    // Save avatar pathname to profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarPath })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      // Still return the path even if profile update fails
    }

    return NextResponse.json({ url: `/api/avatar/serve?pathname=${encodeURIComponent(avatarPath)}` })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// DELETE - Remove avatar
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get current avatar URL
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (profile?.avatar_url) {
      // Delete from Vercel Blob
      await del(profile.avatar_url)
    }

    // Clear avatar URL in profile
    await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

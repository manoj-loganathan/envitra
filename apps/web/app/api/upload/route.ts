import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileExtension = file.name.split('.').pop()
    const filename = `${session.user.id}-${Date.now()}.${fileExtension}`

    // Upload to 'order-assets' bucket
    const { data, error } = await supabase.storage
      .from('order-assets')
      .upload(filename, fileBuffer, {
        contentType: file.type,
      })

    if (error) {
      // If bucket doesn't exist or error, we log it and fallback
      console.error('Supabase storage upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('order-assets')
      .getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

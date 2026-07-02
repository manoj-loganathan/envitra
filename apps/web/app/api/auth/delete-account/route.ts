import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    // 1. Authenticate the request using the server-side supabase client
    const serverSupabase = createServerClient()
    const { data: { session } } = await serverSupabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // 2. Initialize the Supabase Admin client with the service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // 3. Delete the user from auth.users (Cascades to accounts, profiles, cards, links, lead forms, leads, products, etc.)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(session.user.id)
    if (error) throw error

    // 4. Return success
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting user account:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete account' }, { status: 500 })
  }
}

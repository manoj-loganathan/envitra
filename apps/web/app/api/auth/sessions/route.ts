import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const serverSupabase = createServerClient()
    const { data: { session } } = await serverSupabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    })

    const { data: sessions, error } = await supabase
      .rpc('get_user_sessions', { p_user_id: session.user.id })

    if (error) throw error

    return NextResponse.json({ sessions })
  } catch (error: any) {
    console.error('Error fetching auth sessions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: heartbeat / sync — called by syncUserSession() in layout.tsx.
// Reads active sessions from auth.sessions via RPC and returns them.
// (The old user_sessions upsert table was dropped in migration 20260617002000)
export async function POST(request: Request) {
  try {
    const serverSupabase = createServerClient()
    const { data: { session } } = await serverSupabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // Parse body — userId / userAgent / currentSessionId are forwarded but
    // we rely on the server session for authoritative user identity.
    const body = await request.json().catch(() => ({}))
    const userId = body.userId || session.user.id

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    })

    const { data: sessions, error } = await supabase
      .rpc('get_user_sessions', { p_user_id: userId })

    if (error) throw error

    return NextResponse.json({ sessions: sessions ?? [] })
  } catch (error: any) {
    console.error('Error syncing active session:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



export async function DELETE(request: Request) {
  try {
    const serverSupabase = createServerClient()
    const { data: { session } } = await serverSupabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, all, currentSessionId } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    })

    if (all) {
      if (currentSessionId) {
        // Disconnect all other sessions (all except current)
        const { error } = await supabase
          .rpc('delete_other_user_sessions', {
            p_current_session_id: currentSessionId,
            p_user_id: session.user.id
          })
        if (error) throw error
      } else {
        // Disconnect all sessions completely
        const { error } = await supabase
          .rpc('delete_all_user_sessions', {
            p_user_id: session.user.id
          })
        if (error) throw error
      }
    } else if (sessionId) {
      // Disconnect a specific single session
      const { error } = await supabase
        .rpc('delete_user_session', {
          p_session_id: sessionId,
          p_user_id: session.user.id
        })

      if (error) throw error
    } else {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting auth sessions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

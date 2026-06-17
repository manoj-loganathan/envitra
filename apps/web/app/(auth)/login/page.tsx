'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/layout/Logo'
import { Laptop, Smartphone, Tablet, Globe, Loader2, AlertCircle } from 'lucide-react'

// Helper to parse browser name and OS name from user agent
const getBrowserAndOS = (customUa?: string) => {
  const ua = customUa || ''
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'

  if (!ua) return { browser, os }

  if (ua.indexOf('Firefox') > -1) browser = 'Mozilla Firefox'
  else if (ua.indexOf('SamsungBrowser') > -1) browser = 'Samsung Internet'
  else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera'
  else if (ua.indexOf('Trident') > -1) browser = 'Internet Explorer'
  else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) browser = 'Microsoft Edge'
  else if (ua.indexOf('Chrome') > -1) browser = 'Google Chrome'
  else if (ua.indexOf('Safari') > -1) browser = 'Apple Safari'

  if (ua.indexOf('Windows NT 10.0') > -1) os = 'Windows 10/11'
  else if (ua.indexOf('Windows NT 6.2') > -1) os = 'Windows 8'
  else if (ua.indexOf('Windows NT 6.1') > -1) os = 'Windows 7'
  else if (ua.indexOf('Macintosh') > -1) os = 'macOS'
  else if (ua.indexOf('iPhone') > -1) os = 'iOS'
  else if (ua.indexOf('iPad') > -1) os = 'iPadOS'
  else if (ua.indexOf('Android') > -1) os = 'Android'
  else if (ua.indexOf('Linux') > -1) os = 'Linux'

  return { browser, os }
}

const getDeviceIcon = (os: string) => {
  const osLower = os.toLowerCase()
  if (osLower.includes('ios') || osLower.includes('android')) {
    return <Smartphone className="w-4 h-4 text-muted-foreground" />
  }
  if (osLower.includes('ipad')) {
    return <Tablet className="w-4 h-4 text-muted-foreground" />
  }
  if (osLower.includes('mac') || osLower.includes('win') || osLower.includes('linux')) {
    return <Laptop className="w-4 h-4 text-muted-foreground" />
  }
  return <Globe className="w-4 h-4 text-muted-foreground" />
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  // Session lockout state
  const [showLockoutModal, setShowLockoutModal] = useState(false)
  const [lockoutSessions, setLockoutSessions] = useState<any[]>([])
  const [currentSessionId, setCurrentSessionId] = useState('')
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
        setLoading(false)
        return
      }

      // 1. Get session and extract current session ID (sid)
      const session = signInData.session
      let currentSid = ''
      if (session && session.access_token) {
        try {
          const base64Url = session.access_token.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
          const payload = JSON.parse(jsonPayload)
          currentSid = payload.session_id || payload.sid || ''
        } catch (jwtErr) {
          console.error('Failed to parse user session ID:', jwtErr)
        }
      }

      // 2. Fetch active sessions from our API
      const sessionsRes = await fetch('/api/auth/sessions')
      if (!sessionsRes.ok) {
        throw new Error('Failed to retrieve active login sessions.')
      }
      const sessionsData = await sessionsRes.json()
      const sessions = sessionsData.sessions || []

      // 3. Check if active sessions exceed 2
      if (sessions.length > 2) {
        // Sort sessions by created_at ascending (oldest first)
        const sorted = [...sessions].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        setLockoutSessions(sorted)
        setCurrentSessionId(currentSid)
        setShowLockoutModal(true)
        setLoading(false)
        return
      }

      router.refresh()
      router.push(redirect)
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  const disconnectSession = async (sessionId: string) => {
    setDisconnectingId(sessionId)
    try {
      const res = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to disconnect session')
      }

      // Update local state
      const updatedSessions = lockoutSessions.filter((s) => s.id !== sessionId)
      setLockoutSessions(updatedSessions)

      // If sessions are now under/equal to the limit, auto-proceed
      if (updatedSessions.length <= 2) {
        setShowLockoutModal(false)
        router.refresh()
        router.push(redirect)
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to disconnect session')
    } finally {
      setDisconnectingId(null)
    }
  }

  const handleCancelLockout = async () => {
    // Only sign out the local device session, not other devices globally
    await supabase.auth.signOut({ scope: 'local' })
    setShowLockoutModal(false)
  }

  const disconnectAllOtherSessions = async () => {
    setDisconnectingId('all')
    try {
      const res = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          all: true,
          currentSessionId: currentSessionId
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to disconnect other sessions')
      }

      setShowLockoutModal(false)
      router.refresh()
      router.push(redirect)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to disconnect other sessions')
    } finally {
      setDisconnectingId(null)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[var(--bg-page)] relative">
      <div className="max-w-md w-full space-y-8 bg-[var(--bg-surface)] p-8 rounded-card border border-[var(--border)] shadow-sm">
        
        <div className="flex flex-col items-center">
          <Link href="/" className="mb-4">
            <Logo />
          </Link>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Sign in to your account
          </h2>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Configure, order, and manage your NFC cards
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-btn text-center">
            {errorMsg}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:border-purple-600 focus:outline-none text-[var(--text-primary)]"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:border-purple-600 focus:outline-none text-[var(--text-primary)]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-btn font-medium text-white text-sm bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md transition-all duration-200 disabled:opacity-55 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-[var(--text-secondary)]">
          Don't have an account?{' '}
          <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-purple-600 font-semibold hover:underline">
            Sign up
          </Link>
        </div>

      </div>

      {/* Device Lockout Modal */}
      {showLockoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full shadow-xl space-y-6 text-left animate-in fade-in duration-200">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertCircle size={28} className="shrink-0" />
              <h2 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-wide">Device Limit Exceeded</h2>
            </div>
            
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              You are logged into more than the maximum allowed <strong className="text-[var(--text-primary)]">2 active devices</strong>. To complete signing in on this device, please disconnect one of your other active sessions below.
            </p>

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Active Sessions</h3>
              <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-page)]/40">
                {lockoutSessions.map((session) => {
                  const isCurrent = session.id === currentSessionId
                  const { browser, os } = getBrowserAndOS(session.user_agent)
                  return (
                    <div key={session.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                          {getDeviceIcon(os)}
                          <span>{os}</span>
                          <span className="text-[var(--text-secondary)]/50 font-bold">•</span>
                          <span>{browser}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-purple-600/10 text-purple-600 border border-purple-600/20">
                              This Device
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-[var(--text-secondary)]">
                          Last Active: {session.updated_at ? new Date(session.updated_at).toLocaleString() : new Date(session.created_at).toLocaleString()}
                        </p>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => disconnectSession(session.id)}
                          disabled={disconnectingId !== null}
                          className="px-2.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10px] font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {disconnectingId === session.id ? (
                            <Loader2 className="animate-spin w-3.5 h-3.5" />
                          ) : (
                            'Disconnect'
                          )}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--border)]">
              <button
                onClick={handleCancelLockout}
                disabled={disconnectingId !== null}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] text-xs font-semibold hover:bg-[var(--bg-page)] transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel Sign-in
              </button>

              <button
                onClick={disconnectAllOtherSessions}
                disabled={disconnectingId !== null}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all active:scale-98 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {disconnectingId === 'all' ? (
                  <>
                    <Loader2 className="animate-spin w-3 h-3" /> Disconnecting...
                  </>
                ) : (
                  'Sign out from other devices'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-[var(--bg-page)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

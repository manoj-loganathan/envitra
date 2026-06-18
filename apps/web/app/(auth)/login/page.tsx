'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/layout/Logo'
import { Laptop, Smartphone, Tablet, Globe, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

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
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
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

  const partners = [
    'YC Alumni',
    'IIM Bangalore',
    'Nasscom',
    'TechSparks',
    'ProductHunt',
    'Startup India',
    'FICCI',
    'CII',
    'Google for Startups',
  ]
  const marqueeItems = [...partners, ...partners]

  return (
    <div className="h-screen w-full flex items-stretch bg-[var(--bg-page)] text-[var(--text-primary)] overflow-hidden relative">
      
      {/* Dynamic Keyframe Animations */}
      <style>{`
        @keyframes gradientBg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .premium-gradient-animate {
          background: linear-gradient(-45deg, #070919, #0f143c, #1f3bb3, #0b0d26);
          background-size: 300% 300%;
          animation: gradientBg 12s ease infinite;
        }
        @keyframes floatBlob {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(20px, -30px) scale(1.05); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob-1 {
          animation: floatBlob 8s infinite ease-in-out;
        }
        .animate-blob-2 {
          animation: floatBlob 12s infinite ease-in-out reverse;
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>

      {/* Left Column - Premium Background Panel (hidden on mobile, visible on lg screens) */}
      <div className="hidden lg:flex lg:w-1/2 h-full p-12 flex-col justify-between relative overflow-hidden select-none bg-[#070919] dark">
        {/* Background Image */}
        <Image
          src="/auth-bg.jpg"
          alt="Branding Background"
          fill
          className="absolute inset-0 object-cover pointer-events-none z-0"
          priority
        />
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70 z-0" />

        {/* Top: Logo & Name */}
        <div className="relative z-10">
          <Link href="/" className="inline-block">
            <Logo forceWhite />
          </Link>
        </div>

        {/* Middle: Brand Slogan (SEO, AEO, and GEO Optimized) */}
        <div className="relative z-10 max-w-md space-y-2.5 my-auto text-left">
          <h1 className="text-2xl xl:text-3xl font-black text-white leading-snug tracking-tight font-poppins">
            Connect instantly. Network smarter.
          </h1>
          <p className="text-xs text-white/70 font-medium leading-relaxed font-sans">
            Log in to manage your digital profiles, edit card links, view leads, and see your tap analytics in real time.
          </p>
        </div>

        {/* Bottom: Partners (Marquee style from landing page) */}
        <div className="relative z-10 w-full overflow-hidden space-y-2">
          <p className="text-[9px] font-bold text-white/40 tracking-widest uppercase font-poppins">
            Trusted By Innovators
          </p>
          <div
            className="relative flex overflow-hidden w-full"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
              maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            }}
          >
            <div className="flex animate-marquee whitespace-nowrap gap-10 items-center text-white/45 text-[10px] font-extrabold uppercase tracking-widest">
              {marqueeItems.map((partner, i) => (
                <span key={i} className="shrink-0 cursor-default hover:text-white transition-colors duration-200">
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Redesigned login form (Without background, scroll bar, and compact size) */}
      <div className="flex-1 lg:w-1/2 h-full flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24 py-6 overflow-hidden relative bg-[var(--bg-page)]">
        
        {/* Mobile Brand Logo Header (only visible on mobile/tablet) - strictly top left */}
        <div className="lg:hidden w-full flex justify-start mb-6">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        {/* Clean, Neat Form Container (No card background, border, or shadow, compact padding) */}
        <div className="max-w-md w-full space-y-4.5 relative z-10 transition-colors duration-200">
          
          <div className="text-left space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] font-poppins">
              Welcome Back
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">
              Please login to your account to continue.
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-semibold rounded-lg flex items-center gap-1.5">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-semibold rounded-lg flex items-center gap-1.5">
              <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-3.5" onSubmit={handleLogin}>
            <div className="space-y-3">
              
              {/* Email Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-poppins">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs focus:ring-1 focus:ring-purple-600 focus:border-purple-600 focus:outline-none text-[var(--text-primary)] transition-all duration-200"
                  placeholder="Enter your email..."
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-poppins">
                    Password
                  </label>
                  <Link 
                    href="/forgot-password" 
                    className="text-[10px] font-bold text-[#3f5ce6] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs focus:ring-1 focus:ring-purple-600 focus:border-purple-600 focus:outline-none text-[var(--text-primary)] transition-all duration-200"
                    placeholder="Enter your password..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-lg font-bold text-white text-xs bg-[#3f5ce6] hover:bg-[#324ab3] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center font-poppins"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-3.5 h-3.5 mr-1.5" />
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          {/* Swap page link */}
          <div className="text-center text-[11px] font-semibold text-[var(--text-secondary)]">
            Don't have an account?{' '}
            <Link 
              href={`/register?redirect=${encodeURIComponent(redirect)}`} 
              className="text-[#3f5ce6] font-bold hover:underline"
            >
              Signup
            </Link>
          </div>



        </div>

        {/* Bottom Footer Links and Copyright */}
        <div className="absolute bottom-4 left-8 right-8 sm:left-16 sm:right-16 lg:left-24 lg:right-24 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-[var(--text-secondary)] opacity-80 z-10">
          <div className="flex gap-3 font-medium">
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] hover:underline transition-colors duration-150">
              Terms
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] hover:underline transition-colors duration-150">
              Privacy Policy
            </Link>
          </div>
          <div className="font-medium text-center sm:text-right text-muted-foreground">
            © 2026 Envitra Technologies Pvt. Ltd. All rights reserved.
          </div>
        </div>
      </div>

      {/* Device Lockout Modal */}
      {showLockoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6 text-left animate-in fade-in duration-200">
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

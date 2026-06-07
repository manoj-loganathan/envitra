'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (errorParam === 'unauthorized') {
      setErrorMsg('You are not authorised to access the admin panel.')
    }
  }, [errorParam])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authErr) {
        setErrorMsg(authErr.message)
        setLoading(false)
        return
      }

      if (authData?.user) {
        // Query admin_users to see if UID exists
        const { data: adminRecord, error: adminErr } = await supabase
          .from('admin_users')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        if (adminErr || !adminRecord) {
          console.warn('Non-admin user log in detected. Rejecting.')
          await supabase.auth.signOut()
          setErrorMsg('Access Denied. You are not registered as an administrator.')
        } else {
          router.refresh()
          router.push('/')
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected login error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950 text-white">
      <div className="max-w-md w-full space-y-6 bg-zinc-900 p-8 rounded-card border border-zinc-800 shadow-lg">
        
        <div className="text-center">
          <div className="w-10 h-10 rounded bg-gradient-primary flex items-center justify-center shadow-purple-sm mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M4 8 C4 5.8 5.8 4 8 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M2 8 C2 4.7 4.7 2 8 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <circle cx="8" cy="8" r="1.5" fill="white"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            envitra admin
          </h2>
          <p className="mt-1.5 text-xs text-zinc-400">
            Sign in to the super admin control dashboard
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-btn text-center">
            {errorMsg}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-btn border border-zinc-800 bg-zinc-950 text-sm focus:border-purple-600 focus:outline-none text-white"
                placeholder="admin@envitra.in"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-btn border border-zinc-800 bg-zinc-950 text-sm focus:border-purple-600 focus:outline-none text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-btn font-medium text-white text-xs bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md transition-all duration-200 disabled:opacity-55 cursor-pointer mt-2"
          >
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>

      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600" />
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  )
}

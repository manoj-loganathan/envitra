'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/layout/Logo'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        setSuccessMsg('Account created successfully! You can login now.')
        setTimeout(() => {
          router.push(`/login?redirect=${encodeURIComponent(redirect)}`)
        }, 1500)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[var(--bg-page)]">
      <div className="max-w-md w-full space-y-8 bg-[var(--bg-surface)] p-8 rounded-card border border-[var(--border)] shadow-sm">
        
        <div className="flex flex-col items-center">
          <Link href="/" className="mb-4">
            <Logo />
          </Link>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Create your account
          </h2>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Get your identity one tap away today
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-btn text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-xs rounded-btn text-center font-medium">
            {successMsg}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:border-purple-600 focus:outline-none text-[var(--text-primary)]"
                placeholder="Rahul Kumar"
              />
            </div>
            
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
            className="w-full px-4 py-2.5 rounded-btn font-medium text-white text-sm bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md transition-all duration-200 disabled:opacity-55 cursor-pointer mt-4"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-xs text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-purple-600 font-semibold hover:underline">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-[var(--bg-page)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}

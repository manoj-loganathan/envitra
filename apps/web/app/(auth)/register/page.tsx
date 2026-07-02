'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/layout/Logo'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreeToTerms) {
      setErrorMsg('You must agree to the Terms and Conditions and Privacy Policy.')
      return
    }

    const hasLowercase = /[a-z]/.test(password)
    const hasUppercase = /[A-Z]/.test(password)
    const hasDigit = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*()_+=\-[\]{};':"\\|,.<>/?~`]/.test(password)

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.')
      return
    }

    if (!hasLowercase || !hasUppercase || !hasDigit || !hasSpecial) {
      setErrorMsg('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character/symbol.')
      return
    }

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
            agreed_to_terms: true
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
            Step into the future of networking.
          </h1>
          <p className="text-xs text-white/70 font-medium leading-relaxed font-sans">
            Create an account to configure your custom NFC smart cards, design your digital profiles, and start sharing contact details with a single tap.
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

      {/* Right Column - Redesigned signup form (Without background, scroll bar, and compact size) */}
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
              Get Started Now
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">
              Please fill in your details to sign up.
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-semibold rounded-xl flex items-center gap-1.5">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-semibold rounded-xl text-center">
              {successMsg}
            </div>
          )}

          <form className="space-y-3.5" onSubmit={handleRegister}>
            <div className="space-y-3">
              
              {/* Full Name Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-poppins">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs focus:ring-1 focus:ring-purple-600 focus:border-purple-600 focus:outline-none text-[var(--text-primary)] transition-all duration-200"
                  placeholder="Enter your name..."
                />
              </div>

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
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-poppins">
                  Password
                </label>
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

            {/* Terms checkbox - Using Shadcn UI Checkbox for alignment */}
            <div className="flex items-center gap-2 pt-0.5">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked: boolean | 'indeterminate') => setAgreeToTerms(!!checked)}
              />
              <label 
                htmlFor="terms" 
                className="text-[10px] text-[var(--text-secondary)] font-medium select-none cursor-pointer leading-none"
              >
                I agree to the{' '}
                <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#3f5ce6] font-bold hover:underline">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#3f5ce6] font-bold hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-lg font-bold text-white text-xs bg-[#3f5ce6] hover:bg-[#324ab3] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center font-poppins"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-3.5 h-3.5 mr-1.5" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          {/* Swap page link */}
          <div className="text-center text-[11px] font-semibold text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link 
              href={`/login?redirect=${encodeURIComponent(redirect)}`} 
              className="text-[#3f5ce6] font-bold hover:underline"
            >
              Sign in
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

    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}

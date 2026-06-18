'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/layout/Logo'
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

type Step = 'email' | 'otp' | 'reset' | 'success'

function ForgotPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [countdown, setCountdown] = useState(5)

  const supabase = createClient()

  // Reset steps if they reload the page to clear any half-completed state
  useEffect(() => {
    const clearSession = async () => {
      // If there is an active session on load, check if it was a recovery session
      const { data: { session } } = await supabase.auth.getSession()
      const isRecovery = localStorage.getItem('envitra_recovery_mode') === 'true'
      if (session && isRecovery) {
        setStep('reset')
      } else {
        setStep('email')
      }
    }
    clearSession()
  }, [supabase])

  // Countdown timer for resending OTP
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [resendTimer])

  // Success redirect countdown
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 'success' && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [step, countdown])

  // Perform redirect when countdown hits 0
  useEffect(() => {
    if (step === 'success' && countdown === 0) {
      router.push(`/login?redirect=${encodeURIComponent(redirect)}&resetSuccess=true`)
    }
  }, [step, countdown, router, redirect])

  // Unified helper for verification (so both manual and auto verify use the same code)
  const verifyCode = async (code: string) => {
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery',
      })
      if (error) throw error

      localStorage.setItem('envitra_recovery_mode', 'true')
      setStep('reset')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Invalid or expired verification code.')
    } finally {
      setLoading(false)
    }
  }

  // Handle individual OTP digit change
  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return
    const newOtp = [...otpDigits]
    newOtp[index] = value.substring(value.length - 1)
    setOtpDigits(newOtp)

    // Move to next input box if typed a value
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) {
        (nextInput as HTMLInputElement).focus()
      }
    }

    // Auto verify if all digits are filled
    const completeCode = newOtp.join('')
    if (completeCode.length === 6) {
      verifyCode(completeCode)
    }
  }

  // Handle backspace navigation in OTP fields
  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otpDigits]
      if (!otpDigits[index] && index > 0) {
        newOtp[index - 1] = ''
        setOtpDigits(newOtp)
        const prevInput = document.getElementById(`otp-${index - 1}`)
        if (prevInput) {
          (prevInput as HTMLInputElement).focus()
        }
      } else {
        newOtp[index] = ''
        setOtpDigits(newOtp)
      }
    }
  }

  // Handle paste in OTP inputs
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text')
    const digitsOnly = pasteData.replace(/\D/g, '')
    if (digitsOnly.length === 6) {
      const newOtp = digitsOnly.split('')
      setOtpDigits(newOtp)
      const lastInput = document.getElementById('otp-5')
      if (lastInput) {
        (lastInput as HTMLInputElement).focus()
      }
      verifyCode(digitsOnly)
    }
  }

  // Step 1: Send recovery OTP code via resetPasswordForEmail
  const handleSendOtp = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error

      setStep('otp')
      setResendTimer(60) // Start 60s cooldown countdown
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to send recovery code. Make sure the email is registered.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify recovery OTP code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otpDigits.join('')
    if (code.length < 6) {
      setErrorMsg('Please enter all 6 digits of the code.')
      return
    }
    await verifyCode(code)
  }

  // Step 3: Change password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      setLoading(false)
      return
    }

    const hasLowercase = /[a-z]/.test(password)
    const hasUppercase = /[A-Z]/.test(password)
    const hasDigit = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*()_+=\-[\]{};':"\\|,.<>/?~`]/.test(password)

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.')
      setLoading(false)
      return
    }

    if (!hasLowercase || !hasUppercase || !hasDigit || !hasSpecial) {
      setErrorMsg('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character/symbol.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })
      if (error) throw error

      localStorage.removeItem('envitra_recovery_mode')
      // Clean up session state
      await supabase.auth.signOut()

      setStep('success')
      setCountdown(5)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to update password. Please try again.')
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
      
      {/* Keyframe animations for marquee */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>

      {/* Left Column - Visual Background Panel (hidden on mobile, visible on lg screens) */}
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

        {/* Middle: Brand Slogan */}
        <div className="relative z-10 max-w-md space-y-2.5 my-auto text-left">
          <h1 className="text-2xl xl:text-3xl font-black text-white leading-snug tracking-tight font-poppins">
            Recover your account.
          </h1>
          <p className="text-xs text-white/70 font-medium leading-relaxed font-sans">
            Follow the verification steps to securely reset your password and restore access to your Envitra digital business cards and analytics.
          </p>
        </div>

        {/* Bottom: Partners */}
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

      {/* Right Column - Forgot Password Form Flow (Without background, scroll bar, and compact size) */}
      <div className="flex-1 lg:w-1/2 h-full flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24 py-6 overflow-hidden relative bg-[var(--bg-page)]">
        
        {/* Mobile Brand Logo Header (only visible on mobile/tablet) */}
        <div className="lg:hidden w-full flex justify-start mb-6">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        {/* Clean, Neat Form Container */}
        <div className="max-w-md w-full space-y-4.5 relative z-10 transition-colors duration-200">
          
          {/* Form Header */}
          {step !== 'success' && (
            <div className="text-left space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] font-poppins">
                {step === 'email' && 'Forgot Password'}
                {step === 'otp' && 'Verify Code'}
                {step === 'reset' && 'Reset Password'}
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                {step === 'email' && 'Enter your email address to receive a verification OTP.'}
                {step === 'otp' && `We sent a 6-digit OTP code to ${email}.`}
                {step === 'reset' && 'Enter your new password below to secure your account.'}
              </p>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-semibold rounded-lg flex items-center gap-1.5 animate-in fade-in duration-150">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-semibold rounded-lg flex items-center gap-1.5 animate-in fade-in duration-150">
              <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Email Form */}
          {step === 'email' && (
            <form className="space-y-4" onSubmit={handleSendOtp}>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-poppins">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs focus:ring-1 focus:ring-purple-600 focus:border-purple-600 focus:outline-none text-[var(--text-primary)] transition-all duration-200"
                  placeholder="Enter your email address..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-lg font-bold text-white text-xs bg-[#3f5ce6] hover:bg-[#324ab3] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center font-poppins"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-3.5 h-3.5 mr-1.5" />
                    Sending code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </button>

              <div className="text-center text-[11px] font-semibold text-[var(--text-secondary)]">
                Remember your password?{' '}
                <Link 
                  href={`/login?redirect=${encodeURIComponent(redirect)}`} 
                  className="text-[#3f5ce6] font-bold hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: OTP Form */}
          {step === 'otp' && (
            <form className="space-y-4" onSubmit={handleVerifyOtp}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-poppins text-center sm:text-left">
                  Verification OTP Code
                </label>
                <div className="grid grid-cols-6 gap-2 w-full">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      onPaste={handleOtpPaste}
                      className="w-full h-12 text-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-bold focus:ring-1 focus:ring-purple-600 focus:border-purple-600 focus:outline-none text-[var(--text-primary)] transition-all"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-3 rounded-lg font-bold text-white text-xs bg-[#3f5ce6] hover:bg-[#324ab3] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center font-poppins"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-3.5 h-3.5 mr-1.5" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full py-2.5 px-3 rounded-lg border border-[var(--border)] font-bold text-[var(--text-primary)] text-xs hover:bg-[var(--bg-surface)] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center font-poppins"
                >
                  Back to Email
                </button>
              </div>

              <div className="text-center text-[11px] font-semibold text-[var(--text-secondary)]">
                Didn't receive the code?{' '}
                {resendTimer > 0 ? (
                  <span className="text-muted-foreground/60 font-medium">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="text-[#3f5ce6] font-bold hover:underline disabled:opacity-50 cursor-pointer focus:outline-none"
                  >
                    Resend Email
                  </button>
                )}
              </div>
            </form>
          )}

          {/* STEP 3: Password Reset Form */}
          {step === 'reset' && (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              {/* New Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-poppins">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs focus:ring-1 focus:ring-purple-600 focus:border-purple-600 focus:outline-none text-[var(--text-primary)] transition-all duration-200"
                    placeholder="Enter new password..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-poppins">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs focus:ring-1 focus:ring-purple-600 focus:border-purple-600 focus:outline-none text-[var(--text-primary)] transition-all duration-200"
                    placeholder="Confirm new password..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-lg font-bold text-white text-xs bg-[#3f5ce6] hover:bg-[#324ab3] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center font-poppins"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-3.5 h-3.5 mr-1.5" />
                    Resetting password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success Message Screen */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-6 flex flex-col items-center justify-center animate-in fade-in duration-200">
              {/* Checkmark Icon at Center */}
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-emerald-sm">
                <CheckCircle2 size={32} className="text-emerald-500 animate-in zoom-in-50 duration-300" />
              </div>
              
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] font-poppins">
                  Password Changed
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium max-w-[280px]">
                  Password has been changed successfully
                </p>
              </div>

              {/* Redirecting Timer Details */}
              <div className="text-[11px] font-semibold text-muted-foreground pt-1 flex items-center justify-center gap-1.5">
                <Loader2 size={12} className="animate-spin text-[#3f5ce6]" />
                <span>Redirecting to login in <span className="text-[#3f5ce6] font-bold">{countdown}s</span>...</span>
              </div>

              <Link
                href={`/login?redirect=${encodeURIComponent(redirect)}&resetSuccess=true`}
                className="w-full py-2.5 px-3 rounded-lg font-bold text-white text-xs bg-[#3f5ce6] hover:bg-[#324ab3] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center font-poppins"
              >
                Go to Login
              </Link>
            </div>
          )}

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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600" />
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  )
}

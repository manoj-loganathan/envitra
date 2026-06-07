'use client'

import { useState } from 'react'
import { X, Sparkles, Check, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgradeSuccess: (updatedPlan: string, expiresAt: string) => void
}

export function UpgradeModal({ isOpen, onClose, onUpgradeSuccess }: UpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  if (!isOpen) return null

  const price = billingCycle === 'monthly' ? 199 : 2004
  const originalPrice = billingCycle === 'monthly' ? 199 : 2388 // 199 * 12
  const savings = originalPrice - price
  const validity = billingCycle === 'monthly' ? '1 Month' : '1 Year'

  const handlePay = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('You must be logged in to upgrade.')
      }

      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1200))

      const expiresAt = new Date()
      if (billingCycle === 'monthly') {
        expiresAt.setDate(expiresAt.getDate() + 30)
      } else {
        expiresAt.setDate(expiresAt.getDate() + 365)
      }

      const { error } = await supabase
        .from('accounts')
        .update({
          plan: 'pro',
          plan_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess(true)
      
      // Show success screen briefly
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      onUpgradeSuccess('pro', expiresAt.toISOString())
      onClose()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to update plan. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Modal Panel */}
      <div className="relative bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Accent Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-[#3f5ce6] to-indigo-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="size-4" />
        </button>

        {success ? (
          /* Success View */
          <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-500">
              <Check className="size-6 stroke-[3]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Upgrade Successful!</h2>
              <p className="text-xs text-zinc-400 max-w-xs">
                Your account has been upgraded to Envitra Pro.
              </p>
            </div>
          </div>
        ) : (
          /* Payment View */
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="space-y-1 pr-6 text-left">
              <div className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles className="size-2.5" /> PRO UPGRADE
              </div>
              <h2 className="text-lg font-bold text-white">Unlock Premium Features</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Unlock leads capture CRM, products showcases, custom feed posts, and detailed traffic analytics.
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400">
                <AlertCircle className="size-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Selection */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <button
                onClick={() => !loading && setBillingCycle('monthly')}
                className={`relative p-4 rounded-xl border flex flex-col justify-between h-28 transition-all select-none cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'border-[#3f5ce6] bg-[#3f5ce6]/5 ring-1 ring-[#3f5ce6]/20'
                    : 'border-zinc-800 hover:border-[#3f5ce6]/40 hover:bg-zinc-800/30'
                } ${loading ? 'pointer-events-none opacity-60' : ''}`}
              >
                <div>
                  <span className="text-xs font-bold text-white">Monthly</span>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Flexible cycle</p>
                </div>
                <div>
                  <span className="text-base font-black text-white">₹199</span>
                  <span className="text-[9px] text-zinc-500">/mo</span>
                </div>
              </button>

              <button
                onClick={() => !loading && setBillingCycle('yearly')}
                className={`relative p-4 rounded-xl border flex flex-col justify-between h-28 transition-all select-none cursor-pointer overflow-hidden ${
                  billingCycle === 'yearly'
                    ? 'border-[#3f5ce6] bg-[#3f5ce6]/5 ring-1 ring-[#3f5ce6]/20'
                    : 'border-zinc-800 hover:border-[#3f5ce6]/40 hover:bg-zinc-800/30'
                } ${loading ? 'pointer-events-none opacity-60' : ''}`}
              >
                <div className="absolute top-2 right-2 text-[7px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Save 16%
                </div>
                <div>
                  <span className="text-xs font-bold text-white">Yearly Plan</span>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Billed annually as ₹2,004/yr</p>
                </div>
                <div>
                  <span className="text-base font-black text-white">₹167</span>
                  <span className="text-[9px] text-zinc-500">/mo</span>
                </div>
              </button>
            </div>

            {/* Summary */}
            <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 space-y-2 text-left">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Order Summary</span>
              
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Envitra Pro Subscription ({validity})</span>
                  <span className="text-white font-semibold">₹{price.toLocaleString('en-IN')}</span>
                </div>
                
                {billingCycle === 'yearly' && (
                  <div className="flex justify-between items-center text-emerald-500 font-semibold text-[10px]">
                    <span>Yearly savings</span>
                    <span>-₹{savings.toLocaleString('en-IN')}</span>
                  </div>
                )}
                
                <hr className="border-zinc-800" />
                
                <div className="flex justify-between items-center text-xs font-bold text-white pt-1">
                  <span>Total Amount (Inc. Taxes)</span>
                  <span className="text-[#3f5ce6] text-sm font-black">₹{price.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-extrabold shadow-lg shadow-[#3f5ce6]/25 transition-all cursor-pointer active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-3.5" />
                    Pay ₹{price.toLocaleString('en-IN')} with Razorpay
                  </>
                )}
              </button>
              
              <div className="flex items-center justify-center gap-1 text-[9px] text-zinc-500">
                <ShieldCheck className="size-3 text-emerald-500" />
                <span>Secured Sandbox Checkout Payment</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

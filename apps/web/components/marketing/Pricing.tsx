'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Zap, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthly: '₹0',
    yearly: '₹0',
    period: 'forever',
    description: 'Perfect for students and Individual Professionals',
    features: [
      'Digital profile page + QR code',
      'Unlimited views & shares',
      'Basic view count statistic',
      'Up to 1 active profile per card',
      'Email customer support',
    ],
    popular: false,
    cta: 'Get started for free',
    href: '/login',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: '₹199',
    yearly: '₹167',
    yearlyNote: 'Billed annually as ₹2,004',
    period: 'month',
    description: 'For professionals and creators',
    features: [
      'Everything in Free',
      'Advanced traffic & click analytics',
      'Lead capture form on profile',
      'Profile design theme customization',
      'Up to 5 active profiles per card',
      'Priority customer support',
    ],
    popular: true,
    cta: 'Upgrade to Pro',
    href: '/checkout',
  },
  {
    id: 'business',
    name: 'Business',
    monthly: 'Custom',
    yearly: 'Custom',
    period: 'min 5 seats',
    description: 'For startups, agencies & enterprises',
    features: [
      'Everything in Pro',
      'Central company admin dashboard',
      'Bulk profile provisioning & reassignment',
      'Centralized team analytics dashboard',
      'CRM integrations & sync API',
      'Dedicated account manager',
    ],
    popular: false,
    cta: 'Contact Sales',
    href: 'mailto:sales@envitra.in',
  },
]

export function Pricing() {
  const [activePlanId, setActivePlanId] = useState('pro')
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  const activePlan = PLANS.find(p => p.id === activePlanId) || PLANS[1]

  const price = billing === 'monthly' ? activePlan.monthly : activePlan.yearly
  const showYearlyNote = billing === 'yearly' && activePlan.yearlyNote

  return (
    <section id="pricing" className="py-12 sm:py-16 bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-200 min-h-[calc(100vh-80px)] flex items-center">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 w-full">

        {/* ── Header (Aligned and sized as FAQ header) ─────────────────── */}
        <div className="max-w-2xl mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Simple, transparent<br className="hidden sm:block" /> pricing
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
            Buy as many NFC cards as you need and manage every profile under a single subscription, with no extra fees per card or user.
          </p>
        </div>

        {/* ── Two Column Interactive Layout ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch max-w-6xl mx-auto">

          {/* Left Column - Plan list selector */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3">
            {PLANS.map((plan) => {
              const isActive = plan.id === activePlanId
              const cardPrice = billing === 'monthly' ? plan.monthly : plan.yearly

              return (
                <button
                  key={plan.id}
                  onClick={() => setActivePlanId(plan.id)}
                  className={`relative w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 overflow-hidden cursor-pointer flex-1 min-h-[88px] ${isActive
                      ? 'border-purple-500 bg-[var(--bg-surface)] shadow-[0_0_15px_rgba(48,80,216,0.15)] dark:shadow-[0_0_20px_rgba(48,80,216,0.25)]'
                      : 'border-[var(--border)] bg-[var(--bg-muted)] hover:border-[var(--border-strong)]'
                    }`}
                >
                  {/* Sliding selection border glow using framer motion */}
                  {isActive && (
                    <motion.div
                      layoutId="activePlanGlow"
                      className="absolute inset-0 rounded-2xl border-2 border-purple-500/30 pointer-events-none"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  <div className="flex flex-col gap-1.5 relative z-10 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] sm:text-base font-bold text-[var(--text-primary)]">
                        {plan.name}
                      </span>
                      {plan.id === 'pro' && (
                        <span className="text-[9px] font-bold text-white bg-purple-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-normal max-w-[260px]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0 relative z-10">
                    <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                      {cardPrice}
                    </span>
                    {plan.id === 'pro' && (
                      <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                        /month
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right Column - Plan details card */}
          <div className="lg:col-span-7 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePlanId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`relative h-full flex flex-col justify-between rounded-2xl border bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-lg)] ${activePlan.popular ? 'border-purple-500/30' : 'border-[var(--border)]'
                  }`}
              >
                {/* Popular Badge Glow */}
                {activePlan.popular && (
                  <div className="absolute top-0 right-10 -translate-y-1/2 bg-purple-600 px-3.5 py-1 rounded-full flex items-center gap-1 shadow-md z-10">
                    <Zap size={11} className="text-white fill-white shrink-0" />
                    <span className="text-white text-[9px] font-bold tracking-wider uppercase">Recommended</span>
                  </div>
                )}

                <div>
                  {/* Title Area */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-5 mb-5">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                        {activePlan.name} Plan
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {activePlan.description}
                      </p>
                    </div>

                    {/* Billing Toggle (Inside detail pane) */}
                    {activePlan.id !== 'free' && activePlan.id !== 'business' && (
                      <div className="inline-flex items-center gap-1 bg-[var(--bg-muted)] border border-[var(--border)] rounded-full p-0.5 shadow-[var(--shadow-sm)] shrink-0 self-start sm:self-center">
                        <button
                          onClick={() => setBilling('monthly')}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${billing === 'monthly'
                              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setBilling('yearly')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${billing === 'yearly'
                              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                          Yearly
                          <span className="text-[8px] font-extrabold text-purple-500 bg-purple-500/10 px-1 rounded-full leading-none">
                            -16%
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Price display inside detail card */}
                  <div className="mb-5 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)]">
                      {price}
                    </span>
                    {activePlan.id !== 'business' && (
                      <span className="text-sm text-[var(--text-muted)]">
                        /{activePlan.period}
                      </span>
                    )}
                    {showYearlyNote && (
                      <span className="text-xs text-purple-500 bg-purple-500/10 px-2.5 py-1 rounded-full font-medium ml-2">
                        {activePlan.yearlyNote}
                      </span>
                    )}
                  </div>

                  {/* Features list */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      What's Included
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      {activePlan.features.map((feature) => (
                        <li key={feature} className="flex gap-2.5 items-start">
                          <div className="w-[18px] h-[18px] rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-px">
                            <Check
                              size={10}
                              strokeWidth={3}
                              className="text-white"
                            />
                          </div>
                          <span className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action button */}
                <div className="mt-6 border-t border-[var(--border)] pt-5">
                  {activePlan.popular ? (
                    <Link
                      href={activePlan.href}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-bold text-sm text-white bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md hover:shadow-purple-lg transition-all duration-200 cursor-pointer"
                    >
                      {activePlan.cta} <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <Link
                      href={activePlan.href}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-bold text-sm border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-all duration-200 cursor-pointer"
                    >
                      {activePlan.cta} <ArrowRight size={15} />
                    </Link>
                  )}
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

        {/* ── Footer note ────────────────────────────────────────────── */}
        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          Physical card purchase cost is separate. Plans can be cancelled or downgraded anytime.
        </p>

      </div>
    </section>
  )
}

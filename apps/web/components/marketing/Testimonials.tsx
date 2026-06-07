'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TESTIMONIALS = [
  {
    quote: "I've handed out my Envitra card at three conferences. Not one person has lost my contact. It just works.",
    author: 'Rahul K.',
    role: 'Product Manager',
    location: 'Bengaluru',
    initials: 'RK',
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    quote: 'The Botanica design is stunning. Everyone asks where I got it. The profile setup took five minutes and my whole portfolio is live.',
    author: 'Priya S.',
    role: 'UX Designer',
    location: 'Chennai',
    initials: 'PS',
    gradient: 'from-rose-400 to-pink-600',
  },
  {
    quote: 'We onboarded our entire leadership team in a single afternoon. The admin dashboard makes it effortless to manage every card centrally.',
    author: 'Vikram A.',
    role: 'CEO, Acme Corp',
    location: 'Bengaluru',
    initials: 'VA',
    gradient: 'from-sky-500 to-blue-700',
  },
  {
    quote: 'I link my Behance, Instagram, and booking page — all in one tap. An absolute game changer for freelance networking events.',
    author: 'Deepika N.',
    role: 'Freelance Illustrator',
    location: 'Mumbai',
    initials: 'DN',
    gradient: 'from-amber-400 to-orange-600',
  },
  {
    quote: 'First pitch meeting I attended with this card — the investor literally said "that\'s cool". We closed the round that quarter.',
    author: 'Arjun M.',
    role: 'Startup Founder',
    location: 'Pune',
    initials: 'AM',
    gradient: 'from-emerald-500 to-teal-700',
  },
  {
    quote: 'We replaced 200 paper cards with Envitra in a single order. Zero reprint costs, instant profile updates across the whole team.',
    author: 'Sneha R.',
    role: 'CTO',
    location: 'Bengaluru',
    initials: 'SR',
    gradient: 'from-slate-500 to-indigo-700',
  },
]

const INTERVAL_MS = 4500

export function Testimonials() {
  const [active, setActive] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // Start / restart the auto-advance timer
  const resetTimer = () => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % TESTIMONIALS.length)
    }, INTERVAL_MS)
  }

  useEffect(() => {
    resetTimer()
    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const select = (i: number) => {
    setActive(i)
    resetTimer()
  }

  const current = TESTIMONIALS[active]

  return (
    <section id="testimonials" className="py-24 bg-[var(--bg-page)] transition-colors duration-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* ── Heading ─────────────────────────────────────────── */}
        <div className="max-w-2xl mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Our customers<br className="hidden sm:block" /> speak
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            See how professionals, founders, and teams are upgrading their networking with Envitra.
          </p>
        </div>

        {/* ── Quote block ──────────────────────────────────────── */}
        <div className="flex items-start gap-5 sm:gap-8 mb-10 min-h-[120px]">

          {/* Large opening quote mark */}
          <span
            aria-hidden="true"
            className="text-7xl sm:text-8xl font-black leading-none select-none shrink-0 -mt-3 text-[var(--text-primary)]"
          >
            "
          </span>

          {/* Animated quote text */}
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={active}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="text-lg sm:text-xl md:text-2xl font-medium text-[var(--text-primary)] leading-relaxed"
            >
              {current.quote}
            </motion.blockquote>
          </AnimatePresence>
        </div>

        {/* ── Author selector ──────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Active author pill — dark background */}
          <motion.div
            layout
            className="flex items-center gap-2.5 rounded-full pl-1 pr-5 py-1
                       bg-[var(--text-primary)] shadow-md cursor-default select-none"
          >
            {/* Avatar */}
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${current.gradient}
                          flex items-center justify-center text-white text-sm font-bold shrink-0`}
            >
              {current.initials}
            </div>

            {/* Name + role */}
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <p className="text-sm font-semibold leading-tight text-[var(--bg-page)]">
                  {current.author}
                </p>
                <p className="text-[10px] leading-tight" style={{ color: 'color-mix(in srgb, var(--bg-page) 60%, transparent)' }}>
                  {current.role} · {current.location}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Other author avatar circles */}
          {TESTIMONIALS.map((t, i) =>
            i === active ? null : (
              <motion.button
                key={i}
                onClick={() => select(i)}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.93 }}
                title={`${t.author} · ${t.role}`}
                className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.gradient}
                            flex items-center justify-center text-white text-sm font-bold
                            shadow-md cursor-pointer ring-2 ring-transparent
                            hover:ring-[var(--border-strong)] transition-all duration-150`}
              >
                {t.initials}
              </motion.button>
            )
          )}
        </div>

        {/* ── Progress dots ────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 mt-6">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => select(i)}
              aria-label={`View testimonial ${i + 1}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === active
                  ? 'w-6 bg-[var(--text-primary)]'
                  : 'w-1.5 bg-[var(--border-strong)] hover:bg-[var(--text-muted)]'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  )
}

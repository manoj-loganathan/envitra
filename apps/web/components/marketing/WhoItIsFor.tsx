'use client'

import { motion } from 'framer-motion'
import { Briefcase, Rocket, Palette, Building2 } from 'lucide-react'

// ── Left column: minimal 2×2 stats ───────────────────────────────────────────
const stats = [
  { value: '100×', label: 'Faster\ncommunication' },
  { value: '3 min', label: 'Saved per\nconnection' },
  { value: '0%',   label: 'Missed\nconnections' },
  { value: '∞',    label: 'Updates,\nno reprint' },
]

// ── Right column: audience items ─────────────────────────────────────────────
const cards = [
  {
    title: 'Professionals',
    description: "Your role changes. Your card shouldn't. Update your profile instantly without reprinting.",
    icon: Briefcase,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    title: 'Founders',
    description: 'Give investors a dynamic profile — not a paper card destined for the bin. Pitch with impact.',
    icon: Rocket,
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    title: 'Freelancers & Creators',
    description: 'Link your portfolio, social links, and scheduling widgets directly to one tap.',
    icon: Palette,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    title: 'Enterprise Teams',
    description: 'Onboard your team with custom branded cards. Manage all staff profiles centrally.',
    icon: Building2,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
]

export function WhoItIsFor() {
  return (
    <section
      id="who-its-for"
      className="py-24 transition-colors duration-200"
      style={{ background: 'var(--bg-page)' }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Equal-height two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── LEFT: Heading + 2×2 stat grid ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-8"
          >
            {/* Heading */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-[var(--text-primary)]">
                Built for everyone<br />who makes connections
              </h2>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Envitra empowers interactions across industries. Pick a profile style that fits your workflow.
              </p>
            </div>

            {/* 2×2 stat grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 flex-1">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 + 0.2, duration: 0.4 }}
                  className="flex flex-col items-center justify-center text-center py-4"
                >
                  <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent leading-none">
                    {stat.value}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold mt-3 leading-snug whitespace-pre-line text-[var(--text-secondary)]">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── RIGHT: 2×2 audience borderless grid with dividers ── */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-0">
            
            {/* Central Vertical Line (Desktop only) */}
            <div className="hidden sm:block absolute left-1/2 top-4 bottom-4 w-px bg-[var(--border)] -translate-x-1/2 pointer-events-none" />
            
            {/* Central Horizontal Line (Desktop only) */}
            <div className="hidden sm:block absolute left-4 right-4 top-1/2 h-px bg-[var(--border)] -translate-y-1/2 pointer-events-none" />

            {cards.map((card, idx) => {
              const Icon = card.icon
              const isLeft = idx % 2 === 0
              const isTop = idx < 2
              
              const quadrantClass = [
                isLeft ? 'sm:pr-8' : 'sm:pl-8',
                isTop ? 'sm:pb-8' : 'sm:pt-8',
                // Mobile layout spacing & dividers:
                idx !== 3 ? 'border-b border-[var(--border)] sm:border-b-0 pb-8 sm:pb-0' : '',
                idx !== 0 ? 'pt-8 sm:pt-0' : '',
              ].join(' ')

              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  className={`flex flex-col items-start ${quadrantClass}`}
                >
                  {/* Clean Icon */}
                  <Icon size={26} strokeWidth={1.5} className={card.iconColor} />

                  {/* Text details */}
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mt-4">
                    {card.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                    {card.description}
                  </p>
                </motion.div>
              )
            })}
          </div>

        </div>
      </div>
    </section>
  )
}

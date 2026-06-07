'use client'

import { motion } from 'framer-motion'
import { Palette, Package, Smartphone, Share2 } from 'lucide-react'

const STEPS = [
  {
    id: 1,
    title: 'Pick your card',
    description: 'Browse solid colours, pre-designed templates, or upload your own artwork.',
    icon: Palette,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 2,
    title: 'We print & ship',
    description: 'Once placed, we print and dispatch your custom NFC card within 48 hours.',
    icon: Package,
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    id: 3,
    title: 'One tap to activate',
    description: 'Tap the card against your phone once to launch the setup wizard. Done in seconds.',
    icon: Smartphone,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 4,
    title: 'Share forever',
    description: 'Every tap shares your live profile. Update details anytime — no reprinting needed.',
    icon: Share2,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 transition-colors duration-200" style={{ background: 'var(--bg-page)' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="max-w-2xl mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Set up in minutes.<br className="hidden sm:block" /> Share forever.
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Networking shouldn't be complicated. Here's how Envitra gets you connected in four steps.
          </p>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: idx * 0.08, duration: 0.45, ease: 'easeOut' }}
                className="flex flex-col items-start text-left"
              >
                {/* Icon */}
                <Icon 
                  size={28} 
                  strokeWidth={1.5} 
                  className={step.iconColor} 
                />

                {/* Title */}
                <h3 className="text-lg sm:text-[19px] font-bold text-[var(--text-primary)] mt-5 tracking-tight">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[var(--text-secondary)] mt-2.5 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

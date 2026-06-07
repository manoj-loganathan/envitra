'use client'

import { motion } from 'framer-motion'

const FAQS = [
  {
    q: 'Do I pay per card or per account?',
    a: 'Per account. One plan subscription covers all the NFC cards registered on your account. Buy as many physical cards as you need — the plan price never changes.',
  },
  {
    q: 'Can I upgrade my plan later?',
    a: 'Yes, absolutely. You can upgrade, downgrade, or cancel your subscription at any time from your account settings. No lock-in, no penalties.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Physical card printing and shipping typically takes 3–5 business days across major cities in India. Express options are available at checkout.',
  },
  {
    q: 'What happens when I tap the card for the first time?',
    a: 'A one-time setup wizard opens in the mobile browser. Register, create your contact profile, and set a password. After that, every tap goes straight to your live profile — no setup needed again.',
  },
  {
    q: 'Can I have multiple profiles on one card?',
    a: 'Yes. With Pro plans you can create up to 5 separate profiles — business, freelance, social — and switch the active one in real time from your dashboard.',
  },
  {
    q: 'Does the recipient need to install an app?',
    a: 'No. Your contact needs zero apps. Tapping the card opens your digital profile instantly in their default mobile browser on any modern iPhone or Android device.',
  },
  {
    q: 'Can I change my profile after the card is printed?',
    a: 'Yes. Edit any detail — phone, links, company logo, bio — via your online dashboard at any time. Changes are instant and apply on the very next tap.',
  },
  {
    q: 'What is the eco card made from?',
    a: 'Our eco-friendly cards use 100% sustainably harvested organic bamboo. They are fully biodegradable and shipped in plastic-free recycled cardboard packaging.',
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-24 bg-[var(--bg-page)] transition-colors duration-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-2xl mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Common questions<br className="hidden sm:block" /> and answers
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Everything you need to know about Envitra smart NFC cards and accounts.
          </p>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {FAQS.map((faq, i) => {
            const isLeft = i % 2 === 0
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: (i % 2) * 0.05 + Math.floor(i / 2) * 0.06, duration: 0.35, ease: 'easeOut' }}
                className={[
                  'py-8 border-b border-[var(--border)]',
                  isLeft
                    ? 'md:pr-12 md:border-r md:border-[var(--border)]'
                    : 'md:pl-12',
                ].join(' ')}
              >
                {/* Number + Question */}
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-xs font-semibold text-[var(--text-muted)] tabular-nums w-4 shrink-0">
                    {i + 1}
                  </span>
                  <h3 className="text-sm sm:text-[15px] font-semibold text-[var(--text-primary)] leading-snug">
                    {faq.q}
                  </h3>
                </div>

                {/* Answer */}
                <p className="pl-7 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {faq.a}
                </p>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

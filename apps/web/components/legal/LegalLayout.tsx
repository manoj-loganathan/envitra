'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

export interface LegalSection {
  id: string
  title: string
}

interface LegalLayoutProps {
  title: string
  subtitle: string
  lastUpdated: string
  sections: LegalSection[]
  children: React.ReactNode
}

export function LegalLayout({ title, subtitle, lastUpdated, sections, children }: LegalLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id ?? '')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const offset = 112 // sticky header height
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    const sectionEls = sections.map(s => document.getElementById(s.id)).filter(Boolean)

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id)
        }
      },
      {
        rootMargin: '-112px 0px -55% 0px',
        threshold: 0,
      }
    )

    sectionEls.forEach(el => el && observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [sections])

  // Scroll the sidebar nav item into view when active changes
  useEffect(() => {
    if (!sidebarRef.current) return
    const activeEl = sidebarRef.current.querySelector(`[data-nav="${activeSection}"]`) as HTMLElement | null
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeSection])

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--bg-page)]">
        {/* Subtle radial gradient accent */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(63,92,230,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 pt-32 pb-16 md:pt-48 md:pb-24">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--text-primary)] mb-6 font-poppins">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl leading-relaxed mb-6 font-sans">
            {subtitle}
          </p>
          <p className="text-[13px] text-[var(--text-muted)] font-sans">
            Last Updated: {lastUpdated}
          </p>
        </div>
      </div>

      {/* ── Two-Column Body ──────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 w-full">

          {/* ── Sticky Sidebar ─────────────────────────────────── */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div
              ref={sidebarRef}
              className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 pb-10"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
            >
              <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6 font-poppins">
                On this page
              </h3>
              <div className="relative">
                {/* Vertical guide line */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-[var(--border)]" />
                <ul className="space-y-3.5">
                  {sections.map((section) => {
                    const isActive = activeSection === section.id
                    return (
                      <li key={section.id} id={`nav-${section.id}`} className="relative" data-nav={section.id}>
                        {isActive && (
                          <div className="absolute -left-px top-0 bottom-0 w-0.5 bg-[#3f5ce6] rounded-full shadow-[0_0_8px_rgba(63,92,230,0.35)]" />
                        )}
                        <button
                          onClick={() => scrollToSection(section.id)}
                          className={`block w-full text-left text-[13px] pl-5 transition-all duration-200 truncate cursor-pointer font-sans ${
                            isActive
                              ? 'text-[#3f5ce6] font-semibold'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {section.title}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </aside>

          {/* ── Main Content ───────────────────────────────────── */}
          <main className="flex-1 max-w-3xl w-full">
            <div className="space-y-16 text-[15.5px] leading-8 text-[var(--text-secondary)]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

/* ── Reusable Section Wrapper ───────────────────────────────── */
export function LegalSection({
  id,
  number,
  title,
  children,
}: {
  id: string
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-32">
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-xs font-bold text-[#3f5ce6] font-poppins bg-[var(--bg-purple-tint)] border border-[var(--border-purple)] px-2.5 py-1 rounded-md tracking-wider">
          {number}
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight font-poppins">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

/* ── Callout Box ────────────────────────────────────────────── */
export function LegalCallout({
  type = 'info',
  label,
  children,
}: {
  type?: 'info' | 'warning' | 'important'
  label?: string
  children: React.ReactNode
}) {
  const styles = {
    info: {
      wrapper: 'bg-[var(--bg-purple-tint)] border-[var(--border-purple)]',
      dot: 'bg-[#3f5ce6]',
      label: 'text-[#3f5ce6]',
    },
    warning: {
      wrapper: 'bg-amber-500/5 border-amber-500/20',
      dot: 'bg-amber-500',
      label: 'text-amber-500',
    },
    important: {
      wrapper: 'bg-red-500/5 border-red-500/20',
      dot: 'bg-red-500',
      label: 'text-red-500',
    },
  }[type]

  return (
    <div className={`my-4 rounded-xl border px-5 py-4 text-sm ${styles.wrapper}`}>
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
          <span className={`text-[11px] font-bold uppercase tracking-widest ${styles.label} font-poppins`}>
            {label}
          </span>
        </div>
      )}
      <div className="text-[var(--text-secondary)] leading-relaxed">{children}</div>
    </div>
  )
}

/* ── Contact Card ───────────────────────────────────────────── */
export function LegalContactCard({
  title,
  email,
  extra,
}: {
  title: string
  email: string
  extra?: string
}) {
  return (
    <div className="flex gap-4 p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)]">
      <div className="w-10 h-10 rounded-full bg-[var(--bg-purple-tint)] flex items-center justify-center shrink-0 border border-[var(--border-purple)]">
        <svg className="w-5 h-5 text-[#3f5ce6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)] font-poppins mb-0.5">{title}</h4>
        <Link
          href={`mailto:${email}`}
          className="text-[#3f5ce6] hover:underline font-medium text-sm font-sans"
        >
          {email}
        </Link>
        {extra && <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">{extra}</p>}
      </div>
    </div>
  )
}

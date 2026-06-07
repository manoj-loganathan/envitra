'use client'

import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'

export function HeroSection() {
  const avatarInitials = ['AK', 'RS', 'PM', 'VN', 'SK']

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      className="relative overflow-hidden flex flex-col"
      style={{ background: 'var(--bg-page)' }}
    >
      {/* Absolute background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(48,80,216,0.10) 0%, transparent 70%)'
        }}
      />

      {/* ── Hero Content ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-center items-center gap-4 md:gap-5 relative z-10 h-[calc(100dvh-4rem)] min-h-[600px] py-6 md:py-10">

        {/* Heading + subtitle + CTAs */}
        <div className="flex flex-col items-center max-w-4xl gap-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-center whitespace-nowrap bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Your identity. Your brand. One tap away.
          </h1>
          <p className="text-sm sm:text-base text-center max-w-2xl leading-relaxed font-normal" style={{ color: 'var(--text-muted)' }}>
            Replace outdated paper business cards with a premium digital identity that updates in real time and makes every connection effortless.
          </p>
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-1">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-btn font-medium text-white text-sm bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md hover:shadow-purple-lg transition-all duration-200 active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              Get your card <ArrowRight size={16} />
            </Link>
            <button
              onClick={scrollToHowItWorks}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-btn font-medium text-sm border border-[var(--border-purple)] text-purple-400 hover:text-purple-300 bg-transparent hover:bg-purple-600/10 transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              See how it works <Play size={12} className="fill-purple-400" />
            </button>
          </div>
        </div>

        {/* Cards Stack */}
        <div className="relative w-full max-w-5xl flex items-center justify-center h-[calc(var(--card-h)+1.5rem)]">
          <div
            className="relative w-full max-w-5xl flex items-center justify-center [perspective:1200px] [transform-style:preserve-3d] z-10 transition-all duration-300"
            style={{ height: 'var(--card-h)' }}
          >
            {/* Card 1: Outer Left */}
            <div
              className="absolute rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-br from-[#120224] via-[#2E0854] to-[#120224] border border-white/5 p-2 sm:p-4 lg:p-6 flex flex-col justify-between shadow-lg text-white select-none transition-transform duration-500 hover:opacity-100"
              style={{ width: 'var(--card-w)', height: 'var(--card-h)', transform: 'translateX(calc(-1 * var(--card-x1))) translateZ(calc(-1 * var(--card-z1))) rotateY(22deg) scale(0.85)', zIndex: 10, transformStyle: 'preserve-3d' }}
            >
              <div className="flex justify-between items-start">
                <div className="text-[10px] sm:text-base lg:text-xl font-bold tracking-tight text-white opacity-80 flex items-center">
                  <span className="relative">F<span className="absolute -top-0.5 sm:-top-1 left-0 right-0 h-[1px] sm:h-0.5 bg-white/80" /><span className="absolute top-0.5 sm:top-1.5 left-0 right-0.5 h-[1px] sm:h-0.5 bg-white/80" /></span>
                </div>
              </div>
              <div className="text-[5px] sm:text-[8px] lg:text-xs font-mono tracking-widest text-zinc-500">••••</div>
            </div>

            {/* Card 2: Inner Left */}
            <div
              className="absolute rounded-lg sm:rounded-xl lg:rounded-2xl bg-[#090d16] border border-white/5 p-2 sm:p-4 lg:p-6 flex flex-col justify-between shadow-xl text-white select-none transition-transform duration-500 hover:opacity-100"
              style={{ width: 'var(--card-w)', height: 'var(--card-h)', transform: 'translateX(calc(-1 * var(--card-x2))) translateZ(calc(-1 * var(--card-z2))) rotateY(15deg) scale(0.92)', zIndex: 20, transformStyle: 'preserve-3d' }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-[30%] bg-gradient-to-l from-cyan-500/20 to-transparent blur-md pointer-events-none rounded-r-lg sm:rounded-r-xl lg:rounded-r-2xl" />
              <div className="flex justify-between items-start">
                <div className="text-sm sm:text-2xl lg:text-3.5xl font-extrabold tracking-tight text-white flex items-center">
                  <span className="relative">F<span className="absolute -top-0.5 sm:-top-1 left-0 right-0 h-[1px] sm:h-0.5 bg-white" /><span className="absolute top-0.5 sm:top-1.5 left-0 right-0.5 h-[1px] sm:h-0.5 bg-white" /></span>
                  <span className="text-[6px] sm:text-xs opacity-60 ml-0.5">.</span>
                </div>
              </div>
              <div className="text-[5px] sm:text-[8px] lg:text-xs font-mono tracking-widest text-zinc-400">•••• 2400</div>
            </div>

            {/* Card 3: Center (White) */}
            <div
              className="absolute rounded-lg sm:rounded-xl lg:rounded-2xl bg-white p-2 sm:p-4 lg:p-6 flex flex-col justify-between shadow-2xl text-black border border-zinc-200 select-none transition-transform duration-500 hover:scale-[1.04]"
              style={{ width: 'var(--card-w)', height: 'var(--card-h)', transform: 'translateX(0) translateZ(0) rotateY(0) scale(1)', zIndex: 30, transformStyle: 'preserve-3d' }}
            >
              <div className="flex justify-between items-start">
                <div className="text-left font-bold text-xs sm:text-lg lg:text-2xl leading-tight">
                  <span className="text-[#0a235c] block">For any</span>
                  <span className="bg-gradient-to-r from-[#0052d4] via-[#4364f7] to-[#6fb1fc] bg-clip-text text-transparent block mt-0.5">payments</span>
                </div>
                <div className="text-zinc-400">
                  <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2a10 10 0 0 1 10 10" /><path d="M12 6a6 6 0 0 1 6 6" /><circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
              </div>
              <div className="flex gap-0.5 sm:gap-1.5 justify-end">
                <span className="px-1 py-0.5 sm:px-2.5 sm:py-0.5 bg-zinc-100 text-zinc-600 text-[5px] sm:text-[7px] lg:text-[9px] font-semibold rounded border border-zinc-200/50 leading-none">Hotel booking</span>
                <span className="px-1 py-0.5 sm:px-2.5 sm:py-0.5 bg-zinc-100 text-zinc-600 text-[5px] sm:text-[7px] lg:text-[9px] font-semibold rounded border border-zinc-200/50 leading-none">Retail store</span>
                <span className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 bg-zinc-100 text-zinc-600 text-[5px] sm:text-[7px] lg:text-[9px] font-semibold rounded border border-zinc-200/50 leading-none">etc.</span>
              </div>
            </div>

            {/* Card 4: Inner Right */}
            <div
              className="absolute rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-br from-[#0c0714] via-[#1a0f30] to-[#0c0714] border border-white/5 p-2 sm:p-4 lg:p-6 flex flex-col justify-between shadow-xl text-white select-none transition-transform duration-500 hover:opacity-100"
              style={{ width: 'var(--card-w)', height: 'var(--card-h)', transform: 'translateX(var(--card-x2)) translateZ(calc(-1 * var(--card-z2))) rotateY(-15deg) scale(0.92)', zIndex: 20, transformStyle: 'preserve-3d' }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-[30%] bg-gradient-to-r from-purple-500/10 to-transparent blur-md pointer-events-none rounded-l-lg sm:rounded-l-xl lg:rounded-l-2xl" />
              <div className="flex justify-end items-start w-full">
                <div className="text-zinc-600">
                  <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2a10 10 0 0 1 10 10" /><path d="M12 6a6 6 0 0 1 6 6" /><circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-end w-full">
                <div className="w-3 h-3 sm:w-4.5 sm:h-4.5 lg:w-6 lg:h-6 rounded-full bg-[#EB001B] opacity-90" />
                <div className="w-3 h-3 sm:w-4.5 sm:h-4.5 lg:w-6 lg:h-6 rounded-full bg-[#F79E1B] opacity-90 -ml-1.5 sm:-ml-2.5 lg:-ml-3" />
              </div>
            </div>

            {/* Card 5: Outer Right */}
            <div
              className="absolute rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-br from-[#050b1a] via-[#0c1836] to-[#050b1a] border border-white/5 p-2 sm:p-4 lg:p-6 flex flex-col justify-between shadow-lg text-white select-none transition-transform duration-500 hover:opacity-100"
              style={{ width: 'var(--card-w)', height: 'var(--card-h)', transform: 'translateX(var(--card-x1)) translateZ(calc(-1 * var(--card-z1))) rotateY(-22deg) scale(0.85)', zIndex: 10, transformStyle: 'preserve-3d' }}
            >
              <div className="flex justify-end items-start w-full">
                <div className="text-zinc-700">
                  <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2a10 10 0 0 1 10 10" /><path d="M12 6a6 6 0 0 1 6 6" /><circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
              </div>
              <div className="flex justify-between items-end w-full">
                <div className="text-[5px] sm:text-[8px] lg:text-xs font-mono tracking-widest text-zinc-600">••••</div>
                <div className="text-right text-[8px] sm:text-xs lg:text-base font-bold tracking-widest text-white opacity-85">SA</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Social Proof Bar ── */}
      <div
        className="relative z-10 w-full py-6"
        // style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">

            {/* Left: Avatars + trust text */}
            <div className="flex flex-col sm:flex-row items-center gap-3 select-none">
              <div className="flex -space-x-2.5">
                {avatarInitials.map((initials, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-purple-300 shadow-md bg-gradient-to-br from-purple-900 to-zinc-800"
                    style={{ borderColor: 'var(--bg-page)' }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Trusted by 2,000+ professionals
                </p>
                <p className="text-[11px] text-purple-500 font-medium">★ ★ ★ ★ ★ &nbsp;4.9 / 5 Rating</p>
              </div>
            </div>

            {/* Vertical divider */}
            <div className="hidden md:block w-px h-10 shrink-0" style={{ background: 'var(--border)' }} />

            {/* Stats */}
            <div className="flex items-center gap-8 sm:gap-12">
              <div className="text-center space-y-0.5">
                <p className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">95%+</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold leading-tight" style={{ color: 'var(--text-muted)' }}>
                  NFC-ready devices<br />in India
                </p>
              </div>
              <div className="w-px h-8 shrink-0" style={{ background: 'var(--border)' }} />
              <div className="text-center space-y-0.5">
                <p className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">&lt;10s</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold leading-tight" style={{ color: 'var(--text-muted)' }}>
                  Handshake to<br />pipeline
                </p>
              </div>
              <div className="w-px h-8 shrink-0" style={{ background: 'var(--border)' }} />
              <div className="text-center space-y-0.5">
                <p className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">1,000+</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold leading-tight" style={{ color: 'var(--text-muted)' }}>
                  Cards<br />Delivered
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </section>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Palette, Upload, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/layout/Logo'

// ==========================================
// Bespoke Stateful Interactive Visual Mockups
// ==========================================

function ColorCustomizerVisual() {
  const [selectedColor, setSelectedColor] = useState('#3050d8')
  const colors = [
    { name: 'Royal Blue', hex: '#3050d8' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Purple', hex: '#8b5cf6' }
  ]
  return (
    <div className="relative w-72 h-44 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center p-4">
      <div
        className="absolute w-28 h-28 rounded-full blur-2xl opacity-20 transition-all duration-500"
        style={{ backgroundColor: selectedColor }}
      />
      <div
        className="w-16 h-16 rounded-full border border-white/20 shadow-2xl flex items-center justify-center transition-all duration-500 transform scale-105"
        style={{
          backgroundColor: selectedColor,
          boxShadow: `0 0 30px ${selectedColor}40`
        }}
      >
        <span className="text-white text-[10px] font-bold tracking-widest uppercase">Color</span>
      </div>

      <div className="flex gap-3 mt-6">
        {colors.map((c) => (
          <button
            key={c.hex}
            onClick={() => setSelectedColor(c.hex)}
            className="w-6 h-6 rounded-full border border-white/20 hover:scale-125 transition-transform duration-200 cursor-pointer shadow-sm relative flex items-center justify-center"
            style={{ backgroundColor: c.hex }}
            title={c.name}
          >
            {selectedColor === c.hex && (
              <span className="absolute w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function LogoCustomizerVisual() {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setScale(s => (s === 1 ? 1.25 : s === 1.25 ? 0.8 : 1))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-72 h-44 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-white/10 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px] opacity-30" />

      <div className="absolute left-1/2 top-4 bottom-4 border-l border-dashed border-zinc-700/50" />
      <div className="absolute top-1/2 left-4 right-4 border-t border-dashed border-zinc-700/50" />

      <div className="absolute w-24 h-24 rounded-full border border-zinc-700/30 border-dashed animate-pulse" />

      <div
        className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 border border-white/20 shadow-2xl flex items-center justify-center relative transition-transform duration-700 ease-out z-10"
        style={{ transform: `scale(${scale})` }}
      >
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a13.917 13.917 0 00-2.336-6.89M12 11c0-3.517 1.009-6.799 2.753-9.571m3.44 2.04l-.054-.09A13.912 13.912 0 0015 11a13.915 13.915 0 002.336 6.89M9 11a9 9 0 0118 0v1a9 9 0 01-9 9m-9-10a9 9 0 019-9v1a9 9 0 01-9 9m-9-9a9 9 0 00-9 9v1a9 9 0 009 9" />
        </svg>
        <span className="absolute -top-1 -left-1 w-2 h-2 bg-blue-400 border border-white rounded-sm" />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 border border-white rounded-sm" />
        <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 border border-white rounded-sm" />
        <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-400 border border-white rounded-sm" />
      </div>

      <span className="absolute bottom-2 left-3 text-[8px] font-mono text-zinc-500">SCALE: {Math.round(scale * 100)}%</span>
      <span className="absolute bottom-2 right-3 text-[8px] font-mono text-zinc-500">ALIGN: CENTER</span>
    </div>
  )
}

function TextEditorVisual() {
  const [nameText, setNameText] = useState('')
  const [titleText, setTitleText] = useState('')
  const [descText, setDescText] = useState('')
  const targetName = 'Manoj Kumar'
  const targetTitle = 'Creative Director'
  const targetDesc = 'Building design systems that scale.'
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (phase === 0) {
      if (nameText.length < targetName.length) {
        timer = setTimeout(() => setNameText(targetName.slice(0, nameText.length + 1)), 110)
      } else setPhase(1)
    } else if (phase === 1) {
      if (titleText.length < targetTitle.length) {
        timer = setTimeout(() => setTitleText(targetTitle.slice(0, titleText.length + 1)), 80)
      } else setPhase(2)
    } else if (phase === 2) {
      if (descText.length < targetDesc.length) {
        timer = setTimeout(() => setDescText(targetDesc.slice(0, descText.length + 1)), 50)
      } else setPhase(3)
    } else if (phase === 3) {
      timer = setTimeout(() => { setNameText(''); setTitleText(''); setDescText(''); setPhase(0) }, 2800)
    }
    return () => clearTimeout(timer)
  }, [nameText, titleText, descText, phase])

  return (
    <div className="relative w-72 h-44 flex items-center justify-center">
      {/* Ambient glow */}
      <div className="absolute w-40 h-24 bg-indigo-500/10 blur-3xl rounded-full" />

      {/* Floating card */}
      <div className="relative w-full bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 backdrop-blur border border-white/8 rounded-2xl px-5 py-4 shadow-2xl">
        {/* Avatar row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            {nameText ? nameText[0] : '·'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="h-3 flex items-center">
              <span className="text-xs font-semibold text-white truncate">{nameText}</span>
              {phase === 0 && <span className="w-px h-3 bg-blue-400 ml-0.5 animate-pulse" />}
            </div>
            <div className="h-2.5 flex items-center mt-0.5">
              <span className="text-[9px] text-zinc-400 truncate">{titleText}</span>
              {phase === 1 && <span className="w-px h-2.5 bg-blue-400 ml-0.5 animate-pulse" />}
            </div>
          </div>
        </div>

        {/* Description line */}
        <div className="border-t border-white/5 pt-3">
          <p className="text-[9px] text-zinc-400 leading-relaxed min-h-[2rem]">
            {descText}
            {phase === 2 && <span className="w-px h-2.5 bg-blue-400 ml-0.5 animate-pulse inline-block" />}
          </p>
        </div>

        {/* Subtle tag pills */}
        <div className="flex gap-1.5 mt-2.5">
          {['LinkedIn', 'Portfolio', 'Email'].map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded-full bg-white/5 border border-white/8 text-[7px] text-zinc-500">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function BackgroundUploadVisual() {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-72 h-44 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-white/10 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full h-full rounded-xl border border-dashed border-zinc-700/80 bg-zinc-950/20 flex flex-col items-center justify-center space-y-2 relative transition-colors duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-50" />

        <div
          className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center transition-transform duration-700"
          style={{ transform: pulse ? 'translateY(-4px)' : 'translateY(0px)' }}
        >
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>

        <p className="text-[10px] font-bold text-zinc-300 tracking-wide">Drag & Drop Background Artwork</p>
        <p className="text-[8px] text-zinc-500">Supports PNG, JPG, SVG up to 10MB</p>

        <div className="absolute -bottom-2 flex gap-2">
          <div className="w-10 h-6 rounded border border-white/10 bg-gradient-to-tr from-indigo-900 to-slate-900 shadow-lg transform rotate-[-6deg]" />
          <div className="w-10 h-6 rounded border border-white/15 bg-gradient-to-tr from-amber-800 to-stone-900 shadow-lg transform translate-y-[-2px] rotate-[3deg]" />
          <div className="w-10 h-6 rounded border border-white/10 bg-gradient-to-tr from-emerald-900 to-zinc-900 shadow-lg transform rotate-[-3deg]" />
        </div>
      </div>
    </div>
  )
}

function DashboardVisual() {
  return (
    <div className="relative w-72 h-44 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-white/10 p-3.5 flex flex-col justify-between overflow-hidden">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">Live Tap Analytics</span>
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[7px] text-emerald-400 font-bold uppercase animate-pulse">
          <span className="w-1 h-1 rounded-full bg-emerald-400" /> Live
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 my-1">
        <div className="bg-zinc-950/60 border border-white/5 p-1.5 rounded-lg flex flex-col">
          <span className="text-[7px] text-zinc-500 uppercase">Total Taps</span>
          <span className="text-xs font-bold text-white mt-0.5">1,420</span>
        </div>
        <div className="bg-zinc-950/60 border border-white/5 p-1.5 rounded-lg flex flex-col">
          <span className="text-[7px] text-zinc-500 uppercase">Unique Reach</span>
          <span className="text-xs font-bold text-white mt-0.5">856</span>
        </div>
        <div className="bg-zinc-950/60 border border-white/5 p-1.5 rounded-lg flex flex-col">
          <span className="text-[7px] text-zinc-500 uppercase">Active Links</span>
          <span className="text-xs font-bold text-blue-400 mt-0.5">12</span>
        </div>
      </div>

      <div className="h-14 w-full bg-zinc-950/40 rounded-lg border border-white/5 flex items-end p-1 relative">
        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path
            d="M 0 25 Q 15 28 30 18 T 60 10 T 80 5 T 100 12"
            fill="none"
            stroke="url(#chartGrad)"
            strokeWidth={1.5}
          />
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3050d8" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute bottom-1 right-2 text-[6px] font-mono text-zinc-600">Weekly Interactions</span>
      </div>
    </div>
  )
}

function HowItWorksVisual() {
  return (
    <div className="relative w-72 h-44 flex items-center justify-center">
      {/* Background ambient glow */}
      <div className="absolute w-32 h-32 bg-blue-500/8 blur-3xl rounded-full" />

      {/* Ripple rings — purely decorative, perfectly centered */}
      <div className="absolute w-28 h-28 rounded-full border border-blue-500/20 animate-ping" style={{ animationDuration: '2.4s' }} />
      <div className="absolute w-40 h-40 rounded-full border border-blue-500/12 animate-ping" style={{ animationDuration: '2.4s', animationDelay: '0.6s' }} />
      <div className="absolute w-52 h-52 rounded-full border border-blue-500/6 animate-ping" style={{ animationDuration: '2.4s', animationDelay: '1.2s' }} />

      {/* Central card chip */}
      <div className="relative z-10 flex flex-col items-center gap-2.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 border border-white/15 shadow-[0_0_24px_rgba(48,80,216,0.35)] flex items-center justify-center">
          {/* NFC symbol */}
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0" />
          </svg>
        </div>
        <span className="text-[9px] font-semibold text-zinc-400 tracking-widest uppercase">Tap to Connect</span>
      </div>
    </div>
  )
}

// ==========================================
// Slide Array Configuration
// ==========================================

const SLIDES = [
  {
    id: 1,
    badge: 'Aesthetic Options',
    badgeCls: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    title: 'Personalize Your Brand Colors',
    description: 'Express your brand identity. Select from a curated spectrum of solid colors, sleek metallics, and premium custom gradients.',
    cta: 'Explore Color Options',
    action: 'design',
    bg: 'from-zinc-950 via-slate-950 to-blue-950/40 border-blue-500/10',
    visual: () => <ColorCustomizerVisual />
  },
  {
    id: 2,
    badge: 'Branding & Logos',
    badgeCls: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
    title: 'Emboss Your Company Logo',
    description: 'Make your card unmistakably yours. Easily upload and position your high-res vector logo for clean, premium alignment.',
    cta: 'View Branding Series',
    action: 'design',
    bg: 'from-zinc-950 via-zinc-900 to-slate-900 border-slate-500/10',
    visual: () => <LogoCustomizerVisual />
  },
  {
    id: 3,
    badge: 'Typography Layouts',
    badgeCls: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    title: 'Add Custom Title & Description',
    description: 'Present yourself clearly. Add names, job titles, company text, and custom taglines directly onto your card template.',
    cta: 'Customize Card Text',
    action: 'design',
    bg: 'from-zinc-950 via-slate-950 to-indigo-950/40 border-indigo-500/10',
    visual: () => <TextEditorVisual />
  },
  {
    id: 4,
    badge: 'Total Creative Control',
    badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    title: 'Upload Your Custom Backgrounds',
    description: 'Complete creative freedom. Upload custom photography, textures, or patterns to design a card that stands out from the crowd.',
    cta: 'Upload Custom Design',
    action: 'design',
    bg: 'from-zinc-950 via-stone-950 to-amber-950/30 border-amber-500/10',
    visual: () => <BackgroundUploadVisual />
  },
  {
    id: 5,
    badge: 'Digital Portal',
    badgeCls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: 'Real-Time Dashboard Control',
    description: 'Update details instantly. Log into your dashboard to edit social links, contact cards, and monitor interaction analytics in real-time.',
    cta: 'Explore Dashboard Features',
    action: 'design',
    bg: 'from-zinc-950 via-slate-950 to-emerald-950 border-emerald-500/10',
    visual: () => <DashboardVisual />
  },
  {
    id: 6,
    badge: 'NFC Connectivity',
    badgeCls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    title: 'One Tap to Share Instantly',
    description: 'Zero app downloads required. Simply tap your card to any modern smartphone to instantly launch your live digital profile.',
    cta: 'See Tapping in Action',
    action: 'design',
    bg: 'from-zinc-950 via-slate-950 to-cyan-950 border-cyan-500/10',
    visual: () => <HowItWorksVisual />
  }
]

export default function ShopPage() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [currentSlide])

  return (
    <div className="flex flex-col w-full overflow-x-hidden">

      {/* Full-width Carousel Banner */}
      <div className="relative overflow-hidden w-full bg-zinc-950 text-white border-b border-zinc-900 shadow-2xl min-h-[380px] md:min-h-[340px] flex items-center">

        {/* Slide Display Container */}
        <div className="relative w-full h-full min-h-[380px] md:min-h-[340px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className={`absolute inset-0 bg-gradient-to-r ${SLIDES[currentSlide].bg} px-6 sm:px-12 md:px-20 lg:px-28 py-10 flex flex-col md:flex-row items-center justify-between gap-10 h-full w-full`}
            >
              {/* Left Content */}
              <div className="flex-1 space-y-4 max-w-xl text-left relative z-10 w-full">
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`inline-flex items-center px-3 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${SLIDES[currentSlide].badgeCls}`}
                >
                  {SLIDES[currentSlide].badge}
                </motion.span>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent"
                >
                  {SLIDES[currentSlide].title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs sm:text-sm md:text-base text-zinc-400 leading-relaxed font-normal"
                >
                  {SLIDES[currentSlide].description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="pt-2"
                >
                  <Link
                    href={`/shop/${SLIDES[currentSlide].action}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-btn text-xs font-semibold text-white bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md transition-all duration-200 cursor-pointer hover:translate-y-[-1px]"
                  >
                    {SLIDES[currentSlide].cta} <ArrowRight size={14} />
                  </Link>
                </motion.div>
              </div>

              {/* Right Visual Representation (Bespoke Visuals Mockup) */}
              <div className="hidden md:flex flex-1 justify-center lg:justify-end items-center h-full max-w-sm lg:max-w-md relative z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                >
                  {SLIDES[currentSlide].visual()}
                </motion.div>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Left Arrow Button */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
          className="absolute left-4 p-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 text-white/70 hover:text-white transition-all cursor-pointer z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
          className="absolute right-4 p-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 text-white/70 hover:text-white transition-all cursor-pointer z-20"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>

        {/* Bottom Dot Indicators */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${i === currentSlide ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/60'
                }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

      </div>

      {/* Premium Envitra Member-focused Layout */}
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 w-full border-t border-[var(--border)] bg-[var(--bg-background)]">
        {/* Top Header */}
        <div className="text-center space-y-3 mb-16">
          <p className="text-xs sm:text-sm font-semibold tracking-wider text-purple-600 dark:text-purple-400 uppercase">
            One-time card purchase. Free, Pro & Business plans available.
          </p>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Elevate your networking instantly
          </h2>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-center max-w-5xl mx-auto">

          {/* Left Column: Card Preview & CTA */}
          <div className="col-span-12 md:col-span-5 flex flex-col items-center">
            {/* Card Mockup */}
            <div className="relative w-full aspect-[1.586/1] max-w-[360px] rounded-lg sm:rounded-xl lg:rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between select-none"
              style={{
                background: 'linear-gradient(135deg, #1f1f23 0%, #121215 50%, #070709 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
              }}>

              {/* Premium texture overlays */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.08)_0%,transparent_60%)]" />
              <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.4)_0%,rgba(0,0,0,0.2)_100%)]" />

              {/* Card Header */}
              <div className="relative z-10 flex justify-between items-start">
                <Logo
                />
                {/* Hero Section Wave Icon */}
                <div className="text-zinc-400">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M12 2a10 10 0 0 1 10 10" />
                    <path d="M12 6a6 6 0 0 1 6 6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
              </div>

              {/* Price Details */}
              <div className="relative z-10 space-y-1 text-white">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹499</span>
                  <span className="text-xs font-semibold text-zinc-400">/ card</span>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                  One-time card purchase • Free, Pro &amp; Business plans
                </p>
              </div>
            </div>

            {/* Start Customizing button directly under the card */}
            <Link
              href="/shop/design"
              className="mt-6 w-full max-w-[360px] text-center py-3.5 rounded-full font-bold text-sm bg-gradient-primary hover:bg-gradient-primary-hover text-white shadow-purple-md hover:shadow-purple-lg transition-all duration-200 cursor-pointer transform hover:translate-y-[-1px] select-none"
            >
              Start Designing
            </Link>
          </div>

          {/* Right Column: Features List */}
          <div className="col-span-12 md:col-span-7 space-y-8">

            {/* Feature 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center transition-colors duration-200">
                  <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Instant NFC & QR Sharing
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Tap your card to any modern smartphone to instantly share your digital contact card, socials, and portfolio. No app download is ever required.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center transition-colors duration-200">
                  <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Real-Time Portal & Analytics
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Update your contact info, layout, links, and styling in real-time from our responsive dashboard. Monitor interaction metrics to see who is engaging.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center transition-colors duration-200">
                  <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Sustainable Lifetime Card
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Replace thousands of paper business cards with one premium eco-friendly digital card. Crafted to last, reducing your carbon footprint while making a powerful first impression.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  )
}


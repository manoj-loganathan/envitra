'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDashboard } from '../context'
import { createClient } from '@/lib/supabase/client'
import { isDarkColor } from '@/lib/utils'
import {
  CreditCard, User, Users, Activity, Clock, Cpu, UserCheck, Sparkles, Save, Share2, Copy, Check, Download, ExternalLink, Loader2,
  Contact, Link2, FileText, ShoppingBag, Rss, ChevronLeft, ChevronRight, CheckCircle2, Minus
} from 'lucide-react'

const CHECKLIST = [
  {
    id: 'card',
    step: 1,
    label: 'Activate your NFC card',
    desc: 'Enable NFC sharing so your card goes live when tapped.',
    tab: '/dashboard/card',
    icon: Cpu,
    color: '#3f5ce6',
  },
  {
    id: 'profile',
    step: 2,
    label: 'Create your first digital profile',
    desc: 'Build the public page people see when they scan your card.',
    tab: '/dashboard/profiles',
    icon: User,
    color: '#8b5cf6',
  },
  {
    id: 'vcard',
    step: 3,
    label: 'Fill in your vCard contact details',
    desc: 'Add phone, email and address — auto-shared on every tap.',
    tab: '/dashboard/vcard',
    icon: Contact,
    color: '#06b6d4',
  },
  {
    id: 'links',
    step: 4,
    label: 'Add your first social / website link',
    desc: 'Connect Instagram, LinkedIn, portfolio, UPI and more.',
    tab: '/dashboard/links',
    icon: Link2,
    color: '#10b981',
  },
  {
    id: 'leads',
    step: 5,
    label: 'Create a lead capture form',
    desc: 'Let visitors leave their details so you can follow up.',
    tab: '/dashboard/leads',
    icon: FileText,
    color: '#f59e0b',
  },
  {
    id: 'products',
    step: 6,
    label: 'Add a product to your profile',
    desc: 'Showcase what you sell directly on your public page.',
    tab: '/dashboard/products',
    icon: ShoppingBag,
    color: '#ec4899',
  },
  {
    id: 'feeds',
    step: 7,
    label: 'Publish your first feed post',
    desc: 'Share updates, announcements or portfolio pieces.',
    tab: '/dashboard/feeds',
    icon: Rss,
    color: '#14b8a6',
  },
]

export function CardTab() {
  const supabase = createClient()
  const router = useRouter()
  const {
    activeCard,
    setActiveCard,
    setCards,
    activeProfile,
    cardProfiles,
    lastActivity,
    setLastActivity,
    profile,
    setMessage,
    setMessageType,
    profileLinks,
    leadForms,
    profileProducts,
    profileFeeds,
    vcardDataMap,
    leads
  } = useDashboard()

  const [nicknameInput, setNicknameInput] = useState('')
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
  })
  const [copiedLink, setCopiedLink] = useState(false)
  const [stageHover, setStageHover] = useState(false)

  // Initialize nickname input
  useEffect(() => {
    if (activeCard) {
      setNicknameInput(activeCard.card_nickname || '')
    }
  }, [activeCard?.id])

  const isAllCards = activeCard?.id === 'all'

  const [currentStepIdx, setCurrentStepIdx] = useState(0)

  const hasVcard = activeProfile?.id && vcardDataMap?.[activeProfile.id]
    ? !!(vcardDataMap[activeProfile.id].first_name || vcardDataMap[activeProfile.id].phone || vcardDataMap[activeProfile.id].email)
    : false
  const workspaceCheckState: Record<string, boolean> = {
    card: activeCard?.status !== 'provisioned',
    profile: (cardProfiles?.length ?? 0) > 0,
    vcard: hasVcard,
    links: (profileLinks?.length ?? 0) > 0,
    leads: (leadForms?.length ?? 0) > 0,
    products: (profileProducts?.length ?? 0) > 0,
    feeds: (profileFeeds?.length ?? 0) > 0,
  }

  useEffect(() => {
    const nextIdx = CHECKLIST.findIndex((item) => !(workspaceCheckState[item.id] ?? false))
    setCurrentStepIdx(nextIdx !== -1 ? nextIdx : 0)
  }, [
    activeCard?.id,
    workspaceCheckState.card,
    workspaceCheckState.profile,
    workspaceCheckState.vcard,
    workspaceCheckState.links,
    workspaceCheckState.leads,
    workspaceCheckState.products,
    workspaceCheckState.feeds
  ])

  // Tilt animation triggers
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2

    const rotateX = -(y / rect.height) * 15
    const rotateY = (x / rect.width) * 15

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`,
      transition: 'none',
    })
  }

  const handleCardMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
    })
  }

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`)
    setStageHover(true)
  }

  const handleStageMouseLeave = () => {
    setStageHover(false)
  }

  // Helper relative time parser
  const getRelativeTimeString = (dateString: string | null) => {
    if (!dateString) return 'No activity yet'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const handleToggleCardStatus = async () => {
    if (!activeCard || isAllCards) return
    const newStatus = activeCard.status === 'active' ? 'deactivated' : 'active'
    const updatePayload: any = { status: newStatus }
    if (newStatus === 'active') {
      updatePayload.activated_at = new Date().toISOString()
    }
    try {
      const { error } = await supabase
        .from('nfc_cards')
        .update(updatePayload)
        .eq('id', activeCard.id)

      if (error) throw error

      const updatedCard = { ...activeCard, ...updatePayload }
      setActiveCard(updatedCard)
      setCards((prev: any[]) => prev.map((c: any) => c.id === activeCard.id ? updatedCard : c))

      setMessageType('success')
      setMessage(
        newStatus === 'active'
          ? 'NFC sharing enabled successfully! Your card is now active.'
          : 'NFC sharing paused. Your card is temporarily disabled.'
      )
    } catch (err: any) {
      setMessageType('error')
      setMessage(err.message || 'Failed to update card status.')
    }
  }

  const handleSaveNickname = async () => {
    if (!activeCard || isAllCards) return
    try {
      const trimmed = nicknameInput.trim()
      const { error } = await supabase
        .from('nfc_cards')
        .update({ card_nickname: trimmed || null })
        .eq('id', activeCard.id)

      if (error) throw error

      const updatedCard = { ...activeCard, card_nickname: trimmed || null }
      setActiveCard(updatedCard)
      setCards((prev: any[]) => prev.map((c: any) => c.id === activeCard.id ? updatedCard : c))

      setMessageType('success')
      setMessage('Card nickname updated successfully!')
    } catch (err: any) {
      console.error('Failed to save nickname:', err)
      setMessageType('error')
      setMessage(err.message || 'Failed to update card nickname.')
    }
  }

  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
    setMessageType('success')
    setMessage('NFC Profile URL copied to clipboard!')
  }

  const handleDownloadQR = async (e: React.MouseEvent<HTMLAnchorElement>, url: string, filename: string) => {
    e.preventDefault()
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Failed to download QR code:', err)
      window.open(url, '_blank')
    }
  }

  if (isAllCards) return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 flex items-center justify-center">
        <CreditCard size={28} className="text-[#3f5ce6]" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground">Select a Card Workspace</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
          Card details are per-workspace. Select a specific card from the dropdown in the header to manage its status, QR code, and nickname.
        </p>
      </div>
    </div>
  )

  const orderItem = Array.isArray(activeCard?.order_items)
    ? activeCard.order_items[0]
    : activeCard?.order_items
  const pers = orderItem?.personalisation || {}

  const itemTitle = pers.title || pers.name || activeProfile?.profile_name || activeCard?.profile_data?.name || 'Your Name'
  const itemTagline = pers.tagline || activeProfile?.title || activeCard?.profile_data?.tagline || 'Short description'
  const itemLogoUrl = pers.logoUrl || pers.logoImageUrl
  const itemLogoPlacement = pers.logoPlacement || pers.logoplacement || 'top-left'
  const itemLogoHeight = pers.logoHeight || 32

  const itemTitleColor = pers.titleColor
  const itemTitleFont = pers.titleFont || 'font-sans'
  const itemTitleSize = pers.titleSize || 'text-base'

  const itemTaglineColor = pers.taglineColor || pers.descColor || pers.tagColor || pers.tagcolor
  const itemTaglineFont = pers.taglineFont || pers.descFont || 'font-sans'
  const itemTaglineSize = pers.taglineSize || pers.descSize || 'text-xs'

  const isSolid = pers.colorHex || !pers.backgroundUrl
  const bgHex = pers.colorHex || '#111'
  const itemBackgroundUrl = pers.backgroundUrl || pers.backgroundImageUrl

  const relativeActivity = getRelativeTimeString(lastActivity)
  const tapCount = activeCard?.tap_count || 0
  const calcScore = Math.min(100, tapCount * 10 + (cardProfiles.length > 0 ? 15 : 0))
  const engagementScore = tapCount === 0 && cardProfiles.length === 0 ? 0 : calcScore
  let engagementLevel = 'Inactive'
  if (engagementScore > 75) engagementLevel = 'Excellent'
  else if (engagementScore > 40) engagementLevel = 'Active'
  else if (engagementScore > 0) engagementLevel = 'Standard'

  let cardBgStyle: React.CSSProperties = {}
  let isCardDark = true

  if (isSolid) {
    cardBgStyle = { backgroundColor: bgHex }
    isCardDark = isDarkColor(bgHex)
  } else {
    cardBgStyle = {
      backgroundImage: `url(${itemBackgroundUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
    isCardDark = true
  }

  const cardBorderColor = isCardDark ? 'border-white/10' : 'border-zinc-200'
  const cardTextColor = isCardDark ? 'text-white' : 'text-zinc-800'
  const cardSubColor = isCardDark ? 'text-white/60' : 'text-zinc-500'

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn text-left">
      {/* CSS Scanner Scanline and HUD Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scanline-glow {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(160px); opacity: 0; }
        }
        .animate-scanline {
          animation: scanline-glow 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}} />

      {/* Top Header Controls (Active status, Date, and Activate/Deactivate Toggle Button) */}
      <div className="flex items-center justify-between gap-4 px-1 py-1">
        <div className="flex flex-col items-start gap-0.5">
          {activeCard?.status === 'active' ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              <span>Paused / Offline</span>
            </div>
          )}
          {activeCard?.provisioned_at && (
            <span className="text-[9px] font-semibold text-muted-foreground/75 pl-3.5">
              Linked on {new Date(activeCard.provisioned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCard?.card_url && (
            <Link
              href={activeCard.card_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl border border-border bg-transparent hover:bg-muted/30 text-xs font-bold text-foreground transition-all active:scale-95 cursor-pointer"
            >
              View Profile
            </Link>
          )}
          <button
            onClick={handleToggleCardStatus}
            className={`px-4 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer hover:bg-opacity-10 transition-colors ${activeCard?.status === 'active'
                ? 'border-red-500/40 text-red-500 hover:bg-red-500/10'
                : 'border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10'
              }`}
          >
            {activeCard?.status === 'active' ? 'Deactivate Card' : 'Activate Card'}
          </button>
        </div>
      </div>

      {/* 1. Top Element: Card Showcase Stage */}
      <div
        onMouseMove={handleStageMouseMove}
        onMouseLeave={handleStageMouseLeave}
        className="relative rounded-2xl border border-border/40 bg-muted/10 overflow-hidden flex flex-col items-center justify-center p-8 md:p-12 shadow-inner"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(63,92,230,0.08)_0%,transparent_70%)] pointer-events-none filter blur-xl animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.1)_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1.5px,transparent_1.5px)] [background-size:14px_14px] pointer-events-none" />

        {/* Dynamic 10x10 dots (140px diameter) spotlight glow following mouse cursor (Only colors the dots) */}
        {stageHover && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: activeCard?.status === 'active'
                ? 'radial-gradient(140px circle at var(--mouse-x) var(--mouse-y), rgba(16, 185, 129, 0.95), transparent 100%)'
                : 'radial-gradient(140px circle at var(--mouse-x) var(--mouse-y), rgba(239, 68, 68, 0.95), transparent 100%)',
              WebkitMaskImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
              WebkitMaskSize: '14px 14px',
              maskImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
              maskSize: '14px 14px',
            }}
          />
        )}

        <div
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          style={tiltStyle}
          className="relative w-full aspect-[1.586/1] max-w-[320px] sm:max-w-[340px] md:max-w-[360px] rounded-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)] select-none cursor-pointer border border-white/5 transition-all duration-300 active:scale-98"
        >
          <div
            className={`w-full h-full rounded-[15px] p-5 flex flex-col justify-between overflow-hidden relative border transition-all duration-500 ${cardBorderColor}`}
            style={cardBgStyle}
          >
            {!isSolid && itemBackgroundUrl && (
              <div
                className="absolute inset-0 pointer-events-none animate-fadeIn"
                style={{
                  backgroundImage: `url(${itemBackgroundUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transform: `scale(${pers.bgScale || 1}) translate(${pers.bgTranslateX || 0}%, ${pers.bgTranslateY || 0}%)`,
                }}
              />
            )}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.12)_0%,transparent_60%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.06)_0%,transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.3)_0%,rgba(0,0,0,0.2)_100%)]" />
            {orderItem?.material && orderItem.material.includes('Metallic') && (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_40%,rgba(0,0,0,0.22)_60%,rgba(255,255,255,0.18)_100%)] mix-blend-overlay pointer-events-none z-10 animate-pulse" />
            )}

            {itemLogoUrl && itemLogoPlacement === 'center' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <img
                  src={itemLogoUrl}
                  alt="Logo"
                  className="max-w-[110px] object-contain"
                  style={{ height: `${itemLogoHeight * 0.8}px`, width: 'auto' }}
                />
              </div>
            )}

            <div className="relative z-10 flex justify-between items-start w-full">
              <div className="flex items-start">
                {itemLogoUrl ? (
                  (itemLogoPlacement === 'top-left') ? (
                    <img
                      src={itemLogoUrl}
                      alt="Logo"
                      className="max-w-[90px] object-contain"
                      style={{ height: `${itemLogoHeight * 0.8}px`, width: 'auto' }}
                    />
                  ) : null
                ) : (
                  <img
                    src="/default-brand-logo.png"
                    alt="Logo"
                    className="h-12 max-w-[120px] object-contain -mt-3 -ml-3"
                    style={{ height: '48px' }}
                  />
                )}
              </div>
              <div className={isCardDark ? 'text-white/80' : 'text-zinc-800'}>
                <svg className="w-5.5 h-5.5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 2a10 10 0 0 1 10 10" />
                  <path d="M12 6a6 6 0 0 1 6 6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
            </div>

            <div className="relative z-10 w-full mt-auto">
              <div className="text-left max-w-[85%]">
                <h3
                  style={itemTitleColor ? { color: itemTitleColor } : undefined}
                  className={`${itemTitleFont === 'font-display' ? 'font-sans font-extrabold uppercase tracking-wider' : itemTitleFont} ${itemTitleSize === 'text-sm' ? 'text-[10px] sm:text-[11px]' :
                    itemTitleSize === 'text-base' ? 'text-[11px] sm:text-xs' :
                      itemTitleSize === 'text-lg' ? 'text-xs sm:text-sm' :
                        'text-sm sm:text-base'
                    } font-black tracking-wide leading-tight truncate ${!itemTitleColor ? cardTextColor : ''}`}
                >
                  {itemTitle}
                </h3>
                <p
                  style={itemTaglineColor ? { color: itemTaglineColor } : undefined}
                  className={`${itemTaglineFont === 'font-display' ? 'font-sans font-extrabold uppercase tracking-wider' : itemTaglineFont} ${itemTaglineSize === 'text-[10px]' ? 'text-[7px] sm:text-[8px]' :
                    itemTaglineSize === 'text-xs' ? 'text-[8px] sm:text-[9px]' :
                      itemTaglineSize === 'text-sm' ? 'text-[9px] sm:text-xs' :
                        'text-xs sm:text-sm'
                    } font-medium tracking-wide leading-relaxed mt-0.5 line-clamp-2 whitespace-normal break-words ${!itemTaglineColor ? cardSubColor : ''}`}
                >
                  {itemTagline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Onboarding Checklist Carousel — hidden when all steps complete */}
      {!CHECKLIST.every((item) => workspaceCheckState[item.id] ?? false) && (() => {
        const currentStep = CHECKLIST[currentStepIdx]
        const isStepDone = workspaceCheckState[currentStep.id] ?? false
        const StepIcon = currentStep.icon

        const nextStep = () => {
          setCurrentStepIdx((prev) => (prev + 1) % CHECKLIST.length)
        }
        const prevStep = () => {
          setCurrentStepIdx((prev) => (prev - 1 + CHECKLIST.length) % CHECKLIST.length)
        }

        return (
          <div className="w-full flex flex-col gap-6 text-left my-2 px-1 pb-2">
            {/* Carousel Content Card Container */}
            <div className="relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/50 bg-card shadow-sm text-left">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none" />
              
              <div className="relative z-10 flex items-start gap-4 flex-grow min-w-0">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-white/5"
                  style={{ backgroundColor: `${currentStep.color}15` }}
                >
                  <StepIcon className="w-6 h-6" style={{ color: currentStep.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-extrabold text-foreground tracking-tight">{currentStep.label}</h4>
                    {isStepDone ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#3f5ce6]/10 text-[#3f5ce6] border border-[#3f5ce6]/25">
                        Incomplete
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                    {currentStep.desc}
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push(currentStep.tab)}
                className={`relative z-10 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm ${isStepDone
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#3f5ce6] hover:bg-[#3050d8] text-white'
                  }`}
              >
                {isStepDone ? (
                  <>
                    <CheckCircle2 size={14} />
                    Configure Again
                  </>
                ) : (
                  'Configure Setup'
                )}
              </button>
            </div>

            {/* Navigation & Rounded Indicators Row */}
            <div className="flex items-center justify-center gap-4 py-1">
              {/* Previous Arrow */}
              <button
                onClick={prevStep}
                className="w-8 h-8 rounded-xl border border-border bg-[#0d0d0f] hover:bg-muted/50 flex items-center justify-center transition-all text-muted-foreground hover:text-foreground cursor-pointer shadow-sm active:scale-90"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Rounded Indicators with Icons */}
              <div className="flex items-center gap-2">
                {CHECKLIST.map((step, idx) => {
                  const done = workspaceCheckState[step.id] ?? false
                  const active = idx === currentStepIdx
                  const StepDotIcon = step.icon

                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStepIdx(idx)}
                      className={`relative rounded-full flex items-center justify-center transition-all duration-350 shadow-sm cursor-pointer ${
                        active
                          ? 'w-10 h-10 bg-[#3f5ce6]/10 border-2 border-[#3f5ce6] text-[#3f5ce6]'
                          : done
                            ? 'w-6 h-6 bg-emerald-500/5 border border-emerald-500/20 text-emerald-500/80 hover:text-emerald-400'
                            : 'w-6 h-6 bg-[#0d0d0f] border border-[#1f1f23] text-muted-foreground/60 hover:text-foreground hover:border-zinc-700'
                      }`}
                      title={step.label}
                    >
                      <StepDotIcon className={`transition-all ${active ? 'w-4.5 h-4.5' : 'w-3 h-3'}`} />
                      
                      {/* Strike line for completed steps */}
                      {done && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-[70%] h-[1.5px] bg-emerald-500 rotate-45 rounded-full" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Next Arrow */}
              <button
                onClick={nextStep}
                className="w-8 h-8 rounded-xl border border-border bg-[#0d0d0f] hover:bg-muted/50 flex items-center justify-center transition-all text-muted-foreground hover:text-foreground cursor-pointer shadow-sm active:scale-90"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )
      })()}


      {/* 3. Attached Image Statistics contents */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          {
            id: 'profiles',
            label: 'PROFILES',
            value: cardProfiles?.length ?? 0,
            sub: `${cardProfiles?.filter((p: any) => p.is_active)?.length ?? 0} active`,
            icon: User,
            color: '#8b5cf6',
            href: '/dashboard/profiles',
            hasBadge: false,
          },
          {
            id: 'vcard',
            label: 'VCARD',
            value: hasVcard ? 'Set' : 'Empty',
            sub: hasVcard ? 'contact info ready' : 'not filled yet',
            icon: Contact,
            color: '#06b6d4',
            href: '/dashboard/vcard',
            hasBadge: true,
            isDone: hasVcard,
          },
          {
            id: 'links',
            label: 'LINKS',
            value: profileLinks?.length ?? 0,
            sub: `${profileLinks?.filter((l: any) => l.is_active ?? l.is_visible)?.length ?? 0} visible`,
            icon: Link2,
            color: '#10b981',
            href: '/dashboard/links',
            hasBadge: false,
          },
          {
            id: 'leads',
            label: 'LEAD FORMS',
            value: leadForms?.length ?? 0,
            sub: `${leads?.length ?? 0} leads captured`,
            icon: FileText,
            color: '#f59e0b',
            href: '/dashboard/leads',
            hasBadge: false,
          },
          {
            id: 'products',
            label: 'PRODUCTS',
            value: profileProducts?.length ?? 0,
            sub: 'in your profile',
            icon: ShoppingBag,
            color: '#ec4899',
            href: '/dashboard/products',
            hasBadge: false,
          },
          {
            id: 'feeds',
            label: 'FEEDS',
            value: profileFeeds?.length ?? 0,
            sub: 'published posts',
            icon: Rss,
            color: '#14b8a6',
            href: '/dashboard/feeds',
            hasBadge: false,
          },
        ].map((stat) => {
          const StatIcon = stat.icon
          return (
            <button
              key={stat.id}
              onClick={() => router.push(stat.href)}
              className="group bg-[#0d0d0f] border border-[#1f1f23] rounded-2xl p-4 px-3.5 text-left hover:border-zinc-700 hover:shadow-lg transition-all duration-200 relative overflow-hidden flex flex-col justify-between min-h-[125px] cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <StatIcon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                {stat.hasBadge && (
                  <div className="shrink-0">
                    {stat.isDone ? (
                      <div className="w-5.5 h-5.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="w-5.5 h-5.5 rounded-full bg-zinc-800/40 border border-zinc-700/60 flex items-center justify-center text-zinc-500">
                        <Minus className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3.5">
                <div className="text-2xl font-black text-white leading-none tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[9px] font-black tracking-widest text-[#94949e] uppercase mt-1">
                  {stat.label}
                </div>
                <div className="text-[9px] font-semibold text-[#65656c] mt-0.5 truncate w-full">
                  {stat.sub}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Centered Large QR Code */}
      <div className="flex flex-col items-center justify-center py-8 gap-5">
        {activeCard?.qr_code_url ? (
          <>
            <div className="p-4 bg-white rounded-2xl shadow-xl border border-border/20 flex items-center justify-center" style={{ width: 220, height: 220 }}>
              <img
                src={activeCard.qr_code_url}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-3">
              <a
                href={activeCard.qr_code_url}
                onClick={(e) => handleDownloadQR(e, activeCard.qr_code_url, `qr-${activeCard.slug}.png`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3f5ce6]/10 hover:bg-[#3f5ce6]/20 border border-[#3f5ce6]/20 text-[#3f5ce6] text-xs font-bold cursor-pointer transition-all active:scale-95"
              >
                <Download size={13} /> Download QR
              </a>
              <a
                href={activeCard?.card_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-background text-muted-foreground hover:text-[#3f5ce6] hover:border-[#3f5ce6]/30 text-xs font-bold cursor-pointer active:scale-95 transition-all"
              >
                <ExternalLink size={13} /> Open Live Page
              </a>
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground py-8 font-medium flex items-center gap-2">
            <Loader2 size={13} className="animate-spin text-[#3f5ce6]" />
            Generating QR Code...
          </div>
        )}
      </div>
    </div>
  )
}

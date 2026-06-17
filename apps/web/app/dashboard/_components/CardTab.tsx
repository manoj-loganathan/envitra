'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDashboard } from '../context'
import { createClient } from '@/lib/supabase/client'
import { isDarkColor } from '@/lib/utils'
import { 
  CreditCard, User, Activity, Clock, Cpu, UserCheck, Sparkles, Save, Share2, Copy, Check, Download, ExternalLink, Loader2 
} from 'lucide-react'

export function CardTab() {
  const supabase = createClient()
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
    setMessageType 
  } = useDashboard()

  const [nicknameInput, setNicknameInput] = useState('')
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
  })
  const [copiedLink, setCopiedLink] = useState(false)

  // Initialize nickname input
  useEffect(() => {
    if (activeCard) {
      setNicknameInput(activeCard.card_nickname || '')
    }
  }, [activeCard?.id])

  const isAllCards = activeCard?.id === 'all'

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

      {/* 1. Top Element: Card Showcase Stage */}
      <div className="relative rounded-2xl border border-border/40 bg-muted/10 overflow-hidden flex flex-col items-center justify-center p-8 md:p-12 shadow-inner">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(63,92,230,0.08)_0%,transparent_70%)] pointer-events-none filter blur-xl animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.1)_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1.5px,transparent_1.5px)] [background-size:14px_14px] pointer-events-none" />

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

      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4 text-left relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center gap-2 border-b border-border/50 pb-2.5">
          <Activity className="size-4 text-[#3f5ce6]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Quick Insights</h4>
        </div>

        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-background/50 border border-border/40 hover:border-[#3f5ce6]/30 rounded-xl p-4.5 space-y-3 transition-all hover:shadow-[0_4px_12px_rgba(63,92,230,0.04)] flex items-start gap-3.5 group">
            <div className="p-2.5 bg-[#3f5ce6]/10 text-[#3f5ce6] rounded-xl shrink-0 group-hover:bg-[#3f5ce6]/25 transition-all">
              <Activity className="size-4.5 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Total Scans</span>
              <p className="text-lg font-black text-foreground tracking-tight leading-none truncate">{tapCount} taps</p>
              <p className="text-[9px] text-muted-foreground leading-none">Lifetime NFC taps</p>
            </div>
          </div>

          <div className="bg-background/50 border border-border/40 hover:border-[#3f5ce6]/30 rounded-xl p-4.5 space-y-3 transition-all hover:shadow-[0_4px_12px_rgba(63,92,230,0.04)] flex items-start gap-3.5 group">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-xl shrink-0 group-hover:bg-emerald-500/25 transition-all">
              <UserCheck className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Active Profile</span>
              <p className="text-base font-black text-foreground tracking-tight leading-tight truncate">{activeProfile?.profile_name || 'None'}</p>
              <p className="text-[9px] text-muted-foreground leading-none">{cardProfiles.length} profiles linked</p>
            </div>
          </div>

          <div className="bg-background/50 border border-border/40 hover:border-[#3f5ce6]/30 rounded-xl p-4.5 space-y-3 transition-all hover:shadow-[0_4px_12px_rgba(63,92,230,0.04)] flex items-start gap-3.5 group">
            <div className="p-2.5 bg-violet-500/10 text-violet-500 dark:text-violet-400 rounded-xl shrink-0 group-hover:bg-violet-500/25 transition-all">
              <Clock className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Last Activity</span>
              <p className="text-base font-black text-foreground tracking-tight leading-tight truncate">{relativeActivity}</p>
              <p className="text-[9px] text-muted-foreground leading-none">Real-time scan</p>
            </div>
          </div>

          <div className="bg-background/50 border border-border/40 hover:border-[#3f5ce6]/30 rounded-xl p-4.5 transition-all hover:shadow-[0_4px_12px_rgba(63,92,230,0.04)] flex items-center gap-3.5 group">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted/10"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-500 transition-all duration-700 ease-out"
                  strokeDasharray={`${engagementScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-black text-foreground">{engagementScore}%</span>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Engagement</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-black capitalize ${engagementLevel === 'Excellent' ? 'text-amber-500' :
                  engagementLevel === 'Active' ? 'text-emerald-500' :
                    engagementLevel === 'Standard' ? 'text-[#3f5ce6]' :
                      'text-muted-foreground'
                  }`}>
                  {engagementLevel}
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground leading-none">Based on taps</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4 text-left flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <Cpu className="size-4 text-[#3f5ce6]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Card Status & Access</h4>
              </div>

              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 border ${activeCard?.status === 'active'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${activeCard?.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {activeCard?.status === 'active' ? 'Active / Online' : 'Paused / Offline'}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeCard?.status === 'active' ? (
                <>
                  Your smart card is currently <strong>Active & Online</strong>. Tapping the physical card with any NFC-enabled smartphone will instantly share your digital business profile link.
                </>
              ) : (
                <>
                  NFC sharing is currently <strong>Paused & Offline</strong>. Scanning or tapping the physical card will show a temporary inactive message and prevent profile details from being shared.
                </>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground pt-1">
              {activeCard?.provisioned_at && (
                <div className="px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                  <span className="opacity-75">Linked on:</span>
                  <span className="text-foreground">{new Date(activeCard.provisioned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              {activeCard?.activated_at && (
                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="opacity-75">Active since:</span>
                  <span>{new Date(activeCard.activated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-border/30 mt-auto">
            <button
              onClick={handleToggleCardStatus}
              className={`w-full px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-1.5 border shrink-0 ${activeCard?.status === 'active'
                ? 'bg-red-500/5 border-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-500/10'
                : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeCard?.status === 'active' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
              {activeCard?.status === 'active' ? 'Pause NFC Sharing' : 'Enable NFC Sharing'}
            </button>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
              <Sparkles className="size-4 text-[#3f5ce6]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Card Nickname</h4>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Assign an easily recognizable nickname to this physical card to distinguish it from other cards in your workspace.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Nickname Label</label>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="e.g., Personal Matte Card"
                className="w-full bg-muted/30 hover:bg-muted/50 focus:bg-background border border-border focus:border-[#3f5ce6] focus:outline-none rounded-xl px-3 py-2.5 text-xs font-medium text-foreground transition-all duration-200"
              />
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-border/30 mt-auto">
            <button
              onClick={handleSaveNickname}
              className="w-full px-4 py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold cursor-pointer active:scale-98 transition-all shrink-0 flex items-center justify-center gap-1.5"
            >
              <Save size={13} /> Save Nickname
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4 text-left relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2 border-b border-border/50 pb-2.5">
          <Share2 className="size-4 text-[#3f5ce6]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Sharing & QR Code</h4>
        </div>

        <p className="relative z-10 text-xs text-muted-foreground leading-relaxed">
          This profile URL is programmed on your physical card. When tapped, it displays your active profile. You can copy the link or share/download the QR code.
        </p>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Card Link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 p-3 rounded-xl bg-muted/40 border border-border text-xs font-mono font-bold select-all truncate text-foreground">
                {activeCard?.card_url}
              </div>
              <button
                onClick={() => handleCopyLink(activeCard?.card_url)}
                className="p-3 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all shadow-md shrink-0 flex items-center justify-center border border-border min-w-[38px]"
                title="Copy Link"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Share this direct link via email, messaging apps, or embed it on your website.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 bg-muted/20 border border-border/50 rounded-xl p-4">
            {activeCard?.qr_code_url ? (
              <>
                <div className="relative p-2 bg-white rounded-xl border border-border flex items-center justify-center shadow-md shrink-0 max-w-[110px] aspect-square">
                  <img
                    src={activeCard.qr_code_url}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-grow space-y-2.5 w-full">
                  <div className="text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground block">QR Code Scan</span>
                    <p className="text-[11px] text-muted-foreground">Download and print this QR code to let others scan your card instantly.</p>
                  </div>

                  <div className="flex w-full gap-2">
                    <a
                      href={activeCard.qr_code_url}
                      onClick={(e) => handleDownloadQR(e, activeCard.qr_code_url, `qr-${activeCard.slug}.png`)}
                      className="flex-grow inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#3f5ce6]/10 hover:bg-[#3f5ce6]/25 border border-[#3f5ce6]/20 text-[#3f5ce6] text-xs font-bold cursor-pointer transition-all active:scale-95 text-center"
                    >
                      <Download size={13} /> Download QR
                    </a>
                    <a
                      href={activeCard?.card_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-2.5 rounded-xl border border-border bg-background text-muted-foreground hover:text-[#3f5ce6] hover:bg-muted cursor-pointer active:scale-95 transition-all"
                      title="Open Live Page"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground py-4 font-medium flex items-center gap-2">
                <Loader2 size={13} className="animate-spin text-[#3f5ce6]" />
                Generating QR Code...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

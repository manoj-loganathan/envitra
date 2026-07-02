'use client'

import React from 'react'
import { isDarkColor } from '@/lib/utils'

interface NfcCardVisualProps {
  card: any
  /** When true (default in CardTab), the card is interactive with tilt. When false, it's a static preview. */
  interactive?: boolean
  className?: string
  hideText?: boolean
}

export function NfcCardVisual({ card, interactive = false, className = '', hideText = false }: NfcCardVisualProps) {
  const orderItem = Array.isArray(card?.order_items)
    ? card.order_items[0]
    : card?.order_items
  const pers = orderItem?.personalisation || {}

  const itemTitle = pers.title || pers.name || card?.profile_data?.name || 'Your Name'
  const itemTagline = pers.tagline || card?.profile_data?.tagline || 'Short description'
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
  const bgHex = pers.colorHex || card?.profile_data?.colorHex || '#111827'
  const itemBackgroundUrl = pers.backgroundUrl || pers.backgroundImageUrl

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
    <div
      className={`relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)] dark:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6)] select-none border border-white/5 ${className}`}
    >
      <div
        className={`w-full h-full rounded-[15px] p-5 flex flex-col justify-between overflow-hidden relative border transition-all duration-500 ${cardBorderColor}`}
        style={cardBgStyle}
      >
        {/* Background image layer */}
        {!isSolid && itemBackgroundUrl && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${itemBackgroundUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: `scale(${pers.bgScale || 1}) translate(${pers.bgTranslateX || 0}%, ${pers.bgTranslateY || 0}%)`,
            }}
          />
        )}

        {/* Gloss / sheen overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.12)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.06)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.3)_0%,rgba(0,0,0,0.2)_100%)]" />

        {/* Metallic shine for metallic material */}
        {orderItem?.material && orderItem.material.includes('Metallic') && (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_40%,rgba(0,0,0,0.22)_60%,rgba(255,255,255,0.18)_100%)] mix-blend-overlay pointer-events-none z-10" />
        )}

        {/* Center logo */}
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

        {/* Top row: logo + NFC icon */}
        <div className="relative z-10 flex justify-between items-start w-full">
          <div className="flex items-start">
            {itemLogoUrl ? (
              itemLogoPlacement === 'top-left' ? (
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
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 2a10 10 0 0 1 10 10" />
              <path d="M12 6a6 6 0 0 1 6 6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
        </div>

        {/* Bottom: name + tagline */}
        {!hideText && (
          <div className="relative z-10 w-full mt-auto">
            <div className="text-left max-w-[85%]">
              <h3
                style={itemTitleColor ? { color: itemTitleColor } : undefined}
                className={`${itemTitleFont === 'font-display' ? 'font-sans font-extrabold uppercase tracking-wider' : itemTitleFont} ${
                  itemTitleSize === 'text-sm' ? 'text-[10px] sm:text-[11px]' :
                  itemTitleSize === 'text-base' ? 'text-[11px] sm:text-xs' :
                  itemTitleSize === 'text-lg' ? 'text-xs sm:text-sm' :
                  'text-sm sm:text-base'
                } font-black tracking-wide leading-tight truncate ${!itemTitleColor ? cardTextColor : ''}`}
              >
                {itemTitle}
              </h3>
              <p
                style={itemTaglineColor ? { color: itemTaglineColor } : undefined}
                className={`${itemTaglineFont === 'font-display' ? 'font-sans font-extrabold uppercase tracking-wider' : itemTaglineFont} ${
                  itemTaglineSize === 'text-[10px]' ? 'text-[7px] sm:text-[8px]' :
                  itemTaglineSize === 'text-xs' ? 'text-[8px] sm:text-[9px]' :
                  itemTaglineSize === 'text-sm' ? 'text-[9px] sm:text-xs' :
                  'text-xs sm:text-sm'
                } font-medium tracking-wide leading-relaxed mt-0.5 line-clamp-2 whitespace-normal break-words ${!itemTaglineColor ? cardSubColor : ''}`}
              >
                {itemTagline}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


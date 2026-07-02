'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { formatPrice, isDarkColor } from '@/lib/utils'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const getFontDisplayName = (fontKey: string | undefined) => {
  const cleanKey = fontKey || 'font-sans'
  switch (cleanKey) {
    case 'font-sans':
      return 'Modern Sans (Default)'
    case 'font-outfit':
      return 'Outfit'
    case 'font-poppins':
      return 'Poppins'
    case 'font-mono':
      return 'Tech Mono'
    case 'font-display':
      return 'Brand Display'
    default:
      return cleanKey.replace('font-', '') + ' (Default)'
  }
}

export default function CartPage() {
  const router = useRouter()
  const supabase = createClient()
  const { items, removeItem, updateQuantity, getSubtotal, getGst, getGrandTotal } = useCartStore()
  
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [userPlan, setUserPlan] = useState<string>('free')
  
  useEffect(() => {
    setMounted(true)

    const checkSession = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession()
      setSession(activeSession)
      if (activeSession?.user) {
        const { data } = await supabase
          .from('accounts')
          .select('plan')
          .eq('id', activeSession.user.id)
          .single()
        if (data?.plan) {
          setUserPlan(data.plan)
        }
      }
    }
    checkSession()
  }, [])

  const handleRedesign = (item: any) => {
    localStorage.setItem('edit-design-item', JSON.stringify({
      ...item.personalisation,
      quantity: item.quantity,
      id: item.id,
      material: item.material
    }))
    router.push('/shop/design')
  }

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600" />
      </div>
    )
  }

  const subtotal = getSubtotal()
  const gst = getGst()
  const total = subtotal + gst

  // Helper to compute card breakdown for items in cart
  const getBreakdown = () => {
    let baseCardsTotal = 0
    let metallicUpgradesTotal = 0
    let customBgUpgradesTotal = 0
    let logoUpgradesTotal = 0
    let totalQty = 0
    let metallicQty = 0
    let customBgQty = 0
    let logoQty = 0

    items.forEach((item) => {
      const qty = item.quantity
      totalQty += qty
      baseCardsTotal += 49900 * qty

      if (item.material.includes('Metallic')) {
        metallicQty += qty
        metallicUpgradesTotal += 20000 * qty
      }
      if (item.productType === 'custom') {
        customBgQty += qty
        customBgUpgradesTotal += 10000 * qty
      }
      const pers = item.personalisation as any
      if (pers.logoUrl || pers.logoImageUrl) {
        logoQty += qty
        logoUpgradesTotal += 5000 * qty
      }
    })

    return {
      totalQty,
      baseCardsTotal,
      metallicQty,
      metallicUpgradesTotal,
      customBgQty,
      customBgUpgradesTotal,
      logoQty,
      logoUpgradesTotal,
    }
  }

  const breakdown = getBreakdown()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-purple-600/10 text-purple-600 flex items-center justify-center mx-auto">
          <ShoppingBag size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Your cart is empty</h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
          You haven't configured any Envitra NFC smart cards yet. Design one now to get started.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-btn font-medium text-white text-sm bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md transition-all duration-200"
        >
          Browse cards
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-12">Your Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        
        {/* Left Column Items List */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => {
            const pers = item.personalisation as any
            const isSolid = item.productType === 'solid_color'
            const bgHex = pers.colorHex || '#111'
            const bgUrl = pers.backgroundUrl || pers.backgroundImageUrl

            const itemTitle = pers.title || pers.name || 'Your Name'
            const itemTagline = pers.tagline || 'Short description'
            const itemLogoUrl = pers.logoUrl || pers.logoImageUrl
            const itemLogoPlacement = pers.logoPlacement || pers.logoplacement || 'top-left'
            const itemLogoHeight = pers.logoHeight || 32
            
            const itemTitleColor = pers.titleColor
            const itemTitleFont = pers.titleFont || 'font-sans'
            const itemTitleSize = pers.titleSize || 'text-base'

            const itemTaglineColor = pers.taglineColor || pers.descColor || pers.tagColor || pers.tagcolor
            const itemTaglineFont = pers.taglineFont || pers.descFont || 'font-sans'
            const itemTaglineSize = pers.taglineSize || pers.descSize || 'text-xs'

            let cardBgStyle: React.CSSProperties = {}
            let isCardDark = true

            if (isSolid) {
              cardBgStyle = { backgroundColor: bgHex }
              isCardDark = isDarkColor(bgHex)
            } else {
              cardBgStyle = { backgroundColor: '#18181B' }
              isCardDark = true
            }

            const cardTextColor = isCardDark ? 'text-white' : 'text-zinc-950'
            const cardSubColor = isCardDark ? 'text-zinc-300' : 'text-zinc-600'
            const cardBorderColor = isCardDark ? 'border-white/10' : 'border-black/10'
            
            return (
              <div 
                key={item.id}
                className="flex flex-col sm:flex-row gap-6 p-6 rounded-card border border-[var(--border)] bg-[var(--bg-surface)] hover:border-purple-600/30 transition-all items-start"
              >
                {/* Miniature Envitra Card Preview */}
                <div className="w-[176px] h-[111px] shrink-0 rounded-xl relative shadow-lg overflow-hidden border border-zinc-200/10 self-center sm:self-start select-none">
                  {/* Styled scale wrapper - scales a 400x252 card by 0.44 to fit 176x111 */}
                  <div 
                    className={`w-[400px] h-[252px] scale-[0.44] origin-top-left absolute top-0 left-0 p-6 flex flex-col justify-between overflow-hidden border ${cardBorderColor}`}
                    style={cardBgStyle}
                  >
                    {/* Background image if custom, with correct scale/translate */}
                    {!isSolid && bgUrl && (
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          backgroundImage: `url(${bgUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          transform: `scale(${pers.bgScale || 1}) translate(${pers.bgTranslateX || 0}%, ${pers.bgTranslateY || 0}%)`,
                        }}
                      />
                    )}

                    {/* Card texture/lighting overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.12)_0%,transparent_60%)] pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.06)_0%,transparent_50%)] pointer-events-none" />
                    <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.3)_0%,rgba(0,0,0,0.2)_100%)]" />
                    {item.material && item.material.includes('Metallic') && (
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_40%,rgba(0,0,0,0.22)_60%,rgba(255,255,255,0.18)_100%)] mix-blend-overlay pointer-events-none z-10 animate-pulse" style={{ animationDuration: '4s' }} />
                    )}

                    {/* Centered Brand Logo (if custom logo uploaded & centered) */}
                    {itemLogoUrl && itemLogoPlacement === 'center' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <img 
                          src={itemLogoUrl} 
                          alt="Centered Brand Logo" 
                          className="max-w-[200px] object-contain"
                          style={{ height: `${itemLogoHeight}px`, width: 'auto' }}
                        />
                      </div>
                    )}

                    {/* Card Header */}
                    <div className="relative z-10 flex justify-between items-start w-full">
                      {/* Brand Logo (Top Left Corner) */}
                      <div className="flex items-start">
                        {itemLogoUrl ? (
                          (itemLogoPlacement === 'top-left') ? (
                            <img 
                              src={itemLogoUrl} 
                              alt="Brand Logo" 
                              className="max-w-[150px] object-contain"
                              style={{ height: `${itemLogoHeight}px`, width: 'auto' }}
                            />
                          ) : null
                        ) : (
                          <img 
                            src="/default-brand-logo.png" 
                            alt="Brand Logo" 
                            className="h-26 max-w-[220px] object-contain -mt-7 -ml-7"
                            style={{ height: '104px' }}
                          />
                        )}
                      </div>

                      {/* NFC Wave Logo (Top Right Corner) */}
                      <div className={isCardDark ? 'text-white/80' : 'text-zinc-800'}>
                        <svg className="w-9.5 h-9.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                           <path d="M12 2a10 10 0 0 1 10 10" />
                           <path d="M12 6a6 6 0 0 1 6 6" />
                           <circle cx="12" cy="12" r="2" />
                        </svg>
                      </div>
                    </div>

                    {/* Card Footer details */}
                    <div className="relative z-10 w-full mt-auto">
                      <div className="text-left max-w-[85%]">
                        <h3 
                          style={itemTitleColor ? { color: itemTitleColor } : undefined}
                          className={`${itemTitleFont === 'font-display' ? 'font-sans font-extrabold uppercase tracking-wider' : itemTitleFont} ${
                            itemTitleSize === 'text-sm' ? 'text-xs sm:text-sm' :
                            itemTitleSize === 'text-base' ? 'text-base sm:text-lg' :
                            itemTitleSize === 'text-lg' ? 'text-lg sm:text-xl' :
                            'text-xl sm:text-2xl'
                          } font-black tracking-wide leading-tight truncate ${!itemTitleColor ? cardTextColor : ''}`}
                        >
                          {itemTitle}
                        </h3>
                        <p 
                          style={itemTaglineColor ? { color: itemTaglineColor } : undefined}
                          className={`${itemTaglineFont === 'font-display' ? 'font-sans font-extrabold uppercase tracking-wider' : itemTaglineFont} ${
                            itemTaglineSize === 'text-[10px]' ? 'text-[8px] sm:text-[9px]' :
                            itemTaglineSize === 'text-xs' ? 'text-[9px] sm:text-xs' :
                            itemTaglineSize === 'text-sm' ? 'text-xs sm:text-sm' :
                            'text-sm sm:text-base'
                          } font-medium tracking-wide leading-relaxed mt-1 line-clamp-2 whitespace-normal break-words ${!itemTaglineColor ? cardSubColor : ''}`}
                        >
                          {itemTagline}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Item Details */}
                <div className="flex-grow space-y-2.5 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">{item.productName}</h3>
                      <p className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wider">
                        {item.material} 
                        {item.material.includes('Metallic') ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1 tracking-normal normal-case">(+₹200)</span>
                        ) : (
                          <span className="text-zinc-500 font-semibold ml-1 tracking-normal normal-case">(+₹0)</span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-purple-600 dark:text-purple-400">
                      {formatPrice(item.priceInr)}
                    </p>
                  </div>

                  {/* Personalisation details */}
                  <div className="bg-[var(--bg-muted)] p-3.5 rounded-xl text-xs text-[var(--text-secondary)] space-y-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    <div>
                      <span className="font-bold text-[var(--text-primary)] uppercase text-[9px] tracking-wider block">Card Text Details</span>
                      <p className="mt-1"><span className="text-[var(--text-muted)]">Name:</span> <span className="font-semibold">{itemTitle}</span></p>
                      <p><span className="text-[var(--text-muted)]">Description:</span> <span className="font-semibold">{itemTagline}</span></p>
                    </div>

                    <div>
                      <span className="font-bold text-[var(--text-primary)] uppercase text-[9px] tracking-wider block">
                        Background Theme{' '}
                        {item.productType === 'custom' && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold normal-case font-sans tracking-normal">(+₹100)</span>
                        )}
                      </span>
                      {item.productType === 'solid_color' ? (
                        <p className="mt-1">
                          <span className="text-[var(--text-muted)]">Solid color:</span>{' '}
                          <span className="font-semibold flex items-center gap-1.5 inline-flex">
                            <span 
                              className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0" 
                              style={{ backgroundColor: bgHex }}
                            />
                            {pers.colorName}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1">
                          <span className="text-[var(--text-muted)]">Background artwork:</span>{' '}
                          <span className="font-semibold text-purple-600 dark:text-purple-400">
                            Custom Upload
                          </span>
                        </p>
                      )}
                    </div>

                    {pers.customSlugs && pers.customSlugs.length > 0 ? (
                      <div className="sm:col-span-2 border-t border-[var(--border)] pt-1.5">
                        <span className="font-bold text-[var(--text-primary)] uppercase text-[9px] tracking-wider block">Claimed Custom Profile Links</span>
                        <div className="mt-1 space-y-1">
                          {pers.customSlugs.map((slug: string, idx: number) => (
                            <p key={idx}>
                              <span className="text-[var(--text-muted)]">Card {idx + 1}:</span>{' '}
                              <span className="font-bold text-purple-600 dark:text-purple-400">
                                envitra.in/u/{slug}
                              </span>
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : pers.customSlug ? (
                      <div className="sm:col-span-2 border-t border-[var(--border)] pt-1.5">
                        <span className="font-bold text-[var(--text-primary)] uppercase text-[9px] tracking-wider block">Claimed Custom Profile Link</span>
                        <p className="mt-1">
                          <span className="text-[var(--text-muted)]">Link URL:</span>{' '}
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            envitra.in/u/{pers.customSlug}
                          </span>
                        </p>
                      </div>
                    ) : null}

                    {/* Show typography if customized */}
                    {(itemTitleFont !== 'font-sans' || itemTitleSize !== 'text-base' || itemTitleColor || itemTaglineFont !== 'font-sans' || itemTaglineSize !== 'text-xs' || itemTaglineColor) && (
                      <div className="sm:col-span-2 border-t border-[var(--border)] pt-1.5">
                        <span className="font-bold text-[var(--text-primary)] uppercase text-[9px] tracking-wider block">Custom Typography Styles</span>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-[11px]">
                          <div>
                            <span className="text-[var(--text-muted)]">Name Font:</span>{' '}
                            <span className="font-semibold text-[10px]">
                              {getFontDisplayName(itemTitleFont)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--text-muted)]">Description Font:</span>{' '}
                            <span className="font-semibold text-[10px]">
                              {getFontDisplayName(itemTaglineFont)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show custom logo details if uploaded */}
                    {itemLogoUrl && (
                      <div className="sm:col-span-2 border-t border-[var(--border)] pt-1.5">
                        <span className="font-bold text-[var(--text-primary)] uppercase text-[9px] tracking-wider block">
                          Brand Logo Overlay{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold normal-case font-sans tracking-normal">(+₹50)</span>
                        </span>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-[11px]">
                          <div>
                            <span className="text-[var(--text-muted)]">Logo scale height:</span>{' '}
                            <span className="font-semibold">{itemLogoHeight}px</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-muted)]">Logo placement:</span>{' '}
                            <span className="font-semibold capitalize">{itemLogoPlacement}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                        >
                          +
                        </button>
                      </div>

                      {/* Redesign Card Button */}
                      <button
                        type="button"
                        onClick={() => handleRedesign(item)}
                        className="px-3 py-1.5 rounded-lg border border-purple-600/20 hover:border-purple-600/40 bg-purple-600/5 hover:bg-purple-600/10 text-purple-600 dark:text-purple-400 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        Redesign Card
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-btn hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                </div>
              </div>
            )
          })}
        </div>

        {/* Right Column Order Summary Panel */}
        <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Order Summary</h2>

          {/* Pricing summary */}
          <div className="space-y-3 text-xs text-[var(--text-secondary)]">
            {/* Card Base Price */}
            <div className="flex justify-between font-medium">
              <span>Base Smart Cards (₹499 × {breakdown.totalQty})</span>
              <span className="text-[var(--text-primary)]">{formatPrice(breakdown.baseCardsTotal)}</span>
            </div>

            {/* Upgrades List */}
            {(breakdown.metallicQty > 0 || breakdown.customBgQty > 0 || breakdown.logoQty > 0) && (
              <div className="space-y-1.5 pl-2 border-l border-[var(--border)] py-1 text-[11px]">
                {breakdown.metallicQty > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Matte Metallic Upgrades (+₹200 × {breakdown.metallicQty})</span>
                    <span>+{formatPrice(breakdown.metallicUpgradesTotal)}</span>
                  </div>
                )}
                {breakdown.customBgQty > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Custom Background Upgrades (+₹100 × {breakdown.customBgQty})</span>
                    <span>+{formatPrice(breakdown.customBgUpgradesTotal)}</span>
                  </div>
                )}
                {breakdown.logoQty > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Brand Logo Overlay Upgrades (+₹50 × {breakdown.logoQty})</span>
                    <span>+{formatPrice(breakdown.logoUpgradesTotal)}</span>
                  </div>
                )}
              </div>
            )}

            <hr className="border-[var(--border)]" />

            <div className="flex justify-between">
              <span>Cart Subtotal</span>
              <span className="font-medium text-[var(--text-primary)]">{formatPrice(subtotal)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>GST (18%)</span>
              <span className="font-medium text-[var(--text-primary)]">{formatPrice(gst)}</span>
            </div>

            <hr className="border-[var(--border)] my-2" />
            
            <div className="flex justify-between text-base font-bold text-[var(--text-primary)]">
              <span>Total</span>
              <span className="text-purple-600 dark:text-purple-400">{formatPrice(total)}</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/checkout')}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-btn font-medium text-white text-sm bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md hover:shadow-purple-lg transition-all duration-200 cursor-pointer"
          >
            Proceed to checkout <ArrowRight size={16} />
          </button>
        </div>

      </div>

    </div>
  )
}

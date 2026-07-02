'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDashboard } from '../context'
import Link from 'next/link'
import {
  Package, ArrowRight, ChevronLeft, ChevronRight, Check, Copy, ExternalLink, FileDown, CreditCard, Activity, AlertCircle, ShoppingBag, Truck, MapPin
} from 'lucide-react'
import { formatPrice, isDarkColor } from '@/lib/utils'

const formatDateTime = (dateVal: any) => {
  if (!dateVal) return ''
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return ''
    const datePart = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${datePart}, ${timePart}`
  } catch (e) {
    return ''
  }
}

export function OrdersTab() {
  const {
    activeCard,
    userOrders
  } = useDashboard()

  const isAllCards = activeCard?.id === 'all'

  const searchParams = useSearchParams()
  const orderParam = searchParams ? searchParams.get('order') : null

  // Local States
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [copiedTracking, setCopiedTracking] = useState(false)

  // Initialize selected order ID from URL query parameters
  useEffect(() => {
    if (orderParam) {
      setSelectedOrderId(orderParam)
    }
  }, [orderParam])
  const [copiedLink, setCopiedLink] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)

  const handleCopyTracking = (num: string) => {
    navigator.clipboard.writeText(num)
    setCopiedTracking(true)
    setTimeout(() => setCopiedTracking(false), 2000)
  }

  const handleCopyLinkUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const activeOrders = userOrders.filter(o => o.status !== 'delivered')
  const deliveredOrders = userOrders.filter(o => o.status === 'delivered')

  const renderOrderCard = (order: any) => {
    const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    const itemCount = order.order_items?.length || 0
    const mainItem = order.order_items?.[0]

    // Extract personalization from main item
    const pers = mainItem?.personalisation || {}
    const itemTitle = pers.title || pers.name || 'Your Name'
    const itemTagline = pers.tagline || 'Short description'
    const itemLogoUrl = pers.logoUrl || pers.logoImageUrl
    const itemLogoPlacement = pers.logoPlacement || pers.logoplacement || 'top-left'
    const itemLogoHeight = pers.logoHeight || 32

    const itemTitleColor = pers.titleColor
    const itemTitleFont = pers.titleFont || 'font-sans'

    const itemTaglineColor = pers.taglineColor || pers.descColor || pers.tagColor || pers.tagcolor
    const itemTaglineFont = pers.taglineFont || pers.descFont || 'font-sans'

    const isSolid = pers.colorHex || !pers.backgroundUrl
    const bgHex = pers.colorHex || '#111'
    const itemBackgroundUrl = pers.backgroundUrl || pers.backgroundImageUrl

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

    // Compute status badge styling
    let statusColor = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
    let statusText = order.status.replace(/_/g, ' ')
    if (order.status === 'delivered') {
      statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    } else if (order.status === 'dispatched') {
      statusColor = "bg-sky-500/10 text-sky-400 border-sky-500/20"
    } else if (order.status === 'in_production') {
      statusColor = "bg-purple-500/10 text-purple-400 border-purple-500/20"
    } else if (order.status === 'pending_production') {
      statusColor = "bg-amber-500/10 text-amber-400 border-amber-500/20"
    } else if (order.status === 'pending_payment') {
      statusColor = "bg-red-500/10 text-red-400 border-red-500/20"
    }

    return (
      <div
        key={order.id}
        onClick={() => setSelectedOrderId(order.id)}
        className="p-5 rounded-2xl border bg-card border-border/50 hover:border-[#3f5ce6]/50 hover:shadow-[0_0_20px_rgba(63,92,230,0.08)] transition-all cursor-pointer relative text-left flex flex-col justify-between min-h-[320px] select-none animate-fadeIn"
      >
        {/* 1. Mini Card Preview */}
        <div
          className={`w-full aspect-[1.586/1] rounded-xl overflow-hidden shadow-md border relative flex flex-col justify-between p-3 select-none text-[8px] leading-tight mb-4 ${cardBorderColor}`}
          style={cardBgStyle}
        >
          {/* Background image if custom */}
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.1)_0%,transparent_60%)] pointer-events-none" />

          <div className="relative z-10 flex justify-between items-start w-full">
            <div className="flex items-start">
              {itemLogoUrl ? (
                (itemLogoPlacement === 'top-left') ? (
                  <img
                    src={itemLogoUrl}
                    alt="Logo"
                    className="object-contain"
                    style={{ height: `${itemLogoHeight * 0.4}px`, width: 'auto' }}
                  />
                ) : null
              ) : (
                <img
                  src="/default-brand-logo.png"
                  alt="Logo"
                  className="object-contain -mt-1 -ml-1"
                  style={{ height: '20px' }}
                />
              )}
            </div>
            <div className={isCardDark ? 'text-white/60' : 'text-zinc-800/60'}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 2a10 10 0 0 1 10 10" />
                <path d="M12 6a6 6 0 0 1 6 6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
          </div>

          {/* Center logo if centered */}
          {itemLogoUrl && itemLogoPlacement === 'center' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <img
                src={itemLogoUrl}
                alt="Logo"
                className="object-contain"
                style={{ height: `${itemLogoHeight * 0.4}px`, width: 'auto' }}
              />
            </div>
          )}

          <div className="relative z-10 w-full text-left max-w-[90%] font-medium">
            <h4
              style={itemTitleColor ? { color: itemTitleColor } : undefined}
              className={`${itemTitleFont} font-bold text-[9px] tracking-wide leading-tight truncate ${!itemTitleColor ? cardTextColor : ''}`}
            >
              {itemTitle}
            </h4>
            <p
              style={itemTaglineColor ? { color: itemTaglineColor } : undefined}
              className={`${itemTaglineFont} font-medium text-[6px] tracking-wide leading-normal mt-0.5 truncate ${!itemTaglineColor ? cardSubColor : ''}`}
            >
              {itemTagline}
            </p>
          </div>
        </div>

        {/* 2. Order Metadata & Details */}
        <div className="space-y-3 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-bold text-foreground group-hover:text-[#3f5ce6] transition-colors">{order.order_number}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">{dateStr}</p>
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}>
                {statusText}
              </span>
            </div>

            <div className="space-y-1">
              {mainItem && (
                <p className="text-xs font-semibold text-foreground/80 truncate">
                  {mainItem.product_name}
                </p>
              )}
              {itemCount > 1 && (
                <p className="text-[10px] text-muted-foreground font-medium">
                  + {itemCount - 1} other item{itemCount - 1 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-border/40 pt-3 mt-auto">
            <span className="text-sm font-extrabold text-foreground">
              {formatPrice(order.total_inr)}
            </span>
            <span className="text-[9px] font-bold text-[#3f5ce6] flex items-center gap-1 uppercase tracking-wider">
              Track Details <ArrowRight size={11} />
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {selectedOrderId === null ? (
        // General List of Orders View
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/10 pb-4 mb-2 gap-4">
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Your Orders</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select an order to view its status, download invoices, and track your smart cards.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#3f5ce6]/25 bg-[#3f5ce6]/5 text-[#3f5ce6] hover:bg-[#3f5ce6]/15 text-xs font-black transition-all active:scale-95 select-none shrink-0 cursor-pointer"
            >
              Shop Cards <ArrowRight size={12} />
            </Link>
          </div>

          {userOrders.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border space-y-4 max-w-lg mx-auto p-6">
              <div className="w-12 h-12 rounded-full bg-[#3f5ce6]/10 text-[#3f5ce6] flex items-center justify-center mx-auto">
                <Package size={22} />
              </div>
              <h3 className="text-base font-bold text-foreground">No orders found</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                You haven't purchased any custom smart cards yet. Explore our store to build your premium NFC card.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1 px-5 py-2.5 rounded-lg bg-[#3f5ce6] text-white text-xs font-semibold hover:bg-[#3050d8] shadow-md transition-all active:scale-98"
              >
                Browse NFC Cards <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="space-y-10 mt-6 text-left">
              {/* Active Orders Section */}
              {activeOrders.length > 0 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 border-l-2 border-[#3f5ce6] pl-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#3f5ce6]">
                      Active Orders ({activeOrders.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeOrders.map(order => renderOrderCard(order))}
                  </div>
                </div>
              )}

              {/* Delivered Orders Section */}
              {deliveredOrders.length > 0 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 border-l-2 border-emerald-500 pl-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                      Delivered Orders ({deliveredOrders.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deliveredOrders.map(order => renderOrderCard(order))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        // Detailed Order Logistics & Stepper view (Futuristic Minimalist split redesign)
        (() => {
          const order = userOrders.find(o => o.id === selectedOrderId)
          if (!order) {
            return (
              <div className="bg-card border border-border/50 rounded-2xl p-8 text-center text-muted-foreground h-64 flex flex-col justify-center items-center">
                <Package size={30} className="mb-2 text-muted-foreground/40" />
                <p className="text-xs font-medium">Order details not found.</p>
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#3f5ce6] text-white text-xs font-semibold"
                >
                  Back to Orders
                </button>
              </div>
            )
          }

          const statusText = order.status.replace(/_/g, ' ')
          let statusColor = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
          if (order.status === 'delivered') {
            statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          } else if (order.status === 'dispatched') {
            statusColor = "bg-sky-500/10 text-sky-400 border-sky-500/20"
          } else if (order.status === 'in_production') {
            statusColor = "bg-purple-500/10 text-purple-400 border-purple-500/20"
          } else if (order.status === 'pending_production') {
            statusColor = "bg-amber-500/10 text-amber-400 border-amber-500/20"
          } else if (order.status === 'pending_payment') {
            statusColor = "bg-red-500/10 text-red-400 border-red-500/20"
          }

          const itemCount = order.order_items?.length || 0

          // Helper to compute card breakdown for items in the order
          const getOrderBreakdown = () => {
            let baseCardsTotal = 0
            let metallicUpgradesTotal = 0
            let customBgUpgradesTotal = 0
            let logoUpgradesTotal = 0
            let totalQty = 0
            let metallicQty = 0
            let customBgQty = 0
            let logoQty = 0

            order.order_items?.forEach((item: any) => {
              const qty = item.quantity
              totalQty += qty
              baseCardsTotal += 49900 * qty

              if (item.material?.includes('Metallic') || item.material?.includes('metallic')) {
                metallicQty += qty
                metallicUpgradesTotal += 20000 * qty
              }
              const pers = item.personalisation || {}
              if (item.productType === 'custom' || item.product_type === 'custom' || pers.backgroundUrl || pers.backgroundImageUrl) {
                customBgQty += qty
                customBgUpgradesTotal += 10000 * qty
              }
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

          const breakdown = getOrderBreakdown()

          let currentStepLevel = 1
          if (order.status === 'delivered') {
            currentStepLevel = 4
          } else if (order.status === 'dispatched') {
            currentStepLevel = 3
          } else if (order.status === 'in_production') {
            currentStepLevel = 2
          } else if (['pending_production', 'pending_payment'].includes(order.status)) {
            currentStepLevel = 1
          }

          const isDispatched = ['dispatched', 'delivered'].includes(order.status)

          const trackingSteps = [
            {
              label: 'Order Confirmed',
              desc: 'Order placed and confirmed',
              date: order.paid_at || order.created_at,
              icon: ShoppingBag
            },
            {
              label: 'In Production',
              desc: 'Laser engraving & programming',
              date: ['in_production', 'dispatched', 'delivered'].includes(order.status) ? 'Started' : (order.status === 'pending_production' ? 'Queued' : ''),
              icon: Package
            },
            {
              label: 'Transit',
              desc: 'Handed to courier partner',
              date: order.dispatched_at,
              icon: Truck
            },
            {
              label: 'Delivered',
              desc: 'Smart cards successfully delivered',
              date: order.delivered_at,
              icon: MapPin
            },
          ]

          return (
            <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-16">
              {/* Header Section */}
              <div className="flex items-center gap-3 border-b border-border/10 pb-5 text-left">
                <button
                  onClick={() => {
                    setSelectedOrderId(null)
                    setPaymentOpen(false)
                  }}
                  className="p-2.5 rounded-xl border border-border bg-background hover:bg-muted/70 transition-all text-foreground cursor-pointer select-none active:scale-95"
                >
                  <ChevronLeft size={16} />
                </button>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight uppercase">
                    Order details
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Order #{order.order_number} • Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Split columns layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* ─── LEFT SIDE ─── */}
                <div className="space-y-6">
                  {/* Card Previews & Product details */}
                  <div className="space-y-4">
                    {order.order_items?.map((item: any) => {
                        const pers = item.personalisation || {}
                        const itemTitle = pers.title || pers.name || 'Your Name'
                        const itemTagline = pers.tagline || 'Short description'
                        const itemLogoUrl = pers.logoUrl || pers.logoImageUrl
                        const itemLogoPlacement = pers.logoPlacement || 'top-left'
                        const itemLogoHeight = pers.logoHeight || 32

                        const itemTitleColor = pers.titleColor
                        const itemTitleFont = pers.titleFont || 'font-sans'
                        const itemTaglineColor = pers.taglineColor || pers.descColor || pers.tagColor || pers.tagcolor
                        const itemTaglineFont = pers.taglineFont || pers.descFont || 'font-sans'

                        const isSolid = pers.colorHex || !pers.backgroundUrl
                        const bgHex = pers.colorHex || '#111'
                        const itemBackgroundUrl = pers.backgroundUrl || pers.backgroundImageUrl

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
                            className="flex flex-col items-center gap-5 transition-all w-full text-left"
                          >
                            {/* Card Visual Preview */}
                            <div
                              className={`w-full max-w-[340px] aspect-[1.586/1] rounded-2xl overflow-hidden shadow-lg border relative flex flex-col justify-between p-5.5 select-none leading-tight shrink-0 ${cardBorderColor}`}
                              style={cardBgStyle}
                            >
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
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.08)_0%,transparent_60%)] pointer-events-none" />

                              <div className="relative z-10 flex justify-between items-start w-full">
                                <div className="flex items-start">
                                  {itemLogoUrl ? (
                                    (itemLogoPlacement === 'top-left') ? (
                                      <img
                                        src={itemLogoUrl}
                                        alt="Logo"
                                        className="object-contain"
                                        style={{ height: `${itemLogoHeight * 0.6}px`, width: 'auto' }}
                                      />
                                    ) : null
                                  ) : (
                                    <img
                                      src="/default-brand-logo.png"
                                      alt="Logo"
                                      className="object-contain -mt-1 -ml-1"
                                      style={{ height: '24px' }}
                                    />
                                  )}
                                </div>
                                <div className={isCardDark ? 'text-white/60' : 'text-zinc-800/60'}>
                                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                    <path d="M12 6a6 6 0 0 1 6 6" />
                                    <circle cx="12" cy="12" r="2" />
                                  </svg>
                                </div>
                              </div>

                              {itemLogoUrl && itemLogoPlacement === 'center' && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                  <img
                                    src={itemLogoUrl}
                                    alt="Logo"
                                    className="object-contain"
                                    style={{ height: `${itemLogoHeight * 0.6}px`, width: 'auto' }}
                                  />
                                </div>
                              )}

                              <div className="relative z-10 w-full text-left max-w-[90%] font-medium">
                                <h4
                                  style={itemTitleColor ? { color: itemTitleColor } : undefined}
                                  className={`${itemTitleFont} font-bold text-sm tracking-wide leading-tight truncate ${!itemTitleColor ? cardTextColor : ''}`}
                                >
                                  {itemTitle}
                                </h4>
                                <p
                                  style={itemTaglineColor ? { color: itemTaglineColor } : undefined}
                                  className={`${itemTaglineFont} font-medium text-[10px] tracking-wide leading-normal mt-0.5 truncate ${!itemTaglineColor ? cardSubColor : ''}`}
                                >
                                  {itemTagline}
                                </p>
                              </div>
                            </div>

                            {/* Card details summary (stacked below without card container background) */}
                            <div className="w-full flex items-center justify-between mt-2.5 px-1.5">
                              <div className="space-y-0.5 text-left">
                                <h4 className="font-extrabold text-base text-foreground tracking-tight leading-snug">
                                  {item.product_name}
                                </h4>
                                <p className="text-[11px] sm:text-xs text-muted-foreground/75 font-semibold">
                                  {item.material}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs sm:text-sm font-bold text-foreground bg-muted/25 px-2.5 py-1 rounded-lg border border-border/10">
                                  {item.quantity} Unit{item.quantity > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>

                  {/* Payment details in a collapsible */}
                  <div className="bg-background border border-border/40 rounded-2xl overflow-hidden shadow-xs">
                    <button
                      onClick={() => setPaymentOpen(!paymentOpen)}
                      className="w-full flex items-center justify-between p-4 font-black uppercase tracking-wider text-[10px] text-muted-foreground hover:bg-muted/10 transition-colors select-none"
                    >
                      <span className="flex items-center gap-1.5">
                        <CreditCard size={12} /> Payment details
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={`text-muted-foreground transition-transform duration-200 ${paymentOpen ? 'rotate-180' : ''}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {paymentOpen && (
                      <div className="p-4 pt-1 border-t border-border/5 bg-background text-xs animate-slideDown text-left grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <span className="block text-[9px] text-muted-foreground font-black uppercase tracking-wider">Transaction ID</span>
                          <span className="block font-mono font-bold text-foreground mt-0.5 select-all truncate" title={order.razorpay_payment_id}>
                            {order.razorpay_payment_id || 'N/A'}
                          </span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="block text-[9px] text-muted-foreground font-black uppercase tracking-wider">Razorpay Order ID</span>
                          <span className="block font-mono font-bold text-foreground mt-0.5 select-all truncate" title={order.razorpay_order_id}>
                            {order.razorpay_order_id || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-muted-foreground font-black uppercase tracking-wider">Invoice Number</span>
                          <span className="block font-mono font-bold text-foreground mt-0.5 select-all">
                            {order.invoice_number ? `#${order.invoice_number}` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-muted-foreground font-black uppercase tracking-wider">Payment Status</span>
                          <div className="mt-1">
                            {order.paid_at ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Paid
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                        {order.paid_at && (
                          <div className="col-span-2">
                            <span className="block text-[9px] text-muted-foreground font-black uppercase tracking-wider">Transaction Timestamp</span>
                            <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">
                              {new Date(order.paid_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cost Summary details */}
                  <div className="bg-background border border-border/40 rounded-2xl p-5 text-left flex flex-col justify-between space-y-4 shadow-xs">
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground block">Cost Summary</span>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-semibold">Base Smart Cards (₹499 × {breakdown.totalQty})</span>
                          <span className="font-bold text-foreground">{formatPrice(breakdown.baseCardsTotal)}</span>
                        </div>

                        {breakdown.metallicQty > 0 && (
                          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                            <span>Matte Metallic Upgrades (+₹200 × {breakdown.metallicQty})</span>
                            <span>+{formatPrice(breakdown.metallicUpgradesTotal)}</span>
                          </div>
                        )}
                        {breakdown.customBgQty > 0 && (
                          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                            <span>Custom Background Upgrades (+₹100 × {breakdown.customBgQty})</span>
                            <span>+{formatPrice(breakdown.customBgUpgradesTotal)}</span>
                          </div>
                        )}
                        {breakdown.logoQty > 0 && (
                          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                            <span>Brand Logo Overlay Upgrades (+₹50 × {breakdown.logoQty})</span>
                            <span>+{formatPrice(breakdown.logoUpgradesTotal)}</span>
                          </div>
                        )}

                        <hr className="border-border/5 my-1" />

                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-semibold">Subtotal</span>
                          <span className="font-bold text-foreground">
                            {formatPrice(order.subtotal_inr || (order.total_inr - (order.gst_inr || 0)))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-semibold">GST (18%)</span>
                          <span className="font-bold text-foreground">{formatPrice(order.gst_inr || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-semibold">Shipping</span>
                          <span className="text-emerald-500 font-black uppercase tracking-wider text-[10px]">Free Delivery</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/15 flex justify-between items-center">
                      <div>
                        <span className="block text-[9px] text-muted-foreground font-black uppercase tracking-wider">Grand Total</span>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Inclusive of GST and Shipping</p>
                      </div>
                      <span className="text-base font-extrabold text-[#3f5ce6]">
                        {formatPrice(order.total_inr)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ─── RIGHT SIDE ─── */}
                <div className="space-y-6">
                  {/* Delivery Stepper (Vertical Minimal) */}
                  <div className="bg-background border border-border/40 rounded-2xl p-6 text-left shadow-xs">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">Delivery status</span>

                    <div className="relative space-y-6">
                      {/* Vertical line connecting steps */}
                      <div className="absolute left-[19px] top-5 bottom-5 w-[2px]">
                        {/* Grey base track */}
                        <div className="absolute inset-0 bg-border/20" />
                        {/* Blue active progress track */}
                        <div
                          className="absolute top-0 left-0 right-0 bg-[#3f5ce6] transition-all duration-500"
                          style={{ height: `${((currentStepLevel - 1) / 3) * 100}%` }}
                        />
                      </div>

                      {trackingSteps.map((step, idx) => {
                        const stepNum = idx + 1
                        const isCompleted = stepNum < currentStepLevel
                        const isActive = stepNum === currentStepLevel
                        const StepIcon = step.icon

                        let circleStyle = ""
                        if (isCompleted) {
                          circleStyle = "bg-background border-emerald-500 text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.06)]"
                        } else if (isActive) {
                          circleStyle = "bg-background border-[#3f5ce6] text-[#3f5ce6] font-bold ring-4 ring-[#3f5ce6]/10"
                        } else {
                          circleStyle = "bg-background border-border/40 text-muted-foreground/30 border-dashed"
                        }

                        return (
                          <div key={idx} className="flex items-start gap-4 relative justify-between w-full">
                            <div className="flex items-start gap-4">
                              {/* Step Indicator Node */}
                              <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 z-10 shrink-0 ${circleStyle}`}>
                                <StepIcon size={16} />
                              </div>

                              {/* Step Description */}
                              <div className="space-y-0.5 text-left pt-0.5">
                                <span className={`text-xs font-black block uppercase tracking-wider ${isActive ? 'text-[#3f5ce6]' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {step.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground/80 block leading-normal">
                                  {step.desc}
                                </span>
                              </div>
                            </div>

                            {/* Date & Time on the far right */}
                            {step.date && (
                              <span className="text-[10px] text-muted-foreground/60 font-medium pt-1 shrink-0">
                                {typeof step.date === 'string' && (step.date === 'Started' || step.date === 'Queued')
                                  ? step.date
                                  : formatDateTime(step.date)}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Courier & Logistics */}
                  <div className="bg-background border border-border/40 rounded-2xl p-5 text-left space-y-4 shadow-xs">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logistics details</span>
                    {isDispatched ? (
                      <div className="space-y-4">
                        {/* Courier Partner & Dispatch Date Row */}
                        <div className="flex justify-between items-start gap-4 pb-3 border-b border-border/5">
                          <div>
                            <span className="block text-[8px] text-muted-foreground font-black uppercase tracking-wider">Courier Partner</span>
                            <span className="block font-extrabold text-base text-foreground mt-0.5">{order.courier_name || 'N/A'}</span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/80 mt-1 font-semibold">
                              Dispatched: {order.dispatched_at
                                ? new Date(order.dispatched_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                : 'N/A'}
                            </span>
                          </div>

                          {/* Tracking Number */}
                          <div className="text-right">
                            <span className="block text-[8px] text-muted-foreground font-black uppercase tracking-wider mb-1">Tracking Number</span>
                            <div className="inline-flex items-center gap-1.5 bg-muted/20 px-2.5 py-1.5 rounded-lg border border-border/10">
                              <span className="font-mono text-xs font-bold text-foreground select-all">
                                {order.tracking_number || 'N/A'}
                              </span>
                              {order.tracking_number && (
                                <button
                                  onClick={() => handleCopyTracking(order.tracking_number)}
                                  className="p-1 rounded hover:bg-[#3f5ce6]/10 text-[#3f5ce6] transition-all cursor-pointer shrink-0"
                                >
                                  {copiedTracking ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Shipment Link Actions */}
                        {order.tracking_url ? (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#3f5ce6]/25 bg-[#3f5ce6]/5 text-[#3f5ce6] text-xs font-black transition-all hover:bg-[#3f5ce6]/15 active:scale-[0.98] select-none cursor-pointer"
                          >
                            Live Tracking URL <ExternalLink size={12} />
                          </a>
                        ) : (
                          <div className="text-[10px] text-muted-foreground bg-muted/10 p-2.5 rounded-lg text-center font-medium">
                            Live shipment link is currently pending update.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-[#3f5ce6]/10 bg-[#3f5ce6]/[0.02] text-[#3f5ce6] text-[10px] flex items-center gap-2 select-none leading-relaxed">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>Logistics and tracking details will update here once dispatched.</span>
                      </div>
                    )}
                  </div>

                  {/* Download Invoice Button */}
                  {order.invoice_url && (
                    <a
                      href={order.invoice_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-black transition-all cursor-pointer shadow-xs select-none active:scale-98"
                    >
                      <FileDown size={14} /> Download Tax Invoice
                    </a>
                  )}

                  {/* Shipping & Billing Address */}
                  {order.shipping_address && (
                    <div className="bg-background border border-border/40 rounded-2xl p-5 text-left space-y-3.5 shadow-xs">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Delivery & Shipping Address</span>
                      <div className="text-xs space-y-1 bg-muted/5 p-3 rounded-xl border border-border/5">
                        <p className="font-black text-foreground">{order.shipping_address.fullName}</p>
                        <p className="text-muted-foreground leading-relaxed mt-0.5 font-medium">
                          {order.shipping_address.addressLine1}
                          {order.shipping_address.addressLine2 ? `, ${order.shipping_address.addressLine2}` : ''}
                          <br />
                          {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                          <br />
                          {order.shipping_address.phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )
        })()
      )}
    </div>
  )
}

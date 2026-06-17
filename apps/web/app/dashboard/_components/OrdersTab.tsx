'use client'

import React, { useState } from 'react'
import { useDashboard } from '../context'
import Link from 'next/link'
import {
  Package, ArrowRight, ChevronLeft, ChevronRight, Check, Copy, ExternalLink, FileDown, CreditCard, Activity, AlertCircle
} from 'lucide-react'
import { formatPrice, isDarkColor } from '@/lib/utils'

export function OrdersTab() {
  const {
    activeCard,
    userOrders
  } = useDashboard()

  const isAllCards = activeCard?.id === 'all'

  // Local States
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [copiedTracking, setCopiedTracking] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

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

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {selectedOrderId === null ? (
        // General List of Orders View
        <>
          <div className="hidden sm:block">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Your Orders</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select an order to view its status, download invoices, and track your smart cards.
            </p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userOrders.map((order) => {
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
                    className="p-5 rounded-2xl border bg-card border-border/50 hover:border-[#3f5ce6]/50 hover:shadow-[0_0_20px_rgba(63,92,230,0.08)] transition-all cursor-pointer relative text-left flex flex-col justify-between min-h-[320px] select-none"
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
              })}
            </div>
          )}
        </>
      ) : (
        // Detailed Order Logistics & Stepper view
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
              label: 'Order Placed',
              desc: 'Payment verified & design queued',
              date: order.paid_at || order.created_at,
              icon: CreditCard
            },
            {
              label: 'In Production',
              desc: 'Laser engraving & programming',
              date: ['in_production', 'dispatched', 'delivered'].includes(order.status) ? 'Started' : (order.status === 'pending_production' ? 'Queued' : ''),
              icon: Activity
            },
            {
              label: 'Dispatched',
              desc: 'Handed to courier partner',
              date: order.dispatched_at,
              icon: Package
            },
            {
              label: 'Delivered',
              desc: 'Smart cards successfully delivered',
              date: order.delivered_at,
              icon: Check
            },
          ]

          return (
            <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">

              {/* Header Section */}
              <div className="flex justify-between items-center border-b border-border/50 pb-5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedOrderId(null)}
                    className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted/70 transition-all text-foreground cursor-pointer select-none active:scale-95"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                    Order Details
                  </h3>
                </div>
                {order.invoice_url && (
                  <a
                    href={order.invoice_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3f5ce6] text-white hover:bg-[#3050d8] text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-[#3f5ce6]/20 select-none active:scale-95"
                  >
                    <FileDown size={14} /> Download Invoice
                  </a>
                )}
              </div>

              {/* Order Details Strip */}
              <div className="bg-card border border-border/50 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-5 gap-6 text-left">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Order Number</span>
                  <span className="text-sm font-bold text-foreground mt-1.5 block">
                    <span className="select-none">#</span>{order.order_number}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Order Placed</span>
                  <span className="text-sm font-bold text-foreground mt-1.5 block">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Order Delivered</span>
                  <span className="text-sm font-bold text-foreground mt-1.5 block">
                    {order.delivered_at
                      ? new Date(order.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">No of Items</span>
                  <span className="text-sm font-bold text-foreground mt-1.5 block">
                    {String(itemCount).padStart(2, '0')} {itemCount > 1 ? 'Items' : 'Item'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Status</span>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Courier Logistics Strip / Info Notice */}
              {isDispatched ? (
                <div className="bg-card border border-border/50 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left animate-fadeIn">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Courier Partner</span>
                    <span className="text-sm font-bold text-foreground mt-1.5 block">
                      {order.courier_name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Tracking Number</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-sm font-mono font-bold text-foreground select-all">
                        {order.tracking_number ? (
                          <>
                            <span className="select-none font-mono">#</span>{order.tracking_number}
                          </>
                        ) : (
                          'N/A'
                        )}
                      </span>
                      {order.tracking_number && (
                        <button
                          onClick={() => handleCopyTracking(order.tracking_number)}
                          className="p-1 rounded hover:bg-[#3f5ce6]/10 text-[#3f5ce6] hover:text-[#3050d8] transition-all cursor-pointer animate-scaleIn"
                          title="Copy tracking number"
                        >
                          {copiedTracking ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Dispatched Date</span>
                    <span className="text-sm font-bold text-foreground mt-1.5 block">
                      {order.dispatched_at
                        ? new Date(order.dispatched_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Tracking Link</span>
                    <div className="flex items-center gap-2 mt-1">
                      {order.tracking_url ? (
                        <>
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#3f5ce6] hover:underline"
                          >
                            Track Shipment <ExternalLink size={12} />
                          </a>
                          <button
                            onClick={() => handleCopyLinkUrl(order.tracking_url)}
                            className="p-1 rounded hover:bg-[#3f5ce6]/10 text-[#3f5ce6] hover:text-[#3050d8] transition-all cursor-pointer animate-scaleIn"
                            title="Copy tracking link"
                          >
                            {copiedLink ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground font-semibold">N/A</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border bg-[#3f5ce6]/10 border-[#3f5ce6]/20 text-[#3f5ce6] dark:text-[#3f5ce6]/90 text-xs font-semibold flex items-center gap-2 select-none animate-fadeIn">
                  <AlertCircle size={15} className="shrink-0 text-[#3f5ce6]" />
                  <span>Tracking and courier details will be updated once the product is dispatched.</span>
                </div>
              )}

              {/* Order Tracking Progress Timeline */}
              <div className="space-y-4">
                <div className="flex items-center px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Tracking</span>
                </div>

                <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
                  <div className="relative flex justify-between items-start max-w-3xl mx-auto">
                    {/* Background Line */}
                    <div className="absolute top-5 left-[12%] right-[12%] h-[2px] bg-border/40 pointer-events-none" />
                    {/* Active Progress Line */}
                    <div
                      className="absolute top-5 left-[12%] h-[2px] bg-[#3f5ce6] transition-all duration-500 pointer-events-none"
                      style={{ width: `${((currentStepLevel - 1) / 3) * 76}%` }}
                    />

                    {trackingSteps.map((step, idx) => {
                      const stepNum = idx + 1
                      const isCompleted = stepNum < currentStepLevel
                      const isActive = stepNum === currentStepLevel

                      let circleStyle = ""
                      if (isCompleted) {
                        circleStyle = "bg-[#3f5ce6] border-[#3f5ce6] text-white shadow-[0_0_12px_rgba(63,92,230,0.2)]"
                      } else if (isActive) {
                        circleStyle = "bg-card border-[#3f5ce6] text-[#3f5ce6] ring-4 ring-[#3f5ce6]/10 font-bold"
                      } else {
                        circleStyle = "bg-card border-border text-muted-foreground"
                      }

                      return (
                        <div key={idx} className="flex flex-col items-center text-center relative z-10 w-[22%]">
                          {/* Step Circle */}
                          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all duration-300 ${circleStyle}`}>
                            {(() => {
                              const IconComponent = step.icon
                              return <IconComponent className="w-5 h-5" />
                            })()}
                          </div>

                          {/* Step Info */}
                          <span className={`text-xs font-bold mt-3 block ${isActive ? 'text-[#3f5ce6]' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground leading-normal mt-0.5 max-w-[120px] hidden sm:block">
                            {step.desc}
                          </span>
                          {step.date && (
                            <span className="text-[9px] font-mono text-muted-foreground mt-1 block">
                              {typeof step.date === 'string' && step.date !== 'Queued' && step.date !== 'Started'
                                ? new Date(step.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                : step.date}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Items from the order */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground text-left">Items from the order</h4>
                <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                  {/* Table Header (hidden on mobile) */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/20 border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-left">
                    <div className="col-span-5">Product</div>
                    <div className="col-span-3">Material</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-right">Price</div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-border/40">
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
                          className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-6 py-5 items-center text-left"
                        >
                          {/* Column 1: Mini Card Preview + Details */}
                          <div className="col-span-12 sm:col-span-5 flex items-center gap-4">
                            <div
                              className={`w-24 aspect-[1.586/1] rounded-lg overflow-hidden shadow-sm border relative flex flex-col justify-between p-2 select-none text-[6px] leading-tight shrink-0 ${cardBorderColor}`}
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
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.1)_0%,transparent_60%)] pointer-events-none" />

                              <div className="relative z-10 flex justify-between items-start w-full">
                                <div className="flex items-start">
                                  {itemLogoUrl ? (
                                    (itemLogoPlacement === 'top-left') ? (
                                      <img
                                        src={itemLogoUrl}
                                        alt="Logo"
                                        className="object-contain"
                                        style={{ height: `${itemLogoHeight * 0.25}px`, width: 'auto' }}
                                      />
                                    ) : null
                                  ) : (
                                    <img
                                      src="/default-brand-logo.png"
                                      alt="Logo"
                                      className="object-contain -mt-0.5 -ml-0.5"
                                      style={{ height: '12px' }}
                                    />
                                  )}
                                </div>
                                <div className={isCardDark ? 'text-white/60' : 'text-zinc-800/60'}>
                                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
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
                                    style={{ height: `${itemLogoHeight * 0.25}px`, width: 'auto' }}
                                  />
                                </div>
                              )}

                              <div className="relative z-10 w-full text-left max-w-[90%] font-medium">
                                <h4
                                  style={itemTitleColor ? { color: itemTitleColor } : undefined}
                                  className={`${itemTitleFont} font-bold text-[6px] tracking-wide leading-tight truncate ${!itemTitleColor ? cardTextColor : ''}`}
                                >
                                  {itemTitle}
                                </h4>
                                <p
                                  style={itemTaglineColor ? { color: itemTaglineColor } : undefined}
                                  className={`${itemTaglineFont} font-medium text-[4px] tracking-wide leading-normal mt-0.5 truncate ${!itemTaglineColor ? cardSubColor : ''}`}
                                >
                                  {itemTagline}
                                </p>
                              </div>
                            </div>

                            <div>
                              <h5 className="text-xs font-bold text-foreground truncate max-w-[180px]">
                                {item.product_name}
                              </h5>
                            </div>
                          </div>

                          {/* Column 2: Material */}
                          <div className="col-span-12 sm:col-span-3 text-left">
                            <span className="text-xs font-semibold text-foreground/80">{item.material}</span>
                          </div>

                          {/* Column 3: Quantity */}
                          <div className="col-span-12 sm:col-span-2 text-left sm:text-center">
                            <span className="text-xs font-bold text-foreground/80">
                              {String(item.quantity).padStart(2, '0')}
                            </span>
                          </div>

                          {/* Column 4: Price */}
                          <div className="col-span-12 sm:col-span-2 text-left sm:text-right">
                            <span className="text-xs font-extrabold text-foreground">
                              {formatPrice(item.price_inr)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Shipping Address Strip */}
              {order.shipping_address && (
                <div className="bg-card border border-border/50 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Deliver To</span>
                    <span className="text-sm font-bold text-foreground mt-1.5 block">{order.shipping_address.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Shipping Address</span>
                    <span className="text-xs text-muted-foreground mt-1.5 block leading-relaxed font-medium">
                      {order.shipping_address.addressLine1}
                      {order.shipping_address.addressLine2 ? `, ${order.shipping_address.addressLine2}` : ''}
                      <br />
                      {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Contact Number</span>
                    <span className="text-xs text-muted-foreground mt-1.5 block font-mono font-semibold">{order.shipping_address.phone}</span>
                  </div>
                </div>
              )}

              {/* Payment & Transaction Details Strip */}
              <div className="bg-card border border-border/50 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-6 text-left">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Transaction ID (Razorpay)</span>
                  <span className="text-xs font-mono font-bold text-foreground mt-1.5 block select-all">{order.razorpay_payment_id || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Razorpay Order ID</span>
                  <span className="text-xs font-mono font-bold text-foreground mt-1.5 block select-all">{order.razorpay_order_id || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Invoice Number</span>
                  <span className="text-xs font-mono font-bold text-foreground mt-1.5 block select-all">
                    {order.invoice_number ? (
                      <>
                        <span className="select-none font-mono">#</span>{order.invoice_number}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Payment Status</span>
                  <div className="mt-1.5">
                    {order.paid_at ? (
                      <div className="space-y-0.5">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Paid
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground block mt-0.5">
                          {new Date(order.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending Payment
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dual Summary Footer Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Left Panel */}
                <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 text-left">
                  <div className="flex justify-between items-center text-xs font-medium border-b border-border/40 pb-3">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span className="text-foreground font-semibold">{formatPrice(order.gst_inr || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px]">Free</span>
                  </div>
                </div>

                {/* Right Panel */}
                <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 text-left">
                  <div className="flex justify-between items-center text-xs font-medium border-b border-border/40 pb-3">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground font-semibold">
                      {formatPrice(order.subtotal_inr || (order.total_inr - (order.gst_inr || 0)))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground">Grand Total</span>
                    <span className="text-lg font-extrabold text-[#3f5ce6]">
                      {formatPrice(order.total_inr)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )
        })()
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { formatPrice, isDarkColor } from '@/lib/utils'
import { Check, ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSubtotal, getGst, getGrandTotal, clearCart, updateQuantity, removeItem } = useCartStore()
  const supabase = createClient()

  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(1) // 1 = Confirm Order, 2 = Choose Plan, 3 = Shipping, 4 = Review & Pay
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('pro')
  const [session, setSession] = useState<any>(null)
  const [userPlan, setUserPlan] = useState<string>('free')
  const [userPlanExpiresAt, setUserPlanExpiresAt] = useState<string | null>(null)

  const hasActivePro = !!(
    session &&
    (userPlan === 'pro' || userPlan === 'business') &&
    (!userPlanExpiresAt || new Date(userPlanExpiresAt) > new Date())
  )

  const stepsList = hasActivePro
    ? [
        { key: 1, label: '1. Confirm Order' },
        { key: 3, label: '2. Shipping' },
        { key: 4, label: '3. Review & Pay' },
      ]
    : [
        { key: 1, label: '1. Confirm Order' },
        { key: 2, label: '2. Choose Plan' },
        { key: 3, label: '3. Shipping' },
        { key: 4, label: '4. Review & Pay' },
      ]

  // Shipping Form State
  const [shipping, setShipping] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  })

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('checkout-profile-plan')
    if (saved === 'free' || saved === 'pro') {
      setSelectedPlan(saved)
    }
    // Pre-fill user details and plan status
    const prefillUser = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession()
      setSession(activeSession)
      if (activeSession?.user) {
        setShipping((prev) => ({
          ...prev,
          email: activeSession.user.email || '',
        }))
        const { data } = await supabase
          .from('accounts')
          .select('full_name, plan, plan_expires_at')
          .eq('id', activeSession.user.id)
          .single()
        if (data?.full_name) {
          setShipping((prev) => ({
            ...prev,
            fullName: data.full_name,
          }))
        }
        if (data?.plan) {
          setUserPlan(data.plan)
        }
        if (data?.plan_expires_at) {
          setUserPlanExpiresAt(data.plan_expires_at)
          const isCurrentlyPro = (data.plan === 'pro' || data.plan === 'business') &&
            (!data.plan_expires_at || new Date(data.plan_expires_at) > new Date())
          if (isCurrentlyPro) {
            setSelectedPlan('pro')
          }
        }
      }
    }
    prefillUser()
  }, [])

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600" />
      </div>
    )
  }

  if (items.length === 0 && !isRedirecting) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <h1 className="text-xl font-bold">Your cart is empty</h1>
        <button onClick={() => router.push('/shop')} className="mt-4 text-purple-600 font-semibold hover:underline">
          Go to Shop
        </button>
      </div>
    )
  }

  // Price calculations
  const subtotal = getSubtotal()
  const gst = getGst()
  
  let planPrice = 0
  if (selectedPlan === 'pro') {
    if (!hasActivePro) {
      planPrice = 19900 // ₹199 in paise
    }
  }
  const total = subtotal + gst + planPrice

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

      if (item.material === 'Metallic') {
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

  // Form Validation
  const isShippingValid = () => {
    const phoneRegex = /^[0-9]{10}$/
    const pinRegex = /^[0-9]{6}$/
    return (
      shipping.fullName.trim() !== '' &&
      shipping.email.trim() !== '' &&
      phoneRegex.test(shipping.phone) &&
      shipping.addressLine1.trim() !== '' &&
      shipping.city.trim() !== '' &&
      shipping.state.trim() !== '' &&
      pinRegex.test(shipping.pincode)
    )
  }

  const handlePayment = async () => {
    setLoading(true)
    setErrorMsg('')

    try {
      // 1. Create order on server (directly inserts paid order to db)
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: items,
          plan: selectedPlan,
          shipping,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Could not place order. Please try again.')
      }

      const orderData = await res.json()

      if (orderData.success) {
        // Success -> clear cart -> redirect
        setIsRedirecting(true)
        clearCart()
        router.refresh()
        router.push(`/orders/success?order=${orderData.orderId}&num=${orderData.orderNumber}`)
      } else {
        throw new Error('Order creation failed.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 py-16">
        
        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-4 mb-12">
          {stepsList.map((s, i) => {
            const isCurrent = step === s.key
            const isDone = step > s.key
            return (
              <div 
                key={s.key} 
                className={`text-xs sm:text-sm font-semibold pb-2 border-b-2 transition-colors ${
                  isCurrent 
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400' 
                    : isDone 
                    ? 'border-emerald-500 text-emerald-500' 
                    : 'border-transparent text-[var(--text-muted)]'
                }`}
              >
                {s.label}
              </div>
            )
          })}
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-btn text-center mb-8">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Columns Main Content based on step */}
          <div className="lg:col-span-2 bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-6">
            
            {/* STEP 1: CONFIRM ORDER */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Confirm Your Order</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Review the details of your customized NFC smart cards before choosing your digital profile plan.</p>
                </div>

                <div className="space-y-4">
                  {items.map((item) => {
                    const pers = item.personalisation as any
                    const isSolid = item.productType === 'solid_color'
                    const bgHex = pers.colorHex || '#111'
                    const bgUrl = pers.backgroundUrl || pers.backgroundImageUrl

                    const itemTitle = pers.title || pers.name || 'Your Name'
                    const itemTitleColor = pers.titleColor
                    const itemTitleFont = pers.titleFont || 'font-sans'
                    const itemTitleSize = pers.titleSize || 'text-base'

                    const itemTagline = pers.tagline || 'Short description'
                    const itemTaglineColor = pers.taglineColor || pers.descColor || pers.tagColor || pers.tagcolor
                    const itemTaglineFont = pers.taglineFont || pers.descFont || 'font-sans'
                    const itemTaglineSize = pers.taglineSize || pers.descSize || 'text-xs'

                    const itemLogoUrl = pers.logoUrl || pers.logoImageUrl
                    const itemLogoPlacement = pers.logoPlacement || pers.logoplacement || 'top-left'
                    const itemLogoHeight = pers.logoHeight || 32

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
                        className="flex flex-col sm:flex-row gap-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-purple-600/30 transition-all items-center sm:items-start"
                      >
                        {/* Miniature Envitra Card Preview */}
                        <div className="w-[140px] h-[88px] shrink-0 rounded-lg relative shadow-md overflow-hidden border border-zinc-200/10 select-none">
                          <div 
                            className={`w-[400px] h-[252px] scale-[0.35] origin-top-left absolute top-0 left-0 p-6 flex flex-col justify-between overflow-hidden border ${cardBorderColor}`}
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

                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.12)_0%,transparent_60%)] pointer-events-none" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.06)_0%,transparent_50%)] pointer-events-none" />
                            <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.3)_0%,rgba(0,0,0,0.2)_100%)]" />
                            {item.material && item.material.includes('Metallic') && (
                              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_40%,rgba(0,0,0,0.22)_60%,rgba(255,255,255,0.18)_100%)] mix-blend-overlay pointer-events-none z-10 animate-pulse" />
                            )}

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

                            <div className="relative z-10 flex justify-between items-start w-full">
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
                              <div className={isCardDark ? 'text-white/80' : 'text-zinc-800'}>
                                <svg className="w-9.5 h-9.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
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

                        {/* Card Info and Action */}
                        <div className="flex-grow flex flex-col sm:flex-row justify-between items-center sm:items-start w-full text-center sm:text-left gap-4">
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-[var(--text-primary)]">{item.productName}</h4>
                            <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
                              <p>Finish: <span className="font-semibold text-[var(--text-primary)]">{item.material}</span> {item.material.includes('Metallic') && <span className="text-emerald-600 dark:text-emerald-400 font-bold">(+₹200)</span>}</p>
                              <p>Background: <span className="font-semibold text-[var(--text-primary)]">{isSolid ? `${pers.colorName} (Solid)` : 'Custom Artwork'}</span> {item.productType === 'custom' && <span className="text-emerald-600 dark:text-emerald-400 font-bold">(+₹100)</span>}</p>
                              {itemLogoUrl && <p>Brand Logo: <span className="font-semibold text-[var(--text-primary)]">Custom Overlay</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">(+₹50)</span></p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Quantity Selector */}
                            <div className="flex items-center bg-[var(--bg-muted)] rounded-lg p-1 border border-[var(--border)]">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-6 h-6 rounded hover:bg-[var(--bg-surface)] flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                              >
                                -
                              </button>
                              <span className="text-xs font-semibold w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 rounded hover:bg-[var(--bg-surface)] flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                              >
                                +
                              </button>
                            </div>
                            
                            <div className="text-right">
                              <span className="text-sm font-bold text-[var(--text-primary)] block">
                                {formatPrice(item.priceInr * item.quantity)}
                              </span>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-[10px] text-red-500 hover:text-red-600 font-semibold hover:underline mt-1 cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
                  <button
                    onClick={() => router.push('/cart')}
                    className="text-[var(--text-secondary)] font-semibold hover:underline text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back to Cart
                  </button>
                  <button
                    onClick={() => setStep(hasActivePro ? 3 : 2)}
                    className="px-6 py-2.5 rounded-btn font-medium text-white text-xs bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md cursor-pointer"
                  >
                    {hasActivePro ? 'Continue to Shipping' : 'Continue to Choose Plan'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CHOOSE PLAN */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Choose your digital profile plan</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">This plan governs your digital profile benefits and covers ALL cards in this order.</p>
                </div>

                {/* Recommendation message for free plan users */}
                {(!session || userPlan === 'free') && (
                  <div className="p-4 rounded-xl bg-purple-600/5 border border-purple-600/10 text-xs space-y-2 animate-fadeIn">
                    <p className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 text-sm">
                      💡 Recommended Upgrade
                      <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Highly Recommended
                      </span>
                    </p>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      You are currently on the <strong className="text-[var(--text-primary)]">Free Profile Plan</strong>. We highly recommend choosing the <strong className="text-[var(--text-primary)]">Pro Plan</strong> to unlock premium bio themes, advanced link traffic metrics, active lead captures, and multi-profile card mapping.
                    </p>
                  </div>
                )}

                {session && userPlan === 'pro' && hasActivePro && (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✨ You already have the <span className="font-bold">Pro Profile Plan</span> active on your account! (No additional charge will apply for your profile services).
                  </div>
                )}

                {session && userPlan === 'pro' && !hasActivePro && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-600 dark:text-amber-400 font-medium animate-fadeIn">
                    ⚠️ Your Pro Profile Plan subscription has expired. You can renew your subscription below for the quoted price of ₹199/month to keep using premium themes, lead capture form, and profile analytics.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Free Plan */}
                  <button
                    onClick={() => {
                      setSelectedPlan('free')
                      localStorage.setItem('checkout-profile-plan', 'free')
                    }}
                    className={`p-6 rounded-card border text-left flex flex-col justify-between h-44 transition-all cursor-pointer ${
                      selectedPlan === 'free'
                        ? 'border-purple-600 bg-purple-600/5 ring-1 ring-purple-600/30'
                        : 'border-[var(--border)] hover:border-purple-600/30'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center w-full">
                        <span className="font-semibold text-[var(--text-primary)]">Free Profile Plan</span>
                        {selectedPlan === 'free' && <Check size={16} className="text-purple-600" />}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">Standard profile features</p>
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-[var(--text-primary)]">₹0</span>
                      <span className="text-xs text-[var(--text-muted)]">/forever</span>
                    </div>
                  </button>

                  {/* Pro Plan */}
                  <button
                    onClick={() => {
                      setSelectedPlan('pro')
                      localStorage.setItem('checkout-profile-plan', 'pro')
                    }}
                    className={`p-6 rounded-card border text-left flex flex-col justify-between h-44 transition-all cursor-pointer relative overflow-hidden ${
                      selectedPlan === 'pro'
                        ? 'border-purple-600 bg-purple-600/5 ring-1 ring-purple-600/30 shadow-purple-sm'
                        : 'border-[var(--border)] hover:border-purple-600/30'
                    }`}
                  >
                    {(!session || userPlan === 'free') && (
                      <span className="absolute top-2 right-2 text-[8px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider z-10 scale-90">
                        Recommended
                      </span>
                    )}
                    <div>
                      <div className="flex justify-between items-center w-full">
                        <span className="font-semibold text-[var(--text-primary)]">Pro Profile Plan</span>
                        {selectedPlan === 'pro' && <Check size={16} className="text-purple-600" />}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">Analytics, Lead captures & themes</p>
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-[var(--text-primary)]">
                        {session && userPlan === 'pro' && hasActivePro ? '₹0' : '₹199'}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {session && userPlan === 'pro' && hasActivePro ? ' (Included)' : '/month'}
                      </span>
                    </div>
                  </button>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-btn border border-[var(--border)] bg-transparent hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-2.5 rounded-btn font-medium text-white text-xs bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md cursor-pointer"
                  >
                    Continue to Shipping
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SHIPPING DETAILS */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Shipping Details</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Please provide the delivery address for your physical NFC smart cards.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Full Name</label>
                    <input
                      type="text"
                      required
                      value={shipping.fullName}
                      onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Email Address</label>
                    <input
                      type="email"
                      required
                      value={shipping.email}
                      onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Phone Number (10 Digits)</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={shipping.phone}
                      onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:border-purple-600 focus:outline-none"
                      placeholder="e.g. 9876543210"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Pincode (6 Digits)</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={shipping.pincode}
                      onChange={(e) => setShipping({ ...shipping, pincode: e.target.value })}
                      className="w-full px-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:border-purple-600 focus:outline-none"
                      placeholder="560001"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Address Line 1</label>
                    <input
                      type="text"
                      required
                      value={shipping.addressLine1}
                      onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })}
                      className="w-full px-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:border-purple-600 focus:outline-none"
                      placeholder="Flat, House no., Building, Company"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={shipping.addressLine2}
                      onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })}
                      className="w-full px-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:border-purple-600 focus:outline-none"
                      placeholder="Area, Street, Sector, Village"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">City</label>
                    <input
                      type="text"
                      required
                      value={shipping.city}
                      onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">State</label>
                    <input
                      type="text"
                      required
                      value={shipping.state}
                      onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                      className="w-full px-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setStep(hasActivePro ? 1 : 2)}
                    className="px-4 py-2 rounded-btn border border-[var(--border)] bg-transparent hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    onClick={() => {
                      if (isShippingValid()) {
                        setStep(4)
                        setErrorMsg('')
                      } else {
                        setErrorMsg('Please complete all shipping fields. Ensure 10-digit phone and 6-digit pin.')
                      }
                    }}
                    className="px-6 py-2.5 rounded-btn font-medium text-white text-xs bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md cursor-pointer"
                  >
                    Continue to Review & Pay
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & PAY */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Review & Pay</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Please confirm your items, selected plan, and shipping address before checking out.</p>
                </div>

                {/* Shipping Summary */}
                <div className="bg-[var(--bg-muted)] p-4 rounded-btn text-xs text-[var(--text-secondary)] space-y-1">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1">Shipping Address</h4>
                  <p>{shipping.fullName}</p>
                  <p>{shipping.addressLine1}, {shipping.addressLine2 ? `${shipping.addressLine2}, ` : ''}{shipping.city}, {shipping.state} - {shipping.pincode}</p>
                  <p>Phone: {shipping.phone} | Email: {shipping.email}</p>
                </div>

                {/* Items Summary list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Items In Order</h4>
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs border-b border-[var(--border)] pb-2">
                      <div>
                        <span className="font-medium text-[var(--text-primary)]">{item.productName}</span>{' '}
                        <span className="text-[var(--text-muted)]">({item.material})</span>
                        <p className="text-[10px] text-[var(--text-muted)]">Personalised for: {item.personalisation.title || item.personalisation.name || 'Your Name'}</p>
                      </div>
                      <span className="font-semibold text-[var(--text-primary)]">{item.quantity} × {formatPrice(item.priceInr)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setStep(3)}
                    disabled={loading}
                    className="px-4 py-2 rounded-btn border border-[var(--border)] bg-transparent hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] text-xs flex items-center gap-1 cursor-pointer disabled:opacity-55"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="flex-grow inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-btn font-medium text-white text-xs bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md disabled:opacity-55 cursor-pointer"
                  >
                    <ShieldCheck size={16} />
                    {loading ? 'Processing transaction...' : `Pay ${formatPrice(total)} with Razorpay`}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Column Order summary */}
          <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-4 h-fit lg:sticky lg:top-28">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Pricing Breakdown</h3>
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

              <div className="flex justify-between">
                <span>Digital Profile Plan</span>
                {selectedPlan === 'pro' ? (
                  hasActivePro ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Pro (Active - ₹0)</span>
                  ) : (
                    <span className="font-bold text-purple-600 dark:text-purple-400">Pro (+₹199/month)</span>
                  )
                ) : (
                  <span className="font-medium text-[var(--text-muted)]">Free (₹0)</span>
                )}
              </div>
              
              <hr className="border-[var(--border)] my-2" />

              <div className="flex justify-between font-bold text-sm text-[var(--text-primary)] pt-1">
                <span>Total Amount</span>
                <span className="text-purple-600 dark:text-purple-400 text-base">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-2 rounded bg-emerald-600/5 text-emerald-600 dark:text-emerald-400 text-[10px]">
              <ShieldCheck size={12} className="shrink-0" />
              <span>Direct secure instant order submission</span>
            </div>
          </div>

        </div>

      </div>
    </>
  )
}

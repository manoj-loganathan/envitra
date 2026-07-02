'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowRight, ShoppingBag, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function OrderSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('order')
  const orderNumParam = searchParams?.get('num')

  const [orderNumber, setOrderNumber] = useState(orderNumParam || 'ENV-2026-XXXX')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(!orderNumParam)
  const supabase = createClient()

  useEffect(() => {
    if (!orderId) {
      router.push('/')
      return
    }

    let active = true

    // Defensive timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (active) {
        setLoading(false)
      }
    }, 2500)

    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('order_number, contact_email')
          .eq('id', orderId)
          .single()

        if (data && !error && active) {
          setOrderNumber(data.order_number)
          setEmail(data.contact_email)
        }
      } catch (err) {
        console.error('Error loading order success info:', err)
      }
    }

    const checkUserAndFetch = async () => {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser()
        if (userErr || !user) {
          console.warn('No active user session on success page:', userErr)
        }
        await fetchOrder()
      } catch (err) {
        console.error('Auth verification error on success page:', err)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    checkUserAndFetch()

    const channel = supabase
      .channel(`web-order-success-changes-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        () => {
          if (active) {
            fetchOrder()
          }
        }
      )
      .subscribe()

    return () => {
      active = false
      clearTimeout(timeoutId)
      supabase.removeChannel(channel)
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#3f5ce6]" />
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 animate-fadeIn">
      <div className="w-full max-w-md bg-card border border-border/40 rounded-3xl p-8 shadow-xl text-center space-y-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#3f5ce6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Success Icon */}
        <div className="relative mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shadow-lg">
          <Check size={28} className="stroke-[3]" />
          <div className="absolute inset-0 rounded-full border-2 border-emerald-400/20 animate-ping pointer-events-none scale-105" />
        </div>

        {/* Order Details Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">
            Order Confirmed
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Thank you for your purchase. Your digital business card configuration has been successfully queued for laser engraving.
          </p>
        </div>

        {/* Info card block */}
        <div className="bg-muted/10 border border-border/10 rounded-2xl p-4.5 text-left space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-semibold">Order Reference</span>
            <span className="font-mono font-bold text-foreground bg-muted/20 px-2 py-0.5 rounded border border-border/5">
              {orderNumber}
            </span>
          </div>
          {email && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-muted-foreground font-semibold shrink-0">Confirmation Sent</span>
              <span className="font-bold text-foreground text-right truncate max-w-[200px]" title={email}>
                {email}
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Stepper Bar (Horizontal Minimal) */}
        <div className="py-2">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground/60 font-semibold mb-3 px-1">
            <span className="text-emerald-500 font-bold">Confirmed</span>
            <span>Production</span>
            <span>Transit</span>
            <span>Delivered</span>
          </div>
          {/* Progress bar line */}
          <div className="relative w-full h-[3px] bg-border/20 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 bg-[#3f5ce6] w-[12%] rounded-full shadow-xs" />
          </div>
        </div>

        {/* Action Button Controls */}
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href={`/dashboard/orders?order=${orderId}`}
            className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-black transition-all active:scale-[0.98] cursor-pointer shadow-md select-none"
          >
            Track Order Details <ArrowRight size={13} />
          </Link>
          <Link
            href="/shop"
            className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-border bg-background hover:bg-muted/50 text-foreground text-xs font-bold transition-all active:scale-[0.98] cursor-pointer select-none"
          >
            <ShoppingCart size={13} /> Keep Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#3f5ce6]" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}

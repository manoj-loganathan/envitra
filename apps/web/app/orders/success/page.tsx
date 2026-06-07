'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ChevronRight, Package, Truck, Smile, Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function OrderSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  const orderNumParam = searchParams.get('num')

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
      <div className="mx-auto max-w-7xl px-4 py-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600" />
      </div>
    )
  }

  const timelineSteps = [
    { name: 'Order Confirmed', desc: 'Payment verified successfully.', icon: CheckCircle2, active: true },
    { name: 'In Production', desc: 'Customizing layout and chip.', icon: Package, active: false },
    { name: 'Dispatched', desc: 'Shipped via courier.', icon: Truck, active: false },
    { name: 'Delivered', desc: 'Card tapped & ready!', icon: Smile, active: false },
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-8">
      
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Order confirmed!</h1>
        <p className="text-sm font-semibold font-mono text-purple-600 dark:text-purple-400">{orderNumber}</p>
        {email && (
          <p className="text-xs text-[var(--text-secondary)] flex items-center justify-center gap-1">
            <Inbox size={12} /> A confirmation invoice email has been sent to {email}
          </p>
        )}
      </div>

      <hr className="border-[var(--border)]" />

      {/* Production Timeline Visual */}
      <div className="space-y-4 text-left">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Production & Delivery Status</h3>
        <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 pl-6 space-y-8">
          
          {timelineSteps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.name} className="relative">
                {/* Checkpoint Dot */}
                <span className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-[var(--bg-page)] ${
                  step.active 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-zinc-200 dark:bg-zinc-850 text-zinc-400'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                </span>
                <div>
                  <h4 className={`text-xs sm:text-sm font-semibold ${step.active ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}`}>
                    {step.name}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <hr className="border-[var(--border)]" />

      {/* Bottom actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href={`/orders/${orderId}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-btn font-medium text-white text-xs bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md transition-all duration-200"
        >
          View Order Details <ChevronRight size={14} />
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-btn font-medium text-purple-600 border border-[var(--border-purple)] text-xs hover:bg-purple-600/10 transition-all duration-200"
        >
          Keep Shopping
        </Link>
      </div>

    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}

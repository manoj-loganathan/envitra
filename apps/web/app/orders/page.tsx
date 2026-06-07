'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { ShoppingBag, ChevronRight, Calendar, CreditCard } from 'lucide-react'

export default function OrdersHistoryPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let userId: string | null = null
    let active = true

    // Defensive timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (active) {
        setLoading(false)
      }
    }, 2500)

    const fetchOrders = async (uid: string) => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('account_id', uid)
          .order('created_at', { ascending: false })
        
        if (!error && data && active) {
          setOrders(data)
        }
      } catch (err) {
        console.error('Error fetching order history:', err)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (user && active) {
          userId = user.id
          await fetchOrders(user.id)
        } else if (active) {
          router.push('/login?redirect=/orders')
        }
      } catch (err) {
        console.error('Error checking user:', err)
        if (active) {
          setLoading(false)
        }
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && active) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && active) {
          userId = user.id
          fetchOrders(user.id)
        }
      } else if (!session && active) {
        setLoading(false)
      }
    })

    const channel = supabase
      .channel('web-orders-list-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          const accId = payload.new?.account_id || payload.old?.account_id
          if (userId && accId === userId && active) {
            fetchOrders(userId)
          }
        }
      )
      .subscribe()

    return () => {
      active = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Your Order History</h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Manage your purchased smart cards and track their production/delivery status.</p>
      </div>

      <hr className="border-[var(--border)]" />

      {orders.length === 0 ? (
        <div className="text-center py-16 space-y-4 bg-[var(--bg-surface)] p-8 rounded-card border border-[var(--border)]">
          <div className="w-12 h-12 rounded-full bg-purple-600/10 text-purple-600 flex items-center justify-center mx-auto">
            <ShoppingBag size={20} />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">No orders found</h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
            You haven't ordered any physical Envitra cards yet. Explore our store to design yours.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn font-medium text-white text-xs bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md transition-all duration-200"
          >
            Go to Shop
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order.id}
              className="p-6 rounded-card border border-[var(--border)] bg-[var(--bg-surface)] hover:border-purple-600/30 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm sm:text-base font-mono text-[var(--text-primary)]">{order.order_number}</span>
                  <span className="inline-flex px-2 py-0.5 rounded-full bg-purple-600/10 border border-purple-600/20 text-purple-600 text-[10px] font-semibold uppercase tracking-wider">
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {new Date(order.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard size={12} /> {formatPrice(order.total_inr)}
                  </span>
                </div>
              </div>

              <Link
                href={`/orders/${order.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-btn border border-[var(--border-purple)] text-purple-600 dark:text-purple-400 text-xs font-semibold hover:bg-purple-600/10 transition-all cursor-pointer"
              >
                Track Order <ChevronRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

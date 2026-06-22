import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    const supabase = createClient()

    const startOfToday = new Date()
    startOfToday.setUTCHours(0, 0, 0, 0)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setUTCHours(0, 0, 0, 0)

    // Execute queries in parallel using Promise.all to prevent sequential API round-trips
    const [
      ordersCountRes,
      pendingProdRes,
      pendingPaymentRes,
      inProdOrdersRes,
      dispatchedRes,
      usersFreeRes,
      usersProRes,
      recentRes,
      trendRes,
      billingSchedulesRes
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_production'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_payment'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'in_production'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'dispatched'),
      supabase.from('accounts').select('*', { count: 'exact', head: true }).eq('plan', 'free'),
      supabase.from('accounts').select('*', { count: 'exact', head: true }).in('plan', ['pro', 'business']),
      supabase.from('orders').select('id, shipping_address, order_number, total_inr, created_at, status').order('created_at', { ascending: false }).limit(10),
      supabase.from('orders').select('created_at, total_inr, status, paid_at, dispatched_at, delivered_at').or(`created_at.gte.${sevenDaysAgo.toISOString()},paid_at.gte.${sevenDaysAgo.toISOString()},dispatched_at.gte.${sevenDaysAgo.toISOString()},delivered_at.gte.${sevenDaysAgo.toISOString()}`),
      supabase.from('accounts').select('id, email, full_name, plan, plan_expires_at, nfc_cards(id)').not('plan', 'eq', 'free').order('plan_expires_at', { ascending: true }).limit(4)
    ])

    // Log parallel query failures
    const errors = [
      ordersCountRes.error,
      pendingProdRes.error,
      pendingPaymentRes.error,
      inProdOrdersRes.error,
      dispatchedRes.error,
      usersFreeRes.error,
      usersProRes.error,
      recentRes.error,
      trendRes.error,
      billingSchedulesRes.error
    ].filter(Boolean)

    if (errors.length > 0) {
      console.warn('Dashboard API encountered parallel query errors:', errors.map(e => e?.message))
    }

    const ordersCount = ordersCountRes.count
    const pendingProdCount = pendingProdRes.count
    const pendingPaymentCount = pendingPaymentRes.count
    const inProductionOrdersCount = inProdOrdersRes.count
    const dispatchedCount = dispatchedRes.count
    const usersFree = usersFreeRes.count
    const usersPro = usersProRes.count
    const recent = recentRes.data
    const trendOrders = trendRes.data
    const billingSchedules = billingSchedulesRes.data

    const trendMap = new Map()
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      trendMap.set(dateStr, { date: dateStr, revenue: 0, orders: 0, dispatches: 0, deliveries: 0 })
    }

    if (trendOrders) {
      for (const ord of trendOrders) {
        // Daily orders volume count
        if (ord.created_at) {
          const created = new Date(ord.created_at)
          const dateStr = created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (trendMap.has(dateStr)) {
            const current = trendMap.get(dateStr)
            current.orders += 1
            trendMap.set(dateStr, current)
          }
        }

        // Daily revenue summation
        if (ord.paid_at && ['pending_production', 'in_production', 'dispatched', 'delivered'].includes(ord.status)) {
          const paid = new Date(ord.paid_at)
          const dateStr = paid.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (trendMap.has(dateStr)) {
            const current = trendMap.get(dateStr)
            current.revenue += (ord.total_inr || 0)
            trendMap.set(dateStr, current)
          }
        }

        // Daily dispatches volume count
        if (ord.dispatched_at) {
          const dispatched = new Date(ord.dispatched_at)
          const dateStr = dispatched.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (trendMap.has(dateStr)) {
            const current = trendMap.get(dateStr)
            current.dispatches += 1
            trendMap.set(dateStr, current)
          }
        }

        // Daily deliveries volume count
        if (ord.delivered_at) {
          const delivered = new Date(ord.delivered_at)
          const dateStr = delivered.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (trendMap.has(dateStr)) {
            const current = trendMap.get(dateStr)
            current.deliveries += 1
            trendMap.set(dateStr, current)
          }
        }
      }
    }
    const salesTrend = Array.from(trendMap.values())

    return NextResponse.json({
      ordersCount: ordersCount !== null && ordersCount !== undefined ? ordersCount : 0,
      totalOrders: ordersCount !== null && ordersCount !== undefined ? ordersCount : 0,
      pendingProduction: pendingProdCount !== null && pendingProdCount !== undefined ? pendingProdCount : 0,
      pendingPayment: pendingPaymentCount !== null && pendingPaymentCount !== undefined ? pendingPaymentCount : 0,
      inProductionCount: inProductionOrdersCount !== null && inProductionOrdersCount !== undefined ? inProductionOrdersCount : 0,
      dispatchedCount: dispatchedCount !== null && dispatchedCount !== undefined ? dispatchedCount : 0,
      usersFree: usersFree !== null && usersFree !== undefined ? usersFree : 0,
      usersPro: usersPro !== null && usersPro !== undefined ? usersPro : 0,
      recentOrders: recent || [],
      salesTrend,
      billingSchedules: billingSchedules || []
    })
  } catch (error) {
    console.error('API GET dashboard route handler error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

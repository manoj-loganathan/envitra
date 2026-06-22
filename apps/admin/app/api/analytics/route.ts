import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    const supabase = createClient()

    // 1. Fetch from Views
    const { data: revSummary, error: revErr } = await supabase
      .from('v_revenue_summary')
      .select('*')
      .limit(30)
      
    if (revErr) {
      console.warn('Could not fetch v_revenue_summary:', revErr.message)
    }

    const { data: statusSummary, error: statusErr } = await supabase
      .from('v_order_summary')
      .select('*')

    if (statusErr) {
      console.warn('Could not fetch v_order_summary:', statusErr.message)
    }

    // 2. Fetch User plan aggregates
    const { data: accounts, error: accountsErr } = await supabase
      .from('accounts')
      .select('plan')

    if (accountsErr) {
      console.warn('Error fetching accounts plans for analytics:', accountsErr.message)
    }

    // 3. Fetch NFC Card counts
    const { count: totalCards, error: cardsErr } = await supabase
      .from('nfc_cards')
      .select('*', { count: 'exact', head: true })

    if (cardsErr) {
      console.warn('Error fetching total cards count:', cardsErr.message)
    }

    const { count: activeCards, error: activeCardsErr } = await supabase
      .from('nfc_cards')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    if (activeCardsErr) {
      console.warn('Error fetching active cards count:', activeCardsErr.message)
    }

    // 4. Fetch paid orders total sum
    const { data: paidOrders, error: paidErr } = await supabase
      .from('orders')
      .select('total_inr')
      .in('status', ['pending_production', 'in_production', 'dispatched', 'delivered'])

    if (paidErr) {
      console.warn('Error fetching paid orders:', paidErr.message)
    }

    const totalSum = paidOrders?.reduce((sum, ord) => sum + ord.total_inr, 0) || 0

    return NextResponse.json({
      revSummary: revSummary || [],
      statusSummary: statusSummary || [],
      accountsPlans: accounts || [],
      totalCards: totalCards || 0,
      activeCards: activeCards || 0,
      totalRevenue: totalSum,
    })
  } catch (error: any) {
    console.error('API GET analytics route handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

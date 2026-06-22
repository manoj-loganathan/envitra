import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Fetch all accounts
    const { data: accounts, error: accountsErr } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (accountsErr) {
      console.error('API GET users database error:', accountsErr)
      return NextResponse.json({ error: accountsErr.message }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Aggregate cards and orders count for each user in memory to avoid N+1 query overhead
    const { data: cards, error: cardsErr } = await supabase
      .from('nfc_cards')
      .select('account_id')

    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('account_id')

    const cardCounts: Record<string, number> = {}
    const orderCounts: Record<string, number> = {}

    if (cards) {
      for (const card of cards) {
        if (card.account_id) {
          cardCounts[card.account_id] = (cardCounts[card.account_id] || 0) + 1
        }
      }
    }

    if (orders) {
      for (const order of orders) {
        if (order.account_id) {
          orderCounts[order.account_id] = (orderCounts[order.account_id] || 0) + 1
        }
      }
    }

    const hydratedUsers = accounts.map((u) => {
      const cardCount = cardCounts[u.id] || 0
      const ordCount = orderCounts[u.id] || 0
      return {
        ...u,
        account_type: cardCount > 5 ? 'Company' : 'Individual',
        cards_count: cardCount,
        orders_count: ordCount,
      }
    })

    return NextResponse.json({ users: hydratedUsers })
  } catch (error: any) {
    console.error('API GET users route handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { userId, plan, planExpiresAt } = body

    if (!userId || !plan) {
      return NextResponse.json({ error: 'User ID and plan tier are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('accounts')
      .update({
        plan,
        plan_expires_at: planExpiresAt
      })
      .eq('id', userId)
      .select('*')
      .single()

    if (error) {
      console.error('API PATCH user plan update database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data })
  } catch (error: any) {
    console.error('API PATCH user plan route handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

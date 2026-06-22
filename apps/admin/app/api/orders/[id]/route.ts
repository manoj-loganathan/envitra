import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const supabase = createClient()

    // 1. Fetch Order details
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, accounts(plan)')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      console.error('API GET order details error:', orderErr)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 2. Fetch Order Items
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsErr) {
      console.error('API GET order items error:', itemsErr)
    }

    // 3. Fetch Provisioned Cards
    let provisionedCards = []
    const itemIds = items?.map((item) => item.id) || []
    if (itemIds.length > 0) {
      const { data: cards, error: cardsErr } = await supabase
        .from('nfc_cards')
        .select('*')
        .in('order_item_id', itemIds)
      if (cards) provisionedCards = cards
    }

    return NextResponse.json({
      order,
      items: items || [],
      provisionedCards,
    })
  } catch (error: any) {
    console.error('API GET order details handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const supabase = createClient()
    const body = await request.json()
    const { status, deliveredAt } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        delivered_at: deliveredAt || null,
      })
      .eq('id', orderId)
      .select('*')
      .single()

    if (error) {
      console.error('API PATCH order update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, order: data })
  } catch (error: any) {
    console.error('API PATCH order update handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

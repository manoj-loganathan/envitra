import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('nfc_cards')
      .select('*, account:accounts(email, full_name), order_item:order_items(order:orders(id, order_number))')
      .order('provisioned_at', { ascending: false })

    if (error) {
      console.error('API GET cards database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ cards: data || [] })
  } catch (error: any) {
    console.error('API GET cards route handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { cardId, status } = body

    if (!cardId || !status) {
      return NextResponse.json({ error: 'Card ID and status are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('nfc_cards')
      .update({ status })
      .eq('id', cardId)
      .select('*')
      .single()

    if (error) {
      console.error('API PATCH card status database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, card: data })
  } catch (error: any) {
    console.error('API PATCH card status route handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/service'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(quantity), accounts(plan)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('API GET orders database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const hydratedOrders = (data || []).map((order: any) => {
      const items = order.order_items || []
      const quantity = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
      
      const isProOrder = 
        order.plan_charge_inr > 0 ||
        ((order.accounts?.plan === 'pro' || order.accounts?.plan === 'business') &&
         (!order.accounts?.plan_expires_at || new Date(order.created_at) <= new Date(order.accounts?.plan_expires_at)))
      
      const plan = isProOrder ? 'pro' : 'free'
      
      // Destructure to clean up database join arrays
      const { order_items, accounts, ...rest } = order
      return {
        ...rest,
        quantity,
        plan,
      }
    })

    return NextResponse.json({ orders: hydratedOrders })
  } catch (error: any) {
    console.error('API GET orders handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

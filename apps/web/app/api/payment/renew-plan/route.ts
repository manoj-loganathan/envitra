import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = await request.json()
    const { amountInr } = body

    // Default renewal amount: ₹199 (19900 paise)
    const total = amountInr || 19900

    const orderNumber = `ENV-REN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const invoiceNumber = `INV-REN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    // 1. Insert into orders as a successful plan renewal
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert({
        account_id: session.user.id,
        status: 'delivered', // fulfilled instantly
        order_number: orderNumber,
        total_inr: total,
        subtotal_inr: total,
        gst_inr: 0,
        plan_charge_inr: total,
        shipping_address: { fullName: session.user.email || 'Subscriber', email: session.user.email || '', phone: '' },
        contact_phone: 'N/A',
        contact_email: session.user.email || '',
        invoice_number: invoiceNumber,
        paid_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (orderErr) throw orderErr

    // 2. Fetch current plan details to extend if not yet expired
    const { data: currentAccount } = await supabase
      .from('accounts')
      .select('plan_expires_at')
      .eq('id', session.user.id)
      .single()

    let newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    if (currentAccount && currentAccount.plan_expires_at) {
      const currentExpiry = new Date(currentAccount.plan_expires_at)
      if (currentExpiry > new Date()) {
        newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000) // Extend existing
      }
    }

    // 3. Update account plan status
    const { error: userErr } = await supabase
      .from('accounts')
      .update({
        plan: 'pro',
        plan_expires_at: newExpiry.toISOString(),
      })
      .eq('id', session.user.id)

    if (userErr) throw userErr

    // 4. Create admin notification
    await supabase
      .from('admin_notifications')
      .insert({
        type: 'plan_renewed',
        body: `Plan renewed for account: ${session.user.email}. Invoice: ${invoiceNumber}. Total: ₹${(total / 100).toFixed(2)}`,
      })

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      orderNumber,
      invoiceNumber
    })

  } catch (error: any) {
    console.error('Renew plan order error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

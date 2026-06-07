import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // 1. Fetch Order and Items (service role bypass RLS)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      console.error(orderErr)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify order is pending_production
    if (order.status !== 'pending_production') {
      return NextResponse.json({ error: `Order cannot be provisioned in status: ${order.status}` }, { status: 400 })
    }

    const orderItems = order.order_items || []
    const provisionedCards = []

    // 2. Loop through each item to provision
    for (const item of orderItems) {
      const quantity = item.quantity || 1

      for (let i = 0; i < quantity; i++) {
        // Determine the card slug based on customSlug if provided
        const customSlug = item.personalisation?.customSlug
        let slug = ''
        if (customSlug) {
          const baseSlug = customSlug.trim().toLowerCase()
          const candidate = i === 0 ? baseSlug : `${baseSlug}-${i + 1}`
          
          // Double check database uniqueness to avoid any key constraint conflicts
          const { data: existing } = await supabase
            .from('nfc_cards')
            .select('id')
            .eq('slug', candidate)
            .maybeSingle()
            
          if (existing) {
            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
            slug = `${candidate}-${randomSuffix}`
          } else {
            slug = candidate
          }
        } else {
          slug = Math.random().toString(36).substring(2, 10).toUpperCase()
        }

        const cardUrl = `${process.env.NEXT_PUBLIC_WEB_URL || 'https://envitra.in'}/u/${slug}`

        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(cardUrl)}`

        // Insert into nfc_cards database table
        const { data: nfcCard, error: nfcErr } = await supabase
          .from('nfc_cards')
          .insert({
            order_item_id: item.id,
            account_id: order.account_id,
            slug,
            card_url: cardUrl,
            qr_code_url: qrCodeUrl,
            status: 'provisioned',
            profile_data: {
              name: item.personalisation?.name || '',
              tagline: item.personalisation?.tagline || '',
            },
          })
          .select('*')
          .single()

        if (nfcErr) {
          console.error('Failed to create nfc_card database record:', nfcErr)
        } else if (nfcCard) {
          provisionedCards.push(nfcCard)
        }
      }
    }

    // 3. Update Order status to 'in_production'
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status: 'in_production' })
      .eq('id', orderId)

    if (updateErr) {
      console.error('Failed to update order status to in_production:', updateErr)
    }

    // 4. Insert Admin Notification
    await supabase.from('admin_notifications').insert({
      type: 'card_setup_complete',
      body: `${provisionedCards.length} NFC smart cards successfully provisioned for order ${order.order_number}`,
    })

    return NextResponse.json({
      success: true,
      cards: provisionedCards,
    })

  } catch (error: any) {
    console.error('Provision API route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

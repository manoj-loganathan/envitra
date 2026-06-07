import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { 
      orderId, 
      courierName, 
      trackingNumber, 
      trackingUrl, 
      adminNotes 
    } = body

    if (!orderId || !courierName || !trackingNumber) {
      return NextResponse.json({ error: 'Order ID, Courier Name and Tracking Number are required' }, { status: 400 })
    }

    // Fetch order to get customer email and number
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('order_number, contact_email')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 1. Update Order in database
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'dispatched',
        courier_name: courierName,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl || null,
        admin_notes: adminNotes || null,
        dispatched_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateErr) {
      console.error('Database update error on dispatch:', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // 2. Send dispatch email to customer via Resend
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Envitra Smart Cards <shipping@envitra.in>',
            to: order.contact_email,
            subject: `Your Envitra card is on the way — ${order.order_number}`,
            html: `
              <h1>Your Smart Card Has Been Dispatched!</h1>
              <p>Hi there,</p>
              <p>Great news! Your physical Envitra NFC smart card has finished production and has been handed over to our shipping partner.</p>
              <p><strong>Courier:</strong> ${courierName}</p>
              <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
              ${trackingUrl ? `<p><strong>Track Online:</strong> <a href="${trackingUrl}">${trackingUrl}</a></p>` : ''}
              <br/>
              <h3>Quick setup instructions:</h3>
              <p>1. When the card arrives, simply tap it on the back of your NFC-enabled phone (or scan the printed QR code on the back).</p>
              <p>2. A setup page will open where you can create your password and set up your dynamic contact profile.</p>
              <p>3. Save your profile and share it instantly with others on a single tap!</p>
              <br/>
              <p>Best regards,</p>
              <p>The Envitra Operations Team</p>
            `
          })
        })
      } catch (emailErr) {
        console.error('Failed sending dispatch email via Resend API:', emailErr)
      }
    } else {
      console.warn('RESEND_API_KEY not configured, logging dispatch email template mock details.')
    }

    // 3. Insert Admin Notification
    await supabase.from('admin_notifications').insert({
      type: 'order_dispatched',
      body: `Order ${order.order_number} has been dispatched via ${courierName}. Tracking: ${trackingNumber}`,
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Dispatch API route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

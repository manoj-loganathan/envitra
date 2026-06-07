import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function uploadBase64Image(supabase: any, base64Data: string, userId: string, prefix: string): Promise<string | null> {
  if (!base64Data || !base64Data.startsWith('data:image/')) {
    return base64Data;
  }

  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Data;
    }

    const contentType = matches[1];
    const fileBuffer = Buffer.from(matches[2], 'base64');
    
    // Determine file extension
    let extension = 'png';
    const subType = contentType.split('/')[1] || '';
    if (subType.includes('jpeg') || subType.includes('jpg')) {
      extension = 'jpg';
    } else if (subType.includes('svg')) {
      extension = 'svg';
    } else if (subType.includes('webp')) {
      extension = 'webp';
    } else if (subType.includes('gif')) {
      extension = 'gif';
    }

    const filename = `${userId}/${prefix}-${Date.now()}.${extension}`;

    // Upload to 'order-assets' bucket
    const { data, error } = await supabase.storage
      .from('order-assets')
      .upload(filename, fileBuffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error(`Supabase storage upload error for ${prefix}:`, error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('order-assets')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (err) {
    console.error(`Failed to upload base64 image for ${prefix}:`, err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = await request.json()
    const { cart, plan, shipping } = body

    if (!cart || cart.length === 0 || !shipping) {
      return NextResponse.json({ error: 'Invalid order request' }, { status: 400 })
    }

    // 1. Calculate price in paise
    const subtotal = cart.reduce((sum: number, item: any) => sum + item.priceInr * item.quantity, 0)
    const gst = Math.round(subtotal * 0.18)
    
    let planCharge = 0
    if (plan === 'pro') {
      const { data: accountData } = await supabase
        .from('accounts')
        .select('plan')
        .eq('id', session.user.id)
        .single()
      if (!accountData || accountData.plan !== 'pro') {
        planCharge = 19900 // ₹199
      }
    }
    const total = subtotal + gst + planCharge

    // 2. Generate Order Number & Invoice Number
    let orderNumber = `ENV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    try {
      const { data: generatedNum, error: rpcErr } = await supabase.rpc('generate_order_number')
      if (generatedNum && !rpcErr) {
        orderNumber = generatedNum
      }
    } catch {}

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    // 3. Generate Invoice PDF using backend Express service
    let invoiceUrl = null
    const invoiceGeneratorUrl = process.env.INVOICE_GENERATOR_URL || 'http://localhost:8080/generate-invoice'
    try {
      const originHeader = request.headers.get('origin') || process.env.NEXT_PUBLIC_WEB_URL || 'https://envitra.in'
      const invoiceRes = await fetch(invoiceGeneratorUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': process.env.BACKEND_API_KEY || 'envitra-dev-key'
        },
        body: JSON.stringify({
          order: {
            order_number: orderNumber,
            invoice_number: invoiceNumber,
            created_at: new Date().toISOString(),
            subtotal_inr: subtotal,
            gst_inr: gst,
            plan_charge_inr: planCharge,
            total_inr: total,
            shipping_address: shipping,
            contact_phone: shipping.phone,
            contact_email: shipping.email,
          },
          items: cart,
          userId: session.user.id,
          origin: originHeader,
        }),
      })

      if (invoiceRes.ok) {
        const data = await invoiceRes.json()
        invoiceUrl = data.invoiceUrl
      } else {
        console.error('Invoice service returned error status:', invoiceRes.status)
      }
    } catch (e) {
      console.error('Failed to generate/upload invoice PDF:', e)
    }

    // 4. Insert into public.orders table directly with status = 'pending_production' (paid)
    let orderId = Math.random().toString(36).substring(2, 9) // Mock fallback id

    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert({
        account_id: session.user.id,
        status: 'pending_production', // directly marked paid
        order_number: orderNumber,
        total_inr: total,
        subtotal_inr: subtotal,
        gst_inr: gst,
        plan_charge_inr: planCharge,
        shipping_address: shipping,
        contact_phone: shipping.phone,
        contact_email: shipping.email,
        invoice_number: invoiceNumber,
        invoice_url: invoiceUrl || undefined,
        paid_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (orderErr) {
      console.error('Database insert order error:', orderErr)
    } else if (orderData) {
      orderId = orderData.id
    }

    // 4. Insert order items directly into public.order_items table
    if (orderId && !orderErr) {
      const processedCart = [];
      for (const item of cart) {
        const personalisation = { ...item.personalisation };
        
        const targetLogoUrl = personalisation.logoUrl || personalisation.logoImageUrl;
        if (targetLogoUrl && targetLogoUrl.startsWith('data:image/')) {
          const uploadedLogoUrl = await uploadBase64Image(supabase, targetLogoUrl, session.user.id, 'logo');
          if (uploadedLogoUrl) {
            personalisation.logoUrl = uploadedLogoUrl;
            personalisation.logoImageUrl = uploadedLogoUrl;
          }
        }
        
        const targetBgUrl = personalisation.backgroundUrl || personalisation.backgroundImageUrl;
        if (targetBgUrl && targetBgUrl.startsWith('data:image/')) {
          const uploadedBgUrl = await uploadBase64Image(supabase, targetBgUrl, session.user.id, 'bg');
          if (uploadedBgUrl) {
            personalisation.backgroundUrl = uploadedBgUrl;
            personalisation.backgroundImageUrl = uploadedBgUrl;
          }
        }

        processedCart.push({
          ...item,
          personalisation
        });
      }

      const itemsToInsert = processedCart.map((item: any) => ({
        order_id: orderId,
        product_name: item.productName || 'Envitra Custom Smart Card',
        product_type: item.productType || 'custom',
        material: item.material || 'Matte PVC',
        quantity: item.quantity,
        price_inr: item.priceInr,
        personalisation: item.personalisation,
      }))

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(itemsToInsert)

      if (itemsErr) {
        console.error('Database insert order items error:', itemsErr)
      }
    }

    // 5. Update user plan if Pro was selected
    if (plan === 'pro') {
      const { error: userErr } = await supabase
        .from('accounts')
        .update({
          plan: 'pro',
          plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .eq('id', session.user.id)

      if (userErr) {
        console.error('Failed to update user account plan details:', userErr)
      }
    }

    // 6. Create Admin Notification
    const { error: notifErr } = await supabase
      .from('admin_notifications')
      .insert({
        type: 'new_order',
        body: `New paid order submitted directly! Order ID: ${orderId}. Invoice: ${invoiceNumber}. Total: ₹${(total / 100).toFixed(2)}`,
      })

    if (notifErr) {
      console.error('Failed to create admin notification:', notifErr)
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      invoiceNumber
    })

  } catch (error: any) {
    console.error('Submit order endpoint error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

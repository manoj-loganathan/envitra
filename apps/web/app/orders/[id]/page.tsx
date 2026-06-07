'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, CreditCard, Clock, CheckCircle2, 
  Package, Truck, Smile, FileText, ExternalLink 
} from 'lucide-react'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const supabase = createClient()

  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const handleDownloadInvoice = () => {
    if (order?.invoice_url) {
      window.open(order.invoice_url, '_blank')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    const itemsHtml = items.map((item) => {
      const name = item.product_name || item.productName || (item.card_products?.name) || 'Envitra Custom NFC Card'
      const qty = item.quantity || 1
      const unitPriceVal = (item.price_inr || item.priceInr || 49900) / 100
      const rowTotalVal = unitPriceVal * qty
      
      const pers = item.personalisation || item.personalization || {}
      const materialText = item.material || (item.card_products?.material) || 'Matte PVC'
      const productType = item.product_type || item.productType || ''
      
      // Check upgrades
      const showCustomBg = !!(productType === 'custom' || pers.backgroundUrl || pers.backgroundImageUrl)
      const showLogo = !!(pers.logoUrl || pers.logoImageUrl)
      const showMetal = !!(materialText.toLowerCase().includes('metal') || materialText.toLowerCase().includes('metallic') || materialText.toLowerCase().includes('steel') || materialText.toLowerCase().includes('brass'))

      let slugsText = ''
      const cardsForThisItem = item.nfc_cards || item.cards || []
      if (cardsForThisItem.length > 0) {
        slugsText = cardsForThisItem.map((c: any) => c.slug).filter(Boolean).join(', ')
      }

      return `
        <tr style="border-bottom: 1px solid #f1f5f9; page-break-inside: avoid; break-inside: avoid;">
          <td style="padding: 10px 8px; vertical-align: top;">
            <div style="font-weight: 600; font-size: 13px; color: #0f172a;">${name}</div>
            <div style="margin-top: 6px; font-size: 11px; color: #475569; max-width: 320px; line-height: 1.5;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding: 2px 0;">
                <span>Base Smart Cards (₹499 &times; ${qty})</span>
                <span style="font-weight: 600; color: #0f172a;">₹${(499 * qty).toFixed(2)}</span>
              </div>
              ${showCustomBg ? `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding: 2px 0;">
                <span>Custom Background Upgrades (+₹100 &times; ${qty})</span>
                <span style="font-weight: 600; color: #0f172a;">+₹${(100 * qty).toFixed(2)}</span>
              </div>
              ` : ''}
              ${showLogo ? `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding: 2px 0;">
                <span>Brand Logo Upgrades (+₹50 &times; ${qty})</span>
                <span style="font-weight: 600; color: #0f172a;">+₹${(50 * qty).toFixed(2)}</span>
              </div>
              ` : ''}
              ${showMetal ? `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding: 2px 0;">
                <span>Matte Metallic Upgrades (+₹200 &times; ${qty})</span>
                <span style="font-weight: 600; color: #0f172a;">+₹${(200 * qty).toFixed(2)}</span>
              </div>
              ` : ''}
              ${slugsText ? `
              <div style="margin-top: 6px; font-size: 10px; color: #64748b;">
                <strong>NFC Slugs:</strong> ${slugsText}
              </div>
              ` : ''}
            </div>
          </td>
          <td style="padding: 10px 8px; vertical-align: top; text-align: center; font-size: 12px; color: #334155; font-weight: 500;">${qty}</td>
          <td style="padding: 10px 8px; vertical-align: top; text-align: right; font-size: 12px; color: #334155; font-weight: 500;">₹${unitPriceVal.toFixed(2)}</td>
          <td style="padding: 10px 8px; vertical-align: top; text-align: right; font-size: 12px; color: #0f172a; font-weight: 600;">₹${rowTotalVal.toFixed(2)}</td>
        </tr>
      `
    }).join('')

    const subtotalInr = order.subtotal_inr / 100
    const gstInr = order.gst_inr / 100
    const planInr = order.plan_charge_inr / 100
    const totalInr = order.total_inr / 100

    const deliveryState = (order.shipping_address?.state || '').trim().toLowerCase()
    const isTamilNadu = deliveryState.includes('tamil') || deliveryState.includes('nadu') || deliveryState === 'tn'

    let taxBreakdownRows = ''
    if (isTamilNadu) {
      taxBreakdownRows = `
        <tr>
          <td style="text-align: left; padding: 5px 0; color: #475569;">Central GST (CGST @ 9%)</td>
          <td style="text-align: right; padding: 5px 0; font-weight: 500; color: #0f172a;">₹${(gstInr / 2).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="text-align: left; padding: 5px 0; color: #475569;">State GST (SGST @ 9%)</td>
          <td style="text-align: right; padding: 5px 0; font-weight: 500; color: #0f172a;">₹${(gstInr / 2).toFixed(2)}</td>
        </tr>
      `
    } else {
      taxBreakdownRows = `
        <tr>
          <td style="text-align: left; padding: 5px 0; color: #475569;">Integrated GST (IGST @ 18%)</td>
          <td style="text-align: right; padding: 5px 0; font-weight: 500; color: #0f172a;">₹${gstInr.toFixed(2)}</td>
        </tr>
      `
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.invoice_number || 'Order'}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
            body {
              font-family: 'Outfit', sans-serif;
              margin: 0;
              padding: 20px;
              color: #1f2937;
              background-color: #f8fafc;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .invoice-card {
              max-w: 800px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              background-color: #ffffff;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .avoid-break-block {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              display: inline-block;
              width: 100%;
            }
            @media print {
              body {
                padding: 0;
                background-color: transparent;
              }
              .invoice-card {
                border: none;
                box-shadow: none;
                padding: 0;
                max-width: 100%;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-card">
            
            <div class="no-print" style="margin-bottom: 16px; text-align: right;">
              <button 
                onclick="window.print()" 
                style="padding: 10px 20px; font-family: 'Outfit', sans-serif; background: #7c3aed; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background-color 0.2s;"
                onmouseover="this.style.background='#6d28d9'"
                onmouseout="this.style.background='#7c3aed'"
              >
                Print Invoice / Save as PDF
              </button>
            </div>

            <div class="avoid-break-block">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <img src="${window.location.origin}/logo.png" alt="Envitra Logo" style="height: 44px; width: auto; object-fit: contain;" />
                      <div>
                        <div style="font-size: 26px; font-weight: 800; letter-spacing: -0.04em; color: #0f172a; line-height: 1;">envitra</div>
                        <div style="font-size: 10px; font-weight: 600; color: #64748b; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px;">Smart Business Cards</div>
                      </div>
                    </div>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    <h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.02em;">TAX INVOICE</h1>
                    <div style="font-size: 12px; color: #475569; margin-top: 6px; line-height: 1.6;">
                      <div><strong>Invoice No:</strong> ${order.invoice_number || 'INV-2026-XXXX'}</div>
                      <div><strong>Date:</strong> ${formattedDate}</div>
                      <div><strong>Order ID:</strong> ${order.order_number}</div>
                      <div><strong>Transaction Ref:</strong> ${order.razorpay_payment_id || 'Direct Checkout'}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <div class="avoid-break-block" style="margin-bottom: 16px;">
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #10b981;"></span>
                  <span style="font-size: 11px; font-weight: 600; color: #166534;">Payment Status: FULLY PAID</span>
                </div>
                <div style="font-size: 11px; color: #166534; font-weight: 500;">
                  Verified via Secure Payment Checkout
                </div>
              </div>
            </div>

            <div class="avoid-break-block" style="margin-bottom: 16px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 50%; vertical-align: top; padding-right: 8px;">
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background-color: #f8fafc;">
                      <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px;">Seller Details (Sold By)</div>
                      <div style="font-size: 12px; line-height: 1.5; color: #334155;">
                        <strong style="color: #0f172a;">Envitra Technologies Pvt. Ltd.</strong><br />
                        82, Tek Towers, 4th Floor<br />
                        OMR, Karapakkam, Chennai, TN - 600097<br />
                        Email: billing@envitra.in<br />
                        <strong>GSTIN:</strong> 33AABCE1234F1Z5
                      </div>
                    </div>
                  </td>
                  <td style="width: 50%; vertical-align: top; padding-left: 8px;">
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background-color: #f8fafc;">
                      <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px;">Billing & Shipping To</div>
                      <div style="font-size: 12px; line-height: 1.5; color: #334155;">
                        <strong style="color: #0f172a;">${order.shipping_address?.fullName || 'N/A'}</strong><br />
                        ${order.shipping_address?.addressLine1 || 'N/A'}<br />
                        ${order.shipping_address?.addressLine2 ? `${order.shipping_address.addressLine2}<br />` : ''}
                        ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} - ${order.shipping_address?.pincode || ''}<br />
                        Phone: ${order.contact_phone || 'N/A'}<br />
                        Email: ${order.contact_email || 'N/A'}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <thead>
                <tr style="border-bottom: 2px solid #e2e8f0;">
                  <th style="text-align: left; padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569;">Product Details</th>
                  <th style="text-align: center; padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; width: 10%;">Qty</th>
                  <th style="text-align: right; padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; width: 20%;">Unit Price (excl. GST)</th>
                  <th style="text-align: right; padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; width: 20%;">Total (excl. GST)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="avoid-break-block" style="margin-top: 12px;">
              <table style="width: 340px; margin-left: auto; border-collapse: collapse; font-size: 13px; line-height: 1.8;">
                <tr>
                  <td style="text-align: left; padding: 5px 0; color: #475569;">Cart Subtotal (excl. tax)</td>
                  <td style="text-align: right; padding: 5px 0; font-weight: 500; color: #0f172a;">₹${subtotalInr.toFixed(2)}</td>
                </tr>
                ${taxBreakdownRows}
                ${planInr > 0 ? `
                <tr>
                  <td style="text-align: left; padding: 5px 0; color: #475569;">Pro Profile Upgrade (1 Month)</td>
                  <td style="text-align: right; padding: 5px 0; font-weight: 500; color: #7c3aed;">₹${planInr.toFixed(2)}</td>
                </tr>
                ` : `
                <tr>
                  <td style="text-align: left; padding: 5px 0; color: #475569;">Digital Profile Plan</td>
                  <td style="text-align: right; padding: 5px 0; font-weight: 600; color: #16a34a;">Free (₹0.00)</td>
                </tr>
                `}
                <tr style="border-top: 2px solid #0f172a; font-size: 16px; font-weight: 800;">
                  <td style="text-align: left; padding: 10px 0 0 0; color: #0f172a;">Total Paid Amount</td>
                  <td style="text-align: right; padding: 10px 0 0 0; color: #7c3aed;">₹${totalInr.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div class="avoid-break-block" style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6;">
              <p style="font-weight: 600; margin: 0; color: #334155;">Thank you for choosing Envitra!</p>
              <p style="margin: 4px 0 0 0;">This is a computer-generated tax invoice. No signature is required.</p>
              <p style="font-size: 10px; color: #94a3b8; margin-top: 10px;">Envitra Technologies Pvt. Ltd. · 82, Tek Towers, 4th Floor, OMR, Karapakkam, Chennai, TN - 600097 · billing@envitra.in · envitra.in</p>
            </div>

          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  useEffect(() => {
    let active = true

    // Defensive timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (active) {
        setLoading(false)
      }
    }, 2500)

    const fetchOrderDetails = async () => {
      try {
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (orderErr || !orderData) {
          console.error('Error fetching order details:', orderErr)
          if (active) {
            router.push('/orders')
          }
          return
        }

        if (active) {
          setOrder(orderData)
        }

        const { data: itemsData, error: itemsErr } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId)

        if (!itemsErr && itemsData && active) {
          setItems(itemsData)
        }
      } catch (err) {
        console.error('Error fetching order details:', err)
      }
    }

    const checkUserAndFetch = async () => {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser()
        if (userErr || !user) {
          console.warn('No active user session on details page:', userErr)
          if (active) {
            router.push(`/login?redirect=/orders/${orderId}`)
          }
          return
        }

        await fetchOrderDetails()
      } catch (err) {
        console.error('Auth verification error:', err)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    checkUserAndFetch()

    const channel = supabase
      .channel(`web-order-detail-changes-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        () => {
          if (active) {
            fetchOrderDetails()
          }
        }
      )
      .subscribe()

    return () => {
      active = false
      clearTimeout(timeoutId)
      supabase.removeChannel(channel)
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600" />
      </div>
    )
  }

  if (!order) return null

  // Calculate statuses for tracking step checkpoints
  const statuses = ['pending_payment', 'payment_failed', 'pending_production', 'in_production', 'dispatched', 'delivered']
  const statusIndex = statuses.indexOf(order.status)

  const isConfirmed = statusIndex >= 2
  const isInProduction = statusIndex >= 3
  const isDispatched = statusIndex >= 4
  const isDelivered = statusIndex >= 5

  const timeline = [
    { name: 'Payment Confirmed', active: isConfirmed, desc: 'Verified on ' + (order.paid_at ? new Date(order.paid_at).toLocaleDateString() : 'N/A'), icon: CheckCircle2 },
    { name: 'In Production', active: isInProduction, desc: 'Personalising NFC chip & print visual.', icon: Package },
    { name: 'Dispatched', active: isDispatched, desc: order.courier_name ? `Shipped via ${order.courier_name}` : 'Dispatched to courier.', icon: Truck },
    { name: 'Delivered', active: isDelivered, desc: 'NFC profile activated.', icon: Smile },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header bar back actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-purple-600 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <span className="inline-flex px-3 py-1 rounded-full bg-purple-600/10 border border-purple-600/20 text-purple-600 text-xs font-semibold uppercase tracking-wider">
          {order.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column Detailed items list */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Items In Your Order</h2>
            <div className="space-y-4">
              {items.map((item) => {
                const productName = item.product_name || 'NFC Smart Card'
                const material = item.material || 'Recycled PVC'
                const pers = item.personalisation

                return (
                  <div key={item.id} className="flex gap-4 border-b border-[var(--border)] pb-4 last:border-0 last:pb-0">
                    <div className="w-16 h-10 shrink-0 bg-purple-600/10 border border-purple-600/20 rounded flex items-center justify-center text-[6px] font-bold text-purple-600">
                      NFC
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-sm text-[var(--text-primary)]">{productName}</h4>
                        <span className="font-bold text-sm text-[var(--text-primary)]">{formatPrice(item.price_inr)}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{material} · Qty: {item.quantity}</p>
                      
                      {/* Personalisation details */}
                      <div className="mt-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-muted)] p-2 rounded">
                        <p><span className="font-medium text-[var(--text-primary)]">Name:</span> {pers.name}</p>
                        {pers.tagline && <p><span className="font-medium text-[var(--text-primary)]">Tagline:</span> {pers.tagline}</p>}
                        {pers.colorName && <p><span className="font-medium text-[var(--text-primary)]">Colour:</span> {pers.colorName}</p>}
                        {pers.designName && <p><span className="font-medium text-[var(--text-primary)]">Design:</span> {pers.designName}</p>}
                        {pers.brandName && <p><span className="font-medium text-[var(--text-primary)]">Brand:</span> {pers.brandName}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Production Timeline steps */}
          <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Tracking Updates</h2>
            
            <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-3 pl-6 space-y-6">
              {timeline.map((step) => {
                const Icon = step.icon
                return (
                  <div key={step.name} className="relative">
                    <span className={`absolute -left-[30px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-[var(--bg-surface)] ${
                      step.active 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-zinc-200 dark:bg-zinc-850 text-zinc-400'
                    }`}>
                      <span className="w-1 h-1 rounded-full bg-current" />
                    </span>
                    <div>
                      <h4 className={`text-xs sm:text-sm font-semibold ${step.active ? 'text-purple-600 dark:text-purple-400' : 'text-[var(--text-secondary)]'}`}>
                        {step.name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Courier tracking segment */}
            {order.status === 'dispatched' && order.tracking_number && (
              <div className="mt-4 p-4 rounded-btn border border-[var(--border)] bg-purple-600/5 text-purple-600 dark:text-purple-400 space-y-2 text-xs">
                <p className="font-semibold text-sm">Shipment Courier Dispatched</p>
                <p>Courier Service: <span className="font-bold text-[var(--text-primary)]">{order.courier_name}</span></p>
                <p>Tracking ID: <span className="font-bold text-[var(--text-primary)]">{order.tracking_number}</span></p>
                {order.tracking_url && (
                  <Link 
                    href={order.tracking_url} 
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-semibold hover:underline mt-2 text-purple-700 dark:text-purple-300"
                  >
                    Track shipment online <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Column Shipping info & Invoicing */}
        <div className="space-y-6">
          
          <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Shipping & Invoice Details</h3>
            
            <div className="space-y-3 text-xs text-[var(--text-secondary)]">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Delivery Address</p>
                <p className="mt-1">{order.shipping_address.fullName}</p>
                <p>{order.shipping_address.addressLine1}</p>
                {order.shipping_address.addressLine2 && <p>{order.shipping_address.addressLine2}</p>}
                <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</p>
                <p className="mt-1">Phone: {order.shipping_address.phone}</p>
              </div>

              <hr className="border-[var(--border)]" />

              <div className="flex justify-between">
                <span>Selected Plan</span>
                <span className="font-semibold text-[var(--text-primary)] uppercase">{order.plan_charge_inr > 0 ? 'PRO' : 'FREE'}</span>
              </div>

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal_inr)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>{formatPrice(order.gst_inr)}</span>
              </div>
              {order.plan_charge_inr > 0 && (
                <div className="flex justify-between">
                  <span>Pro Plan Charge</span>
                  <span>{formatPrice(order.plan_charge_inr)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-sm text-[var(--text-primary)] pt-1 border-t border-[var(--border)]">
                <span>Total Billed</span>
                <span>{formatPrice(order.total_inr)}</span>
              </div>
            </div>

            {/* Invoice download link */}
            {order.invoice_number && (
              <button 
                onClick={handleDownloadInvoice}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-btn border border-purple-600/35 text-purple-600 dark:text-purple-400 text-xs font-semibold hover:bg-purple-600/10 transition-colors mt-4 cursor-pointer"
              >
                <FileText size={14} /> Download Invoice PDF
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  )
}

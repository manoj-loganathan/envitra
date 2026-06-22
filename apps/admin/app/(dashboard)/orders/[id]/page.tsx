'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, isDarkColor, cn } from '@/lib/utils'
import { 
  ArrowLeft, Loader2, User, MapPin, CreditCard, 
  Settings, Truck, Check, FileText, Download, RefreshCw,
  Clipboard, ChevronRight, Eye, Sparkles, ChevronDown, AlertCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import JSZip from 'jszip'

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const supabase = createClient()

  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [provisionedCards, setProvisionedCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Provision state
  const [provisioning, setProvisioning] = useState(false)

  // Dispatch state
  const [courierName, setCourierName] = useState('Delhivery')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [dispatching, setDispatching] = useState(false)

  // Delivery status
  const [updatingDelivery, setUpdatingDelivery] = useState(false)

  // Stepper state
  const [adminStep, setAdminStep] = useState(1)
  const [hasInitializedStep, setHasInitializedStep] = useState(false)

  // Step 1 checklist states
  const [chkS1Contact, setChkS1Contact] = useState(false)
  const [chkS1Layout, setChkS1Layout] = useState(false)
  const [chkS1Slugs, setChkS1Slugs] = useState(false)
  const [chkS1Bypass, setChkS1Bypass] = useState(false)

  // Step 2 checklist states
  const [chkS2Visualizer, setChkS2Visualizer] = useState(false)
  const [chkS2Assets, setChkS2Assets] = useState(false)
  const [chkS2Hardware, setChkS2Hardware] = useState(false)
  const [chkS2Scan, setChkS2Scan] = useState(false)

  // Step 3 checklist states
  const [chkS3Quality, setChkS3Quality] = useState(false)
  const [chkS3Pack, setChkS3Pack] = useState(false)
  const [chkS3Handover, setChkS3Handover] = useState(false)
  const [chkS3Delivered, setChkS3Delivered] = useState(false)

  // Post-dispatch edit state
  const [isEditingDispatch, setIsEditingDispatch] = useState(false)
  // Active Card Preview Index for visual inspections
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  // Front / Back side toggler for the live preview
  const [cardSideMap, setCardSideMap] = useState<Record<string, 'front' | 'back'>>({})
  // Selected configuration item for modal details
  const [selectedConfigItem, setSelectedConfigItem] = useState<any>(null)
  // Selected card index map for switching previews when quantity > 1
  const [selectedCardIdxMap, setSelectedCardIdxMap] = useState<Record<string, number>>({})

  const handleDownloadFile = async (url: string, filename: string) => {
    if (!url) return
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Failed to download file:', err)
      window.open(url, '_blank')
    }
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('URL copied to clipboard!')
  }

  const handleDownloadAssetsPack = async (card: any, item: any) => {
    const pers = item.personalisation || {}
    const itemBackgroundUrl = pers.backgroundUrl || pers.backgroundImageUrl
    const itemLogoUrl = pers.logoUrl || pers.logoImageUrl
    
    const itemTitle = pers.title || pers.name || 'N/A'
    const itemTitleFont = pers.titleFont || 'Default'
    const itemTitleSize = pers.titleSize || 'Medium'
    const itemTitleColor = pers.titleColor || 'Auto'

    const itemTagline = pers.tagline || 'N/A'
    const itemTaglineFont = pers.taglineFont || pers.descFont || 'Default'
    const itemTaglineSize = pers.taglineSize || pers.descSize || 'Small'
    const itemTaglineColor = pers.taglineColor || pers.descColor || pers.tagColor || pers.tagcolor || 'Auto'

    const itemLogoPlacement = pers.logoPlacement || pers.logoplacement || 'Top-Left'
    const itemLogoHeight = pers.logoHeight || '32'

    const configText = `Envitra NFC Smart Card Configuration
------------------------------------------
Card Slug: ${card.slug}
Profile Activation Link: ${card.card_url}
Provisioned Date: ${new Date(card.provisioned_at).toLocaleDateString()}
Card Material Finish: ${item.material || 'Premium PVC'}

Personalization Details:
- Name on Card: ${itemTitle} (Font: ${itemTitleFont}, Size: ${itemTitleSize}, Color: ${itemTitleColor})
- Tagline/Description: ${itemTagline} (Font: ${itemTaglineFont}, Size: ${itemTaglineSize}, Color: ${itemTaglineColor})
- Background Theme: ${itemBackgroundUrl ? `Custom Graphic Artwork (Zoom: ${Math.round((pers.bgScale || 1) * 100)}%, X-Pos: ${pers.bgTranslateX || 0}%, Y-Pos: ${pers.bgTranslateY || 0}%)` : `Solid ${pers.colorName || 'Color'} (${pers.colorHex || '#111'})`}
- Brand Logo Overlay: ${itemLogoUrl ? `Yes (Placement: ${itemLogoPlacement} · Height: ${itemLogoHeight}px)` : 'None (Default Envitra Watermark)'}
- Claimed Custom Link: ${pers.customSlug ? `envitra.in/u/${pers.customSlug}` : 'None (System Generated)'}
- Material Option Billed: ${item.material}
- Dynamic Price Value: ${formatPrice(item.price_inr)}
`

    try {
      const zip = new JSZip()
      const folder = zip.folder(`envitra-assets-${card.slug}`)
      folder?.file('configuration.txt', configText)

      const fetchAndAddToZip = async (url: string, filename: string) => {
        try {
          const res = await fetch(url)
          if (!res.ok) throw new Error(`HTTP error ${res.status}`)
          const blob = await res.blob()
          folder?.file(filename, blob)
        } catch (e) {
          console.error(`Failed to pack asset: ${url}`, e)
        }
      }

      // Add QR Code
      if (card.qr_code_url) {
        await fetchAndAddToZip(card.qr_code_url, 'qr_code.png')
      }
      
      // Add Background (if custom)
      if (itemBackgroundUrl) {
        await fetchAndAddToZip(itemBackgroundUrl, 'background.png')
      }

      // Add Logo (custom or default Envitra brand logo)
      if (itemLogoUrl) {
        await fetchAndAddToZip(itemLogoUrl, 'brand_logo.png')
      } else {
        // Include default Envitra brand logo
        const defaultLogoUrl = `${window.location.origin}/default-brand-logo.png`
        await fetchAndAddToZip(defaultLogoUrl, 'default_brand_logo.png')
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const blobUrl = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `envitra-assets-${card.slug}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('JSZip generation failed, falling back to sequential download:', err)
      // Fallback
      if (card.qr_code_url) await handleDownloadFile(card.qr_code_url, `qr-${card.slug}.png`)
      if (itemBackgroundUrl) await handleDownloadFile(itemBackgroundUrl, `bg-${card.slug}.png`)
      if (itemLogoUrl) await handleDownloadFile(itemLogoUrl, `logo-${card.slug}.png`)
      
      // Download text config
      try {
        const blob = new Blob([configText], { type: 'text/plain;charset=utf-8' })
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = `nfc-config-${card.slug}.txt`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      } catch {}
    }
  }

  const handleDownloadAllAssets = async () => {
    if (provisionedCards.length === 0) {
      alert('No cards have been provisioned for this order yet.')
      return
    }

    try {
      const zip = new JSZip()
      const mainFolder = zip.folder(`envitra-order-assets-${order.order_number}`)

      for (const item of items) {
        const cardRecords = provisionedCards.filter((card) => card.order_item_id === item.id)
        
        for (const card of cardRecords) {
          const pers = item.personalisation || {}
          const itemBackgroundUrl = pers.backgroundUrl || pers.backgroundImageUrl
          const itemLogoUrl = pers.logoUrl || pers.logoImageUrl
          
          const itemTitle = pers.title || pers.name || 'N/A'
          const itemTitleFont = pers.titleFont || 'Default'
          const itemTitleSize = pers.titleSize || 'Medium'
          const itemTitleColor = pers.titleColor || 'Auto'

          const itemTagline = pers.tagline || 'N/A'
          const itemTaglineFont = pers.taglineFont || pers.descFont || 'Default'
          const itemTaglineSize = pers.taglineSize || pers.descSize || 'Small'
          const itemTaglineColor = pers.taglineColor || pers.descColor || pers.tagColor || pers.tagcolor || 'Auto'

          const itemLogoPlacement = pers.logoPlacement || pers.logoplacement || 'Top-Left'
          const itemLogoHeight = pers.logoHeight || '32'

          const configText = `Envitra NFC Smart Card Configuration
------------------------------------------
Card Slug: ${card.slug}
Profile Activation Link: ${card.card_url}
Provisioned Date: ${new Date(card.provisioned_at).toLocaleDateString()}
Card Material Finish: ${item.material || 'Premium PVC'}

Personalization Details:
- Name on Card: ${itemTitle} (Font: ${itemTitleFont}, Size: ${itemTitleSize}, Color: ${itemTitleColor})
- Tagline/Description: ${itemTagline} (Font: ${itemTaglineFont}, Size: ${itemTaglineSize}, Color: ${itemTaglineColor})
- Background Theme: ${itemBackgroundUrl ? `Custom Graphic Artwork (Zoom: ${Math.round((pers.bgScale || 1) * 100)}%, X-Pos: ${pers.bgTranslateX || 0}%, Y-Pos: ${pers.bgTranslateY || 0}%)` : `Solid ${pers.colorName || 'Color'} (${pers.colorHex || '#111'})`}
- Brand Logo Overlay: ${itemLogoUrl ? `Yes (Placement: ${itemLogoPlacement} · Height: ${itemLogoHeight}px)` : 'None (Default Envitra Watermark)'}
- Claimed Custom Link: ${pers.customSlug ? `envitra.in/u/${pers.customSlug}` : 'None (System Generated)'}
- Material Option Billed: ${item.material}
- Dynamic Price Value: ${formatPrice(item.price_inr)}
`
          const cardFolder = mainFolder?.folder(`card-${card.slug}`)
          cardFolder?.file('configuration.txt', configText)

          const fetchAndAddToFolder = async (url: string, filename: string) => {
            try {
              const res = await fetch(url)
              if (!res.ok) throw new Error(`HTTP error ${res.status}`)
              const blob = await res.blob()
              cardFolder?.file(filename, blob)
            } catch (e) {
              console.error(`Failed to pack asset: ${url}`, e)
            }
          }

          if (card.qr_code_url) {
            await fetchAndAddToFolder(card.qr_code_url, 'qr_code.png')
          }
          if (itemBackgroundUrl) {
            await fetchAndAddToFolder(itemBackgroundUrl, 'background.png')
          }
          if (itemLogoUrl) {
            await fetchAndAddToFolder(itemLogoUrl, 'brand_logo.png')
          } else {
            // Include default Envitra brand logo when no custom logo was selected
            const defaultLogoUrl = `${window.location.origin}/default-brand-logo.png`
            await fetchAndAddToFolder(defaultLogoUrl, 'default_brand_logo.png')
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const blobUrl = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `envitra-order-assets-${order.order_number}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('JSZip packaging failed:', err)
      alert('Failed to create ZIP package. Downloading individually...')
      for (const item of items) {
        const cardRecords = provisionedCards.filter((card) => card.order_item_id === item.id)
        for (const card of cardRecords) {
          await handleDownloadAssetsPack(card, item)
        }
      }
    }
  }

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
      const name = item.product_name || 'Envitra Custom NFC Card'
      const qty = item.quantity || 1
      const unitPriceVal = (item.price_inr || 49900) / 100
      const rowTotalVal = unitPriceVal * qty
      
      const pers = item.personalisation || item.personalization || {}
      const materialText = item.material || 'Matte PVC'
      const productType = item.product_type || item.productType || ''
      
      // Check upgrades
      const showCustomBg = !!(productType === 'custom' || pers.backgroundUrl || pers.backgroundImageUrl)
      const showLogo = !!(pers.logoUrl || pers.logoImageUrl)
      const showMetal = !!(materialText.toLowerCase().includes('metal') || materialText.toLowerCase().includes('metallic') || materialText.toLowerCase().includes('steel') || materialText.toLowerCase().includes('brass'))

      let slugsText = ''
      const cardsForThisItem = (provisionedCards || []).filter((c: any) => c.order_item_id === item.id)
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
                ` : isProOrder ? `
                <tr>
                  <td style="text-align: left; padding: 5px 0; color: #475569;">Pro Profile Plan</td>
                  <td style="text-align: right; padding: 5px 0; font-weight: 600; color: #16a34a;">Active (Included)</td>
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

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.order) {
          setOrder(data.order)
          setItems(data.items || [])
          setProvisionedCards(data.provisionedCards || [])
          return
        }
      }
      setOrder(null)
      setItems([])
      setProvisionedCards([])
    } catch (err) {
      console.error(err)
      setOrder(null)
      setItems([])
      setProvisionedCards([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    // Defensive timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (active) {
        setLoading(false)
      }
    }, 2500)

    const fetchDetailsSafe = async () => {
      if (active) {
        await fetchOrderDetails()
      }
    }
    fetchDetailsSafe()

    // Realtime channel for order updates
    const orderChannel = supabase
      .channel(`admin-order-detail-changes-${orderId}`)
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

    // Realtime channel for nfc_cards updates (helps when provisioning is running)
    const cardsChannel = supabase
      .channel(`admin-order-cards-changes-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'nfc_cards' },
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
      supabase.removeChannel(orderChannel)
      supabase.removeChannel(cardsChannel)
    }
  }, [orderId])

  useEffect(() => {
    if (order && !hasInitializedStep) {
      const status = order.status
      if (status === 'pending_payment') {
        setAdminStep(1)
      } else if (status === 'pending_production' || status === 'in_production') {
        setAdminStep(2)
      } else if (status === 'dispatched' || status === 'delivered') {
        setAdminStep(3)
      }
      setHasInitializedStep(true)
    }
  }, [order, hasInitializedStep])

  const getAutoTrackingUrl = (courier: string, trackingNum: string): string => {
    const cleanNum = trackingNum.trim()
    if (!cleanNum) return ''
    switch (courier) {
      case 'Delhivery':
        return `https://track.delhivery.com/query?key=${cleanNum}`
      case 'DTDC':
        return `https://www.dtdc.in/tracking/tracking_results.asp?pinno=${cleanNum}`
      case 'Blue Dart':
        return `https://www.bluedart.com/tracking?trackid=${cleanNum}`
      case 'Ekart':
        return `https://ekartlogistics.com/track/${cleanNum}`
      case 'India Post':
        return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?ConsignmentNo=${cleanNum}`
      default:
        return ''
    }
  }

  const handleTrackingNumberChange = (num: string) => {
    setTrackingNumber(num)
    const autoUrl = getAutoTrackingUrl(courierName, num)
    setTrackingUrl(autoUrl)
  }

  const handleCourierSelect = (courier: string) => {
    setCourierName(courier)
    const autoUrl = getAutoTrackingUrl(courier, trackingNumber)
    setTrackingUrl(autoUrl)
  }

  const startEditingDispatch = () => {
    if (order) {
      setCourierName(order.courier_name || 'Delhivery')
      setTrackingNumber(order.tracking_number || '')
      setTrackingUrl(order.tracking_url || '')
      setAdminNotes(order.admin_notes || '')
      setIsEditingDispatch(true)
    }
  }

  // Handles provisioning card numbers & URLs & QR codes
  const handleProvision = async () => {
    setProvisioning(true)
    try {
      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      if (!res.ok) {
        let errMsg = 'Provisioning failed'
        try {
          const errData = await res.json()
          if (errData && errData.error) errMsg = errData.error
        } catch {}
        throw new Error(errMsg)
      }
      
      await fetchOrderDetails()
      alert('Cards successfully provisioned and slugs/QR codes generated!')
    } catch (err: any) {
      console.error('Provision failed:', err)
      alert(`Provision failed: ${err?.message || err}. Falling back to offline simulation...`)
      
      // Mock Fallback offline flow
      const mockCards: any[] = []
      items.forEach((item) => {
        const quantity = item.quantity || 1
        const customSlugs = item.personalisation?.customSlugs || []
        const fallbackCustomSlug = item.personalisation?.customSlug
        
        for (let i = 0; i < quantity; i++) {
          let slug = ''
          if (customSlugs[i]) {
            slug = customSlugs[i].trim().toLowerCase()
          } else if (fallbackCustomSlug) {
            const baseSlug = fallbackCustomSlug.trim().toLowerCase()
            slug = i === 0 ? baseSlug : `${baseSlug}-${i + 1}`
          } else {
            slug = Math.random().toString(36).substring(2, 10).toUpperCase()
          }
          
          mockCards.push({
            id: 'card-' + slug,
            order_item_id: item.id,
            slug,
            card_url: `https://envitra.in/u/${slug}`,
            qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https://envitra.in/u/${slug}`,
            status: 'provisioned',
            provisioned_at: new Date().toISOString(),
          })
        }
      })
      setProvisionedCards(mockCards)
      setOrder((prev: any) => ({ ...prev, status: 'in_production' }))
    } finally {
      setProvisioning(false)
    }
  }

  const handleProceedToProduction = async () => {
    if (order && order.status === 'pending_payment') {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'pending_production' }),
        })
        if (!res.ok) throw new Error('Failed to update status')
        await fetchOrderDetails()
      } catch (err) {
        console.error(err)
        setOrder((prev: any) => ({ ...prev, status: 'pending_production' }))
      }
    }
    setAdminStep(2)
  }

  const handleContinueToStep3 = async () => {
    if (order && order.status === 'pending_production') {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_production' }),
        })
        if (!res.ok) throw new Error('Failed to update status')
        await fetchOrderDetails()
      } catch (err) {
        console.error(err)
        setOrder((prev: any) => ({ ...prev, status: 'in_production' }))
      }
    }
    setAdminStep(3)
  }

  // Handles dispatch tracking updates
  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber.trim()) {
      alert('Please fill out a tracking ID.')
      return
    }

    setDispatching(true)
    try {
      const res = await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          courierName,
          trackingNumber,
          trackingUrl,
          adminNotes,
        }),
      })

      if (!res.ok) throw new Error('Dispatch request failed')

      await fetchOrderDetails()
      alert(isEditingDispatch ? 'Tracking details successfully updated!' : 'Order successfully marked as dispatched!')
      setIsEditingDispatch(false)
    } catch {
      setOrder((prev: any) => ({
        ...prev,
        status: 'dispatched',
        courier_name: courierName,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl || null,
        admin_notes: adminNotes || null,
        dispatched_at: new Date().toISOString(),
      }))
      alert(isEditingDispatch ? 'Mock Update Success: Order updated offline.' : 'Mock Dispatch Success: Order updated offline.')
      setIsEditingDispatch(false)
    } finally {
      setDispatching(false)
    }
  }

  // Handles delivery updates
  const handleMarkDelivered = async () => {
    const confirm = window.confirm('Are you sure you want to mark this package as delivered? This will finalize the order timeline.')
    if (!confirm) return

    setUpdatingDelivery(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status on server')
      }

      await fetchOrderDetails()
      alert('Order successfully marked as delivered!')
    } catch (err) {
      console.error(err)
      setOrder((prev: any) => ({
        ...prev,
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      }))
      alert('Mock Delivery Success: Order updated offline.')
    } finally {
      setUpdatingDelivery(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-fadeIn">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-8 max-w-md w-full text-center shadow-lg backdrop-blur-md">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Order Not Found</h2>
          <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
            The order with ID <span className="font-mono bg-[var(--bg-muted)] px-1.5 py-0.5 rounded border border-[var(--border)]">{orderId}</span> could not be found or has been removed from the system.
          </p>
          <button
            onClick={() => router.push('/orders')}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-btn font-semibold text-white text-xs bg-blue-600 hover:bg-blue-700 shadow-sm transition-all duration-200 cursor-pointer w-full"
          >
            <ArrowLeft size={14} /> Back to Orders
          </button>
        </div>
      </div>
    )
  }

  // Compute pricing breakdown for display in Step 1
  const getAdminPricingBreakdown = () => {
    let baseCardsTotal = 0
    let metallicUpgradesTotal = 0
    let customBgUpgradesTotal = 0
    let logoUpgradesTotal = 0
    let totalQty = 0
    let metallicQty = 0
    let customBgQty = 0
    let logoQty = 0

    items.forEach((item) => {
      const qty = item.quantity || 1
      totalQty += qty
      baseCardsTotal += 49900 * qty

      if (item.material && item.material.includes('Metallic')) {
        metallicQty += qty
        metallicUpgradesTotal += 20000 * qty
      }
      const pers = item.personalisation || {}
      if (item.product_type === 'custom' || pers.backgroundUrl || pers.backgroundImageUrl) {
        customBgQty += qty
        customBgUpgradesTotal += 10000 * qty
      }
      if (pers.logoUrl || pers.logoImageUrl) {
        logoQty += qty
        logoUpgradesTotal += 5000 * qty
      }
    })

    return {
      totalQty,
      baseCardsTotal,
      metallicQty,
      metallicUpgradesTotal,
      customBgQty,
      customBgUpgradesTotal,
      logoQty,
      logoUpgradesTotal,
    }
  }

  const isProOrder = 
    order?.plan_charge_inr > 0 ||
    ((order?.accounts?.plan === 'pro' || order?.accounts?.plan === 'business') &&
     (!order?.accounts?.plan_expires_at || new Date(order?.created_at) <= new Date(order?.accounts?.plan_expires_at)))

  const breakdown = getAdminPricingBreakdown()

  const getFontDisplayName = (fontKey: string | undefined) => {
    const cleanKey = fontKey || 'font-sans'
    switch (cleanKey) {
      case 'font-sans':
        return 'Modern Sans (Default)'
      case 'font-outfit':
        return 'Outfit'
      case 'font-poppins':
        return 'Poppins'
      case 'font-mono':
        return 'Tech Mono'
      case 'font-display':
        return 'Brand Display'
      default:
        return cleanKey.replace('font-', '') + ' (Default)'
    }
  }

  return (
    <div className="space-y-8">
      
      {/* Stepper progress bar at the top */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[var(--border)] pb-4">
        <button 
          onClick={() => router.push('/orders')}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-purple-600 cursor-pointer font-semibold"
        >
          <ArrowLeft size={14} /> Back to Orders
        </button>
        
        <div className="flex items-center gap-2 sm:gap-4 bg-[var(--bg-surface)] px-4 py-2 rounded-xl border border-[var(--border)] shadow-sm select-none">
          {[
            { stepNum: 1, title: '1. Order Review' },
            { stepNum: 2, title: '2. Print & Production' },
            { stepNum: 3, title: '3. Dispatch & Shipping' }
          ].map((s) => {
            const isActive = adminStep === s.stepNum
            const isCompleted = adminStep > s.stepNum
            return (
              <button
                key={s.stepNum}
                onClick={() => setAdminStep(s.stepNum)}
                className={`text-xs font-bold pb-1 border-b-2 transition-all cursor-pointer ${
                  isActive 
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold' 
                    : isCompleted 
                    ? 'border-emerald-500 text-emerald-500' 
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {s.title}
              </button>
            )
          })}
        </div>

        <span className="inline-flex px-3 py-1 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-600 text-xs font-semibold uppercase tracking-wider">
          {order.status.replace('_', ' ')}
        </span>
      </div>

      {/* STEP 1: ORDER & PAYMENT REVIEW */}
      {adminStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
          {/* Left Columns - Billing Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer Details */}
            <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
                <User size={14} /> Customer Profile
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-[var(--text-muted)] font-medium">Customer Name</p>
                  <p className="font-bold text-sm text-[var(--text-primary)]">{order.shipping_address?.fullName || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[var(--text-muted)] font-medium">Contact Email</p>
                  <p className="font-semibold text-[var(--text-primary)]">{order.contact_email || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[var(--text-muted)] font-medium">Contact Phone</p>
                  <p className="font-semibold text-[var(--text-primary)]">{order.contact_phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[var(--text-muted)] font-medium">Selected Digital Plan</p>
                  <p className="font-bold text-blue-600 dark:text-blue-400 capitalize">
                    {isProOrder
                      ? `PRO PLAN ${order.plan_charge_inr > 0 ? '(₹199/mo Billed)' : '(Active Complimentary)'}`
                      : 'FREE PLAN'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
                <CreditCard size={14} /> Payment & Billing Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1.5">
                  <p className="text-[var(--text-muted)] font-medium">Order Number</p>
                  <p className="font-bold text-[var(--text-primary)] font-mono">{order.order_number}</p>
                  <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-2">
                    Invoice: {order.invoice_number || 'N/A'}
                    {order.invoice_number && (
                      <button 
                        onClick={handleDownloadInvoice}
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5 ml-2"
                      >
                        Print/Save PDF
                      </button>
                    )}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[var(--text-muted)] font-medium">Transaction & Status</p>
                  <p className="font-medium text-[var(--text-primary)]">
                    Payment Gateway Status: <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">PAID</span>
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono">ID: {order.razorpay_payment_id || 'Direct Checkout Bypassed'}</p>
                </div>
              </div>
            </div>

            {/* Items Summary list */}
            <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
                <FileText size={14} /> Items In Order
              </h3>
              
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                    <div>
                      <span className="font-semibold text-[var(--text-primary)]">{item.product_name || 'Envitra Custom NFC Card'}</span>{' '}
                      <span className="text-[var(--text-muted)]">({item.material || 'Standard PVC'})</span>
                      <p className="text-[10px] text-[var(--text-muted)]">Personalised for: <strong className="text-[var(--text-primary)]">{item.personalisation?.title || item.personalisation?.name || 'N/A'}</strong></p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-[var(--text-primary)]">{item.quantity} × {formatPrice(item.price_inr)}</span>
                      <button
                        onClick={() => setSelectedConfigItem(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-bold text-[10px] cursor-pointer transition-colors"
                      >
                        View Card Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column - Billing breakdown */}
          <div className="space-y-6">
            <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-4 h-fit">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Pricing Breakdown</h3>
              <div className="space-y-3 text-xs text-[var(--text-secondary)]">
                <div className="flex justify-between font-medium">
                  <span>Base Smart Cards (₹499 × {breakdown.totalQty})</span>
                  <span className="text-[var(--text-primary)]">{formatPrice(breakdown.baseCardsTotal)}</span>
                </div>

                {(breakdown.metallicQty > 0 || breakdown.customBgQty > 0 || breakdown.logoQty > 0) && (
                  <div className="space-y-1.5 pl-2 border-l border-[var(--border)] py-1 text-[11px]">
                    {breakdown.metallicQty > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Matte Metallic Upgrades (+₹200 × {breakdown.metallicQty})</span>
                        <span>+{formatPrice(breakdown.metallicUpgradesTotal)}</span>
                      </div>
                    )}
                    {breakdown.customBgQty > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Custom Background Upgrades (+₹100 × {breakdown.customBgQty})</span>
                        <span>+{formatPrice(breakdown.customBgUpgradesTotal)}</span>
                      </div>
                    )}
                    {breakdown.logoQty > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Brand Logo Upgrades (+₹50 × {breakdown.logoQty})</span>
                        <span>+{formatPrice(breakdown.logoUpgradesTotal)}</span>
                      </div>
                    )}
                  </div>
                )}

                <hr className="border-[var(--border)]" />

                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="font-medium text-[var(--text-primary)]">{formatPrice(order.subtotal_inr)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span className="font-medium text-[var(--text-primary)]">{formatPrice(order.gst_inr)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Digital Profile Plan</span>
                  {isProOrder ? (
                    order.plan_charge_inr > 0 ? (
                      <span className="font-bold text-blue-600 dark:text-blue-400">Pro (+{formatPrice(order.plan_charge_inr)})</span>
                    ) : (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Pro (Active - ₹0)</span>
                    )
                  ) : (
                    <span className="font-medium text-[var(--text-muted)]">Free (₹0)</span>
                  )}
                </div>
                
                <hr className="border-[var(--border)] my-2" />

                <div className="flex justify-between font-bold text-sm text-[var(--text-primary)] pt-1">
                  <span>Total Amount Paid</span>
                  <span className="text-blue-600 dark:text-blue-400 text-base">{formatPrice(order.total_inr)}</span>
                </div>
              </div>

              <button
                onClick={() => setAdminStep(2)}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-btn font-semibold text-white text-xs bg-blue-600 hover:bg-blue-700 shadow-sm transition-all duration-200 cursor-pointer"
              >
                Proceed to Production <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PRINT & PRODUCTION */}
      {adminStep === 2 && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Card Provisioning Alert block */}
          {provisionedCards.length === 0 && (
            <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-amber-500/40 ring-1 ring-amber-500/10 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Settings size={14} className="animate-spin" /> Provision Smart Cards Required
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Unique NFC URLs, print envelopes, and custom QR codes have not been generated yet. Click the button below to provision URLs and move the order into production.
              </p>
              
              <button
                onClick={handleProvision}
                disabled={provisioning}
                className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-btn font-semibold text-white text-xs bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-55 cursor-pointer"
              >
                {provisioning ? 'Provisioning Slugs...' : 'Provision Cards & Generate QRs'}
              </button>
            </div>
          )}

          {provisionedCards.length > 0 && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Order Customisations Details & Live Previews
                </h3>
                <button 
                  onClick={handleDownloadAllAssets}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
                >
                  <Download size={14} /> Download All Print Files
                </button>
              </div>

              <div className="space-y-8">
                {items.map((item) => {
                  const productName = item.product_name || 'Envitra Smart Card'
                  const material = item.material || 'Matte PVC'
                  const pers = item.personalisation || {}

                  const itemTitle = pers.title || pers.name || 'Your Name'
                  const itemTagline = pers.tagline || 'Short description'
                  const itemLogoUrl = pers.logoUrl || pers.logoImageUrl
                  const itemLogoPlacement = pers.logoPlacement || pers.logoplacement || 'top-left'
                  const itemLogoHeight = pers.logoHeight || 32
                  
                  const itemTitleColor = pers.titleColor
                  const itemTitleFont = pers.titleFont || 'font-sans'
                  const itemTitleSize = pers.titleSize || 'text-base'

                  const itemTaglineColor = pers.taglineColor || pers.descColor || pers.tagColor || pers.tagcolor
                  const itemTaglineFont = pers.taglineFont || pers.descFont || 'font-sans'
                  const itemTaglineSize = pers.taglineSize || pers.descSize || 'text-xs'

                  const isSolid = item.product_type === 'solid_color' || !pers.backgroundUrl
                  const bgHex = pers.colorHex || '#111'
                  const itemBackgroundUrl = pers.backgroundUrl || pers.backgroundImageUrl

                  let cardBgStyle: React.CSSProperties = {}
                  let isCardDark = true

                  if (isSolid) {
                    cardBgStyle = { backgroundColor: bgHex }
                    isCardDark = isDarkColor(bgHex)
                  } else {
                    cardBgStyle = { backgroundColor: '#18181B' }
                    isCardDark = true
                  }

                  const cardTextColor = isCardDark ? 'text-white' : 'text-zinc-950'
                  const cardSubColor = isCardDark ? 'text-zinc-300' : 'text-zinc-600'
                  const cardBorderColor = isCardDark ? 'border-white/10' : 'border-black/10'

                  // Find cards provisioned for this order item
                  const cardRecords = provisionedCards.filter((card) => card.order_item_id === item.id)
                  const activeCardIdx = selectedCardIdxMap[item.id] || 0
                  const activeCard = cardRecords[activeCardIdx] || cardRecords[0]

                  return (
                    <div key={item.id} className="p-6 rounded-card border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm space-y-6">
                      <div className="flex flex-col xl:flex-row gap-8 items-start">
                        
                        {/* 1. Visual Card Preview Column */}
                        <div className="flex flex-col items-center shrink-0 w-full md:w-[360px] mx-auto xl:mx-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Live Visualizer</span>
                          
                          {/* Card Switcher tabs if quantity > 1 */}
                          {cardRecords.length > 1 && (
                            <div className="flex flex-wrap gap-1 mt-1 mb-3 bg-[var(--bg-muted)] p-1 rounded-lg border border-[var(--border)] shrink-0 select-none w-full justify-center">
                              {cardRecords.map((card, idx) => {
                                const isCurrent = (selectedCardIdxMap[item.id] || 0) === idx
                                return (
                                  <button
                                    key={card.id}
                                    type="button"
                                    onClick={() => setSelectedCardIdxMap(prev => ({ ...prev, [item.id]: idx }))}
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                                      isCurrent
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                                  >
                                    Card {idx + 1}
                                  </button>
                                )
                              })}
                            </div>
                          )}

                          {/* Card Toggler */}
                          <div className="flex gap-2 mb-3 bg-[var(--bg-muted)] p-1 rounded-lg border border-[var(--border)] shrink-0 select-none">
                            {['front', 'back'].map((side) => {
                              const currentSide = cardSideMap[item.id] || 'front'
                              return (
                                <button
                                  key={side}
                                  type="button"
                                  onClick={() => setCardSideMap(prev => ({ ...prev, [item.id]: side as any }))}
                                  className={`px-3 py-1 rounded-md text-[10px] font-bold capitalize transition-all cursor-pointer ${
                                    currentSide === side
                                      ? 'bg-blue-600 text-white shadow-sm'
                                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                  }`}
                                >
                                  {side} side
                                </button>
                              )
                            })}
                          </div>

                          {/* Render styled NFC Card */}
                          <div className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-lg select-none">
                            <div 
                              className={`w-full h-full p-6 flex flex-col justify-between overflow-hidden relative border ${cardBorderColor}`}
                              style={cardBgStyle}
                            >
                              {/* Background image if custom, with correct scale/translate */}
                              {!isSolid && itemBackgroundUrl && (
                                <div 
                                  className="absolute inset-0 pointer-events-none"
                                  style={{
                                    backgroundImage: `url(${itemBackgroundUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    transform: `scale(${pers.bgScale || 1}) translate(${pers.bgTranslateX || 0}%, ${pers.bgTranslateY || 0}%)`,
                                  }}
                                />
                              )}
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.12)_0%,transparent_60%)] pointer-events-none" />
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.06)_0%,transparent_50%)] pointer-events-none" />
                              <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.3)_0%,rgba(0,0,0,0.2)_100%)]" />
                              {item.material && item.material.includes('Metallic') && (
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_40%,rgba(0,0,0,0.22)_60%,rgba(255,255,255,0.18)_100%)] mix-blend-overlay pointer-events-none z-10 animate-pulse" />
                              )}

                              {(cardSideMap[item.id] || 'front') === 'front' ? (
                                <>
                                  {/* Front side logo */}
                                  {itemLogoUrl && itemLogoPlacement === 'center' && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                      <img 
                                        src={itemLogoUrl} 
                                        alt="Logo" 
                                        className="max-w-[160px] object-contain"
                                        style={{ height: `${itemLogoHeight}px`, width: 'auto' }}
                                      />
                                    </div>
                                  )}

                                  <div className="relative z-10 flex justify-between items-start w-full">
                                    <div className="flex items-start">
                                      {itemLogoUrl ? (
                                        (itemLogoPlacement === 'top-left') ? (
                                          <img 
                                            src={itemLogoUrl} 
                                            alt="Logo" 
                                            className="max-w-[120px] object-contain"
                                            style={{ height: `${itemLogoHeight}px`, width: 'auto' }}
                                          />
                                        ) : null
                                      ) : (
                                        <img 
                                          src="/default-brand-logo.png" 
                                          alt="Logo" 
                                          className="h-20 max-w-[180px] object-contain -mt-5 -ml-5"
                                          style={{ height: '80px' }}
                                        />
                                      )}
                                    </div>
                                    <div className={isCardDark ? 'text-white/80' : 'text-zinc-800'}>
                                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                        <path d="M12 2a10 10 0 0 1 10 10" />
                                        <path d="M12 6a6 6 0 0 1 6 6" />
                                        <circle cx="12" cy="12" r="2" />
                                      </svg>
                                    </div>
                                  </div>

                                  <div className="relative z-10 w-full mt-auto">
                                    <div className="text-left max-w-[85%]">
                                      <h3 
                                        style={itemTitleColor ? { color: itemTitleColor } : undefined}
                                        className={`${itemTitleFont === 'font-display' ? 'font-sans font-extrabold uppercase tracking-wider' : itemTitleFont} ${
                                          itemTitleSize === 'text-sm' ? 'text-xs sm:text-sm' :
                                          itemTitleSize === 'text-base' ? 'text-base sm:text-lg' :
                                          itemTitleSize === 'text-lg' ? 'text-lg sm:text-xl' :
                                          'text-xl sm:text-2xl'
                                        } font-black tracking-wide leading-tight truncate ${!itemTitleColor ? cardTextColor : ''}`}
                                      >
                                        {itemTitle}
                                      </h3>
                                      <p 
                                        style={itemTaglineColor ? { color: itemTaglineColor } : undefined}
                                        className={`${itemTaglineFont === 'font-display' ? 'font-sans font-extrabold uppercase tracking-wider' : itemTaglineFont} ${
                                          itemTaglineSize === 'text-[10px]' ? 'text-[8px] sm:text-[9px]' :
                                          itemTaglineSize === 'text-xs' ? 'text-[9px] sm:text-xs' :
                                          itemTaglineSize === 'text-sm' ? 'text-xs sm:text-sm' :
                                          'text-sm sm:text-base'
                                        } font-medium tracking-wide leading-relaxed mt-1 line-clamp-2 whitespace-normal break-words ${!itemTaglineColor ? cardSubColor : ''}`}
                                      >
                                        {itemTagline}
                                      </p>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                // Back Side
                                <div className="absolute inset-0 p-4 flex flex-col justify-between items-center w-full h-full z-10">
                                  <div className="h-6 w-full" />
                                  <div className="flex flex-col items-center justify-center my-auto">
                                    <div className="p-2 bg-white rounded-xl shadow-md">
                                      {activeCard && activeCard.qr_code_url ? (
                                        <img 
                                          src={activeCard.qr_code_url} 
                                          alt="QR Code" 
                                          className="w-16 h-16 object-contain"
                                        />
                                      ) : (
                                        <svg className="w-16 h-16 text-zinc-950" viewBox="0 0 29 29" fill="currentColor">
                                          <rect x="0" y="0" width="7" height="7" />
                                          <rect x="1" y="1" width="5" height="5" fill="white" />
                                          <rect x="2" y="2" width="3" height="3" />
                                          <rect x="22" y="0" width="7" height="7" />
                                          <rect x="23" y="1" width="5" height="5" fill="white" />
                                          <rect x="24" y="2" width="3" height="3" />
                                          <rect x="0" y="22" width="7" height="7" />
                                          <rect x="1" y="23" width="5" height="5" fill="white" />
                                          <rect x="2" y="24" width="3" height="3" />
                                          <rect x="20" y="20" width="5" height="5" />
                                          <rect x="21" y="21" width="3" height="3" fill="white" />
                                          <rect x="22" y="22" width="1" height="1" />
                                        </svg>
                                      )}
                                    </div>
                                    <span className={`text-[7px] font-extrabold tracking-widest mt-1.5 uppercase ${cardSubColor} opacity-60`}>Scan Profile</span>
                                  </div>
                                  <div className="w-full flex justify-end mt-auto">
                                    <span className={`text-[7px] font-medium tracking-wide ${cardSubColor} opacity-75`}>
                                      powered by <span className="font-extrabold">envitra.in</span>
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 2. Customization Details Metadata */}
                        <div className="flex-grow space-y-4 w-full">
                          <div>
                            <h4 className="font-bold text-sm text-[var(--text-primary)]">{productName}</h4>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{material} · Qty: {item.quantity}</p>
                          </div>

                          <div className="bg-[var(--bg-muted)] p-4 rounded-xl text-xs text-[var(--text-secondary)] grid grid-cols-1 sm:grid-cols-2 gap-4 border border-[var(--border)]">
                            <div>
                              <h5 className="font-bold text-[var(--text-primary)] uppercase text-[9px] tracking-wider mb-1">Typography</h5>
                              <p className="mt-1"><span className="text-[var(--text-muted)]">Title Font:</span> <span className="font-semibold">{getFontDisplayName(itemTitleFont)}</span></p>
                              <p><span className="text-[var(--text-muted)]">Title Size:</span> <span className="font-semibold">{itemTitleSize}</span></p>
                              <p><span className="text-[var(--text-muted)]">Title Color:</span> <span className="font-semibold">{itemTitleColor}</span></p>
                              
                              <p className="mt-2"><span className="text-[var(--text-muted)]">Tagline Font:</span> <span className="font-semibold">{getFontDisplayName(itemTaglineFont)}</span></p>
                              <p><span className="text-[var(--text-muted)]">Tagline Size:</span> <span className="font-semibold">{itemTaglineSize}</span></p>
                              <p><span className="text-[var(--text-muted)]">Tagline Color:</span> <span className="font-semibold">{itemTaglineColor}</span></p>
                            </div>

                            <div>
                              <h5 className="font-bold text-[var(--text-primary)] uppercase text-[9px] tracking-wider mb-1">Theme & Assets</h5>
                              <p className="mt-1">
                                <span className="text-[var(--text-muted)]">Background:</span>{' '}
                                {itemBackgroundUrl ? (
                                  <span className="font-semibold text-blue-600 dark:text-blue-400">Custom Upload</span>
                                ) : (
                                  <span className="font-semibold">{pers.colorName || 'Midnight Black'}</span>
                                )}
                              </p>
                              
                              <p className="mt-1">
                                <span className="text-[var(--text-muted)]">Logo overlay:</span>{' '}
                                {itemLogoUrl ? (
                                  <span className="font-semibold text-blue-600 dark:text-blue-400">Custom Logo ({itemLogoPlacement})</span>
                                ) : (
                                  <span className="font-semibold text-[var(--text-muted)]">Default Watermark</span>
                                )}
                              </p>

                              <div className="flex flex-wrap gap-2 mt-4 pt-2 border-t border-[var(--border)]">
                                {itemBackgroundUrl && (
                                  <button
                                    onClick={() => handleDownloadFile(itemBackgroundUrl, `order-bg-${item.id}.png`)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-surface)] hover:bg-zinc-200 border border-[var(--border)] text-[9px] font-bold text-[var(--text-secondary)] cursor-pointer"
                                  >
                                    <Download size={10} /> BG Image
                                  </button>
                                )}
                                {itemLogoUrl && (
                                  <button
                                    onClick={() => handleDownloadFile(itemLogoUrl, `order-logo-${item.id}.png`)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-surface)] hover:bg-zinc-200 border border-[var(--border)] text-[9px] font-bold text-[var(--text-secondary)] cursor-pointer"
                                  >
                                    <Download size={10} /> Logo Overlay
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* 3. Cards Provision records for this item */}
                      <div className="pt-4 border-t border-[var(--border)] space-y-3">
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Provisioned Cards Stock ({cardRecords.length})</p>
                        <div className="grid grid-cols-1 gap-4">
                          {cardRecords.map((card) => (
                            <div key={card.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-blue-600/30 transition-all flex flex-col sm:flex-row gap-4 items-center justify-between">
                              <div className="flex gap-4 items-center w-full sm:w-auto">
                                {card.qr_code_url && (
                                  <img 
                                    src={card.qr_code_url} 
                                    alt="Card QR" 
                                    className="w-14 h-14 object-contain rounded border border-zinc-200 bg-white shadow-sm shrink-0"
                                  />
                                )}
                                <div className="text-[11px] space-y-0.5 min-w-0 max-w-xs sm:max-w-md truncate">
                                  <p className="font-bold font-mono text-[var(--text-primary)] text-sm">{card.slug}</p>
                                  <p className="text-[10px] text-blue-600 dark:text-blue-400 truncate" title={card.card_url}>
                                    {card.card_url}
                                  </p>
                                  <span className={`inline-flex px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider ${
                                    card.status === 'active' 
                                      ? 'bg-emerald-500/10 text-emerald-500' 
                                      : 'bg-blue-600/10 text-blue-600'
                                  }`}>
                                    {card.status}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 shrink-0">
                                <button
                                  onClick={() => handleCopyText(card.card_url)}
                                  className="px-2.5 py-1.5 rounded bg-[var(--bg-muted)] hover:bg-zinc-200 border border-[var(--border)] text-[10px] font-semibold text-[var(--text-secondary)] transition-all cursor-pointer"
                                >
                                  Copy URL
                                </button>
                                <button
                                  onClick={() => handleDownloadFile(card.qr_code_url, `qr-${card.slug}.png`)}
                                  className="px-2.5 py-1.5 rounded bg-[var(--bg-muted)] hover:bg-zinc-200 border border-[var(--border)] text-[10px] font-semibold text-[var(--text-secondary)] transition-all cursor-pointer"
                                >
                                  Download QR
                                </button>
                                <button
                                  onClick={() => handleDownloadAssetsPack(card, item)}
                                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold shadow-sm transition-all cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Download size={11} /> Download Assets Pack
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex gap-4 pt-6 border-t border-[var(--border)]">
            <button
              onClick={() => setAdminStep(1)}
              className="px-4 py-2 rounded-btn border border-[var(--border)] bg-transparent hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] text-xs font-bold cursor-pointer"
            >
              Back to Step 1
            </button>
            <button
              onClick={() => setAdminStep(3)}
              className="px-6 py-2 rounded-btn font-semibold text-white text-xs bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              Continue to Step 3
            </button>
          </div>

        </div>
      )}

      {/* STEP 3: LOGISTICS & SHIPPING */}
      {adminStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
          {/* Left Column Shipping Address Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
                <MapPin size={14} /> Shipping Recipient & Address
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1.5">
                  <p className="text-[var(--text-muted)] font-medium">Recipient Name</p>
                  <p className="font-bold text-sm text-[var(--text-primary)]">{order.shipping_address?.fullName || 'N/A'}</p>
                  <p className="text-[var(--text-secondary)]">Phone: {order.contact_phone || 'N/A'}</p>
                  <p className="text-[var(--text-secondary)]">Email: {order.contact_email || 'N/A'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[var(--text-muted)] font-medium">Destination Address</p>
                  <p className="text-[var(--text-primary)] font-semibold">{order.shipping_address?.addressLine1}</p>
                  {order.shipping_address?.addressLine2 && <p className="text-[var(--text-secondary)]">{order.shipping_address.addressLine2}</p>}
                  <p className="text-[var(--text-primary)] font-bold">{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Shipping Forms */}
          <div className="space-y-6">
            
            {/* Courier dispatch details */}
            {(order.status === 'pending_production' || order.status === 'in_production') ? (
              <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
                  <Truck size={14} /> Dispatch Shipment
                </h3>
                
                <form onSubmit={handleDispatch} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-semibold uppercase text-[10px]">Courier Service</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg-surface)] focus:outline-none flex items-center justify-between cursor-pointer transition-colors text-left">
                          <span>{courierName}</span>
                          <ChevronDown className="h-3.5 w-3.5 text-zinc-400 opacity-60 shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-1 shadow-lg text-xs text-[var(--text-primary)]">
                        <DropdownMenuItem onClick={() => setCourierName('Delhivery')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
                          <span>Delhivery</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setCourierName('DTDC')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
                          <span>DTDC</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setCourierName('Blue Dart')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
                          <span>Blue Dart</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setCourierName('Ekart')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
                          <span>Ekart</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setCourierName('India Post')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
                          <span>India Post</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setCourierName('Other')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
                          <span>Other</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 font-semibold uppercase text-[10px]">Tracking ID</label>
                    <input
                      type="text"
                      required
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] focus:outline-none"
                      placeholder="e.g. 1234567890"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 font-semibold uppercase text-[10px]">Tracking URL (Optional)</label>
                    <input
                      type="url"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] focus:outline-none"
                      placeholder="https://track.delhivery.com/..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 font-semibold uppercase text-[10px]">Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] h-12 resize-none focus:outline-none"
                      placeholder="Courier remarks..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={dispatching}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-btn font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-55 cursor-pointer mt-2"
                  >
                    {dispatching ? 'Dispatching...' : 'Mark as Dispatched'}
                  </button>
                </form>
              </div>
            ) : order.status === 'dispatched' ? (
              <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-500" /> Delivery Handover
                </h3>
                <div className="text-xs text-[var(--text-secondary)] space-y-2">
                  <p>Courier status: <span className="font-bold text-[var(--text-primary)]">Dispatched</span></p>
                  <p>Partner: <strong className="text-[var(--text-primary)]">{order.courier_name}</strong></p>
                  <p>Tracking ID: <strong className="text-[var(--text-primary)]">{order.tracking_number}</strong></p>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline block text-[10px]"
                    >
                      Track Order Link
                    </a>
                  )}
                  {order.admin_notes && (
                    <p className="bg-[var(--bg-muted)] p-2 rounded text-[10px] italic">Notes: {order.admin_notes}</p>
                  )}
                </div>
                
                <button
                  onClick={handleMarkDelivered}
                  disabled={updatingDelivery}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-btn font-semibold text-white text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-55 cursor-pointer mt-4"
                >
                  {updatingDelivery ? 'Updating status...' : 'Mark as Delivered'}
                </button>
              </div>
            ) : (
              // Delivered
              <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-emerald-500/20 bg-emerald-500/5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles size={14} /> Completed Delivery
                </h3>
                <div className="text-xs text-[var(--text-secondary)] space-y-1">
                  <p>Handover status: <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">Delivered</span></p>
                  <p>Delivered on: <strong>{order.delivered_at ? new Date(order.delivered_at).toLocaleDateString() : 'N/A'}</strong></p>
                  <p>Courier Partner: <strong>{order.courier_name}</strong></p>
                  <p>Tracking ID: <strong>{order.tracking_number}</strong></p>
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="pt-2">
              <button
                onClick={() => setAdminStep(2)}
                className="w-full px-4 py-2 rounded-btn border border-[var(--border)] bg-transparent hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] text-xs font-bold cursor-pointer"
              >
                Back to Step 2
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Configuration Details Modal */}
      {selectedConfigItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Card Configuration Details
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                  {selectedConfigItem.product_name || 'Envitra Smart Card'} · {selectedConfigItem.material || 'Standard Finish'}
                </p>
              </div>
              <button
                onClick={() => setSelectedConfigItem(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm font-bold p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Config Content details */}
            <div className="space-y-4 text-xs">
              {/* Order Info & Quantity */}
              <div className="grid grid-cols-2 gap-4 bg-[var(--bg-muted)] p-3.5 rounded-xl border border-[var(--border)]">
                <div>
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Quantity Ordered</span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1 block">
                    {selectedConfigItem.quantity} {selectedConfigItem.quantity > 1 ? 'Cards' : 'Card'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Unit Price (excl. tax)</span>
                  <span className="text-sm font-bold text-[var(--text-primary)] mt-1 block">
                    {formatPrice(selectedConfigItem.price_inr)}
                  </span>
                </div>
              </div>

              {/* Personalization metadata */}
              <div className="space-y-3">
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border)] pb-1">
                  Card Customization Details
                </h4>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Cardholder Name</span>
                    <span className="font-bold text-[var(--text-primary)] mt-0.5 block">
                      {selectedConfigItem.personalisation?.title || selectedConfigItem.personalisation?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Tagline / Subtext</span>
                    <span className="font-semibold text-[var(--text-secondary)] mt-0.5 block line-clamp-1">
                      {selectedConfigItem.personalisation?.tagline || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-[var(--border)]/40">
                  <div>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Background Theme</span>
                    <span className="font-semibold text-[var(--text-secondary)] mt-0.5 block">
                      {selectedConfigItem.personalisation?.backgroundUrl || selectedConfigItem.personalisation?.backgroundImageUrl ? (
                        <span className="text-blue-600 dark:text-blue-400">Custom Graphic</span>
                      ) : (
                        <span>Solid: {selectedConfigItem.personalisation?.colorName || 'Midnight Black'}</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Brand Logo Overlay</span>
                    <span className="font-semibold text-[var(--text-secondary)] mt-0.5 block">
                      {selectedConfigItem.personalisation?.logoUrl || selectedConfigItem.personalisation?.logoImageUrl ? (
                        <span className="text-blue-600 dark:text-blue-400">Custom Logo</span>
                      ) : (
                        <span className="text-[var(--text-muted)]">Default Watermark</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Claimed slugs list */}
                <div className="pt-2 border-t border-[var(--border)]/40">
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Claimed Custom Profile Links</span>
                  <div className="mt-1 space-y-1">
                    {selectedConfigItem.personalisation?.customSlugs && selectedConfigItem.personalisation.customSlugs.length > 0 ? (
                      selectedConfigItem.personalisation.customSlugs.map((slug: string, sIdx: number) => (
                        <p key={sIdx} className="font-mono text-[10px]">
                          <span className="text-[var(--text-muted)] font-sans">Card {sIdx + 1}:</span>{' '}
                          <span className="font-bold text-blue-600 dark:text-blue-400">envitra.in/u/{slug}</span>
                        </p>
                      ))
                    ) : selectedConfigItem.personalisation?.customSlug ? (
                      <p className="font-mono text-[10px]">
                        <span className="text-[var(--text-muted)] font-sans">Card 1:</span>{' '}
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          envitra.in/u/{selectedConfigItem.personalisation.customSlug}
                        </span>
                      </p>
                    ) : (
                      <span className="italic text-[var(--text-muted)] text-[10px]">None (system generated during provisioning)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer close button */}
            <div className="flex justify-end pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => setSelectedConfigItem(null)}
                className="px-4 py-2 bg-[var(--bg-muted)] hover:bg-zinc-200 border border-[var(--border)] text-xs font-bold rounded-xl text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

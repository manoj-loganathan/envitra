'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, isDarkColor } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import { Upload, ChevronRight, Check, ShoppingBag, CreditCard, Layers, Trash2 } from 'lucide-react'

// Solid colors list for selection
const SOLID_COLORS = [
  { name: 'Midnight Black', hex: '#111111' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Royal Blue', hex: '#1E3A8A' },
  { name: 'Emerald Green', hex: '#047857' },
  { name: 'Deep Purple', hex: '#5B21B6' },
  { name: 'Burgundy Red', hex: '#7F1D1D' },
  { name: 'Classic Gold', hex: '#B8860B' },
]

// Text Colors choices for custom styling
const TEXT_COLORS = [
  { name: 'Default', hex: '' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Dark Zinc', hex: '#09090B' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Classic Gold', hex: '#D97706' },
  { name: 'Emerald', hex: '#16A34A' },
  { name: 'Vibrant Red', hex: '#DC2626' },
]

export default function UnifiedDesignPage() {
  const router = useRouter()
  const supabase = createClient()
  const { addItem, removeItem } = useCartStore()
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  // Configure States
  const [title, setTitle] = useState('') // Maps to name on card
  const [description, setDescription] = useState('') // Maps to description on card
  const [customSlug, setCustomSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [bgType, setBgType] = useState<'solid' | 'custom'>('solid')
  const [selectedColor, setSelectedColor] = useState(SOLID_COLORS[0])
  const [quantity, setQuantity] = useState(1)
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front')
  const [material, setMaterial] = useState<'PVC' | 'Metallic'>('PVC')

  // Title (Name) Custom Typography States
  const [titleColor, setTitleColor] = useState('')
  const [titleFont, setTitleFont] = useState('font-sans')
  const [titleSize, setTitleSize] = useState('text-base')

  // Description Custom Typography States
  const [descColor, setDescColor] = useState('')
  const [descFont, setDescFont] = useState('font-sans')
  const [descSize, setDescSize] = useState('text-xs')

  // Custom Logo height state (default 32px)
  const [logoHeight, setLogoHeight] = useState(32)
  const [logoPlacement, setLogoPlacement] = useState<'top-left' | 'center'>('top-left')

  // Upload States
  const [bgFile, setBgFile] = useState<File | null>(null)
  const [bgUrl, setBgUrl] = useState('')
  const [bgProgress, setBgProgress] = useState(0)

  // Custom Background adjustments
  const [bgScale, setBgScale] = useState(1)
  const [bgTranslateX, setBgTranslateX] = useState(0)
  const [bgTranslateY, setBgTranslateY] = useState(0)
  
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [logoProgress, setLogoProgress] = useState(0)

  // Reset design configurations
  const handleResetDesign = () => {
    setTitle('')
    setDescription('')
    setCustomSlug('')
    setSlugStatus('idle')
    setBgType('solid')
    setSelectedColor(SOLID_COLORS[0])
    setMaterial('PVC')
    setQuantity(1)
    setTitleColor('')
    setTitleFont('font-sans')
    setTitleSize('text-base')
    setDescColor('')
    setDescFont('font-sans')
    setDescSize('text-xs')
    setLogoHeight(32)
    setLogoPlacement('top-left')
    setBgFile(null)
    setBgUrl('')
    setBgProgress(0)
    setBgScale(1)
    setBgTranslateX(0)
    setBgTranslateY(0)
    setLogoFile(null)
    setLogoUrl('')
    setLogoProgress(0)
    setCardSide('front')
    setEditingItemId(null)
  }

  // Check if we are editing/redesigning an existing cart item
  useEffect(() => {
    const editDataStr = typeof window !== 'undefined' ? localStorage.getItem('edit-design-item') : null
    if (editDataStr) {
      try {
        const editData = JSON.parse(editDataStr)
        if (editData.title) setTitle(editData.title)
        if (editData.name && !editData.title) setTitle(editData.name)
        if (editData.tagline) setDescription(editData.tagline)
        if (editData.logoUrl) setLogoUrl(editData.logoUrl)
        if (editData.logoImageUrl && !editData.logoUrl) setLogoUrl(editData.logoImageUrl)
        if (editData.titleColor) setTitleColor(editData.titleColor)
        if (editData.titleFont) setTitleFont(editData.titleFont)
        if (editData.titleSize) setTitleSize(editData.titleSize)
        if (editData.taglineColor) setDescColor(editData.taglineColor)
        if (editData.descColor && !editData.taglineColor) setDescColor(editData.descColor)
        if (editData.tagColor && !editData.taglineColor && !editData.descColor) setDescColor(editData.tagColor)
        if (editData.tagcolor && !editData.taglineColor && !editData.descColor && !editData.tagColor) setDescColor(editData.tagcolor)
        if (editData.taglineFont) setDescFont(editData.taglineFont)
        if (editData.descFont && !editData.taglineFont) setDescFont(editData.descFont)
        if (editData.taglineSize) setDescSize(editData.taglineSize)
        if (editData.descSize && !editData.taglineSize) setDescSize(editData.descSize)
        if (editData.logoHeight) setLogoHeight(editData.logoHeight)
        if (editData.logoPlacement) setLogoPlacement(editData.logoPlacement)
        if (editData.logoplacement && !editData.logoPlacement) setLogoPlacement(editData.logoplacement)
        if (editData.quantity) setQuantity(editData.quantity)
        if (editData.material) {
          setMaterial(editData.material.includes('Metallic') ? 'Metallic' : 'PVC')
        }
        if (editData.colorHex) {
          setBgType('solid')
          const matchColor = SOLID_COLORS.find(c => c.hex === editData.colorHex)
          if (matchColor) setSelectedColor(matchColor)
        } else if (editData.backgroundUrl) {
          setBgType('custom')
          setBgUrl(editData.backgroundUrl)
          if (editData.bgScale !== undefined) setBgScale(editData.bgScale)
          if (editData.bgTranslateX !== undefined) setBgTranslateX(editData.bgTranslateX)
          if (editData.bgTranslateY !== undefined) setBgTranslateY(editData.bgTranslateY)
        } else if (editData.backgroundImageUrl) {
          setBgType('custom')
          setBgUrl(editData.backgroundImageUrl)
          if (editData.bgScale !== undefined) setBgScale(editData.bgScale)
          if (editData.bgTranslateX !== undefined) setBgTranslateX(editData.bgTranslateX)
          if (editData.bgTranslateY !== undefined) setBgTranslateY(editData.bgTranslateY)
        }
        if (editData.customSlug) {
          setCustomSlug(editData.customSlug)
          setSlugStatus('available')
        }
        setEditingItemId(editData.id || null)
      } catch (e) {
        console.error('Failed to parse edit design item data', e)
      }
      localStorage.removeItem('edit-design-item')
    }
  }, [])

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    // Convert to lowercase, replace spaces with hyphens, remove any other invalid characters
    const sanitized = raw
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '')
    
    setCustomSlug(sanitized)
    
    if (sanitized === '') {
      setSlugStatus('idle')
      return
    }
    
    if (sanitized.length < 3 || sanitized.length > 25) {
      setSlugStatus('invalid')
      return
    }
    
    setSlugStatus('checking')
  }

  // Debounced database query for slug uniqueness check
  useEffect(() => {
    if (slugStatus !== 'checking' || !customSlug) return

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('nfc_cards')
          .select('id')
          .eq('slug', customSlug)
          .maybeSingle()

        if (error) {
          console.error('Error checking slug availability:', error)
          setSlugStatus('available') // fallback
          return
        }

        if (data) {
          setSlugStatus('taken')
        } else {
          setSlugStatus('available')
        }
      } catch (err) {
        console.error('Failed to query slug availability:', err)
        setSlugStatus('available') // fallback
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [customSlug, slugStatus, supabase])

  // Handle uploading files
  const handleFileUpload = async (file: File, type: 'bg' | 'logo') => {
    const setProgress = type === 'bg' ? setBgProgress : setLogoProgress
    const setUrl = type === 'bg' ? setBgUrl : setLogoUrl

    // 1. Instantly generate a local preview URL so the visual update is instantaneous
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
    setProgress(50) // Instantly show 50% load as we have the preview
    
    try {
      // 2. Perform upload in the background if Supabase is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // If no active session, we keep the local preview URL
        setProgress(100)
        return
      }

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setUrl(data.url) // Replace with server-side URL once upload completes
      }
      setProgress(100)
    } catch (err) {
      console.warn('Background upload failed, keeping local preview:', err)
      setProgress(100)
    }
  }

  // Pre-calculate card background styling
  let cardBgStyle: React.CSSProperties = {}
  let isCardDark = true

  if (bgType === 'solid') {
    cardBgStyle = { backgroundColor: selectedColor.hex }
    isCardDark = isDarkColor(selectedColor.hex)
  } else {
    cardBgStyle = { backgroundColor: '#18181B' } // Default dark zinc, custom image rendered inside absolute div
    isCardDark = true // Custom background is assumed dark style
  }

  const cardTextColor = isCardDark ? 'text-white' : 'text-zinc-950'
  const cardSubColor = isCardDark ? 'text-zinc-300' : 'text-zinc-600'
  const cardBorderColor = isCardDark ? 'border-white/10' : 'border-black/10'

  // Pricing calculation
  const basePrice = 49900 // ₹499 in paise
  const materialAddon = material === 'Metallic' ? 20000 : 0 // +₹200
  const bgAddon = bgType === 'custom' ? 10000 : 0 // +₹100
  const logoAddon = logoUrl ? 5000 : 0 // +₹50
  const singleCardPrice = basePrice + materialAddon + bgAddon + logoAddon
  const totalPrice = singleCardPrice * quantity

  // Validate custom slug availability
  const isSlugInvalid = customSlug.length > 0 && slugStatus !== 'available'

  // Cart item insertion helper
  const getCartItemDetails = () => {
    const personalisation = {
      title: title.trim() || 'Your Name',
      name: title.trim() || 'Your Name', // fallback
      titleColor: titleColor || undefined,
      titleFont: titleFont !== 'font-sans' ? titleFont : undefined,
      titleSize: titleSize !== 'text-base' ? titleSize : undefined,
      tagline: description.trim() || 'Short description',
      taglineColor: descColor || undefined,
      tagColor: descColor || undefined, // tagColor variant
      tagcolor: descColor || undefined, // tagcolor variant
      descColor: descColor || undefined, // fallback
      taglineFont: descFont !== 'font-sans' ? descFont : undefined,
      taglineSize: descSize !== 'text-xs' ? descSize : undefined,
      logoUrl: logoUrl || undefined,
      logoImageUrl: logoUrl || undefined, // fallback
      logoHeight: logoHeight || 32,
      logoPlacement: logoPlacement || 'top-left',
      logoplacement: logoPlacement || 'top-left', // logoplacement variant
      customSlug: customSlug.trim().toLowerCase() || undefined,
      ...(bgType === 'solid' 
        ? { colorName: selectedColor.name, colorHex: selectedColor.hex }
        : { 
            backgroundUrl: bgUrl || '/placeholder_custom_bg.png',
            backgroundImageUrl: bgUrl || '/placeholder_custom_bg.png', // fallback
            bgScale,
            bgTranslateX,
            bgTranslateY
          }
      )
    }

    return {
      cardProductId: 'prod-unified-design',
      productType: bgType === 'solid' ? ('solid_color' as const) : ('custom' as const),
      productName: 'Envitra Custom Smart Card',
      productSlug: 'design',
      material: material === 'Metallic' ? 'Premium Engraved Matte Metallic' : 'Premium Recycled Matte PVC',
      priceInr: singleCardPrice, // Dynamic price in paise
      quantity,
      personalisation: personalisation as any,
    }
  }

  const handleAddToCart = () => {
    const item = getCartItemDetails()
    if (editingItemId) {
      removeItem(editingItemId)
    }
    addItem(item)
    router.push('/cart')
  }

  const handleBuyNow = () => {
    const item = getCartItemDetails()
    if (editingItemId) {
      removeItem(editingItemId)
    }
    addItem(item)
    router.push('/checkout')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      
      {/* Back button */}
      <button 
        onClick={() => router.push('/shop')}
        className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-purple-600 mb-8 cursor-pointer transition-colors group"
      >
        <ChevronRight size={12} className="rotate-180 transition-transform group-hover:-translate-x-0.5" />
        Back to Shop Catalog
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        {/* Left Column: Visual Card Preview */}
        <div className="col-span-12 lg:col-span-5 lg:sticky lg:top-28 flex flex-col items-center self-start">
          
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            Live Interactive Preview
          </span>

          {/* Front/Back View Selector Tabs */}
          <div className="flex gap-2 mb-4 bg-[var(--bg-muted)] p-1 rounded-xl border border-[var(--border)] shrink-0 select-none animate-fadeIn">
            <button
              type="button"
              onClick={() => setCardSide('front')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cardSide === 'front'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Front View
            </button>
            <button
              type="button"
              onClick={() => setCardSide('back')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cardSide === 'back'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Back View
            </button>
          </div>

          {/* Standard Aspect Ratio NFC Card Preview */}
          <div className="relative w-full aspect-[1.586/1] max-w-[420px] rounded-2xl p-[1px] select-none [perspective:1000px] shadow-2xl transition-all duration-300 hover:scale-[1.01]">
            <div 
              className={`w-full h-full rounded-[15px] p-6 flex flex-col justify-between overflow-hidden relative border transition-all duration-500 ${cardBorderColor}`}
              style={cardBgStyle}
            >
              {/* Custom background image with scale/translate adjustments */}
              {bgType === 'custom' && bgUrl && (
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `url(${bgUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: `scale(${bgScale}) translate(${bgTranslateX}%, ${bgTranslateY}%)`,
                  }}
                />
              )}

              {/* Card texture/lighting overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.12)_0%,transparent_60%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.06)_0%,transparent_50%)] pointer-events-none" />
              <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.3)_0%,rgba(0,0,0,0.2)_100%)]" />
              {material === 'Metallic' && (
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_40%,rgba(0,0,0,0.22)_60%,rgba(255,255,255,0.18)_100%)] mix-blend-overlay pointer-events-none z-10 animate-pulse" style={{ animationDuration: '4s' }} />
              )}

              {cardSide === 'front' ? (
                <>
                  {/* Centered Brand Logo (if uploaded and set to center placement) */}
                  {logoUrl && logoPlacement === 'center' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <img 
                        src={logoUrl} 
                        alt="Centered Brand Logo" 
                        className="max-w-[200px] object-contain animate-fadeIn"
                        style={{ height: `${logoHeight}px`, width: 'auto' }}
                      />
                    </div>
                  )}

                  {/* Card Header */}
                  <div className="relative z-10 flex justify-between items-start w-full">
                    
                    {/* Brand Logo & Name (Top Left Corner) */}
                    <div className="flex items-start">
                      {logoUrl ? (
                        logoPlacement === 'top-left' ? (
                          <img 
                            src={logoUrl} 
                            alt="Brand Logo" 
                            className="max-w-[150px] object-contain"
                            style={{ height: `${logoHeight}px`, width: 'auto' }}
                          />
                        ) : null
                      ) : (
                        <img 
                          src="/default-brand-logo.png" 
                          alt="Brand Logo" 
                          className="h-26 max-w-[220px] object-contain -mt-7 -ml-7"
                          style={{ height: '104px' }}
                        />
                      )}
                    </div>

                    {/* NFC Wave Logo (Top Right Corner - from shop page card mockup) */}
                    <div className={isCardDark ? 'text-white/80' : 'text-zinc-800'}>
                      <svg className="w-9.5 h-9.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M12 2a10 10 0 0 1 10 10" />
                        <path d="M12 6a6 6 0 0 1 6 6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    </div>

                  </div>

                  {/* Card Footer details */}
                  <div className="relative z-10 w-full mt-auto">
                    {/* Name & Short Description (Bottom Left Corner) */}
                    <div className="text-left max-w-[85%]">
                      <h3 
                        style={titleColor ? { color: titleColor } : undefined}
                        className={`${titleFont === 'font-display' ? 'font-sans font-extrabold uppercase tracking-wider' : titleFont} ${
                          titleSize === 'text-sm' ? 'text-xs sm:text-sm' :
                          titleSize === 'text-base' ? 'text-base sm:text-lg' :
                          titleSize === 'text-lg' ? 'text-lg sm:text-xl' :
                          'text-xl sm:text-2xl'
                        } font-black tracking-wide leading-tight truncate ${!titleColor ? cardTextColor : ''}`}
                      >
                        {title.trim() || 'Your Name'}
                      </h3>
                      <p 
                        style={descColor ? { color: descColor } : undefined}
                        className={`${descFont === 'font-display' ? 'font-sans font-extrabold uppercase tracking-wider' : descFont} ${
                          descSize === 'text-[10px]' ? 'text-[8px] sm:text-[9px]' :
                          descSize === 'text-xs' ? 'text-[9px] sm:text-xs' :
                          descSize === 'text-sm' ? 'text-xs sm:text-sm' :
                          'text-sm sm:text-base'
                        } font-medium tracking-wide leading-relaxed mt-1 line-clamp-2 whitespace-normal break-words ${!descColor ? cardSubColor : ''}`}
                      >
                        {description.trim() || 'Short description'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                // Back Side of Card
                <div className="absolute inset-0 p-6 flex flex-col justify-between items-center w-full h-full z-10">
                  {/* Empty top-right spacer to balance space-between layout */}
                  <div className="h-7 w-full" />

                  {/* Centered QR Code */}
                  <div className="flex flex-col items-center justify-center my-auto animate-fadeIn">
                    <div className="p-2.5 bg-white rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300">
                      <svg className="w-24 h-24 text-zinc-950" viewBox="0 0 29 29" fill="currentColor">
                        {/* Finder Pattern Top-Left */}
                        <rect x="0" y="0" width="7" height="7" />
                        <rect x="1" y="1" width="5" height="5" fill="white" />
                        <rect x="2" y="2" width="3" height="3" />

                        {/* Finder Pattern Top-Right */}
                        <rect x="22" y="0" width="7" height="7" />
                        <rect x="23" y="1" width="5" height="5" fill="white" />
                        <rect x="24" y="2" width="3" height="3" />

                        {/* Finder Pattern Bottom-Left */}
                        <rect x="0" y="22" width="7" height="7" />
                        <rect x="1" y="23" width="5" height="5" fill="white" />
                        <rect x="2" y="24" width="3" height="3" />

                        {/* Alignment Pattern */}
                        <rect x="20" y="20" width="5" height="5" />
                        <rect x="21" y="21" width="3" height="3" fill="white" />
                        <rect x="22" y="22" width="1" height="1" />

                        {/* Timing Patterns */}
                        <rect x="8" y="6" width="1" height="1" />
                        <rect x="10" y="6" width="1" height="1" />
                        <rect x="12" y="6" width="1" height="1" />
                        <rect x="14" y="6" width="1" height="1" />
                        <rect x="16" y="6" width="1" height="1" />
                        <rect x="18" y="6" width="1" height="1" />
                        <rect x="20" y="6" width="1" height="1" />

                        <rect x="6" y="8" width="1" height="1" />
                        <rect x="6" y="10" width="1" height="1" />
                        <rect x="6" y="12" width="1" height="1" />
                        <rect x="6" y="14" width="1" height="1" />
                        <rect x="6" y="16" width="1" height="1" />
                        <rect x="6" y="18" width="1" height="1" />
                        <rect x="6" y="20" width="1" height="1" />

                        {/* Random Data Blocks */}
                        <rect x="9" y="0" width="2" height="1" />
                        <rect x="13" y="0" width="1" height="2" />
                        <rect x="16" y="0" width="3" height="1" />
                        
                        <rect x="8" y="2" width="1" height="3" />
                        <rect x="10" y="2" width="2" height="1" />
                        <rect x="14" y="2" width="1" height="1" />
                        <rect x="17" y="2" width="2" height="2" />

                        <rect x="9" y="4" width="3" height="1" />
                        <rect x="13" y="4" width="1" height="2" />
                        <rect x="16" y="4" width="1" height="1" />
                        
                        <rect x="8" y="8" width="2" height="2" />
                        <rect x="11" y="8" width="1" height="1" />
                        <rect x="13" y="8" width="3" height="1" />
                        <rect x="18" y="8" width="2" height="2" />
                        <rect x="21" y="8" width="1" height="3" />
                        <rect x="23" y="8" width="2" height="1" />
                        <rect x="26" y="8" width="3" height="2" />

                        <rect x="8" y="11" width="1" height="2" />
                        <rect x="10" y="11" width="3" height="1" />
                        <rect x="14" y="11" width="2" height="3" />
                        <rect x="17" y="11" width="1" height="1" />
                        <rect x="19" y="11" width="1" height="2" />
                        <rect x="23" y="11" width="2" height="2" />

                        <rect x="8" y="14" width="2" height="1" />
                        <rect x="11" y="14" width="2" height="2" />
                        <rect x="17" y="14" width="3" height="1" />
                        <rect x="21" y="14" width="1" height="3" />
                        <rect x="26" y="14" width="2" height="1" />

                        <rect x="9" y="17" width="1" height="2" />
                        <rect x="13" y="17" width="3" height="1" />
                        <rect x="18" y="17" width="2" height="2" />
                        <rect x="23" y="17" width="3" height="1" />
                        <rect x="27" y="17" width="1" height="3" />

                        <rect x="8" y="20" width="3" height="1" />
                        <rect x="12" y="20" width="2" height="2" />
                        <rect x="15" y="20" width="1" height="1" />
                        <rect x="17" y="20" width="2" height="1" />
                        <rect x="26" y="20" width="1" height="2" />

                        <rect x="8" y="23" width="1" height="2" />
                        <rect x="10" y="23" width="2" height="1" />
                        <rect x="13" y="23" width="1" height="3" />
                        <rect x="15" y="23" width="3" height="1" />
                        <rect x="26" y="23" width="3" height="1" />

                        <rect x="9" y="26" width="3" height="1" />
                        <rect x="14" y="26" width="2" height="2" />
                        <rect x="17" y="26" width="1" height="1" />
                        <rect x="19" y="26" width="3" height="1" />
                        <rect x="23" y="26" width="2" height="2" />
                      </svg>
                    </div>
                    <span className={`text-[8px] font-extrabold tracking-widest mt-2.5 uppercase ${cardSubColor} opacity-60`}>
                      Scan Profile
                    </span>
                  </div>

                  {/* Powered by envitra.in at bottom right */}
                  <div className="w-full flex justify-end mt-auto">
                    <span className={`text-[8px] font-medium tracking-wide ${cardSubColor} opacity-75`}>
                      powered by <span className="font-extrabold">envitra.in</span>
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Right Column: Customization Form Fields */}
        <div className="col-span-12 lg:col-span-7 bg-[var(--bg-surface)] p-6 sm:p-8 rounded-2xl border border-[var(--border)] shadow-md space-y-6">
          
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">Personalize Your Card</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Add your information, upload custom background graphics or choose a solid color, and brand logo. All fields are optional.
            </p>
          </div>

          <hr className="border-[var(--border)]" />

          {/* Form Fields */}
          <div className="space-y-6">
            
            {/* Field 1: Title (Name) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Name / Title
                </label>
                <span className="text-[10px] text-[var(--text-muted)]">Optional</span>
              </div>
              <input
                type="text"
                maxLength={30}
                placeholder="Rahul Kumar"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:border-purple-600 focus:outline-none text-[var(--text-primary)] transition-colors"
              />

              {/* Title Styling Options */}
              {title.trim() && (
                <div className="mt-2 p-3.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl space-y-3.5 animate-fadeIn">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Customize Name Typography
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Color Swatches */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Color</label>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {TEXT_COLORS.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setTitleColor(c.hex)}
                            className={`w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform cursor-pointer relative flex items-center justify-center ${
                              titleColor === c.hex ? 'ring-2 ring-purple-600 ring-offset-1 scale-110' : ''
                            }`}
                            style={{ backgroundColor: c.hex || '#4B5563' }}
                            title={c.name}
                          >
                            {c.hex === '' && (
                              <span className="text-[6px] font-black text-white uppercase tracking-tighter scale-90">
                                Auto
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Family Selection */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Font Style</label>
                      <select
                        value={titleFont}
                        onChange={(e) => setTitleFont(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-600"
                      >
                        <option value="font-sans">Modern Sans (Default)</option>
                        <option value="font-outfit">Outfit</option>
                        <option value="font-poppins">Poppins</option>
                        <option value="font-mono">Tech Mono</option>
                        <option value="font-display">Brand Display</option>
                      </select>
                    </div>

                    {/* Font Size Selection */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Font Size</label>
                      <select
                        value={titleSize}
                        onChange={(e) => setTitleSize(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-600"
                      >
                        <option value="text-sm">Small</option>
                        <option value="text-base">Medium</option>
                        <option value="text-lg">Large</option>
                        <option value="text-xl">Extra Large</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Field 2: Description (Tagline/Bio) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Short Description
                </label>
                <span className="text-[10px] text-[var(--text-muted)]">Optional</span>
              </div>
              <input
                type="text"
                maxLength={50}
                placeholder="Senior Product Designer"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm focus:border-purple-600 focus:outline-none text-[var(--text-primary)] transition-colors"
              />

              {/* Description Styling Options */}
              {description.trim() && (
                <div className="mt-2 p-3.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl space-y-3.5 animate-fadeIn">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Customize Description Typography
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Color Swatches */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Color</label>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {TEXT_COLORS.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setDescColor(c.hex)}
                            className={`w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform cursor-pointer relative flex items-center justify-center ${
                              descColor === c.hex ? 'ring-2 ring-purple-600 ring-offset-1 scale-110' : ''
                            }`}
                            style={{ backgroundColor: c.hex || '#4B5563' }}
                            title={c.name}
                          >
                            {c.hex === '' && (
                              <span className="text-[6px] font-black text-white uppercase tracking-tighter scale-90">
                                Auto
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Family Selection */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Font Style</label>
                      <select
                        value={descFont}
                        onChange={(e) => setDescFont(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-600"
                      >
                        <option value="font-sans">Modern Sans (Default)</option>
                        <option value="font-outfit">Outfit</option>
                        <option value="font-poppins">Poppins</option>
                        <option value="font-mono">Tech Mono</option>
                        <option value="font-display">Brand Display</option>
                      </select>
                    </div>

                    {/* Font Size Selection */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Font Size</label>
                      <select
                        value={descSize}
                        onChange={(e) => setDescSize(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-600"
                      >
                        <option value="text-[10px]">Small</option>
                        <option value="text-xs">Medium</option>
                        <option value="text-sm">Large</option>
                        <option value="text-base">Extra Large</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Field 2.5: Claim Custom Profile Link */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Claim Your Custom Profile Link
                </label>
                <span className="text-[10px] text-[var(--text-muted)]">Optional</span>
              </div>
              <div className="flex rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden focus-within:border-purple-600 transition-colors">
                <span className="flex items-center px-3.5 bg-[var(--bg-muted)] border-r border-[var(--border)] text-xs text-[var(--text-secondary)] font-medium select-none">
                  envitra.in/u/
                </span>
                <input
                  type="text"
                  maxLength={25}
                  placeholder="your-name"
                  value={customSlug}
                  onChange={handleSlugChange}
                  className="w-full px-3.5 py-3 bg-transparent text-sm focus:outline-none text-[var(--text-primary)]"
                />
              </div>
              
              {/* Slug status indicators */}
              {customSlug && (
                <div className="mt-1 flex items-center gap-1.5 text-xs animate-fadeIn">
                  {slugStatus === 'checking' && (
                    <span className="text-[var(--text-muted)] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse shrink-0" />
                      Checking availability...
                    </span>
                  )}
                  {slugStatus === 'available' && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Check size={12} className="shrink-0" />
                      envitra.in/u/{customSlug} is available!
                    </span>
                  )}
                  {slugStatus === 'taken' && (
                    <span className="text-red-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      This handle is already taken
                    </span>
                  )}
                  {slugStatus === 'invalid' && (
                    <span className="text-amber-500 font-medium flex items-center gap-1 text-[11px] leading-tight">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      Must be 3 to 25 characters (lowercase letters, numbers, hyphens, underscores)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Field 3: Chips for Solid Color vs Custom Background */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                Background Theme
              </label>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBgType('solid')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                    bgType === 'solid'
                      ? 'bg-purple-600/10 border-purple-600 text-purple-600'
                      : 'border-[var(--border)] hover:border-purple-600/30 text-[var(--text-secondary)]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-primary shrink-0" />
                  Solid Color
                </button>

                <button
                  type="button"
                  onClick={() => setBgType('custom')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                    bgType === 'custom'
                      ? 'bg-purple-600/10 border-purple-600 text-purple-600'
                      : 'border-[var(--border)] hover:border-purple-600/30 text-[var(--text-secondary)]'
                  }`}
                >
                  <Layers size={13} className="shrink-0" />
                  Custom Artwork
                </button>
              </div>

              {/* Subfield based on selection */}
              <div className="mt-3 p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] min-h-[90px] flex items-center">
                {bgType === 'solid' ? (
                  <div className="space-y-2.5 w-full">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                      Choose Color Theme
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {SOLID_COLORS.map((col) => (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => setSelectedColor(col)}
                          className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer hover:scale-105 ${
                            selectedColor.name === col.name 
                              ? 'border-purple-600 scale-105 shadow-md' 
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.name}
                        >
                          {selectedColor.name === col.name && (
                            <Check size={14} className={isDarkColor(col.hex) ? 'text-white' : 'text-zinc-950'} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                      Upload Custom Graphic / Background Image
                    </span>
                    <div className="flex items-center gap-4">
                      <label className="flex flex-col items-center justify-center border border-dashed border-[var(--border)] hover:border-purple-600 rounded-xl p-4 w-full cursor-pointer transition-colors bg-[var(--bg-surface)]">
                        <Upload size={18} className="text-purple-600 mb-1" />
                        <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                          {bgFile ? bgFile.name : 'Select or drag background image'}
                        </span>
                        <span className="text-[8px] text-[var(--text-muted)] mt-0.5">PNG, JPG up to 10MB</span>
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setBgFile(file)
                              handleFileUpload(file, 'bg')
                            }
                          }}
                        />
                      </label>
                      {bgUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setBgFile(null)
                            setBgUrl('')
                            setBgProgress(0)
                            setBgScale(1)
                            setBgTranslateX(0)
                            setBgTranslateY(0)
                          }}
                          className="p-2.5 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-[var(--bg-muted)] hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-all cursor-pointer shrink-0 animate-fadeIn"
                          title="Remove background image"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Background repositioning controls */}
                    {bgUrl && (
                      <div className="mt-4 p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-center pb-1 border-b border-[var(--border)]">
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                            Reposition & Crop Background
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setBgScale(1)
                              setBgTranslateX(0)
                              setBgTranslateY(0)
                            }}
                            className="text-[9px] font-bold text-purple-600 hover:text-purple-700 uppercase tracking-wider cursor-pointer"
                          >
                            Reset Alignment
                          </button>
                        </div>

                        {/* Zoom / Scale */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-medium">
                            <span>Zoom (Scale)</span>
                            <span className="font-semibold">{Math.round(bgScale * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.05"
                            value={bgScale}
                            onChange={(e) => setBgScale(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-[var(--bg-muted)] rounded-lg appearance-none cursor-pointer accent-purple-600"
                          />
                        </div>

                        {/* Move X */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-medium">
                            <span>Move Horizontal</span>
                            <span className="font-semibold">{bgTranslateX}%</span>
                          </div>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            step="1"
                            value={bgTranslateX}
                            onChange={(e) => setBgTranslateX(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-[var(--bg-muted)] rounded-lg appearance-none cursor-pointer accent-purple-600"
                          />
                        </div>

                        {/* Move Y */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-medium">
                            <span>Move Vertical</span>
                            <span className="font-semibold">{bgTranslateY}%</span>
                          </div>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            step="1"
                            value={bgTranslateY}
                            onChange={(e) => setBgTranslateY(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-[var(--bg-muted)] rounded-lg appearance-none cursor-pointer accent-purple-600"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Field 3.5: Material Type Chips */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Material Type
                </label>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">Upgrade Available</span>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setMaterial('PVC')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                    material === 'PVC'
                      ? 'bg-purple-600/10 border-purple-600 text-purple-600'
                      : 'border-[var(--border)] hover:border-purple-600/30 bg-[var(--bg-muted)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 shrink-0" />
                  Matte PVC (Base)
                </button>

                <button
                  type="button"
                  onClick={() => setMaterial('Metallic')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                    material === 'Metallic'
                      ? 'bg-purple-600/10 border-purple-600 text-purple-600 shadow-purple-sm'
                      : 'border-[var(--border)] hover:border-purple-600/30 bg-[var(--bg-muted)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  Matte Metallic (+₹200)
                </button>
              </div>
            </div>

            {/* Field 4: Logo Upload */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Add Brand Logo Overlay
                </label>
                <span className="text-[10px] text-[var(--text-muted)]">Optional</span>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex flex-col items-center justify-center border border-dashed border-[var(--border)] hover:border-purple-600 rounded-xl p-4 w-full cursor-pointer transition-colors bg-[var(--bg-muted)]">
                  <Upload size={18} className="text-purple-600 mb-1" />
                  <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                    {logoFile ? logoFile.name : 'Select custom brand logo'}
                  </span>
                  <span className="text-[8px] text-[var(--text-muted)] mt-0.5">PNG, JPG, SVG with transparent background</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/svg+xml" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setLogoFile(file)
                        handleFileUpload(file, 'logo')
                      }
                    }}
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null)
                      setLogoUrl('')
                      setLogoProgress(0)
                    }}
                    className="p-2.5 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-[var(--bg-muted)] hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-all cursor-pointer shrink-0 animate-fadeIn"
                    title="Remove custom logo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Logo Sizing & Placement Control (if custom logo uploaded) */}
              {logoUrl && (
                <div className="mt-3 space-y-3 p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl animate-fadeIn">
                  
                  {/* Sizing row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Adjust Logo Height / Size
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setLogoHeight((h) => Math.max(16, h - 4))}
                        className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-[var(--bg-muted)] select-none transition-colors"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-[var(--text-primary)] w-10 text-center">{logoHeight}px</span>
                      <button
                        type="button"
                        onClick={() => setLogoHeight((h) => Math.min(80, h + 4))}
                        className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-[var(--bg-muted)] select-none transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Placement row */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Logo Placement
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLogoPlacement('top-left')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                          logoPlacement === 'top-left'
                            ? 'bg-purple-600/10 border-purple-600 text-purple-600'
                            : 'border-[var(--border)] hover:border-purple-600/30 text-[var(--text-secondary)] bg-[var(--bg-surface)]'
                        }`}
                      >
                        Top Left
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setLogoPlacement('center')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                          logoPlacement === 'center'
                            ? 'bg-purple-600/10 border-purple-600 text-purple-600'
                            : 'border-[var(--border)] hover:border-purple-600/30 text-[var(--text-secondary)] bg-[var(--bg-surface)]'
                        }`}
                      >
                        Center
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>

          {/* Pricing Box & Description */}
          <div className="mt-8 w-full bg-[var(--bg-muted)] p-5 rounded-2xl border border-[var(--border)] space-y-4 animate-fadeIn">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Envitra NFC Smart Card</h3>
                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Custom layout & design included</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {formatPrice(singleCardPrice)}
                </span>
                <p className="text-[9px] text-[var(--text-muted)] font-bold">One-time purchase</p>
              </div>
            </div>

            <hr className="border-[var(--border)]" />

            {/* Pricing details and upgrades info */}
            <div className="space-y-2 text-[10px] text-[var(--text-secondary)] font-medium">
              <div className="flex justify-between">
                <span>Base Price (Matte PVC)</span>
                <span className="font-semibold">₹499</span>
              </div>
              {material === 'Metallic' && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Material Upgrade (Metallic)</span>
                  <span>+₹200</span>
                </div>
              )}
              {bgType === 'custom' && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Custom Artwork Upgrade</span>
                  <span>+₹100</span>
                </div>
              )}
              {logoUrl && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Brand Logo Overlay Upgrade</span>
                  <span>+₹50</span>
                </div>
              )}
            </div>

            <hr className="border-[var(--border)]" />

            <div className="grid grid-cols-2 gap-3 text-[10px] text-[var(--text-secondary)] font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {material === 'Metallic' ? 'Engraved Metallic Finish' : 'Matte PVC Finish'}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Free Digital Profile
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Tap and QR sharing
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Lifetime Validity
              </div>
            </div>
          </div>

          {/* Quantity & Action Buttons */}
          <div className="mt-6 w-full space-y-4">
            
            {/* Quantity Selector */}
            <div className="flex items-center justify-between bg-[var(--bg-muted)] px-4 py-3 rounded-xl border border-[var(--border)]">
              <span className="text-xs font-bold text-[var(--text-secondary)]">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] flex items-center justify-center font-bold text-sm cursor-pointer select-none transition-colors"
                >
                  -
                </button>
                <span className="text-sm font-semibold w-6 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] flex items-center justify-center font-bold text-sm cursor-pointer select-none transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart & Buy Buttons */}
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isSlugInvalid || slugStatus === 'checking'}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-xs border-2 border-purple-600/30 hover:border-purple-600/60 bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={15} /> Add to Cart
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isSlugInvalid || slugStatus === 'checking'}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md hover:shadow-purple-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard size={15} /> Buy Now
              </button>
            </div>

            {isSlugInvalid && (
              <p className="text-[10px] text-red-500 text-center font-bold animate-fadeIn">
                Please resolve the custom link availability before proceeding.
              </p>
            )}

            <p className="text-[10px] text-[var(--text-muted)] text-center font-medium">
              🔒 Secure checkout • 18% GST added at payment screen
            </p>
          </div>

          <div className="pt-5 border-t border-[var(--border)] flex justify-end">
            <button
              type="button"
              onClick={handleResetDesign}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-600 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Reset Design
            </button>
          </div>

        </div>

      </div>

    </div>
  )
}

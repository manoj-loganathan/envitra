'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, isDarkColor } from '@/lib/utils'
import {
  CreditCard, User, Copy, CopyPlus, Download, Plus, Trash2,
  Save, Settings, Activity, LogOut, ExternalLink,
  ChevronDown, Check, Sparkles, AlertCircle, Share2,
  LayoutDashboard, Users, Menu, X, Search, FileDown,
  ArrowRight, ChevronLeft, ChevronRight, Magnet, BarChart3,
  Lock, Link2, Package, Contact, Loader2, Clock, Zap,
  UserCheck, Cpu, Calendar, QrCode, Camera, Upload, Image as ImageIcon,
  Phone, Mail, MapPin, Globe, Briefcase, FileText, Eye,
  GripVertical, Navigation, SquarePen, Edit, MousePointer2, MessageCircle, Code2, Music, ShoppingBag,
  ChevronUp, Type, AlignLeft, Hash, ToggleLeft, ListChecks, RadioTower, Paperclip,
  PenLine, Heading1, SlidersHorizontal, Copy as CopyIcon, Layers, Filter, Tag, Star
} from 'lucide-react'

import { Reorder } from 'framer-motion'
import { ThumbsUp, Heart, Flame, Video, Archive } from 'lucide-react'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { HeaderProfile } from '@/components/layout/HeaderProfile'
import { UpgradeModal } from '@/components/dashboard/UpgradeModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

// Workspace constant for "All Cards" selection
const ALL_CARDS_WORKSPACE = {
  id: 'all',
  slug: 'all-cards',
  profile_data: {
    name: 'All Cards',
    colorHex: '#3f5ce6'
  }
}

// Tailored HSL Colors for theme presets
const COLOR_THEMES = [
  { name: 'Royal Purple', hex: '#7c3aed', class: 'bg-purple-600' },
  { name: 'Emerald Green', hex: '#10b981', class: 'bg-emerald-500' },
  { name: 'Midnight Black', hex: '#111111', class: 'bg-zinc-900' },
  { name: 'Crimson Red', hex: '#ef4444', class: 'bg-red-500' },
  { name: 'Ocean Blue', hex: '#0ea5e9', class: 'bg-sky-500' },
  { name: 'Sunset Orange', hex: '#f97316', class: 'bg-orange-500' },
]

// Helper to parse a YYYY-MM-DD string as a local Date object safely across all timezones
const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return undefined
  const parts = dateStr.split('-')
  if (parts.length !== 3) return undefined
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  return new Date(year, month, day)
}

// Helper to get a case-insensitive value from lead.data
const getLeadDataValue = (data: any, fieldId: string) => {
  if (!data || !fieldId) return undefined
  if (data[fieldId] !== undefined) return data[fieldId]
  if (data[fieldId.toLowerCase()] !== undefined) return data[fieldId.toLowerCase()]
  if (data[fieldId.toUpperCase()] !== undefined) return data[fieldId.toUpperCase()]
  return undefined
}

// Helper to render star rating
const renderStars = (rating: number | string | null | undefined) => {
  const ratingVal = rating ? Math.round(parseFloat(rating.toString())) : 0
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFilled = starIndex <= ratingVal
        return (
          <Star
            key={starIndex}
            size={12}
            className={isFilled ? "fill-amber-400 text-amber-400" : "text-zinc-300 dark:text-zinc-700"}
          />
        )
      })}
    </div>
  )
}

// Subcomponent to render product card images with carousel (auto slide & manual controls)
const ProductCardCarousel = ({ imageUrls, alt, objectFit = 'cover' }: { imageUrls: string[]; alt: string; objectFit?: 'cover' | 'contain' }) => {
  const length = imageUrls.length
  const [currentIndex, setCurrentIndex] = useState(1) // Start at index 1 (the first real slide)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [sliding, setSliding] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Double clones at start and end for infinite looping scroll
  const slides = [imageUrls[length - 1], ...imageUrls, imageUrls[0]]

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (sliding) return
    setSliding(true)
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev + 1)
  }

  const prevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (sliding) return
    setSliding(true)
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev - 1)
  }

  const selectSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (sliding) return
    setSliding(true)
    setIsTransitioning(true)
    setCurrentIndex(index + 1)
  }

  const handleTransitionEnd = () => {
    setSliding(false)
    if (currentIndex === 0) {
      setIsTransitioning(false)
      setCurrentIndex(length)
    } else if (currentIndex === length + 1) {
      setIsTransitioning(false)
      setCurrentIndex(1)
    }
  }

  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true)
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [isTransitioning])

  const startAutoSlide = () => {
    stopAutoSlide()
    timerRef.current = setInterval(() => {
      if (!sliding) {
        setSliding(true)
        setIsTransitioning(true)
        setCurrentIndex((prev) => prev + 1)
      }
    }, 3000)
  }

  const stopAutoSlide = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    if (length > 1) {
      startAutoSlide()
    }
    return () => stopAutoSlide()
  }, [length])

  if (!imageUrls || length === 0) return null

  if (length === 1) {
    return (
      <img
        src={imageUrls[0]}
        alt={alt}
        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
      />
    )
  }

  return (
    <div 
      className="relative w-full h-full group/carousel overflow-hidden"
      onMouseEnter={stopAutoSlide}
      onMouseLeave={startAutoSlide}
    >
      {/* Slides Container */}
      <div 
        className="absolute inset-0 flex"
        onTransitionEnd={handleTransitionEnd}
        style={{ 
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: isTransitioning ? 'transform 500ms ease-out' : 'none'
        }}
      >
        {slides.map((url, idx) => (
          <div key={idx} className="w-full h-full shrink-0">
            <img src={url} alt={`${alt} - slide`} className={`w-full h-full object-${objectFit}`} />
          </div>
        ))}
      </div>

      {/* Manual controls: Left Arrow */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 hover:bg-black/60 text-white/95 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer z-10"
      >
        <ChevronLeft size={14} />
      </button>

      {/* Manual controls: Right Arrow */}
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 hover:bg-black/60 text-white/95 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer z-10"
      >
        <ChevronRight size={14} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
        {imageUrls.map((_, idx) => {
          let displayActive = false
          if (currentIndex === 0) {
            displayActive = idx === length - 1
          } else if (currentIndex === length + 1) {
            displayActive = idx === 0
          } else {
            displayActive = idx === currentIndex - 1
          }

          return (
            <button
              key={idx}
              onClick={(e) => selectSlide(idx, e)}
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${displayActive ? 'bg-white scale-110 shadow-xs' : 'bg-white/40 hover:bg-white/60'}`}
            />
          )
        })}
      </div>
    </div>
  )
}


// Helper to extract primary lead details: Name, Email, and Phone
const getLeadPrimaryDetails = (lead: any, leadForms: any[]) => {
  const form = leadForms.find((f: any) => f.id === lead.form_id)
  const fields = form?.fields || []

  let name = ''
  let email = ''
  let phone = ''
  let nameFieldId = ''
  let emailFieldId = ''
  let phoneFieldId = ''

  // 1. Try resolving using field type definitions
  const nameField = fields.find((f: any) => f.type === 'text' && f.label.toLowerCase().includes('name'))
  const emailField = fields.find((f: any) => f.type === 'email')
  const phoneField = fields.find((f: any) => f.type === 'phone')

  if (nameField) {
    name = getLeadDataValue(lead.data, nameField.id) || ''
    nameFieldId = nameField.id
  }
  if (emailField) {
    email = getLeadDataValue(lead.data, emailField.id) || ''
    emailFieldId = emailField.id
  }
  if (phoneField) {
    phone = getLeadDataValue(lead.data, phoneField.id) || ''
    phoneFieldId = phoneField.id
  }

  // 2. Fallback to checking label contents (if type matching failed or returned empty)
  if (!name) {
    const fallbackNameField = fields.find((f: any) => f.type === 'text')
    if (fallbackNameField) {
      name = getLeadDataValue(lead.data, fallbackNameField.id) || ''
      nameFieldId = fallbackNameField.id
    }
  }

  // 3. Scan entries as a generic fallback (covers cases where field schema isn't present)
  if (!name || !email || !phone) {
    Object.entries(lead.data || {}).forEach(([key, val]) => {
      const valStr = typeof val === 'object' ? (val as any).name || JSON.stringify(val) : String(val)
      const k = key.toLowerCase()
      if (!name && (k.includes('name') || k === 'name')) {
        name = valStr
      } else if (!email && k.includes('email')) {
        email = valStr
      } else if (!phone && (k.includes('phone') || k.includes('mobile') || k.includes('contact'))) {
        phone = valStr
      }
    })
  }

  // 4. Final fallback to fill Name from first raw key-value pair if still empty
  if (!name) {
    const entries = Object.entries(lead.data || {})
    if (entries.length > 0) {
      name = String(entries[0][1])
    } else {
      name = 'Unknown Lead'
    }
  }

  return { name, email, phone, nameFieldId, emailFieldId, phoneFieldId }
}

// Helper to extract up to 4 other details to show in the 4-grid layout
const getLeadOtherFields = (lead: any, leadForms: any[], primaryDetails: any) => {
  const form = leadForms.find((f: any) => f.id === lead.form_id)
  const fields = form?.fields || []
  const results: { label: string; value: string; type?: string; id?: string }[] = []

  const primaryIds = [primaryDetails.nameFieldId, primaryDetails.emailFieldId, primaryDetails.phoneFieldId]
    .filter(Boolean)
    .map(id => id.toLowerCase())

  const primaryLabels = ['name', 'email', 'phone', 'telephone', 'mobile', 'contact']

  if (fields.length > 0) {
    // Filter out display-only blocks (headings/paragraphs) and primary fields
    const otherFields = fields.filter((f: any) => {
      if (['heading', 'paragraph'].includes(f.type)) return false

      const labelLower = f.label.toLowerCase()
      const isPrimaryLabel = primaryLabels.some(pl => labelLower.includes(pl))
      const isPrimaryId = primaryIds.includes(f.id.toLowerCase())

      if (isPrimaryLabel || isPrimaryId) return false
      return true
    })

    otherFields.forEach((field: any) => {
      const val = getLeadDataValue(lead.data, field.id)
      if (val !== undefined && val !== null) {
        const displayVal = typeof val === 'object' ? (val.name || JSON.stringify(val)) : String(val)
        results.push({ label: field.label, value: displayVal, type: field.type, id: field.id })
      }
    })
  } else {
    // Fallback if no fields are defined: scan raw lead.data entries
    const primaryValues = [primaryDetails.name, primaryDetails.email, primaryDetails.phone].filter(Boolean)
    Object.entries(lead.data || {}).forEach(([key, val]) => {
      const valStr = typeof val === 'object' ? (val as any).name || JSON.stringify(val) : String(val)
      const isPrimaryVal = primaryValues.includes(valStr)
      const k = key.toLowerCase()
      const isPrimaryLabel = primaryLabels.some(pl => k.includes(pl))

      if (!isPrimaryVal && !isPrimaryLabel) {
        results.push({ label: key, value: valStr, type: 'text', id: key })
      }
    })
  }

  return results
}

// Helper to get a stable styled avatar color background class based on lead name
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
    'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
    'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
    'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
    'bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900',
    'bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900',
    'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900',
    'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900',
    'bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900',
  ]
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  return colors[sum % colors.length]
}

// Mock leads data
const MOCK_LEADS = [
  { id: '1', date: '2026-06-03 14:24', name: 'Rohan Sharma', email: 'rohan.sharma@techcorp.co.in', phone: '+91 98765 43210', company: 'TechCorp Solutions', notes: 'Interested in bulk orders of NFC business cards.' },
  { id: '2', date: '2026-06-02 11:05', name: 'Anjali Desai', email: 'anjali@desaimedia.com', phone: '+91 87654 32109', company: 'Desai Media', notes: 'Wants integration with corporate directory.' },
  { id: '3', date: '2026-05-31 16:50', name: 'Vikram Malhotra', email: 'vikram.m@indiahart.com', phone: '+91 76543 21098', company: 'IndiaHart Ltd', notes: 'Shared contact details. Follow up in a week.' },
  { id: '4', date: '2026-05-29 09:12', name: 'Priya Patel', email: 'priya@pateldesign.in', phone: '+91 65432 10987', company: 'Patel Design Studio', notes: 'Met at Bangalore Tech Summit. Impressed by the card design.' },
  { id: '5', date: '2026-05-25 18:33', name: 'Amit Verma', email: 'amit.verma@ventures.in', phone: '+91 91234 56789', company: 'Verma Ventures', notes: 'Venture Capitalist. Kept for future connection.' },
]

const CATEGORY_MAP: Record<string, string[]> = {
  Social: ['Instagram', 'Facebook', 'LinkedIn', 'YouTube', 'X (Twitter)', 'Threads', 'TikTok', 'Snapchat', 'Pinterest', 'Tumblr', 'Bluesky', 'Mastodon'],
  Messaging: ['WhatsApp', 'Telegram', 'Discord', 'Signal', 'Line', 'Viber', 'Skype', 'Messenger'],
  Developer: ['GitHub', 'GitLab', 'Stack Overflow', 'Bitbucket', 'CodePen', 'Replit', 'HackerNews', 'Dev.to'],
  Business: ['Calendly', 'Zoom', 'Google Meet', 'Microsoft Teams', 'Notion', 'Loom', 'Slack', 'Typeform'],
  Payments: ['UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Amazon Pay', 'Razorpay', 'Stripe', 'PayPal'],
  Content: ['Medium', 'Substack', 'Behance', 'Dribbble', 'Ghost', 'Hashnode', 'Figma', 'Mirror'],
  Music: ['Spotify', 'Apple Music', 'SoundCloud', 'YouTube Music', 'Amazon Music', 'Tidal', 'Deezer'],
  Ecommerce: ['Amazon', 'Flipkart', 'Shopify Store', 'Etsy', 'Nykaa', 'Myntra', 'Ajio', 'Meesho', 'Snapdeal', 'JioMart', 'Zomato', 'Swiggy']
}

const PLATFORM_LIST = [
  // Social
  { name: 'Instagram', category: 'Social' },
  { name: 'Facebook', category: 'Social' },
  { name: 'LinkedIn', category: 'Social' },
  { name: 'YouTube', category: 'Social' },
  { name: 'X (Twitter)', category: 'Social' },
  { name: 'Threads', category: 'Social' },
  { name: 'Snapchat', category: 'Social' },
  { name: 'Pinterest', category: 'Social' },
  { name: 'Tumblr', category: 'Social' },
  { name: 'Bluesky', category: 'Social' },
  { name: 'Mastodon', category: 'Social' },

  // Messaging
  { name: 'WhatsApp', category: 'Messaging' },
  { name: 'Telegram', category: 'Messaging' },
  { name: 'Discord', category: 'Messaging' },
  { name: 'Signal', category: 'Messaging' },
  { name: 'Line', category: 'Messaging' },
  { name: 'Viber', category: 'Messaging' },
  { name: 'Skype', category: 'Messaging' },
  { name: 'Messenger', category: 'Messaging' },

  // Payments
  { name: 'UPI', category: 'Payments' },
  { name: 'Google Pay', category: 'Payments' },
  { name: 'PhonePe', category: 'Payments' },
  { name: 'Paytm', category: 'Payments' },
  { name: 'Amazon Pay', category: 'Payments' },
  { name: 'Razorpay', category: 'Payments' },
  { name: 'Stripe', category: 'Payments' },
  { name: 'PayPal', category: 'Payments' },

  // Developer
  { name: 'GitHub', category: 'Developer' },
  { name: 'GitLab', category: 'Developer' },
  { name: 'Stack Overflow', category: 'Developer' },
  { name: 'Bitbucket', category: 'Developer' },
  { name: 'CodePen', category: 'Developer' },
  { name: 'Replit', category: 'Developer' },
  { name: 'HackerNews', category: 'Developer' },
  { name: 'Dev.to', category: 'Developer' },

  // Business
  { name: 'Calendly', category: 'Business' },
  { name: 'Zoom', category: 'Business' },
  { name: 'Google Meet', category: 'Business' },
  { name: 'Microsoft Teams', category: 'Business' },
  { name: 'Notion', category: 'Business' },
  { name: 'Loom', category: 'Business' },
  { name: 'Slack', category: 'Business' },
  { name: 'Typeform', category: 'Business' },

  // Content
  { name: 'Medium', category: 'Content' },
  { name: 'Substack', category: 'Content' },
  { name: 'Behance', category: 'Content' },
  { name: 'Dribbble', category: 'Content' },
  { name: 'Ghost', category: 'Content' },
  { name: 'Hashnode', category: 'Content' },
  { name: 'Figma', category: 'Content' },
  { name: 'Mirror', category: 'Content' },

  // Music
  { name: 'Spotify', category: 'Music' },
  { name: 'Apple Music', category: 'Music' },
  { name: 'SoundCloud', category: 'Music' },
  { name: 'YouTube Music', category: 'Music' },
  { name: 'Amazon Music', category: 'Music' },
  { name: 'Tidal', category: 'Music' },
  { name: 'Deezer', category: 'Music' },

  // Ecommerce
  { name: 'Amazon', category: 'Ecommerce' },
  { name: 'Flipkart', category: 'Ecommerce' },
  { name: 'Shopify Store', category: 'Ecommerce' },
  { name: 'Etsy', category: 'Ecommerce' },
  { name: 'Nykaa', category: 'Ecommerce' },
  { name: 'Myntra', category: 'Ecommerce' },
  { name: 'Ajio', category: 'Ecommerce' },
  { name: 'Meesho', category: 'Ecommerce' }
]

const getPlatformDefaultPrefix = (platformName: string): string => {
  const p = platformName.toLowerCase().trim();
  if (p === 'whatsapp') return '+91';
  if (p === 'upi') return '@upi';
  if (p === 'instagram') return 'instagram.com/';
  if (p === 'facebook') return 'facebook.com/';
  if (p === 'linkedin') return 'linkedin.com/in/';
  if (p === 'youtube') return 'youtube.com/';
  if (p === 'x (twitter)' || p === 'x' || p === 'twitter') return 'x.com/';
  if (p === 'threads') return 'threads.net/@';
  if (p === 'snapchat') return 'snapchat.com/add/';
  if (p === 'pinterest') return 'pinterest.com/';
  if (p === 'telegram') return 't.me/';
  if (p === 'discord') return 'discord.gg/';
  if (p === 'github') return 'github.com/';
  if (p === 'gitlab') return 'gitlab.com/';
  if (p === 'calendly') return 'calendly.com/';
  if (p === 'medium') return 'medium.com/@';
  if (p === 'spotify') return 'open.spotify.com/user/';
  if (p === 'apple music') return 'music.apple.com/';
  if (p === 'soundcloud') return 'soundcloud.com/';
  if (p === 'behance') return 'behance.net/';
  if (p === 'dribbble') return 'dribbble.com/';
  return '';
}

const mapUiCategoryToDb = (uiCat: string): string => {
  const cat = (uiCat || 'Social').toLowerCase();
  if (cat === 'payments') return 'payment';
  return cat;
}

const getNormalizedPlatform = (platform: string): string => {
  const p = (platform || '').toLowerCase().trim();
  // Social
  if (p.includes('instagram') || p.includes('insta')) return 'instagram';
  if (p.includes('facebook') || p.includes('fb')) return 'facebook';
  if (p.includes('linkedin')) return 'linkedin';
  if (p.includes('youtube music') || p.includes('ytmusic')) return 'youtubemusic';
  if (p.includes('youtube') || p.includes('yt')) return 'youtube';
  if (p.includes('twitter') || p === 'x' || p.includes('x (twitter)')) return 'x';
  if (p.includes('threads')) return 'threads';
  if (p.includes('tiktok')) return 'tiktok';
  if (p.includes('snapchat')) return 'snapchat';
  if (p.includes('pinterest')) return 'pinterest';
  if (p.includes('tumblr')) return 'tumblr';
  if (p.includes('bluesky')) return 'bluesky';
  if (p.includes('mastodon')) return 'mastodon';
  // Messaging
  if (p.includes('whatsapp') || p.includes('wa.me')) return 'whatsapp';
  if (p.includes('telegram') || p.includes('tg')) return 'telegram';
  if (p.includes('discord')) return 'discord';
  if (p.includes('signal')) return 'signal';
  if (p === 'line' || p.includes('line.me')) return 'line';
  if (p.includes('viber')) return 'viber';
  if (p.includes('skype')) return 'skype';
  if (p.includes('messenger')) return 'messenger';
  // Developer
  if (p.includes('github')) return 'github';
  if (p.includes('gitlab')) return 'gitlab';
  if (p.includes('stack overflow') || p.includes('stackoverflow')) return 'stackoverflow';
  if (p.includes('bitbucket')) return 'bitbucket';
  if (p.includes('codepen')) return 'codepen';
  if (p.includes('replit') || p.includes('repl.it')) return 'replit';
  if (p.includes('hackernews') || p.includes('hacker news') || p.includes('news.ycombinator')) return 'hackernews';
  if (p.includes('dev.to') || p === 'devto') return 'devto';
  // Business
  if (p.includes('calendly')) return 'calendly';
  if (p.includes('zoom')) return 'zoom';
  if (p.includes('google meet') || p === 'meet') return 'googlemeet';
  if (p.includes('microsoft teams') || p.includes('teams')) return 'microsoftteams';
  if (p.includes('notion')) return 'notion';
  if (p.includes('loom')) return 'loom';
  if (p.includes('slack')) return 'slack';
  if (p.includes('typeform')) return 'typeform';
  // Content
  if (p.includes('medium')) return 'medium';
  if (p.includes('substack')) return 'substack';
  if (p.includes('behance')) return 'behance';
  if (p.includes('dribbble')) return 'dribbble';
  if (p.includes('ghost')) return 'ghost';
  if (p.includes('hashnode')) return 'hashnode';
  if (p.includes('figma')) return 'figma';
  if (p.includes('mirror.xyz') || p === 'mirror') return 'mirror';
  // Music
  if (p.includes('spotify')) return 'spotify';
  if (p.includes('apple music') || p.includes('applemusic')) return 'applemusic';
  if (p.includes('soundcloud')) return 'soundcloud';
  if (p.includes('amazon music') || p.includes('amazonmusic')) return 'amazonmusic';
  if (p.includes('tidal')) return 'tidal';
  if (p.includes('deezer')) return 'deezer';
  // Payments (check amazon pay BEFORE amazon)
  if (p.includes('amazon pay') || p.includes('amazonpay')) return 'amazonpay';
  if (p.includes('google pay') || p.includes('googlepay') || p === 'gpay') return 'googlepay';
  if (p.includes('phonepe') || p.includes('phone pe')) return 'phonepe';
  if (p.includes('paytm')) return 'paytm';
  if (p.includes('razorpay')) return 'razorpay';
  if (p.includes('stripe')) return 'stripe';
  if (p.includes('paypal')) return 'paypal';
  if (p === 'upi') return 'upi';
  // Ecommerce (check amazon AFTER amazon pay)
  if (p.includes('flipkart')) return 'flipkart';
  if (p.includes('shopify')) return 'shopify';
  if (p.includes('etsy')) return 'etsy';
  if (p.includes('nykaa')) return 'nykaa';
  if (p.includes('myntra')) return 'myntra';
  if (p.includes('ajio')) return 'ajio';
  if (p.includes('meesho')) return 'meesho';
  if (p.includes('snapdeal')) return 'snapdeal';
  if (p.includes('jiomart')) return 'jiomart';
  if (p.includes('zomato')) return 'zomato';
  if (p.includes('swiggy')) return 'swiggy';
  if (p.includes('amazon')) return 'amazon';
  return p;
};

const PLATFORM_DISPLAY_CATEGORY: Record<string, string> = {
  // Social
  instagram: 'Social', facebook: 'Social', linkedin: 'Social', youtube: 'Social',
  x: 'Social', twitter: 'Social', threads: 'Social', tiktok: 'Social',
  snapchat: 'Social', pinterest: 'Social', tumblr: 'Social', bluesky: 'Social', mastodon: 'Social',
  // Messaging
  whatsapp: 'Messaging', telegram: 'Messaging', discord: 'Messaging', signal: 'Messaging',
  line: 'Messaging', viber: 'Messaging', skype: 'Messaging', messenger: 'Messaging',
  // Developer
  github: 'Developer', gitlab: 'Developer', stackoverflow: 'Developer',
  bitbucket: 'Developer', codepen: 'Developer', replit: 'Developer', hackernews: 'Developer', devto: 'Developer',
  // Business
  calendly: 'Business', zoom: 'Business', googlemeet: 'Business', microsoftteams: 'Business',
  notion: 'Business', loom: 'Business', slack: 'Business', typeform: 'Business',
  // Payments
  upi: 'Payments', googlepay: 'Payments', phonepe: 'Payments', paytm: 'Payments',
  amazonpay: 'Payments', razorpay: 'Payments', stripe: 'Payments', paypal: 'Payments',
  // Content
  medium: 'Content', substack: 'Content', behance: 'Content', dribbble: 'Content',
  ghost: 'Content', hashnode: 'Content', figma: 'Content', mirror: 'Content',
  // Music
  spotify: 'Music', applemusic: 'Music', soundcloud: 'Music',
  youtubemusic: 'Music', amazonmusic: 'Music', tidal: 'Music', deezer: 'Music',
  // Ecommerce
  amazon: 'Ecommerce', flipkart: 'Ecommerce', shopify: 'Ecommerce', etsy: 'Ecommerce',
  nykaa: 'Ecommerce', myntra: 'Ecommerce', ajio: 'Ecommerce', meesho: 'Ecommerce',
  snapdeal: 'Ecommerce', jiomart: 'Ecommerce', zomato: 'Ecommerce', swiggy: 'Ecommerce',
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Social': return <Share2 className="w-3.5 h-3.5 shrink-0" />
    case 'Messaging': return <MessageCircle className="w-3.5 h-3.5 shrink-0" />
    case 'Developer': return <Code2 className="w-3.5 h-3.5 shrink-0" />
    case 'Business': return <Briefcase className="w-3.5 h-3.5 shrink-0" />
    case 'Payments': return <CreditCard className="w-3.5 h-3.5 shrink-0" />
    case 'Content': return <FileText className="w-3.5 h-3.5 shrink-0" />
    case 'Music': return <Music className="w-3.5 h-3.5 shrink-0" />
    case 'Ecommerce': return <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
    default: return <Link2 className="w-3.5 h-3.5 shrink-0" />
  }
}

const getUiCategory = (dbCat: string, platformName: string): string => {
  const cat = (dbCat || '').toLowerCase();
  if (cat === 'payment') return 'Payments';
  if (cat === 'social') return 'Social';
  if (cat === 'messaging') return 'Messaging';
  if (cat === 'developer') return 'Developer';
  if (cat === 'business') return 'Business';
  if (cat === 'content') return 'Content';
  if (cat === 'music') return 'Music';
  if (cat === 'ecommerce') return 'Ecommerce';

  const normalized = getNormalizedPlatform(platformName)
  return PLATFORM_DISPLAY_CATEGORY[normalized] || 'Social'
}

const LinkPlatformIcon = ({ platform, category, className }: { platform: string; category: string; className?: string }) => {
  const cls = className || "w-5 h-5 shrink-0"
  const p = getNormalizedPlatform(platform)

  const PLATFORM_SVG_PATHS: Record<string, string> = {
    instagram: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077",
    facebook: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
    linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    youtube: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    x: "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
    twitter: "M21.543 7.104c.015.211.015.423.015.636 0 6.507-4.954 14.01-14.01 14.01v-.003A13.94 13.94 0 0 1 0 19.539a9.88 9.88 0 0 0 7.287-2.041 4.93 4.93 0 0 1-4.6-3.42 4.916 4.916 0 0 0 2.223-.084A4.926 4.926 0 0 1 .96 9.167v-.062a4.887 4.887 0 0 0 2.235.616A4.928 4.928 0 0 1 1.67 3.148 13.98 13.98 0 0 0 11.82 8.292a4.929 4.929 0 0 1 8.39-4.49 9.868 9.868 0 0 0 3.128-1.196 4.941 4.941 0 0 1-2.165 2.724A9.828 9.828 0 0 0 24 4.555a10.019 10.019 0 0 1-2.457 2.549z",
    threads: "M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z",
    tiktok: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
    snapchat: "M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z",
    pinterest: "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z",
    whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
    telegram: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
    discord: "M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z",
    signal: "M12 0q-.934 0-1.83.139l.17 1.111a11 11 0 0 1 3.32 0l.172-1.111A12 12 0 0 0 12 0M9.152.34A12 12 0 0 0 5.77 1.742l.584.961a10.8 10.8 0 0 1 3.066-1.27zm5.696 0-.268 1.094a10.8 10.8 0 0 1 3.066 1.27l.584-.962A12 12 0 0 0 14.848.34M12 2.25a9.75 9.75 0 0 0-8.539 14.459c.074.134.1.292.064.441l-1.013 4.338 4.338-1.013a.62.62 0 0 1 .441.064A9.7 9.7 0 0 0 12 21.75c5.385 0 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25m-7.092.068a12 12 0 0 0-2.59 2.59l.909.664a11 11 0 0 1 2.345-2.345zm14.184 0-.664.909a11 11 0 0 1 2.345 2.345l.909-.664a12 12 0 0 0-2.59-2.59M1.742 5.77A12 12 0 0 0 .34 9.152l1.094.268a10.8 10.8 0 0 1 1.269-3.066zm20.516 0-.961.584a10.8 10.8 0 0 1 1.27 3.066l1.093-.268a12 12 0 0 0-1.402-3.383M.138 10.168A12 12 0 0 0 0 12q0 .934.139 1.83l1.111-.17A11 11 0 0 1 1.125 12q0-.848.125-1.66zm23.723.002-1.111.17q.125.812.125 1.66c0 .848-.042 1.12-.125 1.66l1.111.172a12.1 12.1 0 0 0 0-3.662M1.434 14.58l-1.094.268a12 12 0 0 0 .96 2.591l-.265 1.14 1.096.255.36-1.539-.188-.365a10.8 10.8 0 0 1-.87-2.35m21.133 0a10.8 10.8 0 0 1-1.27 3.067l.962.584a12 12 0 0 0 1.402-3.383zm-1.793 3.848a11 11 0 0 1-2.345 2.345l.664.909a12 12 0 0 0 2.59-2.59zm-19.959 1.1L.357 21.48a1.8 1.8 0 0 0 2.162 2.161l1.954-.455-.256-1.095-1.953.455a.675.675 0 0 1-.81-.81l.454-1.954zm16.832 1.769a10.8 10.8 0 0 1-3.066 1.27l.268 1.093a12 12 0 0 0 3.382-1.402zm-10.94.213-1.54.36.256 1.095 1.139-.266c.814.415 1.683.74 2.591.961l.268-1.094a10.8 10.8 0 0 1-2.35-.869zm3.634 1.24-.172 1.111a12.1 12.1 0 0 0 3.662 0l-.17-1.111q-.812.125-1.66.125a11 11 0 0 1-1.66-.125",
    github: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
    gitlab: "m23.6004 9.5927-.0337-.0862L20.3.9814a.851.851 0 0 0-.3362-.405.8748.8748 0 0 0-.9997.0539.8748.8748 0 0 0-.29.4399l-2.2055 6.748H7.5375l-2.2057-6.748a.8573.8573 0 0 0-.29-.4412.8748.8748 0 0 0-.9997-.0537.8585.8585 0 0 0-.3362.4049L.4332 9.5015l-.0325.0862a6.0657 6.0657 0 0 0 2.0119 7.0105l.0113.0087.03.0213 4.976 3.7264 2.462 1.8633 1.4995 1.1321a1.0085 1.0085 0 0 0 1.2197 0l1.4995-1.1321 2.4619-1.8633 5.006-3.7489.0125-.01a6.0682 6.0682 0 0 0 2.0094-7.003z",
    stackoverflow: "M15.725 0l-1.72 1.277 6.39 8.588 1.716-1.277L15.725 0zm-3.94 3.418l-1.369 1.644 8.225 6.85 1.369-1.644-8.225-6.85zm-3.15 4.465l-.905 1.94 9.702 4.517.904-1.94-9.701-4.517zm-1.85 4.86l-.44 2.093 10.473 2.201.44-2.092-10.473-2.203zM1.89 15.47V24h19.19v-8.53h-2.133v6.397H4.021v-6.396H1.89zm4.265 2.133v2.13h10.66v-2.13H6.154Z",
    calendly: "M19.655 14.262c.281 0 .557.023.828.064 0 .005-.005.01-.005.014-.105.267-.234.534-.381.786l-1.219 2.106c-1.112 1.936-3.177 3.127-5.411 3.127h-2.432c-2.23 0-4.294-1.191-5.412-3.127l-1.218-2.106a6.251 6.251 0 0 1 0-6.252l1.218-2.106C6.736 4.832 8.8 3.641 11.035 3.641h2.432c2.23 0 4.294 1.191 5.411 3.127l1.219 2.106c.147.252.271.519.381.786 0 .004.005.009.005.014-.267.041-.543.064-.828.064-1.816 0-2.501-.607-3.291-1.306-.764-.676-1.711-1.517-3.44-1.517h-1.029c-1.251 0-2.387.455-3.2 1.278-.796.805-1.233 1.904-1.233 3.099v1.411c0 1.196.437 2.295 1.233 3.099.813.823 1.949 1.278 3.2 1.278h1.034c1.729 0 2.676-.841 3.439-1.517.791-.703 1.471-1.306 3.287-1.301Zm.005-3.237c.399 0 .794-.036 1.179-.11-.002-.004-.002-.01-.002-.014-.073-.414-.193-.823-.349-1.218.731-.12 1.407-.396 1.986-.819 0-.004-.005-.013-.005-.018-.331-1.085-.832-2.101-1.489-3.03-.649-.915-1.435-1.719-2.331-2.395-1.867-1.398-4.088-2.138-6.428-2.138-1.448 0-2.855.28-4.175.841-1.273.543-2.423 1.315-3.407 2.299S2.878 6.552 2.341 7.83c-.557 1.324-.842 2.726-.842 4.175 0 1.448.281 2.855.842 4.174.542 1.274 1.314 2.423 2.298 3.407s2.129 1.761 3.407 2.299c1.324.556 2.727.841 4.175.841 2.34 0 4.561-.74 6.428-2.137a10.815 10.815 0 0 0 2.331-2.396c.652-.929 1.158-1.949 1.489-3.03 0-.004.005-.014.005-.018-.579-.423-1.255-.699-1.986-.819.161-.395.276-.804.349-1.218.005-.009.005-.014.005-.023.869.166 1.692.506 2.404 1.035.685.505.552 1.075.446 1.416C22.184 20.437 17.619 24 12.221 24c-6.625 0-12-5.375-12-12s5.37-12 12-12c5.398 0 9.963 3.563 11.471 8.464.106.341.239.915-.446 1.421-.717.529-1.535.873-2.404 1.034.128.716.128 1.45 0 2.166-.387-.074-.782-.11-1.182-.11-4.184 0-3.968 2.823-6.736 2.823h-1.029c-1.899 0-3.15-1.357-3.15-3.095v-1.411c0-1.738 1.251-3.094 3.15-3.094h1.034c2.768 0 2.552 2.823 6.731 2.827Z",
    zoom: "M5.033 14.649H.743a.74.74 0 0 1-.686-.458.74.74 0 0 1 .16-.808L3.19 10.41H1.06A1.06 1.06 0 0 1 0 9.35h3.957c.301 0 .57.18.686.458a.74.74 0 0 1-.161.808L1.51 13.59h2.464c.585 0 1.06.475 1.06 1.06zM24 11.338c0-1.14-.927-2.066-2.066-2.066-.61 0-1.158.265-1.537.686a2.061 2.061 0 0 0-1.536-.686c-1.14 0-2.066.926-2.066 2.066v3.311a1.06 1.06 0 0 0 1.06-1.06v-2.251a1.004 1.004 0 0 1 2.013 0v2.251c0 .586.474 1.06 1.06 1.06v-3.311a1.004 1.004 0 0 1 2.012 0v2.251c0 .586.475 1.06 1.06 1.06zM16.265 12a2.728 2.728 0 1 1-5.457 0 2.728 2.728 0 0 1 5.457 0zm-1.06 0a1.669 1.669 0 1 0-3.338 0 1.669 1.669 0 0 0 3.338 0zm-4.82 0a2.728 2.728 0 1 1-5.458 0 2.728 2.728 0 0 1 5.457 0zm-1.06 0a1.669 1.669 0 1 0-3.338 0 1.669 1.669 0 0 0 3.338 0z",
    googlemeet: "M5.53 2.13 0 7.75h5.53zm.398 0v5.62h7.608v3.65l5.47-4.45c-.014-1.22.031-2.25-.025-3.46-.148-1.09-1.287-1.47-2.236-1.36zM23.1 4.32c-.802.295-1.358.995-2.047 1.49-2.506 2.05-4.982 4.12-7.468 6.19 3.025 2.59 6.04 5.18 9.065 7.76 1.218.671 1.428-.814 1.328-1.64v-13a.828.828 0 0 0-.877-.825zM.038 8.15v7.7h5.53v-7.7zm13.577 8.1H6.008v5.62c3.864-.006 7.737.011 11.58-.009 1.02-.07 1.618-1.12 1.468-2.07v-2.51l-5.47-4.68v3.65zm-13.577 0c.02 1.44-.041 2.88.033 4.31.162.948 1.158 1.43 2.047 1.31h3.464v-5.62z",
    microsoftteams: "M20.625 8.127q-.55 0-1.025-.205-.475-.205-.832-.563-.358-.357-.563-.832Q18 6.053 18 5.502q0-.54.205-1.02t.563-.837q.357-.358.832-.563.474-.205 1.025-.205.54 0 1.02.205t.837.563q.358.357.563.837.205.48.205 1.02 0 .55-.205 1.025-.205.475-.563.832-.357.358-.837.563-.48.205-1.02.205zm0-3.75q-.469 0-.797.328-.328.328-.328.797 0 .469.328.797.328.328.797.328.469 0 .797-.328.328-.328.328-.797 0-.469-.328-.797-.328-.328-.797-.328zM24 10.002v5.578q0 .774-.293 1.46-.293.685-.803 1.194-.51.51-1.195.803-.686.293-1.459.293-.445 0-.908-.105-.463-.106-.85-.329-.293.95-.855 1.729-.563.78-1.319 1.336-.756.557-1.67.861-.914.305-1.898.305-1.148 0-2.162-.398-1.014-.399-1.805-1.102-.79-.703-1.312-1.664t-.674-2.086h-5.8q-.411 0-.704-.293T0 16.881V6.873q0-.41.293-.703t.703-.293h8.59q-.34-.715-.34-1.5 0-.727.275-1.365.276-.639.75-1.114.475-.474 1.114-.75.638-.275 1.365-.275t1.365.275q.639.276 1.114.75.474.475.75 1.114.275.638.275 1.365t-.275 1.365q-.276.639-.75 1.113-.475.475-1.114.75-.638.276-1.365.276-.188 0-.375-.024-.188-.023-.375-.058v1.078h10.875q.469 0 .797.328.328.328.328.797zM12.75 2.373q-.41 0-.78.158-.368.158-.638.434-.27.275-.428.639-.158.363-.158.773 0 .41.158.78.159.368.428.638.27.27.639.428.369.158.779.158.41 0 .773-.158.364-.159.64-.428.274-.27.433-.639.158-.369.158-.779 0-.41-.158-.773-.159-.364-.434-.64-.275-.275-.639-.433-.363-.158-.773-.158zM6.937 9.814h2.25V7.94H2.814v1.875h2.25v6h1.875zm10.313 7.313v-6.75H12v6.504q0 .41-.293.703t-.703.293H8.309q.152.809.556 1.5.405.691.985 1.19.58.497 1.318.779.738.281 1.582.281.926 0 1.746-.352.82-.351 1.436-.966.615-.616.966-1.43.352-.815.352-1.752zm5.25-1.547v-5.203h-3.75v6.855q.305.305.691.452.387.146.809.146.469 0 .879-.176.41-.175.715-.48.304-.305.48-.715t.176-.879Z",
    medium: "M4.21 0A4.201 4.201 0 0 0 0 4.21v15.58A4.201 4.201 0 0 0 4.21 24h15.58A4.201 4.201 0 0 0 24 19.79v-1.093c-.137.013-.278.02-.422.02-2.577 0-4.027-2.146-4.09-4.832a7.592 7.592 0 0 1 .022-.708c.093-1.186.475-2.241 1.105-3.022a3.885 3.885 0 0 1 1.395-1.1c.468-.237 1.127-.367 1.664-.367h.023c.101 0 .202.004.303.01V4.211A4.201 4.201 0 0 0 19.79 0Zm.198 5.583h4.165l3.588 8.435 3.59-8.435h3.864v.146l-.019.004c-.705.16-1.063.397-1.063 1.254h-.003l.003 10.274c.06.676.424.885 1.063 1.03l.02.004v.145h-4.923v-.145l.019-.005c.639-.144.994-.353 1.054-1.03V7.267l-4.745 11.15h-.261L6.15 7.569v9.445c0 .857.358 1.094 1.063 1.253l.02.004v.147H4.405v-.147l.019-.004c.705-.16 1.065-.397 1.065-1.253V6.987c0-.857-.358-1.094-1.064-1.254l-.018-.004zm19.25 3.668c-1.086.023-1.733 1.323-1.813 3.124H24V9.298a1.378 1.378 0 0 0-.342-.047Zm-1.862 3.632c-.1 1.756.86 3.239 2.204 3.634v-3.634z",
    substack: "M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z",
    behance: "M16.969 16.927a2.561 2.561 0 0 0 1.901.677 2.501 2.501 0 0 0 1.531-.475c.362-.235.636-.584.779-.99h2.585a5.091 5.091 0 0 1-1.9 2.896 5.292 5.292 0 0 1-3.091.88 5.839 5.839 0 0 1-2.284-.433 4.871 4.871 0 0 1-1.723-1.211 5.657 5.657 0 0 1-1.08-1.874 7.057 7.057 0 0 1-.383-2.393c-.005-.8.129-1.595.396-2.349a5.313 5.313 0 0 1 5.088-3.604 4.87 4.87 0 0 1 2.376.563c.661.362 1.231.87 1.668 1.485a6.2 6.2 0 0 1 .943 2.133c.194.821.263 1.666.205 2.508h-7.699c-.063.79.184 1.574.688 2.187ZM6.947 4.084a8.065 8.065 0 0 1 1.928.198 4.29 4.29 0 0 1 1.49.638c.418.303.748.711.958 1.182.241.579.357 1.203.341 1.83a3.506 3.506 0 0 1-.506 1.961 3.726 3.726 0 0 1-1.503 1.287 3.588 3.588 0 0 1 2.027 1.437c.464.747.697 1.615.67 2.494a4.593 4.593 0 0 1-.423 2.032 3.945 3.945 0 0 1-1.163 1.413 5.114 5.114 0 0 1-1.683.807 7.135 7.135 0 0 1-1.928.259H0V4.084h6.947Zm-.235 12.9c.308.004.616-.029.916-.099a2.18 2.18 0 0 0 .766-.332c.228-.158.411-.371.534-.619.142-.317.208-.663.191-1.009a2.08 2.08 0 0 0-.642-1.715 2.618 2.618 0 0 0-1.696-.505h-3.54v4.279h3.471Zm13.635-5.967a2.13 2.13 0 0 0-1.654-.619 2.336 2.336 0 0 0-1.163.259 2.474 2.474 0 0 0-.738.62 2.359 2.359 0 0 0-.396.792c-.074.239-.12.485-.137.734h4.769a3.239 3.239 0 0 0-.679-1.785l-.002-.001Zm-13.813-.648a2.254 2.254 0 0 0 1.423-.433c.399-.355.607-.88.56-1.413a1.916 1.916 0 0 0-.178-.891 1.298 1.298 0 0 0-.495-.533 1.851 1.851 0 0 0-.711-.274 3.966 3.966 0 0 0-.835-.073H3.241v3.631h3.293v-.014ZM21.62 5.122h-5.976v1.527h5.976V5.122Z",
    dribbble: "M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z",
    spotify: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z",
    applemusic: "M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.045-1.773-.6-1.943-1.536a1.88 1.88 0 011.038-2.022c.323-.16.67-.25 1.018-.324.378-.082.758-.153 1.134-.24.274-.063.457-.23.51-.516a.904.904 0 00.02-.193c0-1.815 0-3.63-.002-5.443a.725.725 0 00-.026-.185c-.04-.15-.15-.243-.304-.234-.16.01-.318.035-.475.066-.76.15-1.52.303-2.28.456l-2.325.47-1.374.278c-.016.003-.032.01-.048.013-.277.077-.377.203-.39.49-.002.042 0 .086 0 .13-.002 2.602 0 5.204-.003 7.805 0 .42-.047.836-.215 1.227-.278.64-.77 1.04-1.434 1.233-.35.1-.71.16-1.075.172-.96.036-1.755-.6-1.92-1.544-.14-.812.23-1.685 1.154-2.075.357-.15.73-.232 1.108-.31.287-.06.575-.116.86-.177.383-.083.583-.323.6-.714v-.15c0-2.96 0-5.922.002-8.882 0-.123.013-.25.042-.37.07-.285.273-.448.546-.518.255-.066.515-.112.774-.165.733-.15 1.466-.296 2.2-.444l2.27-.46c.67-.134 1.34-.27 2.01-.403.22-.043.442-.088.663-.106.31-.025.523.17.554.482.008.073.012.148.012.223.002 1.91.002 3.822 0 5.732z",
    soundcloud: "M23.999 14.165c-.052 1.796-1.612 3.169-3.4 3.169h-8.18a.68.68 0 0 1-.675-.683V7.862a.747.747 0 0 1 .452-.724s.75-.513 2.333-.513a5.364 5.364 0 0 1 2.763.755 5.433 5.433 0 0 1 2.57 3.54c.282-.08.574-.121.868-.12.884 0 1.73.358 2.347.992s.948 1.49.922 2.373ZM10.721 8.421c.247 2.98.427 5.697 0 8.672a.264.264 0 0 1-.53 0c-.395-2.946-.22-5.718 0-8.672a.264.264 0 0 1 .53 0ZM9.072 9.448c.285 2.659.37 4.986-.006 7.655a.277.277 0 0 1-.55 0c-.331-2.63-.256-5.02 0-7.655a.277.277 0 0 1 .556 0Zm-1.663-.257c.27 2.726.39 5.171 0 7.904a.266.266 0 0 1-.532 0c-.38-2.69-.257-5.21 0-7.904a.266.266 0 0 1 .532 0Zm-1.647.77a26.108 26.108 0 0 1-.008 7.147.272.272 0 0 1-.542 0 27.955 27.955 0 0 1 0-7.147.275.275 0 0 1 .55 0Zm-1.67 1.769c.421 1.865.228 3.5-.029 5.388a.257.257 0 0 1-.514 0c-.21-1.858-.398-3.549 0-5.389a.272.272 0 0 1 .543 0Zm-1.655-.273c.388 1.897.26 3.508-.01 5.412-.026.28-.514.283-.54 0-.244-1.878-.347-3.54-.01-5.412a.283.283 0 0 1 .56 0Zm-1.668.911c.4 1.268.257 2.292-.026 3.572a.257.257 0 0 1-.514 0c-.241-1.262-.354-2.312-.023-3.572a.283.283 0 0 1 .563 0Z",
    amazon: "M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.051-.13zm6.565-6.218c0-1.005.247-1.863.743-2.577.495-.71 1.17-1.25 2.04-1.615.796-.335 1.756-.575 2.912-.72.39-.046 1.033-.103 1.92-.174v-.37c0-.93-.105-1.558-.3-1.875-.302-.43-.78-.65-1.44-.65h-.182c-.48.046-.896.196-1.246.46-.35.27-.575.63-.675 1.096-.06.3-.206.465-.435.51l-2.52-.315c-.248-.06-.372-.18-.372-.39 0-.046.007-.09.022-.15.247-1.29.855-2.25 1.82-2.88.976-.616 2.1-.975 3.39-1.05h.54c1.65 0 2.957.434 3.888 1.29.135.15.27.3.405.48.12.165.224.314.283.45.075.134.15.33.195.57.06.254.105.42.135.51.03.104.062.3.076.615.01.313.02.493.02.553v5.28c0 .376.06.72.165 1.036.105.313.21.54.315.674l.51.674c.09.136.136.256.136.36 0 .12-.06.226-.18.314-1.2 1.05-1.86 1.62-1.963 1.71-.165.135-.375.15-.63.045a6.062 6.062 0 01-.526-.496l-.31-.347a9.391 9.391 0 01-.317-.42l-.3-.435c-.81.886-1.603 1.44-2.4 1.665-.494.15-1.093.227-1.83.227-1.11 0-2.04-.343-2.76-1.034-.72-.69-1.08-1.665-1.08-2.94l-.05-.076zm3.753-.438c0 .566.14 1.02.425 1.364.285.34.675.512.155.512.045 0 .106-.007.195-.02.09-.016.134-.023.166-.023.614-.16 1.08-.553 1.424-1.178.165-.28.285-.58.36-.91.09-.32.12-.59.135-.8.015-.195.015-.54.015-1.005v-.54c-.84 0-1.484.06-1.92.18-1.275.36-1.92 1.17-1.92 2.43l-.035-.02zm9.162 7.027c.03-.06.075-.11.132-.17.362-.243.714-.41 1.05-.5a8.094 8.094 0 011.612-.24c.14-.012.28 0 .41.03.65.06 1.05.168 1.172.33.063.09.099.228.099.39v.15c0 .51-.149 1.11-.424 1.8-.278.69-.664 1.248-1.156 1.68-.073.06-.14.09-.197.09-.03 0-.06 0-.09-.012-.09-.044-.107-.12-.064-.24.54-1.26.806-2.143.806-2.64 0-.15-.03-.27-.087-.344-.145-.166-.55-.257-1.224-.257-.243 0-.533.016-.87.046-.363.045-.7.09-1 .135-.09 0-.148-.014-.18-.044-.03-.03-.036-.047-.02-.077 0-.017.006-.03.02-.063v-.06z",
    amazonpay: "M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.051-.13zm6.565-6.218c0-1.005.247-1.863.743-2.577.495-.71 1.17-1.25 2.04-1.615.796-.335 1.756-.575 2.912-.72.39-.046 1.033-.103 1.92-.174v-.37c0-.93-.105-1.558-.3-1.875-.302-.43-.78-.65-1.44-.65h-.182c-.48.046-.896.196-1.246.46-.35.27-.575.63-.675 1.096-.06.3-.206.465-.435.51l-2.52-.315c-.248-.06-.372-.18-.372-.39 0-.046.007-.09.022-.15.247-1.29.855-2.25 1.82-2.88.976-.616 2.1-.975 3.39-1.05h.54c1.65 0 2.957.434 3.888 1.29.135.15.27.3.405.48.12.165.224.314.283.45.075.134.15.33.195.57.06.254.105.42.135.51.03.104.062.3.076.615.01.313.02.493.02.553v5.28c0 .376.06.72.165 1.036.105.313.21.54.315.674l.51.674c.09.136.136.256.136.36 0 .12-.06.226-.18.314-1.2 1.05-1.86 1.62-1.963 1.71-.165.135-.375.15-.63.045a6.062 6.062 0 01-.526-.496l-.31-.347a9.391 9.391 0 01-.317-.42l-.3-.435c-.81.886-1.603 1.44-2.4 1.665-.494.15-1.093.227-1.83.227-1.11 0-2.04-.343-2.76-1.034-.72-.69-1.08-1.665-1.08-2.94l-.05-.076zm3.753-.438c0 .566.14 1.02.425 1.364.285.34.675.512 1.155.512.045 0 .106-.007.195-.02.09-.016.134-.023.166-.023.614-.16 1.08-.553 1.424-1.178.165-.28.285-.58.36-.91.09-.32.12-.59.135-.8.015-.195.015-.54.015-1.005v-.54c-.84 0-1.484.06-1.92.18-1.275.36-1.92 1.17-1.92 2.43l-.035-.02zm9.162 7.027c.03-.06.075-.11.132-.17.362-.243.714-.41 1.05-.5a8.094 8.094 0 011.612-.24c.14-.012.28 0 .41.03.65.06 1.05.168 1.172.33.063.09.099.228.099.39v.15c0 .51-.149 1.11-.424 1.8-.278.69-.664 1.248-1.156 1.68-.073.06-.14.09-.197.09-.03 0-.06 0-.09-.012-.09-.044-.107-.12-.064-.24.54-1.26.806-2.143.806-2.64 0-.15-.03-.27-.087-.344-.145-.166-.55-.257-1.224-.257-.243 0-.533.016-.87.046-.363.045-.7.09-1 .135-.09 0-.148-.014-.18-.044-.03-.03-.036-.047-.02-.077 0-.017.006-.03.02-.063v-.06z",
    flipkart: "M3.833 1.333a.993.993 0 0 0-.333.061V1c0-.551.449-1 1-1h14.667c.551 0 1 .449 1 1v.333H3.833zm17.334 2.334H2.833c-.551 0-1 .449-1 1V23c0 .551.449 1 1 1h7.3l1.098-5.645h-2.24c-.051 0-5.158-.241-5.158-.241l4.639-.327-.078-.366-1.978-.285 1.882-.158-.124-.449-3.075-.467s3.341-.373 3.392-.373h3.232l.247-1.331c.289-1.616.945-2.807 1.973-3.693 1.033-.892 2.344-1.332 3.937-1.332.643 0 1.053.151 1.231.463.118.186.201.516.279.859.074.352.14.671.095.903-.057.345-.461.465-1.197.465h-.253c-1.327 0-2.134.763-2.405 2.31l-.243 1.355h1.54c.574 0 .781.402.622 1.306-.17.941-.539 1.36-1.111 1.36H14.9L13.804 24h7.362c.551 0 1-.449 1-1V4.667a1 1 0 0 0-.999-1zM20.5 2.333A.334.334 0 0 0 20.167 2H3.833a.334.334 0 0 0-.333.333V3h17v-.667z",
    shopify: "M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z",
    etsy: "M8.559 2.445c0-.325.033-.52.59-.52h7.465c1.3 0 2.02 1.11 2.54 3.193l.42 1.666h1.27c.23-4.728.43-6.784.43-6.784s-3.196.36-5.09.36H6.635L1.521.196v1.37l1.725.326c1.21.24 1.5.496 1.6 1.606 0 0 .11 3.27.11 8.64 0 5.385-.09 8.61-.09 8.61 0 .973-.39 1.333-1.59 1.573l-1.722.33V24l5.13-.165h8.55c1.935 0 6.39.165 6.39.165.105-1.17.75-6.48.855-7.064h-1.2l-1.284 2.91c-1.005 2.28-2.476 2.445-4.11 2.445h-4.906c-1.63 0-2.415-.64-2.415-2.05V12.8s3.62 0 4.79.096c.912.064 1.463.325 1.76 1.598l.39 1.695h1.41l-.09-4.278.192-4.305h-1.391l-.45 1.89c-.283 1.244-.48 1.47-1.754 1.6-1.666.17-4.815.14-4.815.14V2.45h-.05z",
    googlepay: "M3.963 7.235A3.963 3.963 0 00.422 9.419a3.963 3.963 0 000 3.559 3.963 3.963 0 003.541 2.184c1.07 0 1.97-.352 2.627-.957.748-.69 1.18-1.71 1.18-2.916a4.722 4.722 0 00-.07-.806H3.964v1.526h2.14a1.835 1.835 0 01-.79 1.205c-.356.241-.814.379-1.35.379-1.034 0-1.911-.697-2.225-1.636a2.375 2.375 0 010-1.517c.314-.94 1.191-1.636 2.225-1.636a2.152 2.152 0 011.52.594l1.132-1.13a3.808 3.808 0 00-2.652-1.033zm6.501.55v6.9h.886V11.89h1.465c.603 0 1.11-.196 1.522-.588a1.911 1.911 0 00.635-1.464 1.92 1.92 0 00-.635-1.456 2.125 2.125 0 00-1.522-.598zm2.427.85a1.156 1.156 0 01.823.365 1.176 1.176 0 010 1.686 1.171 1.171 0 01-.877.357H11.35V8.635h1.487a1.156 1.156 0 01.054 0zm4.124 1.175c-.842 0-1.477.308-1.907.925l.781.491c.288-.417.68-.626 1.175-.626a1.255 1.255 0 01.856.323 1.009 1.009 0 01.366.785v.202c-.34-.193-.774-.289-1.3-.289-.617 0-1.11.145-1.479.434-.37.288-.554.677-.554 1.165a1.476 1.476 0 00.525 1.156c.35.308.785.463 1.305.463.61 0 1.098-.27 1.465-.81h.038v.655h.848v-2.909c0-.61-.19-1.09-.568-1.44-.38-.35-.896-.525-1.551-.525zm2.263.154l1.946 4.422-1.098 2.38h.915L24 9.963h-.965l-1.368 3.391h-.02l-1.406-3.39zm-2.146 2.368c.494 0 .88.11 1.156.33 0 .372-.147.696-.44.973a1.413 1.413 0 01-.997.414 1.081 1.081 0 01-.69-.232.708.708 0 01-.293-.578c0-.257.12-.47.363-.647.24-.173.54-.26.9-.26Z",
    phonepe: "M10.206 9.941h2.949v4.692c-.402.201-.938.268-1.34.268-1.072 0-1.609-.536-1.609-1.743V9.941zm13.47 4.816c-1.523 6.449-7.985 10.442-14.433 8.919C2.794 22.154-1.199 15.691.324 9.243 1.847 2.794 8.309-1.199 14.757.324c6.449 1.523 10.442 7.985 8.919 14.433zm-6.231-5.888a.887.887 0 0 0-.871-.871h-1.609l-3.686-4.222c-.335-.402-.871-.536-1.407-.402l-1.274.401c-.201.067-.268.335-.134.469l4.021 3.82H6.386c-.201 0-.335.134-.335.335v.67c0 .469.402.871.871.871h.938v3.217c0 2.413 1.273 3.82 3.418 3.82.67 0 1.206-.067 1.877-.335v2.145c0 .603.469 1.072 1.072 1.072h.938a.432.432 0 0 0 .402-.402V9.874h1.542c.201 0 .335-.134.335-.335v-.67z",
    paytm: "M15.85 8.167a.204.204 0 0 0-.04.004c-.68.19-.543 1.148-1.781 1.23h-.12a.23.23 0 0 0-.052.005h-.001a.24.24 0 0 0-.184.235v1.09c0 .134.106.241.237.241h.645v4.623c0 .132.104.238.233.238h1.058a.236.236 0 0 0 .233-.238v-4.623h.6c.13 0 .236-.107.236-.241v-1.09a.239.239 0 0 0-.236-.24h-.612V8.386a.218.218 0 0 0-.216-.22zm4.225 1.17c-.398 0-.762.15-1.042.395v-.124a.238.238 0 0 0-.234-.224h-1.07a.24.24 0 0 0-.236.242v5.92a.24.24 0 0 0 .236.242h1.07c.12 0 .217-.091.233-.209v-4.25a.393.393 0 0 1 .371-.408h.196a.41.41 0 0 1 .226.09.405.405 0 0 1 .145.319v4.074l.004.155a.24.24 0 0 0 .237.241h1.07a.239.239 0 0 0 .235-.23l-.001-4.246c0-.14.062-.266.174-.34a.419.419 0 0 1 .196-.068h.198c.23.02.37.2.37.408.005 1.396.004 2.8.004 4.224a.24.24 0 0 0 .237.241h1.07c.13 0 .236-.108.236-.241v-4.543c0-.31-.034-.442-.08-.577a1.601 1.601 0 0 0-1.51-1.09h-.015a1.58 1.58 0 0 0-1.152.5c-.291-.308-.7-.5-1.153-.5zM.232 9.4A.234.234 0 0 0 0 9.636v5.924c0 .132.096.238.216.241h1.09c.13 0 .237-.107.237-.24l.004-1.658H2.57c.857 0 1.453-.605 1.453-1.481v-1.538c0-.877-.596-1.484-1.453-1.484H.232zm9.032 0a.239.239 0 0 0-.237.241v2.47c0 .94.657 1.608 1.579 1.608h.675s.016 0 .037.004a.253.253 0 0 1 .222.253c0 .13-.096.235-.219.251l-.018.004-.303.006H9.739a.239.239 0 0 0-.236.24v1.09a.24.24 0 0 0 .236.242h1.75c.92 0 1.577-.669 1.577-1.608v-4.56a.239.239 0 0 0-.236-.24h-1.07a.239.239 0 0 0-.236.24c-.005.787 0 1.525 0 2.255a.253.253 0 0 1-.25.25h-.449a.253.253 0 0 1-.25-.255c.005-.754-.005-1.5-.005-2.25a.239.239 0 0 0-.236-.24zm-4.004.006a.232.232 0 0 0-.238.226v1.023c0 .132.113.24.252.24h1.413c.112.017.2.1.213.23v.14c-.013.124-.1.214-.207.224h-.7c-.93 0-1.594.63-1.594 1.515v1.269c0 .88.57 1.506 1.495 1.506h1.94c.348 0 .63-.27.63-.6v-4.136c0-1.004-.508-1.637-1.72-1.637zm-3.713 1.572h.678c.139 0 .25.115.25.256v.836a.253.253 0 0 1-.25.256h-.1c-.192.002-.386 0-.578 0zm4.67 1.977h.445c.139 0 .252.108.252.24v.932a.23.23 0 0 1-.014.076.25.25 0 0 1-.238.164h-.445a.247.247 0 0 1-.252-.24v-.933c0-.132.113-.239.252-.239Z",
    razorpay: "M22.436 0l-11.91 7.773-1.174 4.276 6.625-4.297L11.65 24h4.391l6.395-24zM14.26 10.098L3.389 17.166 1.564 24h9.008l3.688-13.902Z",
    upi: "M2 3l11 9-11 9V3zm10 0l11 9-11 9V3z",
    // ── New platforms ──────────────────────────────────────────
    // Social
    tumblr: "M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.63-1.313 4.512-4.596 4.71-6.469C9.84.051 9.941 0 9.999 0h3.517v6.114h4.801v3.633h-4.82v7.47c.016 1.001.375 2.371 2.207 2.371h.09c.631-.02 1.486-.205 1.936-.419l1.156 3.425c-.436.636-2.4 1.374-4.156 1.404h-.166z",
    bluesky: "M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z",
    mastodon: "M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.053.053 0 0 0-.066-.051 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.052.052 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422 2.435-.464 4.753-1.92 4.989-5.604.008-.145.028-1.52.028-1.67.002-.512.167-3.63-.023-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z",
    // Messaging
    line: "M19.365 9.863c.349 0 .63.285.63.63 0 .348-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0",
    viber: "M11.398.002C8.95-.034 3.742.948 1.535 8.021.44 11.519.525 14.535.525 14.535s.013 2.76.793 5.24c.779 2.48 4.037 5.24 4.037 5.24s2.697 2.337 5.24 2.573c2.54.237 4.04.11 4.04.11l.186-.025s4.04-.49 6.576-3.08c2.68-2.74 2.59-7.71 2.59-7.71s-.013-4.56-2.59-6.963C18.886.943 13.847.038 11.398.002zm5.744 18.61a1.07 1.07 0 0 1-.323.25c-.288.142-.764.234-1.156.032a27.056 27.056 0 0 1-2.54-1.59c-.726-.53-1.41-1.11-2.015-1.765a16.527 16.527 0 0 1-1.565-2.1 14.16 14.16 0 0 1-1.008-2.133c-.234-.65-.345-1.275-.315-1.85.02-.403.15-.772.394-1.08l.04-.046c.246-.282.538-.43.864-.447h.014c.25 0 .477.09.65.258.194.178.344.415.457.658.182.393.33.806.46 1.197.128.384.187.741.105 1.04-.048.176-.18.35-.364.514l-.195.17c-.175.154-.234.384-.156.586.117.3.303.621.558.997.38.56.82 1.078 1.294 1.548.477.474.994.91 1.548 1.292.378.255.697.44.998.558.201.078.43.018.585-.156l.17-.195c.165-.183.338-.316.514-.364.298-.082.656-.024 1.04.105.392.13.805.278 1.196.46.244.113.48.263.659.458.169.173.257.4.258.65v.014c-.017.326-.166.618-.447.864l-.046.04z",
    skype: "M23.04 14.064c.145-.636.217-1.28.219-1.927-.012-5.9-5.043-10.712-11.26-10.704-5.68.006-10.418 4.027-11.102 9.398C.338 17.017 2.31 22.126 6.42 24a11.18 11.18 0 0 0 5.58.005c5.663-1.257 9.665-6.284 9.665-12.168-.003-.456-.025-.912-.068-1.367zm-4.95 1.286c-.192.498-.51.913-.906 1.2-.399.29-.873.465-1.382.518-.495.051-.993.065-1.488.065-.86 0-1.709-.115-2.386-.48-.676-.367-1.193-.983-1.4-1.793-.067-.262-.099-.53-.096-.8h2.097c-.003.23.034.459.108.675.094.264.267.493.498.655.23.16.512.246.81.246.203 0 .408-.025.606-.076.237-.062.459-.192.623-.384.163-.193.264-.446.264-.716 0-.254-.064-.492-.177-.706a1.524 1.524 0 0 0-.51-.54 3.47 3.47 0 0 0-.764-.378 11.047 11.047 0 0 0-.966-.29 11.91 11.91 0 0 1-1.08-.36 4.52 4.52 0 0 1-.928-.533 2.604 2.604 0 0 1-.65-.787c-.167-.318-.255-.68-.261-1.07-.002-.468.13-.925.379-1.334.25-.407.625-.745 1.085-1.001.457-.255.992-.406 1.555-.477.567-.07 1.14-.067 1.699.01.566.078 1.098.252 1.55.546.454.294.81.693 1.054 1.18.238.48.339 1.03.327 1.597H15.62c.006-.25-.033-.5-.114-.736a1.404 1.404 0 0 0-.453-.587 1.54 1.54 0 0 0-.747-.271 2.48 2.48 0 0 0-.554.012 2.13 2.13 0 0 0-.524.149c-.163.08-.31.195-.427.337a.915.915 0 0 0-.177.565c.003.25.087.478.24.662.155.184.374.327.62.44.244.113.517.21.812.296.297.086.594.183.882.293.298.11.581.24.844.392.264.153.495.336.686.55.192.214.342.462.437.73z",
    messenger: "M12 0C5.374 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.975 12-11.111C24 4.974 18.626 0 12 0zm1.194 14.963l-3.055-3.26-5.963 3.26L10.895 7.2l3.13 3.26 5.89-3.26-6.721 7.763z",
    // Developer
    bitbucket: "M.778 1.213a.768.768 0 0 0-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 0 0 .77-.646l3.27-20.03a.768.768 0 0 0-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z",
    codepen: "M24 8.182l-.018-.087-.017-.05c-.01-.024-.018-.05-.03-.075-.003-.018-.015-.034-.02-.05l-.035-.067-.03-.05-.044-.06-.046-.045-.06-.045-.046-.03-.06-.044-.044-.04-.015-.02L12.58.19c-.347-.232-.796-.232-1.142 0L.453 7.502l-.015.015-.044.035-.06.05-.038.04-.05.056-.037.045-.05.06-.032.046-.05.06-.02.06c-.02.01-.02.04-.03.07l-.01.05C0 8.12 0 8.15 0 8.18v7.497c0 .044.003.09.01.135l.01.046c.005.03.01.06.02.086l.015.05c.01.027.016.053.027.075l.022.05c0 .01.015.04.03.06l.03.04c.015.01.03.04.045.06l.03.04.04.04c.01.013.01.03.03.03l.06.042.04.03.01.014 11.024 7.285c.35.233.792.233 1.14 0l11.02-7.285.015-.014.046-.037.06-.043c.01-.015.03-.03.03-.03l.04-.04.03-.05c.01-.01.03-.03.04-.05l.026-.06c.01-.02.021-.04.03-.07l.015-.05c.009-.004.009-.027.009-.045l.01-.135V8.18c0-.07 0-.14-.012-.19zm-9.756 3.49l-3.455 2.27-3.324-2.19V10.28l3.324-2.19 3.455 2.19zm-.536-4.532L12 5.031l1.93 1.19-3.324 2.19-3.324-2.19L12 5.031l1.708 1.109zM7.045 12.023l-2.99 1.965-.96-.635V10.05l.96-.635 2.99 1.965v.643zm3.58 2.354l3.324 2.19L12 17.96l-1.93-1.19 3.324-2.19zm.96-.635l2.99-1.965v.643l2.99 1.965.96.635v3.303l-.96.635-2.99-1.965V13.742z",
    replit: "M2.186 0A2.186 2.186 0 0 0 0 2.186v5.404C0 8.77 1.05 9.82 2.186 9.82H6.56v4.357H2.186A2.186 2.186 0 0 0 0 16.363v5.451A2.186 2.186 0 0 0 2.186 24H9.82V14.18h4.357V24h7.637A2.186 2.186 0 0 0 24 21.814v-5.451a2.186 2.186 0 0 0-2.186-2.186H17.46V9.82h4.354A2.186 2.186 0 0 0 24 7.59V2.186A2.186 2.186 0 0 0 21.814 0H2.186z",
    hackernews: "M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.449h1.874v-5.426l4.148-7.73h-2.172l-2.92 5.709-2.854-5.71H6.951z",
    devto: "M7.826 10.083a.784.784 0 0 0-.468-.175h-.701v4.198h.701a.786.786 0 0 0 .468-.175c.155-.117.233-.292.233-.525v-2.798c.001-.233-.078-.408-.233-.525zM19.236 3H4.764C3.791 3 3.002 3.787 3 4.76v14.48c.002.973.791 1.76 1.764 1.76h14.473c.973 0 1.762-.787 1.764-1.76V4.76A1.765 1.765 0 0 0 19.236 3zM9.195 13.414c0 .755-.466 1.901-1.942 1.898H5.009V8.687h2.256c1.429 0 1.93 1.144 1.93 1.899v2.828zm4.045-3.562H11.1v1.544h1.309v1.188H11.1v1.543h2.142v1.188h-2.498a.813.813 0 0 1-.833-.792V9.485a.813.813 0 0 1 .792-.833h2.539l-.002 1.2zm4.165 4.632c-.531 1.235-1.481.99-1.906 0l-1.548-5.818h1.309l1.014 3.797 1.011-3.797H18.5l-1.095 5.818z",
    // Business
    notion: "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z",
    loom: "M22.367 9.32h-7.726l6.687-3.861-1.219-2.112-6.687 3.862 3.862-6.688-2.113-1.219-3.861 6.688V-.007h-2.44v7.726L4.984 1.03 2.873 2.249l3.862 6.687H-.004v2.44h7.726L1.034 15.04l1.219 2.112 6.687-3.861-3.861 6.687 2.112 1.22 3.862-6.688v7.727h2.44v-7.727l3.861 6.688 2.113-1.22-3.862-6.687 6.688 3.861 1.218-2.112-6.688-3.861h7.727V9.32z",
    slack: "M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z",
    typeform: "M13.323 0H0v2.68h5.31v18.605h2.696V2.68h5.317zm3.22 7.31h-2.702v13.974h2.703V7.31zm6.133 0h-2.695v13.974h2.695V7.31zm1.324 0v2.68H24V7.31z",
    // Content
    ghost: "M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm0 3.97a8.03 8.03 0 1 1 0 16.06A8.03 8.03 0 0 1 12 3.97zm-.093 2.764a5.266 5.266 0 0 0-5.265 5.266 5.266 5.266 0 0 0 5.265 5.265 5.263 5.263 0 0 0 5.157-4.227 7.16 7.16 0 0 1-4.157 1.334 7.164 7.164 0 0 1-5.4-2.45 5.25 5.25 0 0 0 3.643-1.477 2.633 2.633 0 1 1 .757-5.711z",
    hashnode: "M13.997 7.99c3.313 0 6.003 2.69 6.003 6.003 0 3.313-2.69 6.003-6.003 6.003H9.996V13.993h4.001v4.006l.006-.006c1.105 0 2-.895 2-2v-2c0-1.105-.895-2-2-2H9.997V7.99h4zm-3 0v4H7v6h4.003v4.006H6.003A6.003 6.003 0 0 1 0 16V9.993A6.003 6.003 0 0 1 6.003 4h4.994v3.99z",
    figma: "M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.026-4.49 4.515-4.49c2.49 0 4.515 2.014 4.515 4.49S10.661 24 8.172 24zm0-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019 3.019-1.355 3.019-3.019-1.354-3.019-3.019-3.019z",
    mirror: "M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 2c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8zm-1 3v4H7l5 5 5-5h-4V7h-2z",
    // Music
    youtubemusic: "M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm-1.488 16.464L8.04 14.424V9.888l2.472-2.04 5.04 4.296-5.04 4.32z",
    amazonmusic: "M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.051-.13zm22.3-1.61a.97.97 0 0 0-.64-.32c-.137-.01-.277.02-.41.09l-.011.006c-.215.12-.55.266-.856.416-.31.15-.611.25-.81.25-.295 0-.36-.177-.244-.498.13-.357.37-.883.578-1.395a7.12 7.12 0 0 0 .358-1.37c0-.573-.317-.932-.936-.94-.458-.007-1.003.222-1.577.616-.567.388-1.023.807-1.238 1.064-.188.222-.186.548.015.756.22.224.566.24.824.041.248-.193.56-.457.862-.676.302-.22.572-.36.737-.36.19 0 .257.127.147.427l-.036.1c-.174.476-.387 1.07-.387 1.609 0 .758.444 1.094 1.086 1.094.402 0 .874-.162 1.35-.405.484-.247.894-.528 1.097-.706a.658.658 0 0 0 .218-.56z",
    tidal: "M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004L8.008 16l4.004-4 4.004 4 4.004-4.004L16.016 8l-4.004-3.992V4zM12 12.008l-4-4 4-4 4 4z",
    deezer: "M21.812 3.77c0 2.084-1.69 3.77-3.77 3.77s-3.77-1.686-3.77-3.77S15.962 0 18.043 0s3.77 1.687 3.77 3.77zm-8.547 5.037a3.77 3.77 0 0 0-3.77 3.77 3.77 3.77 0 0 0 3.77 3.77 3.77 3.77 0 0 0 3.77-3.77 3.77 3.77 0 0 0-3.77-3.77zm-8.546 0a3.77 3.77 0 0 0-3.77 3.77 3.77 3.77 0 0 0 3.77 3.77 3.77 3.77 0 0 0 3.77-3.77 3.77 3.77 0 0 0-3.77-3.77zm8.546 8.546a3.77 3.77 0 0 0-3.77 3.77 3.77 3.77 0 0 0 3.77 3.77 3.77 3.77 0 0 0 3.77-3.77 3.77 3.77 0 0 0-3.77-3.77z",
    // Payments
    stripe: "M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z",
    paypal: "M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z",
    // Ecommerce
    nykaa: "M12 1L3 6.5v11L12 23l9-5.5v-11L12 1zm0 2.3l7 4.27v8.86L12 20.7l-7-4.27V7.57L12 3.3zm-1 4.7v8h2V8h-2zM8 9.5v5l4 2.5 4-2.5v-5l-4-2.5L8 9.5zm2 1.77l2-1.23 2 1.23v2.96l-2 1.23-2-1.23V11.27z",
    myntra: "M12 2L4 7v10l8 5 8-5V7L12 2zm0 2.6l6 3.73v7.34L12 19.4l-6-3.73V8.33L12 4.6zm-1 4.4v6h2V9h-2zm-3 1l3 5 3-5H8z",
    ajio: "M12 2L2 19h4l1.5-3h9L18 19h4L12 2zm0 4.5L15.5 14h-7L12 6.5z",
    meesho: "M19 7h-3V6c0-2.76-2.24-5-5-5S6 3.24 6 6v1H3c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM8.5 14.5L7 13l5-5 5 5-1.5 1.5L12 11l-3.5 3.5zM12 7c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z",
    snapdeal: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 17h-9c-.83 0-1.5-.67-1.5-1.5v-7c0-.83.67-1.5 1.5-1.5h9c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5zm-6-3h3v-1.5h-3V14zm0-3h3v-1.5h-3V11z",
    jiomart: "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zM7.17 14.75l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 23.5 4H5.21l-.94-2H1v2h2l3.6 7.59L5.25 14c-.16.28-.25.61-.25.96C5 16.1 6.1 17 7 17h14v-2H7.42a.13.13 0 0 1-.25-.25z",
    zomato: "M11 2v9H9V2H7v9H5V2H3v9c0 2.12 1.33 3.93 3.17 4.7L6 21h2l-.01-5.3C10.67 14.93 12 13.12 12 11V2h-1zm9 0h-2c0 0-3 3.33-3 7h3v12h2V2z",
    swiggy: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.28 14.65c-.85.6-2.07.9-3.28.9-3.1 0-5.4-1.9-5.4-5.1 0-3.06 2.2-5.4 5.3-5.4 1.5 0 2.8.5 3.7 1.4l-1.5 1.5c-.6-.55-1.4-.85-2.2-.85-1.77 0-3.1 1.35-3.1 3.35 0 2 1.33 3.1 3.2 3.1.7 0 1.47-.2 2-.6v-1.5h-2.2v-2h4.3l.18 4.7z"
  }


  const path = PLATFORM_SVG_PATHS[p]
  if (path) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d={path} />
      </svg>
    )
  }

  // Fallbacks by category
  const dbCat = mapUiCategoryToDb(category)
  if (dbCat === 'payment') {
    return <CreditCard className={cls} />
  }

  return <Globe className={cls} />
}

const getBrandLogoUrl = (urlStr: string, platformName: string, category: string): string | null => {
  const cleanPlatform = platformName.toLowerCase();

  // 1. If it's a payment link / UPI ID
  if (category === 'Payments' || category === 'payment') {
    if (urlStr.includes('@')) {
      const handle = urlStr.split('@')[1]?.toLowerCase() || '';
      if (handle.includes('ybl') || handle.includes('ibl') || handle.includes('axl')) {
        return 'https://logo.clearbit.com/phonepe.com';
      }
      if (handle.includes('okhdfcbank') || handle.includes('okaxis') || handle.includes('okicici') || handle.includes('oksbi')) {
        return 'https://logo.clearbit.com/pay.google.com';
      }
      if (handle.includes('paytm')) {
        return 'https://logo.clearbit.com/paytm.com';
      }
      if (handle.includes('apb') || handle.includes('yapl') || handle.includes('rapl') || handle.includes('amazonpay')) {
        return 'https://logo.clearbit.com/amazon.in';
      }
    }
    // Fallbacks for payment platforms
    if (cleanPlatform.includes('phonepe')) return 'https://logo.clearbit.com/phonepe.com';
    if (cleanPlatform.includes('google pay') || cleanPlatform.includes('gpay')) return 'https://logo.clearbit.com/pay.google.com';
    if (cleanPlatform.includes('paytm')) return 'https://logo.clearbit.com/paytm.com';
    if (cleanPlatform.includes('amazon pay')) return 'https://logo.clearbit.com/amazon.in';
    if (cleanPlatform.includes('razorpay')) return 'https://logo.clearbit.com/razorpay.com';
    if (cleanPlatform.includes('upi')) return 'https://logo.clearbit.com/bhimupi.org.in';
    return null;
  }

  // 2. If it's a social/website URL
  try {
    let tempUrl = urlStr.trim();
    if (!tempUrl) return null;
    if (!/^https?:\/\//i.test(tempUrl)) {
      tempUrl = 'https://' + tempUrl;
    }
    const host = new URL(tempUrl).hostname.toLowerCase().replace(/^www\./, '');
    if (host) {
      return `https://logo.clearbit.com/${host}`;
    }
  } catch (e) {
    // fallback if URL parsing fails but platform is known
    const platformDomains: Record<string, string> = {
      instagram: 'instagram.com',
      facebook: 'facebook.com',
      linkedin: 'linkedin.com',
      youtube: 'youtube.com',
      x: 'x.com',
      twitter: 'x.com',
      threads: 'threads.net',
      tiktok: 'tiktok.com',
      snapchat: 'snapchat.com',
      pinterest: 'pinterest.com',
      whatsapp: 'whatsapp.com',
      telegram: 'telegram.org',
      discord: 'discord.com',
      signal: 'signal.org',
      github: 'github.com',
      gitlab: 'gitlab.com',
      'stack overflow': 'stackoverflow.com',
      calendly: 'calendly.com',
      zoom: 'zoom.us',
      'google meet': 'google.com',
      'microsoft teams': 'microsoft.com',
      medium: 'medium.com',
      substack: 'substack.com',
      behance: 'behance.net',
      dribbble: 'dribbble.com',
      spotify: 'spotify.com',
      'apple music': 'apple.com',
      soundcloud: 'soundcloud.com',
      amazon: 'amazon.in',
      flipkart: 'flipkart.com',
      'shopify store': 'shopify.com',
      etsy: 'etsy.com'
    };
    if (platformDomains[cleanPlatform]) {
      return `https://logo.clearbit.com/${platformDomains[cleanPlatform]}`;
    }
  }
  return null;
};

const BrandLogoImage = ({ url, platform, category, className }: { url: string; platform: string; category: string; className?: string }) => {
  const [error, setError] = useState(false);
  const logoUrl = getBrandLogoUrl(url, platform, category);

  useEffect(() => {
    setError(false);
  }, [url, platform, category]);

  if (error || !logoUrl) {
    return <LinkPlatformIcon platform={platform} category={category} />;
  }

  return (
    <img
      src={logoUrl}
      alt={platform}
      className={`${className || 'w-5 h-5'} rounded-md object-contain`}
      onError={() => setError(true)}
    />
  );
};

export default function UserDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#3f5ce6]" />
      </div>
    }>
      <UserDashboardContent />
    </Suspense>
  )
}

function UserDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Routing-controlled active tab
  const activeTab = searchParams.get('tab') || 'overview'

  // App state
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)  // account row
  const [userOrders, setUserOrders] = useState<any[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [copiedTracking, setCopiedTracking] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedOrderNum, setCopiedOrderNum] = useState(false)
  const [copiedInvoiceNum, setCopiedInvoiceNum] = useState(false)
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null)
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
  const [existingLinkDetected, setExistingLinkDetected] = useState(false)

  // Cards state
  const [cards, setCards] = useState<any[]>([])
  const [activeCard, setActiveCard] = useState<any>(ALL_CARDS_WORKSPACE)
  const [nicknameInput, setNicknameInput] = useState('')
  const [lastActivity, setLastActivity] = useState<string | null>(null)
  const [copiedHardwareId, setCopiedHardwareId] = useState(false)
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
  })

  // Profiles state (per selected card)
  const [cardProfiles, setCardProfiles] = useState<any[]>([])
  const [activeProfile, setActiveProfile] = useState<any>(null)

  // Links state
  const [profileLinks, setProfileLinks] = useState<any[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [linkModal, setLinkModal] = useState<{ open: boolean; mode: 'add' | 'edit'; link: any }>({ open: false, mode: 'add', link: null })
  const [linkForm, setLinkForm] = useState({ category: 'Social', platform: '', label: '', url: '' })
  const [linkSaving, setLinkSaving] = useState(false)
  const [linkModalCheckedProfiles, setLinkModalCheckedProfiles] = useState<string[]>([])
  const [linkPendingDelete, setLinkPendingDelete] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [activePlatformTab, setActivePlatformTab] = useState('All')
  const [displayOrderCollapsed, setDisplayOrderCollapsed] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})
  const saveTimeoutRef = useRef<any>(null)

  // Feeds system states
  const [profileFeeds, setProfileFeeds] = useState<any[]>([])
  const [profileFeedsLoading, setProfileFeedsLoading] = useState(false)
  const [feedSheetOpen, setFeedSheetOpen] = useState(false)
  const [feedFormMode, setFeedFormMode] = useState<'add' | 'edit'>('add')
  const [editingFeed, setEditingFeed] = useState<any | null>(null)
  const [feedForm, setFeedForm] = useState({
    feed_type: 'text' as 'text' | 'image' | 'video' | 'link',
    caption: '',
    media_url: '',
    link_url: '',
    link_title: '',
    is_published: true
  })
  const [feedImages, setFeedImages] = useState<any[]>([])
  const [feedDeletedExistingImageUrls, setFeedDeletedExistingImageUrls] = useState<string[]>([])
  const [feedVideo, setFeedVideo] = useState<any | null>(null)
  const [feedDeletedExistingVideoUrl, setFeedDeletedExistingVideoUrl] = useState<string | null>(null)
  const [feedSaving, setFeedSaving] = useState(false)
  const [feedDeleting, setFeedDeleting] = useState<string | null>(null)
  const [feedPendingDelete, setFeedPendingDelete] = useState<string | null>(null)
  const [isConfirmingFeedDelete, setIsConfirmingFeedDelete] = useState(false)
  const [feedsFilterTab, setFeedsFilterTab] = useState<'active' | 'archived'>('active')
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({})
  const [uploadingFeedMedia, setUploadingFeedMedia] = useState(false)
  const [isReorderingFeeds, setIsReorderingFeeds] = useState(false)
  const [draggedFeedId, setDraggedFeedId] = useState<string | null>(null)
  const [dragOverFeedId, setDragOverFeedId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, feedId: string) => {
    setDraggedFeedId(feedId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', feedId)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedFeedId === targetId) return
    setDragOverFeedId(targetId)
  }

  const handleDragEnd = () => {
    setDraggedFeedId(null)
    setDragOverFeedId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedFeedId || draggedFeedId === targetId) return

    const draggedIndex = profileFeeds.findIndex((f: any) => f.id === draggedFeedId)
    const targetIndex = profileFeeds.findIndex((f: any) => f.id === targetId)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const updatedFeeds = [...profileFeeds]
      const [draggedItem] = updatedFeeds.splice(draggedIndex, 1)
      updatedFeeds.splice(targetIndex, 0, draggedItem)
      handleFeedsReorder(updatedFeeds)
    }
    handleDragEnd()
  }




  const handleUpgradeSuccess = (updatedPlan: string, expiresAt: string) => {
    setProfile((prev: any) => ({
      ...prev,
      plan: updatedPlan,
      plan_expires_at: expiresAt,
    }))
    setMessage({
      type: 'success',
      text: `Account upgraded to Pro successfully! Gated features are now unlocked.`,
    })
  }

  // Edit Forms state
  const [cardProfile, setCardProfile] = useState({
    name: '',
    tagline: '',
    bio: '',
    colorHex: '#3f5ce6',
    colorName: 'Ocean Blue',
    links: [] as Array<{ id: string; title: string; url: string }>,
    products: [] as any[]
  })

  const [accountForm, setAccountForm] = useState({
    fullName: ''
  })

  // Feedback states
  const [savingCard, setSavingCard] = useState(false)
  const [savingAccount, setSavingAccount] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Card Visualizer Side State
  const [cardPreviewSide, setCardPreviewSide] = useState<'front' | 'back'>('front')

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Card Profiles Manager States
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<any>(null) // null for create mode
  const [savingProfile, setSavingProfile] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [profileForm, setProfileForm] = useState({
    profileName: '',
    displayName: '',
    title: '',
    bio: '',
    status: 'draft' as 'active' | 'inactive' | 'draft',
    isActive: false,
    primaryProfile: false,
    avatarUrl: '',
    bgImageUrl: ''
  })
  const [initialProfileForm, setInitialProfileForm] = useState<any>(null)

  const isFormChanged = () => {
    if (!initialProfileForm) return false
    return (
      profileForm.profileName !== initialProfileForm.profileName ||
      profileForm.displayName !== initialProfileForm.displayName ||
      profileForm.title !== initialProfileForm.title ||
      profileForm.bio !== initialProfileForm.bio ||
      profileForm.status !== initialProfileForm.status ||
      profileForm.isActive !== initialProfileForm.isActive ||
      profileForm.primaryProfile !== initialProfileForm.primaryProfile ||
      profileForm.avatarUrl !== initialProfileForm.avatarUrl ||
      profileForm.bgImageUrl !== initialProfileForm.bgImageUrl
    )
  }

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `${fileName}`

      const { error } = await supabase.storage
        .from('profile-avatars')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(filePath)

      setProfileForm(prev => ({ ...prev, avatarUrl: publicUrl }))
      setMessage({ type: 'success', text: 'Avatar image uploaded successfully!' })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to upload avatar image.' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingBg(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `${fileName}`

      const { error } = await supabase.storage
        .from('profile-backgrounds')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('profile-backgrounds')
        .getPublicUrl(filePath)

      setProfileForm(prev => ({ ...prev, bgImageUrl: publicUrl }))
      setMessage({ type: 'success', text: 'Background image uploaded successfully!' })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to upload background image.' })
    } finally {
      setUploadingBg(false)
    }
  }

  // Auto-dismiss feedback message banner after 5 seconds
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      setMessage(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [message])

  // Cleanup drag timeout on tab change or unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Auto-detection of Platform from URL or UPI ID
  useEffect(() => {
    if (linkModal.mode !== 'add' || !linkForm.url.trim()) {
      return;
    }

    const val = linkForm.url.trim();
    let detectedPlatform = '';
    let detectedCategory = '';

    // Check if it's a UPI ID first (contains @ but doesn't look like an email or a URL)
    if (val.includes('@') && !val.includes('://') && !val.includes('.com') && !val.includes('.net') && !val.includes('.org') && !val.includes('.in')) {
      const handle = val.split('@')[1]?.toLowerCase() || '';
      detectedCategory = 'Payments';
      if (handle.includes('ybl') || handle.includes('ibl') || handle.includes('axl')) {
        detectedPlatform = 'PhonePe';
      } else if (handle.includes('okhdfcbank') || handle.includes('okaxis') || handle.includes('okicici') || handle.includes('oksbi')) {
        detectedPlatform = 'Google Pay';
      } else if (handle.includes('paytm')) {
        detectedPlatform = 'Paytm';
      } else if (handle.includes('apb') || handle.includes('yapl') || handle.includes('rapl') || handle.includes('amazonpay')) {
        detectedPlatform = 'Amazon Pay';
      } else {
        detectedPlatform = 'UPI';
      }
    } else {
      // Check if it's a phone number (optionally starting with + or containing standard digit chars)
      const cleanPhone = val.replace(/[\s\-\(\)\+]/g, '');
      const isPhone = /^[0-9]{10,15}$/.test(cleanPhone);

      if (isPhone) {
        detectedPlatform = 'WhatsApp';
        detectedCategory = 'Messaging';
      } else {
        // Normal platform detection from URL
        let cleaned = val.toLowerCase();
        if (cleaned.includes('instagram.com')) detectedPlatform = 'Instagram';
        else if (cleaned.includes('facebook.com') || cleaned.includes('fb.com')) detectedPlatform = 'Facebook';
        else if (cleaned.includes('linkedin.com')) detectedPlatform = 'LinkedIn';
        else if (cleaned.includes('youtube.com') || cleaned.includes('youtu.be')) detectedPlatform = 'YouTube';
        else if (cleaned.includes('x.com') || cleaned.includes('twitter.com')) detectedPlatform = 'X (Twitter)';
        else if (cleaned.includes('threads.net')) detectedPlatform = 'Threads';
        else if (cleaned.includes('tiktok.com')) detectedPlatform = 'TikTok';
        else if (cleaned.includes('snapchat.com')) detectedPlatform = 'Snapchat';
        else if (cleaned.includes('pinterest.com') || cleaned.includes('pinterest.co.in')) detectedPlatform = 'Pinterest';
        else if (cleaned.includes('whatsapp.com') || cleaned.includes('wa.me')) detectedPlatform = 'WhatsApp';
        else if (cleaned.includes('telegram.org') || cleaned.includes('t.me') || cleaned.includes('telegram.me')) detectedPlatform = 'Telegram';
        else if (cleaned.includes('discord.gg') || cleaned.includes('discord.com')) detectedPlatform = 'Discord';
        else if (cleaned.includes('signal.org') || cleaned.includes('signal.me')) detectedPlatform = 'Signal';
        else if (cleaned.includes('github.com')) detectedPlatform = 'GitHub';
        else if (cleaned.includes('gitlab.com')) detectedPlatform = 'GitLab';
        else if (cleaned.includes('stackoverflow.com')) detectedPlatform = 'Stack Overflow';
        else if (cleaned.includes('medium.com')) detectedPlatform = 'Medium';
        else if (cleaned.includes('substack.com')) detectedPlatform = 'Substack';
        else if (cleaned.includes('behance.net')) detectedPlatform = 'Behance';
        else if (cleaned.includes('dribbble.com')) detectedPlatform = 'Dribbble';
        else if (cleaned.includes('spotify.com')) detectedPlatform = 'Spotify';
        else if (cleaned.includes('music.apple.com')) detectedPlatform = 'Apple Music';
        else if (cleaned.includes('soundcloud.com')) detectedPlatform = 'SoundCloud';
        else if (cleaned.includes('calendly.com')) detectedPlatform = 'Calendly';
        else if (cleaned.includes('zoom.us') || cleaned.includes('zoom.com')) detectedPlatform = 'Zoom';
        else if (cleaned.includes('meet.google.com')) detectedPlatform = 'Google Meet';
        else if (cleaned.includes('teams.microsoft.com')) detectedPlatform = 'Microsoft Teams';
        else if (cleaned.includes('amazon.in') || cleaned.includes('amazon.com') || cleaned.includes('amzn.to')) detectedPlatform = 'Amazon';
        else if (cleaned.includes('flipkart.com')) detectedPlatform = 'Flipkart';
        else if (cleaned.includes('shopify.com')) detectedPlatform = 'Shopify Store';
        else if (cleaned.includes('etsy.com')) detectedPlatform = 'Etsy';
        else if (cleaned.includes('nykaa.com')) detectedPlatform = 'Nykaa';
        else if (cleaned.includes('myntra.com')) detectedPlatform = 'Myntra';
        else if (cleaned.includes('ajio.com')) detectedPlatform = 'Ajio';
        else if (cleaned.includes('meesho.com')) detectedPlatform = 'Meesho';
        else if (cleaned.includes('snapdeal.com')) detectedPlatform = 'Snapdeal';
        else if (cleaned.includes('jiomart.com')) detectedPlatform = 'JioMart';
        else if (cleaned.includes('zomato.com')) detectedPlatform = 'Zomato';
        else if (cleaned.includes('swiggy.com')) detectedPlatform = 'Swiggy';
        else {
          try {
            let tempUrl = val;
            if (!/^https?:\/\//i.test(tempUrl)) {
              tempUrl = 'https://' + tempUrl;
            }
            const parsed = new URL(tempUrl);
            const hostname = parsed.hostname.replace(/^www\./, '').split('.')[0];
            if (hostname && hostname.length > 2) {
              detectedPlatform = hostname.charAt(0).toUpperCase() + hostname.slice(1);
            }
          } catch (e) { }
        }

        if (detectedPlatform) {
          const norm = getNormalizedPlatform(detectedPlatform);
          detectedCategory = PLATFORM_DISPLAY_CATEGORY[norm] || 'Social';
        }
      }
    }

    if (detectedPlatform && detectedCategory) {
      setLinkForm(p => {
        if (p.platform !== detectedPlatform || p.category !== detectedCategory) {
          return { ...p, platform: detectedPlatform, category: detectedCategory };
        }
        return p;
      });
    }
  }, [linkForm.url, linkModal.mode]);

  // Check if the URL + Platform already exists in the database
  useEffect(() => {
    if (linkModal.open && linkModal.mode === 'add' && linkForm.platform.trim() && linkForm.url.trim()) {
      const checkExistingLink = async () => {
        try {
          // WhatsApp link phone number normalization
          let finalUrl = linkForm.url.trim()
          const isWhatsApp = linkForm.platform.trim().toLowerCase() === 'whatsapp' || getNormalizedPlatform(linkForm.platform) === 'whatsapp'
          if (isWhatsApp) {
            const cleanPhone = finalUrl.replace(/[\s\-\(\)\+]/g, '')
            if (/^[0-9]{10,15}$/.test(cleanPhone)) {
              let numberOnly = cleanPhone
              if (numberOnly.length === 10) {
                numberOnly = '91' + numberOnly
              }
              finalUrl = `https://wa.me/${numberOnly}`
            }
          }

          const { data: existingLink } = await supabase
            .from('social_links')
            .select('id')
            .eq('account_id', user?.id)
            .eq('platform', linkForm.platform.trim())
            .eq('url', finalUrl)
            .maybeSingle()

          if (existingLink) {
            // Find all profiles that already have this link mapped
            const { data: junctions } = await supabase
              .from('profile_links')
              .select('profile_id')
              .eq('link_id', existingLink.id)

            if (junctions && junctions.length > 0) {
              const profileIds = junctions.map((j: any) => j.profile_id)
              setLinkModalCheckedProfiles(profileIds)
              setExistingLinkDetected(true)
            } else {
              setExistingLinkDetected(false)
            }
          } else {
            setExistingLinkDetected(false)
          }
        } catch (err) {
          console.error('Check existing link error:', err)
        }
      }

      const timer = setTimeout(checkExistingLink, 500)
      return () => clearTimeout(timer)
    } else {
      setExistingLinkDetected(false)
    }
  }, [linkForm.url, linkForm.platform, linkModal.open, linkModal.mode])

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

  const getRelativeTimeString = (dateString: string | null) => {
    if (!dateString) return 'No activity yet'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  // Leads search state
  const [leadsSearch, setLeadsSearch] = useState('')

  // Real leads state hooks
  const [leads, setLeads] = useState<any[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadSheet, setLeadSheet] = useState<{ open: boolean; mode: 'view' | 'edit' | 'add'; lead: any }>({ open: false, mode: 'view', lead: null })
  const [leadFormState, setLeadFormState] = useState({ status: 'new' })
  const [leadSaving, setLeadSaving] = useState(false)
  const [leadPendingDelete, setLeadPendingDelete] = useState<string | null>(null)
  const [leadModalSelectedFormId, setLeadModalSelectedFormId] = useState<string | null>(null)
  const [leadModalCustomData, setLeadModalCustomData] = useState<Record<string, any>>({})
  const [leadModalUploadingFieldId, setLeadModalUploadingFieldId] = useState<string | null>(null)
  const [openDatePickerFieldId, setOpenDatePickerFieldId] = useState<string | null>(null)
  const [leadSignedUrls, setLeadSignedUrls] = useState<Record<string, string>>({})
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  // Generate signed URLs for lead attachment files on the fly if the bucket is authenticated
  useEffect(() => {
    setIsConfirmingDelete(false)
    if (!leadSheet.open || !leadSheet.lead?.data) {
      setLeadSignedUrls({})
      return
    }

    const loadSignedUrls = async () => {
      const urls: Record<string, string> = {}
      const dataEntries = Object.entries(leadSheet.lead.data)

      for (const [key, val] of dataEntries) {
        if (typeof val === 'string' && val.includes('/lead-attachments/')) {
          const bucketMarker = '/lead-attachments/'
          const index = val.indexOf(bucketMarker)
          if (index !== -1) {
            const rawPath = val.substring(index + bucketMarker.length)
            const path = decodeURIComponent(rawPath)
            try {
              const { data, error } = await supabase.storage
                .from('lead-attachments')
                .createSignedUrl(path, 86400) // 24 hours
              if (!error && data?.signedUrl) {
                urls[key] = data.signedUrl
              }
            } catch (err) {
              console.error('Failed to generate signed URL for path:', path, err)
            }
          }
        }
      }
      setLeadSignedUrls(urls)
    }

    loadSignedUrls()
  }, [leadSheet.open, leadSheet.lead])

  // ── Multi-form system state ─────────────────────────────────
  const [leadForms, setLeadForms] = useState<any[]>([])
  const [leadFormsLoading, setLeadFormsLoading] = useState(false)
  // Current sub-tab inside the Leads tab
  const [leadsSubTab, setLeadsSubTab] = useState<'crm' | 'forms'>('crm')
  // Form builder sheet
  const [formBuilderOpen, setFormBuilderOpen] = useState(false)
  const [editingFormId, setEditingFormId] = useState<string | null>(null)
  const [formBuilderDraft, setFormBuilderDraft] = useState<any>({
    form_name: '',
    title: 'Get in Touch',
    subtitle: 'Fill out the form below to connect.',
    button_label: 'Submit',
    is_active: false,
    fields: [
      {
        id: 'default-name',
        type: 'text',
        label: 'Name',
        placeholder: 'Enter your name...',
        required: true,
      },
      {
        id: 'default-email',
        type: 'email',
        label: 'Email',
        placeholder: 'Enter your email...',
        required: true,
      },
      {
        id: 'default-phone',
        type: 'phone',
        label: 'Phone Number',
        placeholder: 'Enter your phone number...',
        required: true,
      }
    ],
    product_ids: []
  })
  const [formBuilderSaving, setFormBuilderSaving] = useState(false)
  // Field type picker
  const [fieldTypePickerOpen, setFieldTypePickerOpen] = useState(false)
  // Duplication dialog
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicatingForm, setDuplicatingForm] = useState<any>(null)
  const [duplicateTargetProfileId, setDuplicateTargetProfileId] = useState<string>('')
  const [duplicateFormName, setDuplicateFormName] = useState('')
  const [duplicateConflict, setDuplicateConflict] = useState(false)
  const [duplicateCheckingConflict, setDuplicateCheckingConflict] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  // Leads filters
  const [leadsFilterFormId, setLeadsFilterFormId] = useState<string>('all')
  const [leadsFilterProductId, setLeadsFilterProductId] = useState<string>('all')
  // Products list for filter + form linking
  const [profileProducts, setProfileProducts] = useState<any[]>([])
  // Pending delete form
  const [formPendingDelete, setFormPendingDelete] = useState<string | null>(null)

  // ── Products System state ────────────────────────────────────
  const [profileProductsLoading, setProfileProductsLoading] = useState(false)
  const [productSheetOpen, setProductSheetOpen] = useState(false)
  const [productFormMode, setProductFormMode] = useState<'add' | 'edit' | 'view'>('add')
  const [isConfirmingProductDelete, setIsConfirmingProductDelete] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price_inr: '', // Displayed in rupees, saved in paise
    net_quantity: '0',
    link_url: '',
    enquiry_form_id: '',
    is_active: true,
    rating: '',
    review: ''
  })
  const [productImages, setProductImages] = useState<any[]>([])
  const [deletedExistingImageUrls, setDeletedExistingImageUrls] = useState<string[]>([])
  const [productSaving, setProductSaving] = useState(false)
  const [productDeleting, setProductDeleting] = useState<string | null>(null)
  const [productPendingDelete, setProductPendingDelete] = useState<string | null>(null)
  const [uploadingProductImages, setUploadingProductImages] = useState(false)

  // Product reviews state
  const [productReviews, setProductReviews] = useState<any[]>([])
  const [newReviewRating, setNewReviewRating] = useState('5')
  const [newReviewText, setNewReviewText] = useState('')
  const [newReviewName, setNewReviewName] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)

  // Product Duplication dialog states
  const [duplicateProductDialogOpen, setDuplicateProductDialogOpen] = useState(false)
  const [duplicatingProduct, setDuplicatingProduct] = useState<any | null>(null)
  const [duplicateProductName, setDuplicateProductName] = useState('')
  const [duplicateProductTargetProfileId, setDuplicateProductTargetProfileId] = useState<string>('')
  const [duplicateProductConflict, setDuplicateProductConflict] = useState(false)
  const [duplicateProductCheckingConflict, setDuplicateProductCheckingConflict] = useState(false)
  const [duplicatingProductProgress, setDuplicatingProductProgress] = useState(false)

  // Duplicate from other profiles states
  const [duplicateFromOthersDialogOpen, setDuplicateFromOthersDialogOpen] = useState(false)
  const [selectedSourceProfileId, setSelectedSourceProfileId] = useState('')
  const [selectedSourceProductId, setSelectedSourceProductId] = useState('')
  const [duplicateFromOthersProductName, setDuplicateFromOthersProductName] = useState('')
  const [duplicateFromOthersConflict, setDuplicateFromOthersConflict] = useState(false)
  const [duplicateFromOthersCheckingConflict, setDuplicateFromOthersCheckingConflict] = useState(false)
  const [duplicatingFromOthersProgress, setDuplicatingFromOthersProgress] = useState(false)
  const [allAccountProducts, setAllAccountProducts] = useState<any[]>([])
  const [allAccountProductsLoading, setAllAccountProductsLoading] = useState(false)

  // Feed Duplication states
  const [duplicateFeedDialogOpen, setDuplicateFeedDialogOpen] = useState(false)
  const [duplicatingFeed, setDuplicatingFeed] = useState<any | null>(null)
  const [duplicateFeedTargetProfileId, setDuplicateFeedTargetProfileId] = useState<string>('')
  const [duplicatingFeedProgress, setDuplicatingFeedProgress] = useState(false)

  // Duplicate feeds from other profiles states
  const [duplicateFeedFromOthersDialogOpen, setDuplicateFeedFromOthersDialogOpen] = useState(false)
  const [selectedSourceFeedProfileId, setSelectedSourceFeedProfileId] = useState('')
  const [selectedSourceFeedId, setSelectedSourceFeedId] = useState('')
  const [duplicatingFeedFromOthersProgress, setDuplicatingFeedFromOthersProgress] = useState(false)
  const [allAccountFeeds, setAllAccountFeeds] = useState<any[]>([])
  const [allAccountFeedsLoading, setAllAccountFeedsLoading] = useState(false)

  // Analytics states
  const [analyticsRange, setAnalyticsRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const isAllCards = activeCard?.id === 'all'

  // Trigger new lead form from product form creation redirection
  useEffect(() => {
    if (activeTab === 'leads' && searchParams.get('newForm') === 'true') {
      openFormBuilder()
      // Remove query param to clean up URL
      router.replace('/dashboard?tab=leads')
    }
  }, [activeTab, searchParams])

  // Workspace active tab redirect logic
  useEffect(() => {
    if (activeCard?.id === 'all') {
      if (!['overview', 'orders'].includes(activeTab)) {
        router.push('/dashboard?tab=overview')
      }
    } else {
      if (['orders'].includes(activeTab)) {
        router.push('/dashboard?tab=overview')
      }
    }
  }, [activeCard, activeTab])

  useEffect(() => {
    let active = true

    const checkAuthAndFetchData = async () => {
      try {
        const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser()
        if (authErr || !authUser) {
          if (active) {
            router.push('/login?redirect=/dashboard')
          }
          return
        }

        if (active) {
          setUser(authUser)
        }

        // Fetch profile
        const { data: accData } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (accData && active) {
          setProfile(accData)
          setAccountForm({ fullName: accData.full_name || '' })
        }

        // Fetch user's orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('account_id', authUser.id)
          .order('created_at', { ascending: false })

        if (ordersData && active) {
          setUserOrders(ordersData)
        }

        // Fetch owned cards with personalization details
        const { data: cardsData, error: cardsErr } = await supabase
          .from('nfc_cards')
          .select('*, order_items(personalisation)')
          .eq('account_id', authUser.id)
          .order('provisioned_at', { ascending: false })

        if (!cardsErr && cardsData && active) {
          setCards(cardsData)
          setActiveCard(ALL_CARDS_WORKSPACE)

          if (cardsData.length > 0) {
            const pData = cardsData[0].profile_data || {}
            setCardProfile({
              name: pData.name || '',
              tagline: pData.tagline || '',
              bio: pData.bio || '',
              colorHex: pData.colorHex || '#3f5ce6',
              colorName: pData.colorName || 'Ocean Blue',
              links: pData.links || [],
              products: pData.products || []
            })
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    checkAuthAndFetchData()

    // Setup Token Refreshing & Auth status sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && active) {
        setUser(session.user)
      } else if (!session && active) {
        router.push('/login?redirect=/dashboard')
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // Handle active card switch — fetches profiles for the selected card
  const handleSelectCard = async (card: any) => {
    setActiveCard(card)
    setMessage(null)
    setNicknameInput(card?.card_nickname || '')

    // Reset profiles when switching to All Cards
    if (card?.id === 'all') {
      setCardProfiles([])
      setActiveProfile(null)
      setLastActivity(null)
      return
    }

    // Fetch last tap activity dynamically
    try {
      const { data: tapData } = await supabase
        .from('card_taps')
        .select('tapped_at')
        .eq('card_id', card.id)
        .order('tapped_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (tapData) {
        setLastActivity(tapData.tapped_at)
      } else {
        setLastActivity(null)
      }
    } catch (err) {
      console.error('Failed to fetch last activity:', err)
      setLastActivity(null)
    }

    // Fetch profiles for this card from Supabase
    try {
      const { data: profiles, error } = await supabase
        .from('card_profiles')
        .select('*')
        .eq('card_id', card.id)
        .order('sort_order', { ascending: true })

      if (!error && profiles) {
        const isPro = profile?.plan === 'pro' || profile?.plan === 'business'
        let currentProfiles = [...profiles]

        if (!isPro && profiles.length > 0) {
          const primary = profiles.find((p: any) => p.primary_profile) || profiles[0]
          const activeProfiles = profiles.filter((p: any) => p.is_active)
          const needsSync = activeProfiles.length !== 1 || activeProfiles[0].id !== primary.id

          if (needsSync) {
            try {
              // Unset all active profiles for this card in DB
              await supabase
                .from('card_profiles')
                .update({ is_active: false })
                .eq('card_id', card.id)

              // Set primary profile as active
              await supabase
                .from('card_profiles')
                .update({ is_active: true })
                .eq('id', primary.id)

              // Re-fetch profiles
              const { data: updated } = await supabase
                .from('card_profiles')
                .select('*')
                .eq('card_id', card.id)
                .order('sort_order', { ascending: true })

              if (updated) {
                currentProfiles = updated
              }
            } catch (err) {
              console.error('Failed to enforce primary profile fallback:', err)
            }
          }
        }

        setCardProfiles(currentProfiles)
        const live = currentProfiles.find((p: any) => p.is_active) || currentProfiles[0] || null
        setActiveProfile(live)

        // Fetch vCard details for all card profiles to show "Save Contact" or "Add vCard Details"
        if (currentProfiles.length > 0) {
          const profileIds = currentProfiles.map((p: any) => p.id)
          const { data: vcards } = await supabase
            .from('vcard_details')
            .select('*')
            .in('profile_id', profileIds)

          if (vcards) {
            const map: Record<string, any> = {}
            vcards.forEach((vc: any) => {
              map[vc.profile_id] = vc
            })
            setVcardDataMap(map)
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch card profiles:', err)
    }
  }

  // vCard Form State
  const [vcardForm, setVcardForm] = useState({
    firstName: '',
    lastName: '',
    organization: '',
    jobTitle: '',
    department: '',
    website: '',
    phones: [] as Array<{ label: string; number: string; is_primary: boolean }>,
    emails: [] as Array<{ label: string; email: string; is_primary: boolean }>,
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    urls: [] as Array<{ label: string; url: string }>,
    socials: [] as Array<{ platform: string; username: string; url: string }>,
    notes: '',
    customFields: [] as Array<{ key: string; value: string }>,
  })
  const [savingVCard, setSavingVCard] = useState(false)
  const [loadingVCard, setLoadingVCard] = useState(false)
  const [vcardDataMap, setVcardDataMap] = useState<Record<string, any>>({})
  const [pendingDelete, setPendingDelete] = useState<{ type: 'phone' | 'email' | 'url' | 'social'; index: number } | null>(null)

  // Fetch vCard details when active card or active profile changes
  useEffect(() => {
    if (isAllCards || !activeCard?.id) return

    const fetchVCardDetails = async () => {
      setLoadingVCard(true)
      try {
        let targetProfileId = activeProfile?.id
        if (!targetProfileId) {
          const { data: profiles } = await supabase
            .from('card_profiles')
            .select('id')
            .eq('card_id', activeCard.id)
            .order('sort_order', { ascending: true })

          if (profiles && profiles.length > 0) {
            targetProfileId = profiles[0].id
          }
        }

        if (!targetProfileId) {
          setVcardForm({
            firstName: '',
            lastName: '',
            organization: '',
            jobTitle: '',
            department: '',
            website: '',
            phones: [],
            emails: [],
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India',
            urls: [],
            socials: [],
            notes: '',
            customFields: [],
          })
          return
        }

        const { data: vcardData, error } = await supabase
          .from('vcard_details')
          .select('*')
          .eq('profile_id', targetProfileId)
          .maybeSingle()

        if (!error && vcardData) {
          setVcardForm({
            firstName: vcardData.first_name || '',
            lastName: vcardData.last_name || '',
            organization: vcardData.organization || '',
            jobTitle: vcardData.job_title || '',
            department: vcardData.department || '',
            website: vcardData.website || '',
            phones: vcardData.phones || [],
            emails: vcardData.emails || [],
            street: vcardData.street || '',
            city: vcardData.city || '',
            state: vcardData.state || '',
            postalCode: vcardData.postal_code || '',
            country: vcardData.country || 'India',
            urls: vcardData.urls || [],
            socials: vcardData.socials || [],
            notes: vcardData.notes || '',
            customFields: vcardData.custom_fields || [],
          })
        } else {
          setVcardForm({
            firstName: '',
            lastName: '',
            organization: '',
            jobTitle: '',
            department: '',
            website: '',
            phones: [],
            emails: [],
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India',
            urls: [],
            socials: [],
            notes: '',
            customFields: [],
          })
        }
      } catch (err) {
        console.error('Failed to load vCard details:', err)
      } finally {
        setLoadingVCard(false)
      }
    }

    fetchVCardDetails()
  }, [activeCard, activeProfile])

  // Reload links, leads, forms, products, and feeds when profile changes
  useEffect(() => {
    setProfileLinks([])
    setLeads([])
    setLeadForms([])
    setProfileProducts([])
    setProfileFeeds([])
    setFeedsFilterTab('active')
    setLeadsFilterFormId('all')
    setLeadsFilterProductId('all')
    setIsReorderingFeeds(false)
    if (activeProfile?.id) {
      fetchProfileLinks(activeProfile.id)
      fetchLeads(activeProfile.id)
      fetchLeadForms(activeProfile.id)
      fetchProfileProducts(activeProfile.id)
      fetchAllAccountProducts()
      fetchProfileFeeds(activeProfile.id)
      fetchAllAccountFeeds()
    }
  }, [activeProfile?.id, user?.id])

  // Load analytics when range, tab, active card, or active profile changes
  useEffect(() => {
    if (activeTab === 'analytics' && user?.id) {
      fetchAnalyticsData()
    }
  }, [activeTab, analyticsRange, activeCard?.id, activeProfile?.id, user?.id])

  const handleAddPhone = () => {
    setVcardForm(prev => ({
      ...prev,
      phones: [...prev.phones, { label: 'Mobile', number: '', is_primary: prev.phones.length === 0 }]
    }))
  }

  const handleRemovePhone = (index: number) => {
    setVcardForm(prev => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== index)
    }))
  }

  const handlePhoneChange = (index: number, field: string, value: any) => {
    setVcardForm(prev => ({
      ...prev,
      phones: prev.phones.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }))
  }

  const handleAddEmail = () => {
    setVcardForm(prev => ({
      ...prev,
      emails: [...prev.emails, { label: 'Work', email: '', is_primary: prev.emails.length === 0 }]
    }))
  }

  const handleRemoveEmail = (index: number) => {
    setVcardForm(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index)
    }))
  }

  const handleEmailChange = (index: number, field: string, value: any) => {
    setVcardForm(prev => ({
      ...prev,
      emails: prev.emails.map((e, i) => i === index ? { ...e, [field]: value } : e)
    }))
  }

  const handleAddCustomField = () => {
    setVcardForm(prev => ({
      ...prev,
      customFields: [...prev.customFields, { key: '', value: '' }]
    }))
  }

  const handleRemoveCustomField = (index: number) => {
    setVcardForm(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
    }))
  }

  const handleCustomFieldChange = (index: number, field: string, value: string) => {
    setVcardForm(prev => ({
      ...prev,
      customFields: prev.customFields.map((c, i) => i === index ? { ...c, [field]: value } : c)
    }))
  }

  const handleAddUrl = () => {
    setVcardForm(prev => ({
      ...prev,
      urls: [...prev.urls, { label: 'Website', url: '' }]
    }))
  }

  const handleRemoveUrl = (index: number) => {
    setVcardForm(prev => ({
      ...prev,
      urls: prev.urls.filter((_, i) => i !== index)
    }))
  }

  const handleUrlChange = (index: number, field: string, value: string) => {
    setVcardForm(prev => ({
      ...prev,
      urls: prev.urls.map((u, i) => i === index ? { ...u, [field]: value } : u)
    }))
  }

  const handleAddSocial = () => {
    setVcardForm(prev => ({
      ...prev,
      socials: [...prev.socials, { platform: 'LinkedIn', username: '', url: '' }]
    }))
  }

  const handleRemoveSocial = (index: number) => {
    setVcardForm(prev => ({
      ...prev,
      socials: prev.socials.filter((_, i) => i !== index)
    }))
  }

  const handleSocialChange = (index: number, field: string, value: string) => {
    setVcardForm(prev => ({
      ...prev,
      socials: prev.socials.map((s, i) => {
        if (i === index) {
          const updated = { ...s, [field]: value }
          // Automatically construct url if username changes based on platform
          if (field === 'username' || field === 'platform') {
            const platform = field === 'platform' ? value : s.platform
            const username = field === 'username' ? value : s.username
            if (username) {
              if (platform === 'LinkedIn') updated.url = `https://linkedin.com/in/${username}`
              else if (platform === 'Instagram') updated.url = `https://instagram.com/${username}`
              else if (platform === 'Twitter' || platform === 'X') updated.url = `https://x.com/${username}`
              else if (platform === 'Facebook') updated.url = `https://facebook.com/${username}`
              else if (platform === 'YouTube') updated.url = `https://youtube.com/@${username}`
              else if (platform === 'TikTok') updated.url = `https://tiktok.com/@${username}`
              else if (platform === 'WhatsApp') updated.url = `https://wa.me/${username.replace(/[^\d+]/g, '')}`
            }
          }
          return updated
        }
        return s
      })
    }))
  }

  const saveVCard = async (vcardData: typeof vcardForm) => {
    setSavingVCard(true)
    setMessage(null)
    try {
      const { data: profiles } = await supabase
        .from('card_profiles')
        .select('id')
        .eq('card_id', activeCard.id)

      if (!profiles || profiles.length === 0) {
        throw new Error('Please create at least one profile first.')
      }

      for (const prof of profiles) {
        const { error } = await supabase
          .from('vcard_details')
          .upsert({
            profile_id: prof.id,
            first_name: vcardData.firstName,
            last_name: vcardData.lastName,
            organization: vcardData.organization,
            job_title: vcardData.jobTitle,
            department: vcardData.department,
            website: vcardData.website,
            phones: vcardData.phones,
            emails: vcardData.emails,
            street: vcardData.street,
            city: vcardData.city,
            state: vcardData.state,
            postal_code: vcardData.postalCode,
            country: vcardData.country,
            urls: vcardData.urls,
            socials: vcardData.socials,
            notes: vcardData.notes,
            custom_fields: vcardData.customFields,
          }, {
            onConflict: 'profile_id'
          })

      }

      // Update local vcardDataMap
      const updatedMap = { ...vcardDataMap }
      for (const prof of profiles) {
        updatedMap[prof.id] = {
          profile_id: prof.id,
          first_name: vcardData.firstName,
          last_name: vcardData.lastName,
          organization: vcardData.organization,
          job_title: vcardData.jobTitle,
          department: vcardData.department,
          website: vcardData.website,
          phones: vcardData.phones,
          emails: vcardData.emails,
          street: vcardData.street,
          city: vcardData.city,
          state: vcardData.state,
          postal_code: vcardData.postalCode,
          country: vcardData.country,
          urls: vcardData.urls,
          socials: vcardData.socials,
          notes: vcardData.notes,
          custom_fields: vcardData.customFields
        }
      }
      setVcardDataMap(updatedMap)

      setMessage({ type: 'success', text: 'vCard details updated for all profiles.' })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to save vCard details.' })
    } finally {
      setSavingVCard(false)
    }
  }

  // Auto-save phones or emails to Supabase when primary changes
  const savePrimaryToSupabase = async (field: 'phones' | 'emails', updatedArr: any[]) => {
    try {
      const { data: profiles } = await supabase
        .from('card_profiles')
        .select('id')
        .eq('card_id', activeCard.id)
      if (!profiles || profiles.length === 0) return
      for (const prof of profiles) {
        await supabase
          .from('vcard_details')
          .upsert({ profile_id: prof.id, [field]: updatedArr }, { onConflict: 'profile_id' })
      }
    } catch (err) {
      console.error('Failed to auto-save primary:', err)
    }
  }

  const handleToggleCardStatus = async () => {
    if (!activeCard || isAllCards) return
    const newStatus = activeCard.status === 'active' ? 'deactivated' : 'active'
    const updatePayload: any = { status: newStatus }
    if (newStatus === 'active') {
      updatePayload.activated_at = new Date().toISOString()
    }
    try {
      const { error } = await supabase
        .from('nfc_cards')
        .update(updatePayload)
        .eq('id', activeCard.id)

      if (error) throw error

      const updatedCard = { ...activeCard, ...updatePayload }
      setActiveCard(updatedCard)
      setCards(prev => prev.map(c => c.id === activeCard.id ? updatedCard : c))

      setMessage({
        type: 'success',
        text: newStatus === 'active'
          ? 'NFC sharing enabled successfully! Your card is now active.'
          : 'NFC sharing paused. Your card is temporarily disabled.'
      })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update card status.' })
    }
  }

  const handleSaveNickname = async () => {
    if (!activeCard || isAllCards) return
    try {
      const trimmed = nicknameInput.trim()
      const { error } = await supabase
        .from('nfc_cards')
        .update({ card_nickname: trimmed || null })
        .eq('id', activeCard.id)

      if (error) throw error

      const updatedCard = { ...activeCard, card_nickname: trimmed || null }
      setActiveCard(updatedCard)
      setCards(prev => prev.map(c => c.id === activeCard.id ? updatedCard : c))
      setMessage({ type: 'success', text: 'Card nickname updated successfully!' })
    } catch (err: any) {
      console.error('Failed to save nickname:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to update card nickname.' })
    }
  }

  const handleCopyHardwareId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedHardwareId(true)
    setTimeout(() => setCopiedHardwareId(false), 2000)
  }

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2

    // Calculate degree rotation (max 15 degrees)
    const rotateX = -(y / rect.height) * 15
    const rotateY = (x / rect.width) * 15

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`,
      transition: 'none',
    })
  }

  const handleCardMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
    })
  }


  // Handle link updates
  const handleAddLink = () => {
    setCardProfile(prev => ({
      ...prev,
      links: [
        ...prev.links,
        { id: Math.random().toString(36).substring(2, 9), title: '', url: '' }
      ]
    }))
  }

  const handleRemoveLink = (id: string) => {
    setCardProfile(prev => ({
      ...prev,
      links: prev.links.filter(link => link.id !== id)
    }))
  }

  const handleUpdateLink = (id: string, field: 'title' | 'url', value: string) => {
    setCardProfile(prev => ({
      ...prev,
      links: prev.links.map(link =>
        link.id === id ? { ...link, [field]: value } : link
      )
    }))
  }

  // ── Links CRUD ──────────────────────────────────────────────────
  const fetchProfileLinks = async (profileId: string) => {
    if (!profileId) return
    setLinksLoading(true)
    try {
      const { data, error } = await supabase
        .from('profile_links')
        .select('*, social_links(*)')
        .eq('profile_id', profileId)
        .order('sort_order', { ascending: true })
      if (!error && data) {
        const mapped = data.map((pl: any) => ({
          id: pl.id, // Junction row ID
          profile_id: pl.profile_id,
          link_id: pl.link_id,
          sort_order: pl.sort_order,
          is_active: pl.is_active,
          click_count: pl.click_count,
          url: pl.social_links?.url || '',
          platform: pl.social_links?.platform || '',
          label: pl.social_links?.label || '',
          category: pl.social_links?.category || 'social',
          created_at: pl.created_at,
        }))
        setProfileLinks(mapped)
      }
    } finally {
      setLinksLoading(false)
    }
  }

  const openAddLink = () => {
    setLinkForm({ category: 'Social', platform: '', label: '', url: '' })
    setLinkModalCheckedProfiles(activeProfile ? [activeProfile.id] : [])
    setLinkModal({ open: true, mode: 'add', link: null })
  }

  const openEditLink = async (link: any) => {
    const uiCategory = getUiCategory(link.category || 'social', link.platform || '')
    setLinkForm({
      category: uiCategory,
      platform: link.platform || '',
      label: link.label || '',
      url: link.url || ''
    })
    setLinkModalCheckedProfiles([link.profile_id])
    setLinkModal({ open: true, mode: 'edit', link })

    try {
      const { data } = await supabase
        .from('profile_links')
        .select('profile_id')
        .eq('link_id', link.link_id)

      if (data) {
        const checked = data.map((item: any) => item.profile_id)
        if (!checked.includes(link.profile_id)) {
          checked.push(link.profile_id)
        }
        setLinkModalCheckedProfiles(checked)
      }
    } catch (err) {
      console.error('Failed to pre-check profiles:', err)
    }
  }

  const closeLinkModal = () => {
    setLinkModal({ open: false, mode: 'add', link: null })
    setLinkModalCheckedProfiles([])
  }

  const saveLinkModal = async () => {
    if (!activeProfile || !linkForm.platform.trim() || !linkForm.url.trim() || linkModalCheckedProfiles.length === 0) return
    setLinkSaving(true)
    try {
      const dbCategory = mapUiCategoryToDb(linkForm.category)

      // WhatsApp link phone number normalization
      let finalUrl = linkForm.url.trim()
      const isWhatsApp = linkForm.platform.trim().toLowerCase() === 'whatsapp' || getNormalizedPlatform(linkForm.platform) === 'whatsapp'
      if (isWhatsApp) {
        const cleanPhone = finalUrl.replace(/[\s\-\(\)\+]/g, '')
        if (/^[0-9]{10,15}$/.test(cleanPhone)) {
          let numberOnly = cleanPhone
          if (numberOnly.length === 10) {
            numberOnly = '91' + numberOnly
          }
          finalUrl = `https://wa.me/${numberOnly}`
        }
      }

      // Step 1: Find or insert the unique social_links record
      let linkId = ''
      const { data: existingLink } = await supabase
        .from('social_links')
        .select('id')
        .eq('account_id', user?.id)
        .eq('platform', linkForm.platform.trim())
        .eq('url', finalUrl)
        .maybeSingle()

      if (existingLink) {
        linkId = existingLink.id
        // Update details (category, label) in case they changed/updated
        await supabase
          .from('social_links')
          .update({
            category: dbCategory,
            label: linkForm.label.trim() || null,
          })
          .eq('id', linkId)
      } else {
        const { data: newLink, error: insertError } = await supabase
          .from('social_links')
          .insert({
            account_id: user?.id,
            category: dbCategory,
            platform: linkForm.platform.trim(),
            label: linkForm.label.trim() || null,
            url: finalUrl,
          })
          .select('id')
          .single()

        if (insertError || !newLink) {
          throw new Error(insertError?.message || 'Failed to create social link')
        }
        linkId = newLink.id
      }

      // Step 2: Fetch existing profile associations for this linkId
      const { data: existingJunctions } = await supabase
        .from('profile_links')
        .select('*')
        .eq('link_id', linkId)

      const existingMap = new Map<string, any>()
      if (existingJunctions) {
        existingJunctions.forEach((pl: any) => {
          existingMap.set(pl.profile_id, pl)
        })
      }

      // Step 3: For each profile in the system, insert or delete mapping
      const updatePromises = cardProfiles.map(async (prof: any) => {
        const profId = prof.id
        const isChecked = linkModalCheckedProfiles.includes(profId)
        const existingJunction = existingMap.get(profId)

        if (isChecked) {
          if (!existingJunction) {
            // Create association
            const { data: siblingList } = await supabase.from('profile_links').select('sort_order').eq('profile_id', profId)
            const maxOrder = siblingList && siblingList.length > 0 ? Math.max(...siblingList.map((l: any) => l.sort_order || 0)) + 1 : 0

            const { data, error } = await supabase
              .from('profile_links')
              .insert({
                profile_id: profId,
                link_id: linkId,
                sort_order: maxOrder,
                is_active: true,
              })
              .select()
              .single()

            if (!error && data && profId === activeProfile.id) {
              // Fetch full joined row to add to local state
              const { data: fullRow } = await supabase
                .from('profile_links')
                .select('*, social_links(*)')
                .eq('id', data.id)
                .single()

              if (fullRow) {
                const mapped = {
                  id: fullRow.id,
                  profile_id: fullRow.profile_id,
                  link_id: fullRow.link_id,
                  sort_order: fullRow.sort_order,
                  is_active: fullRow.is_active,
                  click_count: fullRow.click_count,
                  url: fullRow.social_links?.url || '',
                  platform: fullRow.social_links?.platform || '',
                  label: fullRow.social_links?.label || '',
                  category: fullRow.social_links?.category || 'social',
                  created_at: fullRow.created_at,
                }
                setProfileLinks(prev => {
                  if (prev.some(l => l.id === mapped.id)) return prev;
                  return [...prev, mapped];
                })
              }
            }
          } else {
            // Already exists, just update state for active profile since details might have changed in Step 1
            if (profId === activeProfile.id) {
              setProfileLinks(prev => prev.map(l => l.link_id === linkId ? {
                ...l,
                category: dbCategory,
                platform: linkForm.platform.trim(),
                label: linkForm.label.trim() || null,
                url: finalUrl
              } : l))
            }
          }
        } else {
          if (existingJunction) {
            // Delete association
            await supabase.from('profile_links').delete().eq('id', existingJunction.id)
            if (profId === activeProfile.id) {
              setProfileLinks(prev => prev.filter(l => l.id !== existingJunction.id))
            }
          }
        }
      })

      await Promise.all(updatePromises)
      closeLinkModal()
    } catch (err) {
      console.error('Save link error:', err)
    } finally {
      setLinkSaving(false)
    }
  }

  const toggleLinkActive = async (link: any) => {
    const newVal = !link.is_active
    setProfileLinks(prev => prev.map(l => l.id === link.id ? { ...l, is_active: newVal } : l))
    await supabase.from('profile_links').update({ is_active: newVal }).eq('id', link.id)
  }

  const deleteLink = async (id: string) => {
    setProfileLinks(prev => prev.filter(l => l.id !== id))
    setLinkPendingDelete(null)
    await supabase.from('profile_links').delete().eq('id', id)
  }

  const moveLinkOrder = async (index: number, dir: 'up' | 'down') => {
    const newLinks = [...profileLinks]
    const swapIdx = dir === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= newLinks.length) return
      ;[newLinks[index], newLinks[swapIdx]] = [newLinks[swapIdx], newLinks[index]]
    const updated = newLinks.map((l, i) => ({ ...l, sort_order: i }))
    setProfileLinks(updated)
    for (const l of updated) {
      await supabase.from('profile_links').update({ sort_order: l.sort_order }).eq('id', l.id)
    }
  }

  const handleReorder = (newOrder: any[]) => {
    setProfileLinks(newOrder)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const promises = newOrder.map((link, index) =>
          supabase
            .from('profile_links')
            .update({ sort_order: index })
            .eq('id', link.id)
        )
        await Promise.all(promises)
      } catch (err) {
        console.error('Reorder error:', err)
      }
    }, 800)
  }

  const handleCategoryReorder = (category: string, newCategoryLinks: any[]) => {
    const catSet = new Set(newCategoryLinks.map((l: any) => l.id))
    const otherLinks = profileLinks.filter((l: any) => !catSet.has(l.id))
    const newLinks = [...otherLinks, ...newCategoryLinks]
    setProfileLinks(newLinks)

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await Promise.all(newLinks.map((link: any, index: number) =>
          supabase.from('profile_links').update({ sort_order: index }).eq('id', link.id)
        ))
      } catch (err) {
        console.error('Reorder error:', err)
      }
    }, 800)
  }

  // ── Leads CRUD ──────────────────────────────────────────────────
  const fetchLeads = async (profileId: string) => {
    if (!profileId) return
    setLeadsLoading(true)
    try {
      const { data, error } = await supabase
        .from('lead_submissions')
        .select('*')
        .eq('profile_id', profileId)
        .order('submitted_at', { ascending: false })
      if (!error && data) {
        setLeads(data)
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err)
    } finally {
      setLeadsLoading(false)
    }
  }

  const handleAttachFile = (fieldId: string, file: File) => {
    if (!file) return
    setLeadModalCustomData(p => ({
      ...p,
      [fieldId]: { file, name: file.name }
    }))
  }

  const openAddLead = async () => {
    let currentForms = [...leadForms]
    if (currentForms.length === 0 && activeProfile?.id && user?.id) {
      setLeadSaving(true)
      try {
        const { data: newForm, error: formErr } = await supabase
          .from('lead_forms')
          .insert({
            profile_id: activeProfile.id,
            account_id: user.id,
            form_name: 'Lead Form',
            title: 'Get in Touch',
            subtitle: 'Fill out the form below to connect.',
            button_label: 'Submit',
            is_active: true,
            fields: []
          })
          .select()
          .single()
        if (!formErr && newForm) {
          currentForms = [newForm]
          setLeadForms(currentForms)
        }
      } catch (err) {
        console.error('Error creating default form:', err)
      } finally {
        setLeadSaving(false)
      }
    }

    setLeadFormState({
      status: 'new'
    })
    setLeadModalSelectedFormId(null)
    setLeadModalCustomData({})
    setLeadSheet({ open: true, mode: 'add', lead: null })
  }

  const openEditLead = (lead: any) => {
    setLeadFormState({
      status: lead.status || 'new'
    })
    setLeadModalSelectedFormId(lead.form_id || null)
    setLeadModalCustomData(lead.data || {})
    setLeadSheet({ open: true, mode: 'edit', lead })
  }

  const saveLead = async () => {
    if (!activeProfile?.id || !user?.id) return
    setLeadSaving(true)
    try {
      const selectedForm = leadForms.find((f: any) => f.id === leadModalSelectedFormId)
      let formId = selectedForm?.id || null
      let formName = selectedForm?.form_name || 'Manual CRM Entry'
      const fields = selectedForm?.fields || []

      // Helper to delete a file from Supabase storage using its public URL
      const deleteStorageFileByUrl = async (url: string) => {
        try {
          if (typeof url === 'string' && url.includes('/public/lead-attachments/')) {
            const parts = url.split('/public/lead-attachments/')
            if (parts.length === 2 && parts[1]) {
              const path = decodeURIComponent(parts[1])
              const { error } = await supabase.storage.from('lead-attachments').remove([path])
              if (error) {
                console.error('Supabase storage delete error:', error)
              } else {
                console.log('Successfully deleted old file from bucket:', path)
              }
            }
          }
        } catch (deleteErr) {
          console.error('Failed to delete old file from bucket:', url, deleteErr)
        }
      }

      // Process and upload local attachments and signatures
      const finalData = { ...leadModalCustomData }
      for (const field of fields) {
        // Handle file / image uploading
        if (field.type === 'file' || field.type === 'image') {
          const originalUrl = leadSheet.lead?.data?.[field.id]
          const currentVal = finalData[field.id]
          const isReplaced = currentVal && currentVal.file
          const isRemoved = !currentVal

          if (originalUrl && (isReplaced || isRemoved)) {
            await deleteStorageFileByUrl(originalUrl)
          }

          if (isReplaced) {
            const file = currentVal.file
            const fileExt = file.name.split('.').pop()
            const filePath = `manual/${activeProfile.id}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('lead-attachments')
              .upload(filePath, file)
            if (uploadErr) throw uploadErr

            const { data: publicUrlData } = supabase.storage
              .from('lead-attachments')
              .getPublicUrl(uploadData.path)

            finalData[field.id] = publicUrlData.publicUrl
          }
        }

        // Handle base64 signature uploading
        if (field.type === 'signature') {
          const originalUrl = leadSheet.lead?.data?.[field.id]
          const currentVal = finalData[field.id]
          const isReplaced = currentVal && currentVal.startsWith?.('data:')
          const isRemoved = !currentVal

          if (originalUrl && (isReplaced || isRemoved)) {
            await deleteStorageFileByUrl(originalUrl)
          }

          if (isReplaced) {
            const base64Data = currentVal
            const response = await fetch(base64Data)
            const blob = await response.blob()
            const file = new File([blob], "signature.png", { type: "image/png" })

            const filePath = `manual/${activeProfile.id}/${Date.now()}_sig_${Math.random().toString(36).substring(2, 7)}.png`
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('lead-attachments')
              .upload(filePath, file)
            if (uploadErr) throw uploadErr

            const { data: publicUrlData } = supabase.storage
              .from('lead-attachments')
              .getPublicUrl(uploadData.path)

            finalData[field.id] = publicUrlData.publicUrl
          }
        }
      }

      if (leadSheet.mode === 'add') {
        const { error } = await supabase
          .from('lead_submissions')
          .insert({
            form_id: formId,
            form_name: formName,
            profile_id: activeProfile.id,
            account_id: user.id,
            status: leadFormState.status,
            data: finalData
          })
        if (error) throw error
        setMessage({ type: 'success', text: 'Lead added successfully!' })
      } else {
        const { error } = await supabase
          .from('lead_submissions')
          .update({
            status: leadFormState.status,
            data: finalData
          })
          .eq('id', leadSheet.lead.id)
        if (error) throw error
        setMessage({ type: 'success', text: 'Lead updated successfully!' })
      }
      setLeadSheet({ open: false, mode: 'view', lead: null })
      fetchLeads(activeProfile.id)
    } catch (err: any) {
      console.error('Failed to save lead:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to save lead.' })
    } finally {
      setLeadSaving(false)
    }
  }

  const deleteLeadSubmission = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('lead_submissions')
        .delete()
        .eq('id', leadId)
      if (error) throw error
      setLeads(prev => prev.filter(l => l.id !== leadId))
      setLeadPendingDelete(null)
      setMessage({ type: 'success', text: 'Lead deleted successfully!' })
    } catch (err: any) {
      console.error('Failed to delete lead:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to delete lead.' })
    }
  }

  const handleUpdateLeadStatus = async (leadId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('lead_submissions')
        .update({ status })
        .eq('id', leadId)
      if (error) throw error
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l))
      setMessage({ type: 'success', text: 'Lead status updated!' })
    } catch (err: any) {
      console.error('Failed to update lead status:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to update status.' })
    }
  }

  // ── Multi-Form System Functions ─────────────────────────────────

  const fetchLeadForms = async (profileId: string) => {
    if (!profileId) return
    setLeadFormsLoading(true)
    try {
      const { data, error } = await supabase
        .from('lead_forms')
        .select('*')
        .eq('profile_id', profileId)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false })
      if (!error && data) {
        setLeadForms(data)
      }
    } catch (err) {
      console.error('Failed to fetch lead forms:', err)
    } finally {
      setLeadFormsLoading(false)
    }
  }

  const fetchProfileProducts = async (profileId: string) => {
    if (!profileId) return
    setProfileProductsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profile_products')
        .select('*')
        .eq('profile_id', profileId)
        .order('sort_order', { ascending: true })
      if (!error && data) {
        setProfileProducts(data)
        const productIds = data.map(p => p.id)
        if (productIds.length > 0) {
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('profile_product_reviews')
            .select('*')
            .in('product_id', productIds)
            .order('created_at', { ascending: false })
          if (!reviewsError && reviewsData) {
            setProductReviews(reviewsData)
          } else {
            setProductReviews([])
          }
        } else {
          setProductReviews([])
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile products:', err)
    } finally {
      setProfileProductsLoading(false)
    }
  }

  const openAddProduct = () => {
    setProductFormMode('add')
    setEditingProduct(null)
    setIsConfirmingProductDelete(false)
    setProductForm({
      name: '',
      description: '',
      price_inr: '',
      net_quantity: '0',
      link_url: '',
      enquiry_form_id: '',
      is_active: true,
      rating: '',
      review: ''
    })
    setProductImages([])
    setDeletedExistingImageUrls([])
    setNewReviewRating('5')
    setNewReviewText('')
    setNewReviewName('')
    setProductSheetOpen(true)
  }

  const openEditProduct = (product: any) => {
    setProductFormMode('edit')
    setEditingProduct(product)
    setIsConfirmingProductDelete(false)
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price_inr: product.price_inr ? (product.price_inr / 100).toString() : '',
      net_quantity: (product.net_quantity ?? 0).toString(),
      link_url: product.link_url || '',
      enquiry_form_id: product.enquiry_form_id || '',
      is_active: product.is_active ?? true,
      rating: '',
      review: ''
    })
    const mappedImages = (product.image_urls || []).map((url: string) => ({
      id: Math.random().toString(36).substring(2, 9),
      type: 'existing',
      url
    }))
    setProductImages(mappedImages)
    setDeletedExistingImageUrls([])
    setNewReviewRating('5')
    setNewReviewText('')
    setNewReviewName('')
    setProductSheetOpen(true)
  }

  const openViewProduct = (product: any) => {
    setProductFormMode('view')
    setEditingProduct(product)
    setIsConfirmingProductDelete(false)
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price_inr: product.price_inr ? (product.price_inr / 100).toString() : '',
      net_quantity: (product.net_quantity ?? 0).toString(),
      link_url: product.link_url || '',
      enquiry_form_id: product.enquiry_form_id || '',
      is_active: product.is_active ?? true,
      rating: '',
      review: ''
    })
    const mappedImages = (product.image_urls || []).map((url: string) => ({
      id: Math.random().toString(36).substring(2, 9),
      type: 'existing',
      url
    }))
    setProductImages(mappedImages)
    setDeletedExistingImageUrls([])
    setNewReviewRating('5')
    setNewReviewText('')
    setNewReviewName('')
    setProductSheetOpen(true)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productForm.name || !activeProfile?.id || !user?.id) return
    setProductSaving(true)
    try {
      const parsedPrice = productForm.price_inr ? Math.round(parseFloat(productForm.price_inr) * 100) : null
      const parsedQuantity = parseInt(productForm.net_quantity, 10) || 0
      
      const parsedViews = productFormMode === 'edit' ? (editingProduct?.view_count ?? 0) : 0

      const finalUrls: string[] = []
      
      for (const img of productImages) {
        if (img.type === 'existing') {
          finalUrls.push(img.url)
        } else if (img.type === 'new') {
          const fileExt = img.file.name.split('.').pop()
          const fileName = `${user.id}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
          const filePath = `${fileName}`
          
          const { error } = await supabase.storage
            .from('product-images')
            .upload(filePath, img.file)
          if (error) throw error
          
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath)
            
          finalUrls.push(publicUrl)
        }
      }

      const payload: any = {
        profile_id: activeProfile.id,
        account_id: user.id,
        name: productForm.name,
        description: productForm.description || null,
        price_inr: parsedPrice,
        net_quantity: parsedQuantity,
        view_count: parsedViews,
        link_url: productForm.link_url || null,
        enquiry_form_id: productForm.enquiry_form_id || null,
        is_active: productForm.is_active,
        image_urls: finalUrls,
        image_url: finalUrls[0] || null
      }
      
      if (productFormMode === 'add') {
        const { data, error } = await supabase
          .from('profile_products')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        setProfileProducts(prev => [...prev, data])
        setMessage({ type: 'success', text: 'Product added successfully!' })
      } else {
        const { data, error } = await supabase
          .from('profile_products')
          .update(payload)
          .eq('id', editingProduct.id)
          .select()
          .single()
        if (error) throw error
        setProfileProducts(prev => prev.map(p => p.id === editingProduct.id ? data : p))
        setMessage({ type: 'success', text: 'Product updated successfully!' })
      }

      for (const url of deletedExistingImageUrls) {
        try {
          const isReferenced = allAccountProducts.some(
            p => p.id !== editingProduct?.id && p.image_urls && Array.isArray(p.image_urls) && p.image_urls.includes(url)
          )
          if (!isReferenced && url.includes('/public/product-images/')) {
            const parts = url.split('/public/product-images/')
            if (parts.length === 2 && parts[1]) {
              const path = decodeURIComponent(parts[1])
              await supabase.storage.from('product-images').remove([path])
            }
          }
        } catch (delErr) {
          console.error('Failed to delete removed image from bucket:', url, delErr)
        }
      }

      fetchAllAccountProducts()

      productImages.forEach(img => {
        if (img.type === 'new') {
          URL.revokeObjectURL(img.previewUrl)
        }
      })

      setProductSheetOpen(false)
    } catch (err: any) {
      console.error('Failed to save product:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to save product.' })
    } finally {
      setProductSaving(false)
    }
  }

  // ── Product Reviews CRUD ────────────────────────────────────
  const handleAddReview = async (productId: string) => {
    if (!newReviewRating || !productId) return
    setReviewSaving(true)
    try {
      const ratingVal = Math.min(5, Math.max(0, parseFloat(newReviewRating)))
      const { data, error } = await supabase
        .from('profile_product_reviews')
        .insert({
          product_id: productId,
          rating: ratingVal,
          review: newReviewText.trim() || null,
          reviewer_name: newReviewName.trim() || 'Anonymous'
        })
        .select()
        .single()
      if (error) throw error
      setProductReviews(prev => [data, ...prev])
      // Refresh product row to get updated average rating from trigger
      const { data: updatedProduct } = await supabase
        .from('profile_products')
        .select('*')
        .eq('id', productId)
        .single()
      if (updatedProduct) {
        setProfileProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p))
      }
      setNewReviewRating('5')
      setNewReviewText('')
      setNewReviewName('')
      setMessage({ type: 'success', text: 'Review added!' })
    } catch (err: any) {
      console.error('Failed to add review:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to add review.' })
    } finally {
      setReviewSaving(false)
    }
  }

  const handleDeleteReview = async (reviewId: string, productId: string) => {
    try {
      const { error } = await supabase
        .from('profile_product_reviews')
        .delete()
        .eq('id', reviewId)
      if (error) throw error
      setProductReviews(prev => prev.filter(r => r.id !== reviewId))
      // Refresh product row to get updated average rating from trigger
      const { data: updatedProduct } = await supabase
        .from('profile_products')
        .select('*')
        .eq('id', productId)
        .single()
      if (updatedProduct) {
        setProfileProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p))
      }
      setMessage({ type: 'success', text: 'Review deleted.' })
    } catch (err: any) {
      console.error('Failed to delete review:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to delete review.' })
    }
  }

  const confirmDeleteProduct = async (id: string) => {
    setProductDeleting(id)
    try {
      const prod = profileProducts.find(p => p.id === id)
      
      const { error } = await supabase
        .from('profile_products')
        .delete()
        .eq('id', id)
      if (error) throw error

      if (prod?.image_urls && Array.isArray(prod.image_urls)) {
        for (const url of prod.image_urls) {
          const isReferenced = allAccountProducts.some(
            p => p.id !== id && p.image_urls && Array.isArray(p.image_urls) && p.image_urls.includes(url)
          )
          if (!isReferenced && typeof url === 'string' && url.includes('/public/product-images/')) {
            const parts = url.split('/public/product-images/')
            if (parts.length === 2 && parts[1]) {
              const path = decodeURIComponent(parts[1])
              await supabase.storage.from('product-images').remove([path])
            }
          }
        }
      }
      
      setProfileProducts(prev => prev.filter(p => p.id !== id))
      fetchAllAccountProducts()
      setMessage({ type: 'success', text: 'Product deleted successfully!' })
    } catch (err: any) {
      console.error('Failed to delete product:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to delete product.' })
    } finally {
      setProductDeleting(null)
      setProductPendingDelete(null)
    }
  }

  const handleUploadProductImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user) return
    const newItems: any[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const previewUrl = URL.createObjectURL(file)
      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        type: 'new',
        file,
        previewUrl
      })
    }
    setProductImages(prev => [...prev, ...newItems])
  }

  const handleDeleteProductImage = (id: string) => {
    const target = productImages.find(img => img.id === id)
    if (!target) return
    
    if (target.type === 'new') {
      URL.revokeObjectURL(target.previewUrl)
    } else if (target.type === 'existing') {
      setDeletedExistingImageUrls(prev => [...prev, target.url])
    }
    
    setProductImages(prev => prev.filter(img => img.id !== id))
  }

  const moveProductImage = (index: number, direction: 'up' | 'down') => {
    const list = [...productImages]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= list.length) return
    const temp = list[index]
    list[index] = list[targetIndex]
    list[targetIndex] = temp
    setProductImages(list)
  }

  const checkDuplicateProductConflict = async (name: string, targetProfileId: string) => {
    if (!targetProfileId) return
    setDuplicateProductCheckingConflict(true)
    try {
      const { data, error } = await supabase
        .from('profile_products')
        .select('name')
        .eq('profile_id', targetProfileId)
      if (error) throw error
      if (data) {
        const conflict = data.some((p: any) =>
          p.name.trim().toLowerCase() === name.trim().toLowerCase()
        )
        setDuplicateProductConflict(conflict)
      }
    } catch (err) {
      console.error('Failed to check product duplication conflict:', err)
    } finally {
      setDuplicateProductCheckingConflict(false)
    }
  }

  const openDuplicateProductDialog = (product: any) => {
    setDuplicatingProduct(product)
    setDuplicateProductName(product.name || '')
    const targetId = cardProfiles.filter((p: any) => p.id !== activeProfile?.id)[0]?.id || ''
    setDuplicateProductTargetProfileId(targetId)
    setDuplicateProductConflict(false)
    setDuplicateProductDialogOpen(true)
    if (targetId) {
      checkDuplicateProductConflict(product.name, targetId)
    }
  }

  const confirmDuplicateProduct = async () => {
    if (!duplicatingProduct || !duplicateProductTargetProfileId || !user?.id) return
    setDuplicatingProductProgress(true)
    try {
      const targetProfile = cardProfiles.find((p: any) => p.id === duplicateProductTargetProfileId)
      const { data, error } = await supabase
        .from('profile_products')
        .insert({
          profile_id: duplicateProductTargetProfileId,
          account_id: user.id,
          name: duplicateProductName.trim(),
          description: duplicatingProduct.description,
          price_inr: duplicatingProduct.price_inr,
          currency: duplicatingProduct.currency || 'INR',
          is_active: false,
          image_urls: duplicatingProduct.image_urls || [],
          image_url: duplicatingProduct.image_url || null,
          net_quantity: duplicatingProduct.net_quantity || 0,
          rating: null,
          review: null,
          click_count: 0,
          view_count: 0,
          link_url: duplicatingProduct.link_url || null,
          enquiry_form_id: null
        })
        .select()
        .single()
      if (error) throw error
      setDuplicateProductDialogOpen(false)
      fetchAllAccountProducts()
      setMessage({ type: 'success', text: `Product duplicated to "${targetProfile?.profile_name || 'profile'}" successfully!` })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to duplicate product.' })
    } finally {
      setDuplicatingProductProgress(false)
    }
  }

  const fetchAllAccountProducts = async () => {
    if (!user?.id) return
    setAllAccountProductsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profile_products')
        .select('*')
        .eq('account_id', user.id)
      if (error) throw error
      if (data) {
        setAllAccountProducts(data)
      }
    } catch (err) {
      console.error('Failed to fetch all account products:', err)
    } finally {
      setAllAccountProductsLoading(false)
    }
  }

  const checkDuplicateFromOthersConflict = async (name: string, targetProfileId: string) => {
    if (!targetProfileId) return
    setDuplicateFromOthersCheckingConflict(true)
    try {
      const { data, error } = await supabase
        .from('profile_products')
        .select('name')
        .eq('profile_id', targetProfileId)
      if (error) throw error
      if (data) {
        const conflict = data.some((p: any) =>
          p.name.trim().toLowerCase() === name.trim().toLowerCase()
        )
        setDuplicateFromOthersConflict(conflict)
      }
    } catch (err) {
      console.error('Failed to check product duplication conflict:', err)
    } finally {
      setDuplicateFromOthersCheckingConflict(false)
    }
  }

  const confirmDuplicateFromOthers = async () => {
    if (!selectedSourceProductId || !activeProfile?.id || !user?.id) return
    setDuplicatingFromOthersProgress(true)
    try {
      const sourceProduct = allAccountProducts.find(p => p.id === selectedSourceProductId)
      if (!sourceProduct) throw new Error('Source product not found.')

      const { data, error } = await supabase
        .from('profile_products')
        .insert({
          profile_id: activeProfile.id,
          account_id: user.id,
          name: duplicateFromOthersProductName.trim(),
          description: sourceProduct.description,
          price_inr: sourceProduct.price_inr,
          currency: sourceProduct.currency || 'INR',
          is_active: false,
          image_urls: sourceProduct.image_urls || [],
          image_url: sourceProduct.image_url || null,
          net_quantity: sourceProduct.net_quantity || 0,
          rating: null,
          review: null,
          click_count: 0,
          view_count: 0,
          link_url: sourceProduct.link_url || null,
          enquiry_form_id: null
        })
        .select()
        .single()
      if (error) throw error
      setDuplicateFromOthersDialogOpen(false)
      fetchProfileProducts(activeProfile.id)
      fetchAllAccountProducts()
      setMessage({ type: 'success', text: `Product duplicated successfully!` })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to duplicate product.' })
    } finally {
      setDuplicatingFromOthersProgress(false)
    }
  }

  const openDuplicateFromOthersDialog = () => {
    const sourceProfiles = cardProfiles.filter(profile => 
      allAccountProducts.some(p => p.profile_id === profile.id) && profile.id !== activeProfile?.id
    );
    const firstProfileId = sourceProfiles[0]?.id || ''
    setSelectedSourceProfileId(firstProfileId)

    if (firstProfileId) {
      const firstProduct = allAccountProducts.find(prod => prod.profile_id === firstProfileId)
      if (firstProduct) {
        setSelectedSourceProductId(firstProduct.id)
        setDuplicateFromOthersProductName(firstProduct.name || '')
        if (activeProfile?.id) {
          checkDuplicateFromOthersConflict(firstProduct.name, activeProfile.id)
        }
      } else {
        setSelectedSourceProductId('')
        setDuplicateFromOthersProductName('')
        setDuplicateFromOthersConflict(false)
      }
    } else {
      setSelectedSourceProductId('')
      setDuplicateFromOthersProductName('')
      setDuplicateFromOthersConflict(false)
    }
    setDuplicateFromOthersDialogOpen(true)
  }

  const handleExportProductsCSV = () => {
    const headers = ['Name', 'Description', 'Price (INR)', 'Net Quantity', 'View Count', 'Rating', 'Review', 'External Link', 'Status']
    const rows = profileProducts.map(p => [
      p.name || '',
      p.description || '',
      p.price_inr ? (p.price_inr / 100).toFixed(2) : 'Price on Request',
      (p.net_quantity ?? 0).toString(),
      (p.view_count ?? 0).toString(),
      p.rating ? parseFloat(p.rating).toFixed(1) : 'No Rating',
      p.review || '',
      p.link_url || '',
      p.is_active ? 'Active' : 'Inactive'
    ])
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `envitra_products_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ── Feeds CRUD ──────────────────────────────────────────────
  const fetchProfileFeeds = async (profileId: string) => {
    if (!profileId) return
    setProfileFeedsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profile_feeds')
        .select('*')
        .eq('profile_id', profileId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      if (data) {
        setProfileFeeds(data)
      }
    } catch (err) {
      console.error('Failed to fetch profile feeds:', err)
    } finally {
      setProfileFeedsLoading(false)
    }
  }

  const fetchAllAccountFeeds = async () => {
    if (!user?.id) return
    setAllAccountFeedsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profile_feeds')
        .select('*')
        .eq('account_id', user.id)
      if (error) throw error
      if (data) {
        setAllAccountFeeds(data)
      }
    } catch (err) {
      console.error('Failed to fetch all account feeds:', err)
    } finally {
      setAllAccountFeedsLoading(false)
    }
  }

  const fetchAnalyticsData = async () => {
    if (!user?.id) return
    setAnalyticsLoading(true)
    try {
      const days = analyticsRange === '7d' ? 7 : analyticsRange === '90d' ? 90 : 30
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateISO = startDate.toISOString()

      // 1. Fetch taps
      let tapsQuery = supabase
        .from('card_taps')
        .select('*')
        .gte('tapped_at', startDateISO)

      if (isAllCards) {
        const cardIds = cards.map((c: any) => c.id).filter(Boolean)
        if (cardIds.length > 0) {
          tapsQuery = tapsQuery.in('card_id', cardIds)
        } else {
          tapsQuery = tapsQuery.eq('card_id', '00000000-0000-0000-0000-000000000000')
        }
      } else {
        tapsQuery = tapsQuery.eq('card_id', activeCard.id)
        if (activeProfile?.id) {
          tapsQuery = tapsQuery.eq('profile_id', activeProfile.id)
        }
      }

      const { data: tapsData, error: tapsErr } = await tapsQuery
      if (tapsErr) throw tapsErr

      // 2. Fetch link clicks (raw log records)
      let clicksQuery = supabase
        .from('link_clicks')
        .select('link_id, profile_id, clicked_at')
        .gte('clicked_at', startDateISO)

      const profileIds = isAllCards
        ? cardProfiles.map((p: any) => p.id).filter(Boolean)
        : (activeProfile?.id ? [activeProfile.id] : cardProfiles.filter((p: any) => p.card_id === activeCard.id).map((p: any) => p.id))

      if (profileIds.length > 0) {
        clicksQuery = clicksQuery.in('profile_id', profileIds)
      } else {
        clicksQuery = clicksQuery.eq('profile_id', '00000000-0000-0000-0000-000000000000')
      }

      const { data: clicksData, error: clicksErr } = await clicksQuery
      if (clicksErr) throw clicksErr

      // 3. Fetch lead submissions
      let leadsQuery = supabase
        .from('lead_submissions')
        .select('*')
        .gte('submitted_at', startDateISO)

      if (profileIds.length > 0) {
        leadsQuery = leadsQuery.in('profile_id', profileIds)
      } else {
        leadsQuery = leadsQuery.eq('profile_id', '00000000-0000-0000-0000-000000000000')
      }

      const { data: leadsData, error: leadsErr } = await leadsQuery
      if (leadsErr) throw leadsErr

      // 4. Fetch social links (to read platforms and custom labels/URLs)
      let linksQuery = supabase
        .from('social_links')
        .select('*')

      if (profileIds.length > 0) {
        linksQuery = linksQuery.in('profile_id', profileIds)
      } else {
        linksQuery = linksQuery.eq('profile_id', '00000000-0000-0000-0000-000000000000')
      }
      const { data: allLinksData } = await linksQuery

      // 5. Fetch profile products
      let productsQuery = supabase
        .from('profile_products')
        .select('*')

      if (profileIds.length > 0) {
        productsQuery = productsQuery.in('profile_id', profileIds)
      } else {
        productsQuery = productsQuery.eq('profile_id', '00000000-0000-0000-0000-000000000000')
      }
      const { data: allProductsData } = await productsQuery

      // Check if we have real taps. If 0, generate rich simulated activity data.
      if (!tapsData || tapsData.length === 0) {
        // Fallback simulated data generator
        const timeline = []
        // Seed based on active range
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          
          // Generate a smooth pattern with weekends having fewer taps
          const dayOfWeek = d.getDay()
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
          const baseMultiplier = isWeekend ? 0.4 : 1.0
          
          const taps = Math.floor((Math.random() * 15 + 8) * baseMultiplier)
          const clicks = Math.floor((Math.random() * 8 + 3) * baseMultiplier)
          const leads = Math.random() > 0.75 ? Math.floor(Math.random() * 2 + 1) : 0

          timeline.push({ date: dateStr, taps, clicks, leads })
        }

        const totalSimTaps = timeline.reduce((sum, item) => sum + item.taps, 0)
        const totalSimClicks = timeline.reduce((sum, item) => sum + item.clicks, 0)
        const totalSimLeads = timeline.reduce((sum, item) => sum + item.leads, 0)

        const osList = [
          { label: 'iOS / Safari', count: Math.round(totalSimTaps * 0.54), pct: 54, color: '#3f5ce6' },
          { label: 'Android / Chrome', count: Math.round(totalSimTaps * 0.32), pct: 32, color: '#10b981' },
          { label: 'Windows', count: Math.round(totalSimTaps * 0.10), pct: 10, color: '#8b5cf6' },
          { label: 'macOS', count: Math.round(totalSimTaps * 0.04), pct: 4, color: '#f59e0b' },
        ]

        const deviceList = [
          { label: 'Mobile', count: Math.round(totalSimTaps * 0.78), pct: 78, color: '#3f5ce6' },
          { label: 'Desktop', count: Math.round(totalSimTaps * 0.16), pct: 16, color: '#10b981' },
          { label: 'Tablet', count: Math.round(totalSimTaps * 0.06), pct: 6, color: '#f59e0b' },
        ]

        const browserList = [
          { label: 'Safari', count: Math.round(totalSimTaps * 0.51), pct: 51, color: '#3f5ce6' },
          { label: 'Chrome', count: Math.round(totalSimTaps * 0.35), pct: 35, color: '#10b981' },
          { label: 'Firefox', count: Math.round(totalSimTaps * 0.09), pct: 9, color: '#8b5cf6' },
          { label: 'Edge', count: Math.round(totalSimTaps * 0.05), pct: 5, color: '#f59e0b' },
        ]

        const locationList = [
          { city: 'Mumbai', country: 'India', count: Math.round(totalSimTaps * 0.38), pct: 38 },
          { city: 'Bengaluru', country: 'India', count: Math.round(totalSimTaps * 0.28), pct: 28 },
          { city: 'New Delhi', country: 'India', count: Math.round(totalSimTaps * 0.18), pct: 18 },
          { city: 'Chennai', country: 'India', count: Math.round(totalSimTaps * 0.11), pct: 11 },
          { city: 'Pune', country: 'India', count: Math.round(totalSimTaps * 0.05), pct: 5 },
        ]

        const linksList = [
          { platform: 'Instagram', label: 'My Instagram', url: '#', clicks: Math.round(totalSimClicks * 0.42), pct: 42 },
          { platform: 'LinkedIn', label: 'Professional Profile', url: '#', clicks: Math.round(totalSimClicks * 0.28), pct: 28 },
          { platform: 'WhatsApp', label: 'Chat with Us', url: '#', clicks: Math.round(totalSimClicks * 0.18), pct: 18 },
          { platform: 'UPI / GPay', label: 'Make Payment', url: '#', clicks: Math.round(totalSimClicks * 0.09), pct: 9 },
          { platform: 'Website', label: 'Company Portal', url: '#', clicks: Math.round(totalSimClicks * 0.03), pct: 3 },
        ]

        const productsList = [
          { name: 'NFC Metal Black Card', views: Math.round(totalSimTaps * 0.65), clicks: Math.round(totalSimClicks * 0.55), ctr: Math.round((totalSimClicks * 0.55) / Math.max(1, totalSimTaps * 0.65) * 100) },
          { name: 'NFC Classic Wood Card', views: Math.round(totalSimTaps * 0.42), clicks: Math.round(totalSimClicks * 0.32), ctr: Math.round((totalSimClicks * 0.32) / Math.max(1, totalSimTaps * 0.42) * 100) },
          { name: 'Custom Brand Identity Pack', views: Math.round(totalSimTaps * 0.25), clicks: Math.round(totalSimClicks * 0.15), ctr: Math.round((totalSimClicks * 0.15) / Math.max(1, totalSimTaps * 0.25) * 100) },
        ]

        setAnalyticsData({
          isSimulated: true,
          summary: {
            totalTaps: totalSimTaps,
            uniqueVisitors: Math.round(totalSimTaps * 0.72),
            linkClicks: totalSimClicks,
            leadsCaptured: totalSimLeads,
            conversionRate: totalSimTaps > 0 ? Math.round((totalSimLeads / totalSimTaps) * 100) : 0,
            productViews: Math.round(totalSimTaps * 1.3),
            productClicks: Math.round(totalSimClicks * 1.0),
          },
          timeline,
          os: osList,
          devices: deviceList,
          browsers: browserList,
          locations: locationList,
          topLinks: linksList,
          topProducts: productsList,
        })
      } else {
        // Process real database analytics
        const timelineMap: Record<string, { taps: number, clicks: number, leads: number }> = {}
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          timelineMap[dateStr] = { taps: 0, clicks: 0, leads: 0 }
        }

        tapsData.forEach((t: any) => {
          const dateStr = new Date(t.tapped_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (timelineMap[dateStr]) {
            timelineMap[dateStr].taps++
          }
        })

        clicksData.forEach((c: any) => {
          const dateStr = new Date(c.clicked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (timelineMap[dateStr]) {
            timelineMap[dateStr].clicks++
          }
        })

        leadsData.forEach((l: any) => {
          const dateStr = new Date(l.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (timelineMap[dateStr]) {
            timelineMap[dateStr].leads++
          }
        })

        const timeline = Object.entries(timelineMap).map(([date, val]) => ({
          date,
          taps: val.taps,
          clicks: val.clicks,
          leads: val.leads,
        }))

        const totalTapsCount = tapsData.length
        const totalClicksCount = clicksData.length + (allLinksData || []).reduce((sum: number, l: any) => sum + (l.click_count || 0), 0)
        const totalLeadsCount = leadsData.length
        const uniqueVisitorsCount = new Set(tapsData.map((t: any) => t.ip_address).filter(Boolean)).size || Math.round(totalTapsCount * 0.75)

        // OS aggregates
        const osMap: Record<string, number> = {}
        tapsData.forEach((t: any) => {
          const key = t.os || 'Other'
          osMap[key] = (osMap[key] || 0) + 1
        })
        const osColors: Record<string, string> = {
          'iOS': '#3f5ce6', 'Android': '#10b981', 'Windows': '#8b5cf6', 'macOS': '#f59e0b', 'Other': '#6b7280'
        }
        const osList = Object.entries(osMap).map(([label, count]) => ({
          label,
          count,
          pct: totalTapsCount > 0 ? Math.round((count / totalTapsCount) * 100) : 0,
          color: osColors[label] || '#6b7280'
        })).sort((a, b) => b.count - a.count)

        // Device aggregates
        const deviceMap: Record<string, number> = {}
        tapsData.forEach((t: any) => {
          const key = t.device_type ? (t.device_type.charAt(0).toUpperCase() + t.device_type.slice(1)) : 'Other'
          deviceMap[key] = (deviceMap[key] || 0) + 1
        })
        const deviceColors: Record<string, string> = {
          'Mobile': '#3f5ce6', 'Desktop': '#10b981', 'Tablet': '#f59e0b', 'Other': '#6b7280'
        }
        const deviceList = Object.entries(deviceMap).map(([label, count]) => ({
          label,
          count,
          pct: totalTapsCount > 0 ? Math.round((count / totalTapsCount) * 100) : 0,
          color: deviceColors[label] || '#6b7280'
        })).sort((a, b) => b.count - a.count)

        // Browser aggregates
        const browserMap: Record<string, number> = {}
        tapsData.forEach((t: any) => {
          const key = t.browser || 'Other'
          browserMap[key] = (browserMap[key] || 0) + 1
        })
        const browserColors: Record<string, string> = {
          'Safari': '#3f5ce6', 'Chrome': '#10b981', 'Firefox': '#8b5cf6', 'Edge': '#f59e0b', 'Other': '#6b7280'
        }
        const browserList = Object.entries(browserMap).map(([label, count]) => ({
          label,
          count,
          pct: totalTapsCount > 0 ? Math.round((count / totalTapsCount) * 100) : 0,
          color: browserColors[label] || '#6b7280'
        })).sort((a, b) => b.count - a.count)

        // Geographic aggregates
        const locMap: Record<string, { city: string, country: string, count: number }> = {}
        tapsData.forEach((t: any) => {
          if (!t.city && !t.country) return
          const key = `${t.city || 'Unknown'}, ${t.country || 'Unknown'}`
          if (!locMap[key]) {
            locMap[key] = { city: t.city || 'Unknown', country: t.country || 'Unknown', count: 0 }
          }
          locMap[key].count++
        })
        const locationList = Object.values(locMap).map((loc) => ({
          city: loc.city,
          country: loc.country,
          count: loc.count,
          pct: totalTapsCount > 0 ? Math.round((loc.count / totalTapsCount) * 100) : 0
        })).sort((a, b) => b.count - a.count).slice(0, 5)

        // Link clicks aggregates
        const linkMap: Record<string, any> = {}
        clicksData.forEach((c: any) => {
          linkMap[c.link_id] = (linkMap[c.link_id] || 0) + 1
        })

        const linksList = (allLinksData || []).map((link: any) => {
          const clicks = (link.click_count || 0) + (linkMap[link.id] || 0)
          return {
            platform: link.platform,
            label: link.label || link.platform,
            url: link.url,
            clicks,
            pct: 0
          }
        })
        const maxClicks = Math.max(...linksList.map(l => l.clicks), 1)
        linksList.forEach(l => {
          l.pct = Math.round((l.clicks / maxClicks) * 100)
        })
        linksList.sort((a, b) => b.clicks - a.clicks)

        // Top products aggregates
        const productsList = (allProductsData || []).map((prod: any) => {
          const views = prod.view_count || 0
          const clicks = prod.click_count || 0
          const ctr = views > 0 ? Math.round((clicks / views) * 100) : 0
          return {
            name: prod.name,
            views,
            clicks,
            ctr
          }
        }).sort((a, b) => b.clicks - a.clicks).slice(0, 5)

        const totalProductViews = (allProductsData || []).reduce((sum: number, p: any) => sum + (p.view_count || 0), 0)
        const totalProductClicks = (allProductsData || []).reduce((sum: number, p: any) => sum + (p.click_count || 0), 0)

        setAnalyticsData({
          isSimulated: false,
          summary: {
            totalTaps: totalTapsCount,
            uniqueVisitors: uniqueVisitorsCount,
            linkClicks: totalClicksCount,
            leadsCaptured: totalLeadsCount,
            conversionRate: totalTapsCount > 0 ? Math.round((totalLeadsCount / totalTapsCount) * 100) : 0,
            productViews: totalProductViews,
            productClicks: totalProductClicks,
          },
          timeline,
          os: osList,
          devices: deviceList,
          browsers: browserList,
          locations: locationList,
          topLinks: linksList.slice(0, 5),
          topProducts: productsList,
        })
      }
    } catch (err) {
      console.error('Failed to load analytics metrics:', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const openDuplicateFeedDialog = (feed: any) => {
    setDuplicatingFeed(feed)
    const firstOther = cardProfiles.find((p: any) => p.id !== activeProfile?.id)
    setDuplicateFeedTargetProfileId(firstOther ? firstOther.id : '')
    setDuplicateFeedDialogOpen(true)
  }

  const confirmDuplicateFeed = async () => {
    if (!duplicatingFeed || !duplicateFeedTargetProfileId || !user?.id) return
    setDuplicatingFeedProgress(true)
    try {
      const targetProfile = cardProfiles.find((p: any) => p.id === duplicateFeedTargetProfileId)
      const { data, error } = await supabase
        .from('profile_feeds')
        .insert({
          profile_id: duplicateFeedTargetProfileId,
          account_id: user.id,
          feed_type: duplicatingFeed.feed_type,
          caption: duplicatingFeed.caption || null,
          media_url: duplicatingFeed.media_url || null,
          media_urls: duplicatingFeed.media_urls || [],
          thumbnail_url: duplicatingFeed.thumbnail_url || null,
          link_url: duplicatingFeed.link_url || null,
          link_title: duplicatingFeed.link_title || null,
          is_published: false,
          sort_order: 0,
          reactions: { like: 0, love: 0, fire: 0, clap: 0 }
        })
        .select()
        .single()
      if (error) throw error
      setDuplicateFeedDialogOpen(false)
      fetchAllAccountFeeds()
      setMessage({ type: 'success', text: `Feed post duplicated to "${targetProfile?.profile_name || 'profile'}" successfully!` })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to duplicate feed post.' })
    } finally {
      setDuplicatingFeedProgress(false)
    }
  }

  const openDuplicateFeedFromOthersDialog = () => {
    const sourceProfiles = cardProfiles.filter(profile =>
      allAccountFeeds.some(f => f.profile_id === profile.id) && profile.id !== activeProfile?.id
    )
    if (sourceProfiles.length > 0) {
      const firstProf = sourceProfiles[0]
      setSelectedSourceFeedProfileId(firstProf.id)
      const feedsForProf = allAccountFeeds.filter(f => f.profile_id === firstProf.id)
      if (feedsForProf.length > 0) {
        setSelectedSourceFeedId(feedsForProf[0].id)
      } else {
        setSelectedSourceFeedId('')
      }
    } else {
      setSelectedSourceFeedProfileId('')
      setSelectedSourceFeedId('')
    }
    setDuplicateFeedFromOthersDialogOpen(true)
  }

  const confirmDuplicateFeedFromOthers = async () => {
    if (!selectedSourceFeedId || !activeProfile?.id || !user?.id) return
    setDuplicatingFeedFromOthersProgress(true)
    try {
      const sourceFeed = allAccountFeeds.find(f => f.id === selectedSourceFeedId)
      if (!sourceFeed) throw new Error('Source feed not found')
      const { data, error } = await supabase
        .from('profile_feeds')
        .insert({
          profile_id: activeProfile.id,
          account_id: user.id,
          feed_type: sourceFeed.feed_type,
          caption: sourceFeed.caption || null,
          media_url: sourceFeed.media_url || null,
          media_urls: sourceFeed.media_urls || [],
          thumbnail_url: sourceFeed.thumbnail_url || null,
          link_url: sourceFeed.link_url || null,
          link_title: sourceFeed.link_title || null,
          is_published: false,
          sort_order: 0,
          reactions: { like: 0, love: 0, fire: 0, clap: 0 }
        })
        .select()
        .single()
      if (error) throw error
      setDuplicateFeedFromOthersDialogOpen(false)
      fetchAllAccountFeeds()
      fetchProfileFeeds(activeProfile.id)
      setMessage({ type: 'success', text: `Feed post duplicated successfully!` })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to duplicate feed post.' })
    } finally {
      setDuplicatingFeedFromOthersProgress(false)
    }
  }

  const handleFeedsReorder = (newOrder: any[]) => {
    setProfileFeeds(newOrder)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const promises = newOrder.map((feed, index) =>
          supabase
            .from('profile_feeds')
            .update({ sort_order: index })
            .eq('id', feed.id)
        )
        await Promise.all(promises)
      } catch (err) {
        console.error('Feeds reorder error:', err)
      }
    }, 800)
  }

  const openAddFeed = (type: 'text' | 'image' | 'video' | 'link' = 'text') => {
    setFeedFormMode('add')
    setEditingFeed(null)
    setFeedForm({
      feed_type: type,
      caption: '',
      media_url: '',
      link_url: '',
      link_title: '',
      is_published: true
    })
    setFeedImages([])
    setFeedDeletedExistingImageUrls([])
    setFeedVideo(null)
    setFeedDeletedExistingVideoUrl(null)
    setFeedSheetOpen(true)
  }

  const openEditFeed = (feed: any) => {
    setFeedFormMode('edit')
    setEditingFeed(feed)
    setFeedForm({
      feed_type: feed.feed_type || 'text',
      caption: feed.caption || '',
      media_url: feed.media_url || '',
      link_url: feed.link_url || '',
      link_title: feed.link_title || '',
      is_published: feed.is_published ?? true
    })

    if (feed.feed_type === 'image') {
      const urls = feed.media_urls && Array.isArray(feed.media_urls)
        ? feed.media_urls
        : (feed.media_url ? [feed.media_url] : [])
      setFeedImages(urls.map((url: string) => ({
        id: Math.random().toString(36).substring(2, 9),
        type: 'existing',
        url
      })))
      setFeedVideo(null)
    } else if (feed.feed_type === 'video') {
      if (feed.media_url) {
        setFeedVideo({
          id: Math.random().toString(36).substring(2, 9),
          type: 'existing',
          url: feed.media_url
        })
      } else {
        setFeedVideo(null)
      }
      setFeedImages([])
    } else {
      setFeedImages([])
      setFeedVideo(null)
    }

    setFeedDeletedExistingImageUrls([])
    setFeedDeletedExistingVideoUrl(null)
    setFeedSheetOpen(true)
  }

  const handleUploadFeedImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user) return
    const newItems: any[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const previewUrl = URL.createObjectURL(file)
      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        type: 'new',
        file,
        previewUrl
      })
    }
    setFeedImages(prev => [...prev, ...newItems])
  }

  const handleDeleteFeedImage = (id: string) => {
    const target = feedImages.find(img => img.id === id)
    if (!target) return
    
    if (target.type === 'new' && target.previewUrl) {
      URL.revokeObjectURL(target.previewUrl)
    } else if (target.type === 'existing') {
      setFeedDeletedExistingImageUrls(prev => [...prev, target.url])
    }
    
    setFeedImages(prev => prev.filter(img => img.id !== id))
  }

  const moveFeedImage = (index: number, direction: 'up' | 'down') => {
    const list = [...feedImages]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= list.length) return
    const temp = list[index]
    list[index] = list[targetIndex]
    list[targetIndex] = temp
    setFeedImages(list)
  }

  const handleUploadFeedVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const previewUrl = URL.createObjectURL(file)
    
    if (feedVideo && feedVideo.type === 'new' && feedVideo.previewUrl) {
      URL.revokeObjectURL(feedVideo.previewUrl)
    } else if (feedVideo && feedVideo.type === 'existing') {
      setFeedDeletedExistingVideoUrl(feedVideo.url)
    }

    setFeedVideo({
      id: Math.random().toString(36).substring(2, 9),
      type: 'new',
      file,
      previewUrl
    })
  }

  const handleDeleteFeedVideo = () => {
    if (!feedVideo) return
    if (feedVideo.type === 'new' && feedVideo.previewUrl) {
      URL.revokeObjectURL(feedVideo.previewUrl)
    } else if (feedVideo.type === 'existing') {
      setFeedDeletedExistingVideoUrl(feedVideo.url)
    }
    setFeedVideo(null)
  }

  const handleSubmitFeed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProfile?.id || !user?.id) return
    setFeedSaving(true)
    try {
      let finalMediaUrl: string | null = feedForm.media_url || null
      let finalMediaUrls: string[] = []

      if (feedForm.feed_type === 'image') {
        setUploadingFeedMedia(true)
        // Upload new files
        for (const img of feedImages) {
          if (img.type === 'new' && img.file) {
            const fileExt = img.file.name.split('.').pop()
            const fileName = `${user.id}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
              .from('profile-feeds')
              .upload(filePath, img.file)
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
              .from('profile-feeds')
              .getPublicUrl(filePath)
            
            finalMediaUrls.push(publicUrl)
          } else if (img.type === 'existing' && img.url) {
            finalMediaUrls.push(img.url)
          }
        }

        // Delete removed existing files from storage
        for (const url of feedDeletedExistingImageUrls) {
          const isReferenced = allAccountFeeds.some(
            f => f.id !== editingFeed?.id && f.media_urls && Array.isArray(f.media_urls) && f.media_urls.includes(url)
          )
          if (!isReferenced && typeof url === 'string' && url.includes('/public/profile-feeds/')) {
            const parts = url.split('/public/profile-feeds/')
            if (parts.length === 2 && parts[1]) {
              const path = decodeURIComponent(parts[1])
              await supabase.storage.from('profile-feeds').remove([path])
            }
          }
        }
        
        finalMediaUrl = finalMediaUrls[0] || null
      } else if (feedForm.feed_type === 'video') {
        if (feedVideo && feedVideo.type === 'new' && feedVideo.file) {
          setUploadingFeedMedia(true)
          const fileExt = feedVideo.file.name.split('.').pop()
          const fileName = `${user.id}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
          const filePath = `${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('profile-feeds')
            .upload(filePath, feedVideo.file)
          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('profile-feeds')
            .getPublicUrl(filePath)
          
          finalMediaUrl = publicUrl
        } else if (feedVideo && feedVideo.type === 'existing') {
          finalMediaUrl = feedVideo.url
        } else {
          finalMediaUrl = null
        }

        if (feedDeletedExistingVideoUrl) {
          const isReferenced = allAccountFeeds.some(
            f => f.id !== editingFeed?.id && f.media_url === feedDeletedExistingVideoUrl
          )
          if (!isReferenced && feedDeletedExistingVideoUrl.includes('/public/profile-feeds/')) {
            const parts = feedDeletedExistingVideoUrl.split('/public/profile-feeds/')
            if (parts.length === 2 && parts[1]) {
              const path = decodeURIComponent(parts[1])
              await supabase.storage.from('profile-feeds').remove([path])
            }
          }
        }
      }

      const payload: any = {
        profile_id: activeProfile.id,
        account_id: user.id,
        feed_type: feedForm.feed_type,
        caption: feedForm.caption.trim() || null,
        media_url: ['image', 'video'].includes(feedForm.feed_type) ? finalMediaUrl || null : null,
        media_urls: feedForm.feed_type === 'image' ? finalMediaUrls : [],
        link_url: feedForm.feed_type === 'link' ? feedForm.link_url.trim() || null : null,
        link_title: feedForm.feed_type === 'link' ? feedForm.link_title.trim() || null : null,
        is_published: feedForm.is_published
      }

      if (feedFormMode === 'add') {
        const minSortOrder = profileFeeds.length > 0
          ? Math.min(...profileFeeds.map(f => f.sort_order ?? 0))
          : 0;
        payload.sort_order = minSortOrder - 1;

        const { data, error } = await supabase
          .from('profile_feeds')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        setProfileFeeds(prev => [data, ...prev])
        setMessage({ type: 'success', text: 'Feed post created successfully!' })
      } else {
        const { data, error } = await supabase
          .from('profile_feeds')
          .update(payload)
          .eq('id', editingFeed.id)
          .select()
          .single()
        if (error) throw error
        setProfileFeeds(prev => prev.map(f => f.id === editingFeed.id ? data : f))
        setMessage({ type: 'success', text: 'Feed post updated successfully!' })
      }

      feedImages.forEach(img => {
        if (img.type === 'new' && img.previewUrl) URL.revokeObjectURL(img.previewUrl)
      })
      if (feedVideo && feedVideo.type === 'new' && feedVideo.previewUrl) {
        URL.revokeObjectURL(feedVideo.previewUrl)
      }

      fetchAllAccountFeeds()
      setFeedSheetOpen(false)
    } catch (err: any) {
      console.error('Failed to save feed post:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to save feed post.' })
    } finally {
      setFeedSaving(false)
      setUploadingFeedMedia(false)
    }
  }

  const confirmDeleteFeed = async (id: string) => {
    setFeedDeleting(id)
    try {
      const feed = profileFeeds.find(f => f.id === id)
      const { error } = await supabase
        .from('profile_feeds')
        .delete()
        .eq('id', id)
      if (error) throw error

      if (feed?.feed_type === 'image' && feed.media_urls && Array.isArray(feed.media_urls)) {
        for (const url of feed.media_urls) {
          const isReferenced = allAccountFeeds.some(
            f => f.id !== id && f.media_urls && Array.isArray(f.media_urls) && f.media_urls.includes(url)
          )
          if (!isReferenced && typeof url === 'string' && url.includes('/public/profile-feeds/')) {
            const parts = url.split('/public/profile-feeds/')
            if (parts.length === 2 && parts[1]) {
              const path = decodeURIComponent(parts[1])
              await supabase.storage.from('profile-feeds').remove([path])
            }
          }
        }
      }

      if (feed?.media_url && typeof feed.media_url === 'string' && feed.media_url.includes('/public/profile-feeds/')) {
        const isReferenced = allAccountFeeds.some(
          f => f.id !== id && (f.media_url === feed.media_url || (f.media_urls && Array.isArray(f.media_urls) && f.media_urls.includes(feed.media_url)))
        )
        if (!isReferenced) {
          const parts = feed.media_url.split('/public/profile-feeds/')
          if (parts.length === 2 && parts[1]) {
            const path = decodeURIComponent(parts[1])
            await supabase.storage.from('profile-feeds').remove([path])
          }
        }
      }

      setProfileFeeds(prev => prev.filter(f => f.id !== id))
      fetchAllAccountFeeds()
      setMessage({ type: 'success', text: 'Feed post deleted successfully!' })
    } catch (err: any) {
      console.error('Failed to delete feed post:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to delete feed post.' })
    } finally {
      setFeedDeleting(null)
      setFeedPendingDelete(null)
    }
  }

  const handleIncrementReaction = async (feedId: string, reactionType: string) => {
    const feed = profileFeeds.find(f => f.id === feedId)
    if (!feed) return
    
    const currentReactions = { ...feed.reactions }
    currentReactions[reactionType] = (currentReactions[reactionType] || 0) + 1
    
    setProfileFeeds(prev => prev.map(f => f.id === feedId ? { ...f, reactions: currentReactions } : f))
    
    try {
      const { error } = await supabase
        .from('profile_feeds')
        .update({ reactions: currentReactions })
        .eq('id', feedId)
      if (error) throw error
    } catch (err) {
      console.error('Failed to update reaction:', err)
      setProfileFeeds(prev => prev.map(f => f.id === feedId ? feed : f))
    }
  }

  const activateForm = async (formId: string) => {
    if (!activeProfile?.id) return
    try {
      // Use the DB helper function (atomic swap)
      const { error } = await supabase.rpc('activate_lead_form', {
        p_form_id: formId,
        p_profile_id: activeProfile.id
      })
      if (error) {
        // Fallback: manual swap in JS if RPC fails
        await supabase.from('lead_forms').update({ is_active: false }).eq('profile_id', activeProfile.id)
        await supabase.from('lead_forms').update({ is_active: true }).eq('id', formId)
      }
      // Update local state
      setLeadForms(prev => prev.map(f => ({ ...f, is_active: f.id === formId })))
      setMessage({ type: 'success', text: 'Form activated! It will now appear on your card page.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to activate form.' })
    }
  }

  const deactivateForm = async (formId: string) => {
    try {
      const { error } = await supabase
        .from('lead_forms')
        .update({ is_active: false })
        .eq('id', formId)
      if (error) throw error
      // Update local state
      setLeadForms(prev => prev.map(f => f.id === formId ? { ...f, is_active: false } : f))
      setMessage({ type: 'success', text: 'Form deactivated successfully!' })
    } catch (err: any) {
      console.error('Failed to deactivate form:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to deactivate form.' })
    }
  }

  const deleteForm = async (formId: string) => {
    try {
      const { error } = await supabase.from('lead_forms').delete().eq('id', formId)
      if (error) throw error
      setLeadForms(prev => prev.filter(f => f.id !== formId))
      setFormPendingDelete(null)
      setMessage({ type: 'success', text: 'Form deleted. Existing leads are preserved.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete form.' })
    }
  }

  const openFormBuilder = (form?: any) => {
    if (form) {
      setEditingFormId(form.id)
      setFormBuilderDraft({
        form_name: form.form_name || 'Lead Form',
        title: form.title || 'Get in Touch',
        subtitle: form.subtitle || '',
        button_label: form.button_label || 'Submit',
        is_active: form.is_active || false,
        fields: form.fields || [],
        product_ids: form.product_ids || [],
      })
    } else {
      setEditingFormId(null)
      setFormBuilderDraft({
        form_name: '',
        title: 'Get in Touch',
        subtitle: 'Fill out the form below to connect.',
        button_label: 'Submit',
        is_active: false,
        fields: [
          {
            id: Math.random().toString(36).substring(2, 11),
            type: 'text',
            label: 'Name',
            placeholder: 'Enter your name...',
            required: true,
          },
          {
            id: Math.random().toString(36).substring(2, 11),
            type: 'email',
            label: 'Email',
            placeholder: 'Enter your email...',
            required: true,
          },
          {
            id: Math.random().toString(36).substring(2, 11),
            type: 'phone',
            label: 'Phone Number',
            placeholder: 'Enter your phone number...',
            required: true,
          }
        ],
        product_ids: [],
      })
    }
    setFormBuilderOpen(true)
  }

  const saveFormBuilder = async () => {
    if (!activeProfile?.id || !user?.id) return
    setFormBuilderSaving(true)
    try {
      if (editingFormId) {
        // Update existing
        const { data, error } = await supabase
          .from('lead_forms')
          .update({
            form_name: formBuilderDraft.form_name,
            title: formBuilderDraft.title,
            subtitle: formBuilderDraft.subtitle,
            button_label: formBuilderDraft.button_label,
            fields: formBuilderDraft.fields,
            product_ids: formBuilderDraft.product_ids || [],
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFormId)
          .select()
          .single()
        if (error) throw error
        setLeadForms(prev => prev.map(f => f.id === editingFormId ? data : f))
        setMessage({ type: 'success', text: 'Form saved successfully!' })
      } else {
        // Create new
        const { data, error } = await supabase
          .from('lead_forms')
          .insert({
            profile_id: activeProfile.id,
            account_id: user.id,
            form_name: formBuilderDraft.form_name,
            title: formBuilderDraft.title,
            subtitle: formBuilderDraft.subtitle,
            button_label: formBuilderDraft.button_label,
            is_active: false,
            fields: formBuilderDraft.fields,
            product_ids: formBuilderDraft.product_ids || [],
          })
          .select()
          .single()
        if (error) throw error
        setLeadForms(prev => [data, ...prev])
        setMessage({ type: 'success', text: 'New form created! Activate it to show on your card.' })
      }
      setFormBuilderOpen(false)
    } catch (err: any) {
      console.error('Failed to save form:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to save form.' })
    } finally {
      setFormBuilderSaving(false)
    }
  }

  const checkDuplicateConflict = async (name: string, targetProfileId: string, fields: any[]) => {
    if (!targetProfileId) return
    setDuplicateCheckingConflict(true)
    try {
      const { data, error } = await supabase
        .from('lead_forms')
        .select('*')
        .eq('profile_id', targetProfileId)
      if (error) throw error
      if (data) {
        const conflict = data.some((f: any) =>
          f.form_name.trim().toLowerCase() === name.trim().toLowerCase() &&
          JSON.stringify(f.fields) === JSON.stringify(fields)
        )
        setDuplicateConflict(conflict)
      }
    } catch (err) {
      console.error('Failed to check conflict:', err)
    } finally {
      setDuplicateCheckingConflict(false)
    }
  }

  const openDuplicateDialog = (form: any) => {
    setDuplicatingForm(form)
    const targetId = cardProfiles.filter((p: any) => p.id !== activeProfile?.id)[0]?.id || ''
    setDuplicateTargetProfileId(targetId)
    setDuplicateFormName(form.form_name)
    setDuplicateConflict(false)
    setDuplicateDialogOpen(true)
    if (targetId) {
      checkDuplicateConflict(form.form_name, targetId, form.fields)
    }
  }

  const confirmDuplicateForm = async () => {
    if (!duplicatingForm || !duplicateTargetProfileId || !user?.id) return
    setDuplicating(true)
    try {
      const targetProfile = cardProfiles.find((p: any) => p.id === duplicateTargetProfileId)
      const { data, error } = await supabase
        .from('lead_forms')
        .insert({
          profile_id: duplicateTargetProfileId,
          account_id: user.id,
          form_name: duplicateFormName,
          title: duplicatingForm.title,
          subtitle: duplicatingForm.subtitle,
          button_label: duplicatingForm.button_label,
          is_active: false,
          fields: duplicatingForm.fields,
          product_ids: duplicatingForm.product_ids || [],
          duplicated_from_id: duplicatingForm.id,
        })
        .select()
        .single()
      if (error) throw error
      setDuplicateDialogOpen(false)
      setMessage({ type: 'success', text: `Form duplicated to "${targetProfile?.profile_name || 'profile'}" successfully!` })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to duplicate form.' })
    } finally {
      setDuplicating(false)
    }
  }

  // Field management helpers for form builder
  const addField = (type: string) => {
    const newField: any = {
      id: Math.random().toString(36).substring(2, 11),
      type,
      label: type === 'heading' ? 'Section Heading'
        : type === 'paragraph' ? 'Helper text here'
          : type === 'signature' ? 'Signature'
            : type.charAt(0).toUpperCase() + type.slice(1),
      placeholder: ['text', 'email', 'phone', 'number', 'url', 'textarea'].includes(type) ? `Enter ${type}...` : '',
      required: false,
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : [],
      content: ['heading', 'paragraph'].includes(type) ? '' : undefined,
      accept: type === 'image' ? 'image/*' : type === 'file' ? '*/*' : undefined,
      multiple: false,
    }
    setFormBuilderDraft((p: any) => ({ ...p, fields: [...p.fields, newField] }))
    setFieldTypePickerOpen(false)
  }

  const updateField = (fieldId: string, updates: any) => {
    setFormBuilderDraft((p: any) => ({
      ...p,
      fields: p.fields.map((f: any) => f.id === fieldId ? { ...f, ...updates } : f)
    }))
  }

  const removeField = (fieldId: string) => {
    setFormBuilderDraft((p: any) => ({
      ...p,
      fields: p.fields.filter((f: any) => f.id !== fieldId)
    }))
  }

  const moveField = (idx: number, dir: 'up' | 'down') => {
    setFormBuilderDraft((p: any) => {
      const fields = [...p.fields]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      if (swap < 0 || swap >= fields.length) return p
        ;[fields[idx], fields[swap]] = [fields[swap], fields[idx]]
      return { ...p, fields }
    })
  }

  // Save Card Profile Data

  const handleSaveCardProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCard) return
    setSavingCard(true)
    setMessage(null)

    try {
      // Validate URLs
      const cleanedLinks = cardProfile.links.filter(l => l.title.trim() !== '' && l.url.trim() !== '')

      const { data, error } = await supabase
        .from('nfc_cards')
        .update({
          profile_data: {
            name: cardProfile.name,
            tagline: cardProfile.tagline,
            bio: cardProfile.bio,
            colorHex: cardProfile.colorHex,
            colorName: cardProfile.colorName,
            links: cleanedLinks,
            products: cardProfile.products || []
          },
          status: activeCard.status === 'provisioned' ? 'active' : activeCard.status, // Auto-activate on first save
          activated_at: activeCard.activated_at || new Date().toISOString()
        })
        .eq('id', activeCard.id)
        .select('*')
        .single()

      if (error) throw error

      if (data) {
        setActiveCard(data)
        // Update cards list
        setCards(prev => prev.map(c => c.id === data.id ? data : c))
        setMessage({ type: 'success', text: 'Card business profile successfully updated!' })
      }
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to save card customizations.' })
    } finally {
      setSavingCard(false)
    }
  }

  // Save Account Profile Data
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingAccount(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          full_name: accountForm.fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile((prev: any) => ({ ...prev, full_name: accountForm.fullName }))
      setMessage({ type: 'success', text: 'Account settings updated successfully!' })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to update account settings.' })
    } finally {
      setSavingAccount(false)
    }
  }

  // Open Create Profile Modal
  const handleOpenCreateProfile = () => {
    const isPro = profile?.plan === 'pro' || profile?.plan === 'business'
    const limit = isPro ? 5 : 1
    if (cardProfiles.length >= limit) {
      setMessage({
        type: 'error',
        text: isPro
          ? 'Pro plan allows up to 5 profiles per card. Delete a profile first to add a new one.'
          : 'Free plan allows 1 profile. Upgrade to Pro to add up to 5 profiles!'
      })
      return
    }
    setShowCancelConfirm(false)
    setEditingProfile(null)
    const initialForm = {
      profileName: '',
      displayName: profile?.full_name || '',
      title: '',
      bio: '',
      status: 'active' as const,
      isActive: false,
      primaryProfile: cardProfiles.length === 0,
      avatarUrl: '',
      bgImageUrl: ''
    }
    setProfileForm(initialForm)
    setInitialProfileForm(initialForm)
    setShowProfileModal(true)
  }

  // Open Edit Profile Modal
  const handleOpenEditProfile = (p: any) => {
    setShowCancelConfirm(false)
    setEditingProfile(p)
    const initialForm = {
      profileName: p.profile_name || '',
      displayName: p.display_name || '',
      title: p.title || '',
      bio: p.bio || '',
      status: p.status || 'draft',
      isActive: p.is_active || false,
      primaryProfile: p.primary_profile || false,
      avatarUrl: p.avatar_url || '',
      bgImageUrl: p.bg_image_url || ''
    }
    setProfileForm(initialForm)
    setInitialProfileForm(initialForm)
    setShowProfileModal(true)
  }

  // Save Profile (Create / Edit)
  const handleSaveProfile = async (e: React.SyntheticEvent, formOverride?: typeof profileForm) => {
    if (e) e.preventDefault()
    if (!activeCard || isAllCards || !user) return
    setSavingProfile(true)
    setMessage(null)

    const targetForm = formOverride || profileForm

    try {
      if (editingProfile) {
        // Update profile
        const { error } = await supabase
          .from('card_profiles')
          .update({
            profile_name: targetForm.profileName,
            display_name: targetForm.displayName,
            title: targetForm.title || null,
            bio: targetForm.bio || null,
            status: targetForm.status,
            is_active: targetForm.isActive,
            primary_profile: targetForm.primaryProfile,
            avatar_url: targetForm.avatarUrl || null,
            bg_image_url: targetForm.bgImageUrl || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProfile.id)

        if (error) throw error
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
      } else {
        // Create profile
        const { data, error } = await supabase
          .from('card_profiles')
          .insert({
            card_id: activeCard.id,
            account_id: user.id,
            profile_name: targetForm.profileName,
            display_name: targetForm.displayName,
            title: targetForm.title || null,
            bio: targetForm.bio || null,
            status: targetForm.status,
            is_active: targetForm.isActive,
            primary_profile: targetForm.primaryProfile,
            avatar_url: targetForm.avatarUrl || null,
            bg_image_url: targetForm.bgImageUrl || null
          })
          .select('*')
          .single()

        if (error) throw error

        // Create default empty vcard_details row for this profile
        if (data) {
          await supabase.from('vcard_details').insert({ profile_id: data.id })

          // Add empty vcard to local map if new profile
          setVcardDataMap(prev => ({
            ...prev,
            [data.id]: {
              profile_id: data.id,
              first_name: '',
              last_name: '',
              phones: [],
              emails: [],
              custom_fields: []
            }
          }))
        }
        setMessage({ type: 'success', text: 'New profile created successfully!' })
      }

      // Re-fetch profiles for current card
      const { data: updatedList, error: listError } = await supabase
        .from('card_profiles')
        .select('*')
        .eq('card_id', activeCard.id)
        .order('sort_order', { ascending: true })

      if (!listError && updatedList) {
        const isPro = profile?.plan === 'pro' || profile?.plan === 'business'
        let currentList = [...updatedList]

        // Double check plan limit fallbacks
        if (!isPro && updatedList.length > 0) {
          const primary = updatedList.find((p: any) => p.primary_profile) || updatedList[0]
          const activeProfiles = updatedList.filter((p: any) => p.is_active)
          const needsSync = activeProfiles.length !== 1 || activeProfiles[0].id !== primary.id

          if (needsSync) {
            await supabase.from('card_profiles').update({ is_active: false }).eq('card_id', activeCard.id)
            await supabase.from('card_profiles').update({ is_active: true }).eq('id', primary.id)
            const { data: resynced } = await supabase
              .from('card_profiles')
              .select('*')
              .eq('card_id', activeCard.id)
              .order('sort_order', { ascending: true })
            if (resynced) currentList = resynced
          }
        }

        setCardProfiles(currentList)
        const live = currentList.find((p: any) => p.is_active) || currentList[0] || null
        setActiveProfile(live)
      }

      setShowProfileModal(false)
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to save profile details.' })
    } finally {
      setSavingProfile(false)
    }
  }

  // Set Profile Live (Quick action)
  const handleSetProfileLive = async (profileId: string) => {
    if (!activeCard || isAllCards) return
    setMessage(null)

    try {
      const { error } = await supabase
        .from('card_profiles')
        .update({ is_active: true })
        .eq('id', profileId)

      if (error) throw error

      // Re-fetch profiles to sync local state (triggers the DB trigger which toggles others is_active to false)
      const { data: updatedList } = await supabase
        .from('card_profiles')
        .select('*')
        .eq('card_id', activeCard.id)
        .order('sort_order', { ascending: true })

      if (updatedList) {
        setCardProfiles(updatedList)
        const live = updatedList.find((p: any) => p.is_active) || null
        setActiveProfile(live)
        setMessage({ type: 'success', text: 'Profile is now active / live!' })
      }
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to set profile live.' })
    }
  }

  // Set Profile Primary (Quick action)
  const handleSetProfilePrimary = async (profileId: string) => {
    if (!activeCard || isAllCards) return
    setMessage(null)
    try {
      const { error } = await supabase
        .from('card_profiles')
        .update({ primary_profile: true })
        .eq('id', profileId)

      if (error) throw error

      // Re-fetch profiles to sync local state (triggers the DB trigger which toggles others primary_profile to false)
      const { data: updatedList } = await supabase
        .from('card_profiles')
        .select('*')
        .eq('card_id', activeCard.id)
        .order('sort_order', { ascending: true })

      if (updatedList) {
        setCardProfiles(updatedList)
        const live = updatedList.find((p: any) => p.is_active) || updatedList[0] || null
        setActiveProfile(live)
      }
      setMessage({ type: 'success', text: 'Primary profile set successfully!' })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to set primary profile.' })
    }
  }

  // Generate & Download vCard (.vcf)
  const handleDownloadVCard = (vc: any, p: any) => {
    if (!vc) return
    const firstName = vc.first_name || ''
    const lastName = vc.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim() || p.display_name || p.profile_name

    const orgValue = vc.organization || vc.department
      ? `ORG:${vc.organization || ''}${vc.department ? `;${vc.department}` : ''}`
      : ''

    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${lastName};${firstName};;;`,
      `FN:${fullName}`,
      orgValue,
      vc.job_title ? `TITLE:${vc.job_title}` : '',
      vc.website ? `URL;TYPE=WORK:${vc.website}` : '',
      vc.notes ? `NOTE:${vc.notes.replace(/\n/g, '\\n')}` : '',
    ]

    if (vc.phones && vc.phones.length > 0) {
      vc.phones.forEach((phone: any) => {
        if (phone.number) {
          vcardLines.push(`TEL;TYPE=${(phone.label || 'CELL').toUpperCase()}:${phone.number}`)
        }
      })
    }

    if (vc.emails && vc.emails.length > 0) {
      vc.emails.forEach((email: any) => {
        if (email.email) {
          vcardLines.push(`EMAIL;TYPE=${(email.label || 'WORK').toUpperCase()}:${email.email}`)
        }
      })
    }

    if (vc.street || vc.city || vc.state || vc.postal_code) {
      vcardLines.push(`ADR;TYPE=WORK:;;${vc.street || ''};${vc.city || ''};${vc.state || ''};${vc.postal_code || ''};${vc.country || 'India'}`)
    }

    if (vc.urls && vc.urls.length > 0) {
      vc.urls.forEach((u: any) => {
        if (u.url) {
          vcardLines.push(`URL;TYPE=${(u.label || 'CUSTOM').toUpperCase()}:${u.url}`)
        }
      })
    }

    if (vc.socials && vc.socials.length > 0) {
      vc.socials.forEach((s: any) => {
        if (s.url) {
          vcardLines.push(`X-SOCIALPROFILE;TYPE=${(s.platform || 'OTHER').toUpperCase()}:${s.url}`)
        }
      })
    }

    if (vc.custom_fields && vc.custom_fields.length > 0) {
      vc.custom_fields.forEach((field: any) => {
        if (field.key && field.value) {
          vcardLines.push(`X-${field.key.replace(/\s+/g, '-').toUpperCase()}:${field.value}`)
        }
      })
    }

    vcardLines.push('END:VCARD')
    const vcardString = vcardLines.filter(Boolean).join('\n')

    const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fullName.replace(/\s+/g, '_')}_contact.vcf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Delete Profile
  const handleDeleteProfile = async (p: any) => {
    if (!activeCard || isAllCards) return

    // Check if it is the primary profile and other profiles exist
    if (p.primary_profile && cardProfiles.length > 1) {
      setMessage({
        type: 'error',
        text: 'You cannot delete the primary profile while other profiles exist. Please set another profile as primary first.'
      })
      return
    }

    if (!confirm(`Are you sure you want to delete profile "${p.profile_name}"? This will permanently remove all linked social links, products, feeds, and contact info.`)) {
      return
    }

    setMessage(null)
    try {
      const { error } = await supabase
        .from('card_profiles')
        .delete()
        .eq('id', p.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile deleted successfully.' })

      // Re-fetch profiles
      const { data: updatedList } = await supabase
        .from('card_profiles')
        .select('*')
        .eq('card_id', activeCard.id)
        .order('sort_order', { ascending: true })

      if (updatedList) {
        // Enforce fallback rules on update
        const isPro = profile?.plan === 'pro' || profile?.plan === 'business'
        let currentList = [...updatedList]

        if (updatedList.length > 0) {
          // If we deleted the active profile, trigger might have set another active, or we must activate primary
          const primary = updatedList.find((x: any) => x.primary_profile) || updatedList[0]
          const activeProfiles = updatedList.filter((x: any) => x.is_active)
          const needsSync = activeProfiles.length === 0 || (!isPro && (activeProfiles.length !== 1 || activeProfiles[0].id !== primary.id))

          if (needsSync) {
            await supabase.from('card_profiles').update({ is_active: false }).eq('card_id', activeCard.id)
            await supabase.from('card_profiles').update({ is_active: true }).eq('id', primary.id)
            const { data: resynced } = await supabase
              .from('card_profiles')
              .select('*')
              .eq('card_id', activeCard.id)
              .order('sort_order', { ascending: true })
            if (resynced) currentList = resynced
          }
        }

        setCardProfiles(currentList)
        const live = currentList.find((x: any) => x.is_active) || currentList[0] || null
        setActiveProfile(live)

        // Remove from local vcardDataMap
        setVcardDataMap(prev => {
          const updated = { ...prev }
          delete updated[p.id]
          return updated
        })
      }
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to delete profile.' })
    }
  }

  // Handle Copy Clipboard
  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
    setMessage({ type: 'success', text: 'NFC Profile URL copied to clipboard!' })
  }

  const handleCopyLinkVal = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedLinkId(id)
    setTimeout(() => setCopiedLinkId(null), 2000)
    setMessage({ type: 'success', text: 'Link URL copied to clipboard!' })
  }

  // Handle Secure Cross-Origin QR Download
  const handleDownloadQR = async (e: React.MouseEvent<HTMLAnchorElement>, url: string, filename: string) => {
    e.preventDefault()
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
      console.error('Failed to download QR code:', err)
      window.open(url, '_blank')
    }
  }

  const handleCopyTracking = (num: string) => {
    navigator.clipboard.writeText(num)
    setCopiedTracking(true)
    setTimeout(() => setCopiedTracking(false), 2000)
  }

  const handleCopyLinkUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyOrderNum = (num: string) => {
    navigator.clipboard.writeText(num)
    setCopiedOrderNum(true)
    setTimeout(() => setCopiedOrderNum(false), 2000)
  }

  const handleCopyInvoiceNum = (num: string) => {
    navigator.clipboard.writeText(num)
    setCopiedInvoiceNum(true)
    setTimeout(() => setCopiedInvoiceNum(false), 2000)
  }

  const handleCopyProductId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedProductId(id)
    setTimeout(() => setCopiedProductId(null), 2000)
  }

  // Export leads to CSV (uses filteredLeads)
  const handleExportCSV = () => {
    const headers = ['Date', 'Form', 'Status', 'Submitted Data']
    const rows = filteredLeads.map(l => {
      const dataStr = Object.entries(l.data || {})
        .map(([k, v]) => {
          const valStr = typeof v === 'object' && v ? ((v as any).name || JSON.stringify(v)) : String(v ?? '')
          return `${k}: ${valStr}`
        })
        .join(' | ')
      return [
        l.submitted_at ? new Date(l.submitted_at).toLocaleString() : '',
        l.form_name || '',
        l.status || '',
        dataStr
      ]
    })
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `envitra_leads_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter leads: search + form + product
  const filteredLeads = leads.filter(lead => {
    const query = leadsSearch.toLowerCase()
    const dataString = Object.entries(lead.data || {})
      .map(([k, v]) => `${k} ${typeof v === 'object' && v ? ((v as any).name || JSON.stringify(v)) : String(v ?? '')}`)
      .join(' ')
      .toLowerCase()
    const matchesSearch = !query || dataString.includes(query) || (lead.form_name || '').toLowerCase().includes(query)
    const matchesForm = leadsFilterFormId === 'all' || lead.form_id === leadsFilterFormId
    const matchesProduct = leadsFilterProductId === 'all' || lead.product_id === leadsFilterProductId
    return matchesSearch && matchesForm && matchesProduct
  })

  // ── Shimmer Skeleton ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar skeleton */}
        <aside className="w-[220px] shrink-0 border-r border-border bg-sidebar flex flex-col gap-6 p-4">
          {/* Logo */}
          <div className="flex items-center gap-2 px-1 py-1">
            <div className="skeleton w-8 h-8 rounded-md" />
            <div className="skeleton h-4 w-20 rounded" />
          </div>
          {/* Nav items */}
          <div className="flex flex-col gap-3 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2">
                <div className="skeleton w-4 h-4 rounded" />
                <div className="skeleton h-3.5 rounded" style={{ width: `${55 + (i % 3) * 18}px` }} />
              </div>
            ))}
          </div>
        </aside>

        {/* Main area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header skeleton */}
          <header className="h-16 shrink-0 border-b border-border px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="skeleton w-6 h-6 rounded" />
              <div className="skeleton w-px h-4" />
              <div className="skeleton h-7 w-32 rounded-lg" />
            </div>
            <div className="skeleton h-5 w-28 rounded" />
            <div className="skeleton w-8 h-8 rounded-full" />
          </header>

          {/* Content skeleton */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 4 stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border/50 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="skeleton w-8 h-8 rounded-lg" />
                    <div className="skeleton h-7 w-10 rounded" />
                  </div>
                  <div className="skeleton h-8 w-full rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              ))}
            </div>

            {/* Wide content block */}
            <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="skeleton h-5 w-40 rounded" />
                <div className="skeleton h-7 w-24 rounded-lg" />
              </div>
              <div className="skeleton h-40 w-full rounded-xl" />
            </div>

            {/* Table block */}
            <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
              <div className="skeleton h-5 w-32 rounded" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 rounded" style={{ width: `${50 + (i % 4) * 12}%` }} />
                    <div className="skeleton h-2.5 rounded w-2/5" />
                  </div>
                  <div className="skeleton h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <TooltipProvider>

        {/* Collapsible shadcn-ui App Sidebar */}
        <AppSidebar
          activeCard={activeCard}
          cards={cards}
          account={profile}
          handleSelectCard={handleSelectCard}
          onUpgradeClick={() => setShowUpgradeModal(true)}
        />

        {/* Sidebar Inset Layout */}
        <SidebarInset className="bg-background text-foreground flex flex-col h-screen overflow-hidden">

          {/* Top Header Bar */}
          <header className="flex h-16 shrink-0 items-center border-b border-border bg-background px-6 sticky top-0 z-30 select-none">
            {/* Left section: Collapse Trigger & Dropdown */}
            <div className="flex items-center gap-3 w-1/3 justify-start">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
              <div className="h-4 w-px bg-border" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/70 transition-colors text-xs font-semibold text-foreground cursor-pointer select-none active:scale-98">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#3f5ce6]"
                    />
                    <span className="truncate max-w-[150px]">
                      {isAllCards ? 'All Cards' : (activeCard?.card_nickname ? `${activeCard.slug} (${activeCard.card_nickname})` : activeCard?.slug || 'Select Card')}
                    </span>
                    <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 mt-1 border border-border bg-popover text-popover-foreground rounded-xl shadow-2xl p-1.5 space-y-1 z-[100]">
                  <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Workspaces</div>

                  {/* All Cards option */}
                  <DropdownMenuItem
                    onClick={() => handleSelectCard(ALL_CARDS_WORKSPACE)}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${isAllCards
                      ? 'bg-[#3f5ce6]/10 text-[#3f5ce6] focus:bg-[#3f5ce6]/10 focus:text-[#3f5ce6] border border-[#3f5ce6]/20'
                      : 'hover:bg-accent focus:bg-accent text-muted-foreground border border-transparent'
                      }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-3.5 h-3.5 rounded-sm bg-[#3f5ce6] flex items-center justify-center text-[7px] font-bold text-white uppercase shrink-0">
                        ALL
                      </div>
                      <span className="font-semibold text-foreground">All Cards</span>
                    </div>
                  </DropdownMenuItem>

                  <div className="h-px bg-border my-1" />

                  <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Your Cards</div>

                  {/* List of cards */}
                  {cards.map((c) => (
                    <DropdownMenuItem
                      key={c.id}
                      onClick={() => handleSelectCard(c)}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${activeCard?.id === c.id
                        ? 'bg-[#3f5ce6]/10 text-[#3f5ce6] focus:bg-[#3f5ce6]/10 focus:text-[#3f5ce6] border border-[#3f5ce6]/20'
                        : 'hover:bg-accent focus:bg-accent text-muted-foreground border border-transparent'
                        }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[7px] font-bold text-white uppercase shrink-0 bg-[#3f5ce6]"
                        >
                          {c.slug?.substring(0, 2)}
                        </div>
                        <span className="font-mono text-foreground truncate">
                          {c.slug}{c.card_nickname ? ` (${c.card_nickname})` : ''}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Center section: Centered Breadcrumb */}
            <div className="flex items-center justify-center w-1/3 text-center">
              <span className="text-foreground font-semibold text-sm capitalize">
                {activeTab === 'overview' ? 'Overview' :
                  activeTab === 'card' ? 'Card Preview' :
                    activeTab === 'profiles' ? 'Profiles' :
                      activeTab === 'vcard' ? 'vCard Details' :
                        activeTab === 'links' ? 'Manage Links' :
                          activeTab === 'leads' ? 'Leads' :
                            activeTab === 'products' ? 'Products' :
                              activeTab === 'feeds' ? 'Feeds' :
                                activeTab === 'analytics' ? 'Analytics' :
                                  activeTab === 'settings' ? 'Settings' :
                                    activeTab === 'shop' ? 'Shop' :
                                      activeTab === 'orders' ? (
                                        selectedOrderId ? (
                                          <span className="flex items-center gap-1.5 justify-center normal-case">
                                            <button
                                              onClick={() => setSelectedOrderId(null)}
                                              className="text-muted-foreground hover:text-[#3f5ce6] transition-colors font-medium hover:underline cursor-pointer"
                                            >
                                              Orders
                                            </button>
                                            <span className="text-muted-foreground/60 text-xs">➔</span>
                                            <span className="text-foreground font-semibold">Track Order</span>
                                          </span>
                                        ) : (
                                          'Orders'
                                        )
                                      ) :
                                        'Overview'}
              </span>
            </div>

            {/* Right section: Profile selector + User avatar */}
            <div className="flex items-center justify-end gap-3 w-1/3">
              {/* Profile selector — only in card context and only on links, leads, feeds, products, analytics */}
              {!isAllCards && ['links', 'leads', 'feeds', 'products', 'analytics'].includes(activeTab) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/70 transition-colors text-xs font-medium text-foreground cursor-pointer select-none">
                      <div className="w-4 h-4 rounded-full bg-[#3f5ce6]/20 flex items-center justify-center shrink-0">
                        <span className="text-[8px] font-bold text-[#3f5ce6]">
                          {(activeProfile?.profile_name || 'P')[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="truncate max-w-[100px]">
                        {activeProfile?.profile_name || 'Select Profile'}
                      </span>
                      <ChevronDown className="size-3 text-muted-foreground shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 mt-1 border border-border bg-popover rounded-xl shadow-2xl p-1.5 z-[100]">
                    <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Profiles</div>
                    {cardProfiles.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">No profiles yet</div>
                    ) : cardProfiles.map((p: any) => (
                      <DropdownMenuItem
                        key={p.id}
                        onClick={() => setActiveProfile(p)}
                        className={`px-3 py-2 rounded-md text-xs cursor-pointer flex items-center gap-2 ${activeProfile?.id === p.id
                          ? 'bg-[#3f5ce6]/10 text-[#3f5ce6]'
                          : 'text-foreground hover:bg-accent'
                          }`}
                      >
                        <div className="w-5 h-5 rounded-full bg-[#3f5ce6]/10 flex items-center justify-center text-[8px] font-bold text-[#3f5ce6] shrink-0">
                          {p.profile_name?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold truncate">{p.profile_name}</span>
                          {p.title && <span className="text-[9px] text-muted-foreground truncate">{p.title}</span>}
                        </div>
                        {p.is_active && (
                          <span className="ml-auto text-[8px] font-bold text-emerald-500 bg-emerald-500/10 rounded px-1 py-0.5">LIVE</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <HeaderProfile />
            </div>
          </header>

          {/* Main scrollable content panel */}
          <main className="flex-grow overflow-y-auto bg-background p-6 max-w-7xl w-full mx-auto space-y-6">

            {/* Feedback message banner */}
            {message && (
              <div className={`p-3.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 border animate-fadeIn shadow-sm select-none ${message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{message.text}</span>
                </div>
                <button
                  onClick={() => setMessage(null)}
                  className="p-1 rounded hover:bg-foreground/5 text-current cursor-pointer active:scale-95 transition-all shrink-0"
                  title="Dismiss message"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: OVERVIEW                                            */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Summary Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Active Cards */}
                  <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm overflow-hidden group hover:shadow-md hover:border-[#3f5ce6]/40 transition-all relative text-left">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none group-hover:from-[#3f5ce6]/10 transition-all" />
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 bg-[#3f5ce6]/10 rounded-lg group-hover:bg-[#3f5ce6]/20 transition-colors">
                        <CreditCard className="w-4 h-4 text-[#3f5ce6]" />
                      </div>
                      <span className="text-2xl font-extrabold tracking-tight text-foreground">{cards.length}</span>
                    </div>
                    <div className="flex gap-1.5 mb-4 mt-2 h-10 items-center">
                      {cards.slice(0, 5).map((c, i) => (
                        <div
                          key={c.id || i}
                          className="w-7 h-4.5 rounded border border-border/80 opacity-80 shrink-0"
                          style={{ backgroundColor: c.profile_data?.colorHex || '#3f5ce6' }}
                          title={c.slug}
                        />
                      ))}
                      {cards.length === 0 && (
                        <div className="h-1.5 w-full rounded-full bg-muted/40 border border-dashed border-border/40" />
                      )}
                      {cards.length > 5 && (
                        <div className="text-[10px] text-muted-foreground font-bold">+{cards.length - 5}</div>
                      )}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-[#3f5ce6]/70 transition-colors">Active Cards</p>
                  </div>

                  {/* Card 2: Workspace/Active Card Slug */}
                  <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm overflow-hidden group hover:shadow-md hover:border-[#3f5ce6]/40 transition-all relative text-left">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none group-hover:from-[#3f5ce6]/10 transition-all" />
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 bg-[#3f5ce6]/10 rounded-lg group-hover:bg-[#3f5ce6]/20 transition-colors">
                        <User className="w-4 h-4 text-[#3f5ce6]" />
                      </div>
                      <span className="text-sm font-mono font-bold text-foreground/90 truncate max-w-[120px] uppercase">
                        {isAllCards ? 'All Cards' : (activeCard ? activeCard.slug : 'NONE')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-4 mt-2 h-10">
                      <div className="relative w-8 h-8 shrink-0">
                        {[1, 0.65, 0.35].map((s, i) => (
                          <div key={i} className="absolute border-2 border-[#3f5ce6] rounded-full"
                            style={{ width: `${s * 100}%`, height: `${s * 100}%`, top: `${(1 - s) * 50}%`, left: `${(1 - s) * 50}%`, opacity: 0.3 + (1 - s) * 0.5 }}
                          />
                        ))}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#3f5ce6]" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isAllCards ? 'bg-[#3f5ce6]' : activeCard?.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          {isAllCards ? 'All Workspaces' : (activeCard?.status || 'Inactive')}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-[#3f5ce6]/70 transition-colors">Workspace</p>
                  </div>

                  {/* Card 3: Taps */}
                  <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm overflow-hidden group hover:shadow-md hover:border-[#3f5ce6]/40 transition-all relative text-left">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none group-hover:from-[#3f5ce6]/10 transition-all" />
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 bg-[#3f5ce6]/10 rounded-lg group-hover:bg-[#3f5ce6]/20 transition-colors">
                        <Activity className="w-4 h-4 text-[#3f5ce6]" />
                      </div>
                      <span className="text-2xl font-extrabold tracking-tight text-foreground">
                        {isAllCards
                          ? cards.reduce((sum, c) => sum + (c.tap_count || 0), 0)
                          : (activeCard?.tap_count || 0)}
                      </span>
                    </div>
                    <div className="flex items-end gap-1 h-10 mb-4 mt-2">
                      {[2, 5, 3, 8, 4, 6, 3, 7, 5, 9].map((val, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-sm ${i === 9 ? 'bg-[#3f5ce6]' : 'bg-[#3f5ce6]/30'}`}
                          style={{ height: `${val * 10}%` }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-[#3f5ce6]/70 transition-colors">
                      {isAllCards ? 'Total Scan Taps' : 'Taps This Month'}
                    </p>
                  </div>

                  {/* Card 4: Leads */}
                  <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm overflow-hidden group hover:shadow-md hover:border-emerald-500/40 transition-all relative text-left">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none group-hover:from-emerald-500/10 transition-all" />
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                        <Users className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-2xl font-extrabold tracking-tight text-foreground">{leads.length}</span>
                    </div>
                    <div className="space-y-1.5 mb-4 mt-2 h-10 flex flex-col justify-center">
                      {[100, 70, 45, 25].map((w, i) => (
                        <div key={i} className={`h-1.5 rounded-full ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-emerald-400/70' : i === 2 ? 'bg-emerald-300/50' : 'bg-emerald-200/40'
                          }`} style={{ width: `${w}%` }} />
                      ))}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-emerald-500/70 transition-colors">Leads Captured</p>
                  </div>
                </div>

                {cards.length > 0 ? (
                  isAllCards ? (
                    /* All Cards Workspace View */
                    <div className="space-y-6 text-left">
                      <div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Select Card Workspace</h3>
                        <p className="text-xs text-muted-foreground">Click on any card below to open and manage its dynamic profile.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {cards.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectCard(c)}
                            className="group relative bg-card border border-border hover:border-[#3f5ce6]/50 rounded-2xl p-6 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(63,92,230,0.1)] flex flex-col justify-between h-48 select-none"
                          >
                            <div
                              className="absolute top-0 left-0 w-2 h-full rounded-l-2xl transition-colors duration-300"
                              style={{ backgroundColor: c.profile_data?.colorHex || '#3f5ce6' }}
                            />
                            <div className="pl-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{c.slug}</span>
                                <span className={`text-[8px] uppercase px-1.5 py-0.2 rounded-full font-bold tracking-wider ${c.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                  {c.status}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-base font-extrabold text-foreground tracking-tight leading-tight truncate">
                                  {c.profile_data?.name || 'New Profile'}
                                </h4>
                                <p className="text-[10px] text-muted-foreground truncate">{c.profile_data?.tagline || 'No tagline set'}</p>
                              </div>
                            </div>
                            <div className="pl-3 flex justify-between items-center border-t border-border pt-4 text-[10px] text-muted-foreground font-medium">
                              <span className="flex items-center gap-1">
                                <Activity size={12} className="text-muted-foreground" />
                                <span className="text-foreground"><b>{c.tap_count || 0}</b> taps</span>
                              </span>
                              <span className="group-hover:text-[#3f5ce6] transition-colors font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                                Manage <ArrowRight size={10} />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Single Selected Card View: Welcome Dashboard screen */
                    <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 text-left space-y-6 shadow-sm relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none" />

                      <div className="relative z-10 max-w-xl space-y-3">
                        <div className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#3f5ce6]/10 text-[#3f5ce6] border border-[#3f5ce6]/20">
                          Workspace Dashboard
                        </div>
                        <h3 className="text-xl font-extrabold text-foreground tracking-tight leading-tight">
                          Welcome, {profile?.full_name || 'Card Owner'}!
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          You are currently managing the smart card workspace for <strong className="font-mono text-[#3f5ce6] font-bold">{activeCard?.card_nickname || activeCard?.slug}</strong>. Use the navigation sidebar or quick actions below to customize your experience.
                        </p>
                      </div>

                      <hr className="border-border/50 my-6" />

                      <div className="relative z-10 space-y-4">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Quick Actions & Setup Guide</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                          <Link
                            href={`/dashboard?tab=card`}
                            className="group p-5 bg-background border border-border/50 hover:border-[#3f5ce6]/40 hover:bg-[#3f5ce6]/5 rounded-xl transition-all flex items-start gap-4 cursor-pointer"
                          >
                            <div className="p-2.5 bg-[#3f5ce6]/10 rounded-lg group-hover:bg-[#3f5ce6]/20 transition-colors shrink-0">
                              <CreditCard className="w-5 h-5 text-[#3f5ce6]" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-foreground group-hover:text-[#3f5ce6] transition-colors">1. Visual Customization & Status</h5>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">View your interactive card designs, download the QR code, or enable/disable NFC access.</p>
                            </div>
                          </Link>

                          <Link
                            href={`/dashboard?tab=profiles`}
                            className="group p-5 bg-background border border-border/50 hover:border-[#3f5ce6]/40 hover:bg-[#3f5ce6]/5 rounded-xl transition-all flex items-start gap-4 cursor-pointer"
                          >
                            <div className="p-2.5 bg-[#3f5ce6]/10 rounded-lg group-hover:bg-[#3f5ce6]/20 transition-colors shrink-0">
                              <User className="w-5 h-5 text-[#3f5ce6]" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-foreground group-hover:text-[#3f5ce6] transition-colors">2. Manage Digital Profiles</h5>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">Create and manage multiple digital profiles linked to your physical card. Toggle profiles live instantly.</p>
                            </div>
                          </Link>

                          <Link
                            href={`/dashboard?tab=vcard`}
                            className="group p-5 bg-background border border-border/50 hover:border-[#3f5ce6]/40 hover:bg-[#3f5ce6]/5 rounded-xl transition-all flex items-start gap-4 cursor-pointer"
                          >
                            <div className="p-2.5 bg-[#3f5ce6]/10 rounded-lg group-hover:bg-[#3f5ce6]/20 transition-colors shrink-0">
                              <Contact className="w-5 h-5 text-[#3f5ce6]" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-foreground group-hover:text-[#3f5ce6] transition-colors">3. Update vCard Contact Details</h5>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">Fill out contact numbers, email, and address info shared automatically when your card is scanned.</p>
                            </div>
                          </Link>

                          <Link
                            href={`/dashboard?tab=links`}
                            className="group p-5 bg-background border border-border/50 hover:border-[#3f5ce6]/40 hover:bg-[#3f5ce6]/5 rounded-xl transition-all flex items-start gap-4 cursor-pointer"
                          >
                            <div className="p-2.5 bg-[#3f5ce6]/10 rounded-lg group-hover:bg-[#3f5ce6]/20 transition-colors shrink-0">
                              <Link2 className="w-5 h-5 text-[#3f5ce6]" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-foreground group-hover:text-[#3f5ce6] transition-colors">4. Add Links & Track Clicks</h5>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">Insert social icons, portfolio links, or UPI payment channels. Access instant click counts.</p>
                            </div>
                          </Link>

                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center py-20 bg-card rounded-xl border border-border space-y-4 max-w-lg mx-auto p-6">
                    <div className="w-12 h-12 rounded-full bg-[#3f5ce6]/10 text-[#3f5ce6] flex items-center justify-center mx-auto">
                      <CreditCard size={22} />
                    </div>
                    <h3 className="text-base font-bold text-foreground">No NFC cards owned</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      You haven't ordered any custom smart business cards or they haven't been provisioned yet. Explore our store to design your premium NFC cards.
                    </p>
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-1 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#3f5ce6] to-indigo-600 text-white text-xs font-semibold hover:opacity-90 shadow-md"
                    >
                      Order Cards Now <ExternalLink size={13} />
                    </Link>
                  </div>
                )}
              </div>
            )}


            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: CARD                                                */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'card' && !isAllCards && (
              <div className="space-y-6 animate-fadeIn text-left">


                {(() => {
                  const orderItem = Array.isArray(activeCard?.order_items)
                    ? activeCard.order_items[0]
                    : activeCard?.order_items
                  const pers = orderItem?.personalisation || {}

                  const itemTitle = pers.title || pers.name || activeProfile?.profile_name || activeCard?.profile_data?.name || 'Your Name'
                  const itemTagline = pers.tagline || activeProfile?.title || activeCard?.profile_data?.tagline || 'Short description'
                  const itemLogoUrl = pers.logoUrl || pers.logoImageUrl
                  const itemLogoPlacement = pers.logoPlacement || pers.logoplacement || 'top-left'
                  const itemLogoHeight = pers.logoHeight || 32

                  const itemTitleColor = pers.titleColor
                  const itemTitleFont = pers.titleFont || 'font-sans'
                  const itemTitleSize = pers.titleSize || 'text-base'

                  const itemTaglineColor = pers.taglineColor || pers.descColor || pers.tagColor || pers.tagcolor
                  const itemTaglineFont = pers.taglineFont || pers.descFont || 'font-sans'
                  const itemTaglineSize = pers.taglineSize || pers.descSize || 'text-xs'

                  const isSolid = pers.colorHex || !pers.backgroundUrl
                  const bgHex = pers.colorHex || '#111'
                  const itemBackgroundUrl = pers.backgroundUrl || pers.backgroundImageUrl

                  const relativeActivity = getRelativeTimeString(lastActivity)
                  const tapCount = activeCard?.tap_count || 0
                  const calcScore = Math.min(100, tapCount * 10 + (cardProfiles.length > 0 ? 15 : 0))
                  const engagementScore = tapCount === 0 && cardProfiles.length === 0 ? 0 : calcScore
                  let engagementLevel = 'Inactive'
                  if (engagementScore > 75) engagementLevel = 'Excellent'
                  else if (engagementScore > 40) engagementLevel = 'Active'
                  else if (engagementScore > 0) engagementLevel = 'Standard'

                  let cardBgStyle: React.CSSProperties = {}
                  let isCardDark = true

                  if (isSolid) {
                    cardBgStyle = { backgroundColor: bgHex }
                    isCardDark = isDarkColor(bgHex)
                  } else {
                    cardBgStyle = {
                      backgroundImage: `url(${itemBackgroundUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                    isCardDark = true
                  }

                  const cardBorderColor = isCardDark ? 'border-white/10' : 'border-zinc-200'
                  const cardTextColor = isCardDark ? 'text-white' : 'text-zinc-800'
                  const cardSubColor = isCardDark ? 'text-white/60' : 'text-zinc-500'

                  return (
                    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn text-left">

                      {/* CSS Scanner Scanline and HUD Animations */}
                      <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes scanline-glow {
                          0% { transform: translateY(0); opacity: 0; }
                          10% { opacity: 1; }
                          90% { opacity: 1; }
                          100% { transform: translateY(160px); opacity: 0; }
                        }
                        .animate-scanline {
                          animation: scanline-glow 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                        }
                      `}} />

                      {/* 1. Top Element: Card Showcase Stage */}
                      <div className="relative rounded-2xl border border-border/40 bg-muted/10 overflow-hidden flex flex-col items-center justify-center p-8 md:p-12 shadow-inner">
                        {/* Ambient glow in background */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(63,92,230,0.08)_0%,transparent_70%)] pointer-events-none filter blur-xl animate-pulse" />

                        {/* Dynamic sub-mesh grid pattern */}
                        <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.1)_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1.5px,transparent_1.5px)] [background-size:14px_14px] pointer-events-none" />

                        {/* Floating 3D card */}
                        <div
                          onMouseMove={handleCardMouseMove}
                          onMouseLeave={handleCardMouseLeave}
                          style={tiltStyle}
                          className="relative w-full aspect-[1.586/1] max-w-[320px] sm:max-w-[340px] md:max-w-[360px] rounded-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)] select-none cursor-pointer border border-white/5 transition-all duration-300 active:scale-98"
                        >
                          <div
                            className={`w-full h-full rounded-[15px] p-5 flex flex-col justify-between overflow-hidden relative border transition-all duration-500 ${cardBorderColor}`}
                            style={cardBgStyle}
                          >
                            {/* Background image if custom */}
                            {!isSolid && itemBackgroundUrl && (
                              <div
                                className="absolute inset-0 pointer-events-none animate-fadeIn"
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
                            {orderItem?.material && orderItem.material.includes('Metallic') && (
                              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_40%,rgba(0,0,0,0.22)_60%,rgba(255,255,255,0.18)_100%)] mix-blend-overlay pointer-events-none z-10 animate-pulse" />
                            )}

                            {/* Front side logo */}
                            {itemLogoUrl && itemLogoPlacement === 'center' && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <img
                                  src={itemLogoUrl}
                                  alt="Logo"
                                  className="max-w-[110px] object-contain"
                                  style={{ height: `${itemLogoHeight * 0.8}px`, width: 'auto' }}
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
                                      className="max-w-[90px] object-contain"
                                      style={{ height: `${itemLogoHeight * 0.8}px`, width: 'auto' }}
                                    />
                                  ) : null
                                ) : (
                                  <img
                                    src="/default-brand-logo.png"
                                    alt="Logo"
                                    className="h-12 max-w-[120px] object-contain -mt-3 -ml-3"
                                    style={{ height: '48px' }}
                                  />
                                )}
                              </div>
                              <div className={isCardDark ? 'text-white/80' : 'text-zinc-800'}>
                                <svg className="w-5.5 h-5.5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
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
                                  className={`${itemTitleFont === 'font-display' ? 'font-sans font-extrabold uppercase tracking-wider' : itemTitleFont} ${itemTitleSize === 'text-sm' ? 'text-[10px] sm:text-[11px]' :
                                    itemTitleSize === 'text-base' ? 'text-[11px] sm:text-xs' :
                                      itemTitleSize === 'text-lg' ? 'text-xs sm:text-sm' :
                                        'text-sm sm:text-base'
                                    } font-black tracking-wide leading-tight truncate ${!itemTitleColor ? cardTextColor : ''}`}
                                >
                                  {itemTitle}
                                </h3>
                                <p
                                  style={itemTaglineColor ? { color: itemTaglineColor } : undefined}
                                  className={`${itemTaglineFont === 'font-display' ? 'font-sans font-extrabold uppercase tracking-wider' : itemTaglineFont} ${itemTaglineSize === 'text-[10px]' ? 'text-[7px] sm:text-[8px]' :
                                    itemTaglineSize === 'text-xs' ? 'text-[8px] sm:text-[9px]' :
                                      itemTaglineSize === 'text-sm' ? 'text-[9px] sm:text-xs' :
                                        'text-xs sm:text-sm'
                                    } font-medium tracking-wide leading-relaxed mt-0.5 line-clamp-2 whitespace-normal break-words ${!itemTaglineColor ? cardSubColor : ''}`}
                                >
                                  {itemTagline}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4 text-left relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none" />
                        <div className="relative z-10 flex items-center gap-2 border-b border-border/50 pb-2.5">
                          <Activity className="size-4 text-[#3f5ce6]" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Quick Insights</h4>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Insight 1: Total Scans */}
                          <div className="bg-background/50 border border-border/40 hover:border-[#3f5ce6]/30 rounded-xl p-4.5 space-y-3 transition-all hover:shadow-[0_4px_12px_rgba(63,92,230,0.04)] flex items-start gap-3.5 group">
                            <div className="p-2.5 bg-[#3f5ce6]/10 text-[#3f5ce6] rounded-xl shrink-0 group-hover:bg-[#3f5ce6]/25 transition-all">
                              <Activity className="size-4.5 animate-pulse" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Total Scans</span>
                              <p className="text-lg font-black text-foreground tracking-tight leading-none truncate">{tapCount} taps</p>
                              <p className="text-[9px] text-muted-foreground leading-none">Lifetime NFC taps</p>
                            </div>
                          </div>

                          {/* Insight 2: Active Profile */}
                          <div className="bg-background/50 border border-border/40 hover:border-[#3f5ce6]/30 rounded-xl p-4.5 space-y-3 transition-all hover:shadow-[0_4px_12px_rgba(63,92,230,0.04)] flex items-start gap-3.5 group">
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-xl shrink-0 group-hover:bg-emerald-500/25 transition-all">
                              <UserCheck className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Active Profile</span>
                              <p className="text-base font-black text-foreground tracking-tight leading-tight truncate">{activeProfile?.profile_name || 'None'}</p>
                              <p className="text-[9px] text-muted-foreground leading-none">{cardProfiles.length} profiles linked</p>
                            </div>
                          </div>

                          {/* Insight 3: Last Scanned Activity */}
                          <div className="bg-background/50 border border-border/40 hover:border-[#3f5ce6]/30 rounded-xl p-4.5 space-y-3 transition-all hover:shadow-[0_4px_12px_rgba(63,92,230,0.04)] flex items-start gap-3.5 group">
                            <div className="p-2.5 bg-violet-500/10 text-violet-500 dark:text-violet-400 rounded-xl shrink-0 group-hover:bg-violet-500/25 transition-all">
                              <Clock className="size-4.5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Last Activity</span>
                              <p className="text-base font-black text-foreground tracking-tight leading-tight truncate">{relativeActivity}</p>
                              <p className="text-[9px] text-muted-foreground leading-none">Real-time scan</p>
                            </div>
                          </div>

                          {/* Insight 4: Engagement Level */}
                          <div className="bg-background/50 border border-border/40 hover:border-[#3f5ce6]/30 rounded-xl p-4.5 transition-all hover:shadow-[0_4px_12px_rgba(63,92,230,0.04)] flex items-center gap-3.5 group">
                            {/* Radial SVG Ring progress */}
                            <div className="relative flex items-center justify-center shrink-0">
                              <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  className="text-muted/10"
                                  strokeWidth="3.5"
                                  stroke="currentColor"
                                  fill="none"
                                  d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                  className="text-amber-500 transition-all duration-700 ease-out"
                                  strokeDasharray={`${engagementScore}, 100`}
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                  stroke="currentColor"
                                  fill="none"
                                  d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                              </svg>
                              <span className="absolute text-[10px] font-black text-foreground">{engagementScore}%</span>
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Engagement</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-black capitalize ${engagementLevel === 'Excellent' ? 'text-amber-500' :
                                  engagementLevel === 'Active' ? 'text-emerald-500' :
                                    engagementLevel === 'Standard' ? 'text-[#3f5ce6]' :
                                      'text-muted-foreground'
                                  }`}>
                                  {engagementLevel}
                                </span>
                              </div>
                              <p className="text-[9px] text-muted-foreground leading-none">Based on taps</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. Middle-Bottom Element: 2-Column Responsive Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

                        {/* Left Grid: Card Status & Access */}
                        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4 text-left flex flex-col justify-between relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none" />

                          <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                              <div className="flex items-center gap-2">
                                <Cpu className="size-4 text-[#3f5ce6]" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Card Status & Access</h4>
                              </div>

                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 border ${activeCard?.status === 'active'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${activeCard?.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                {activeCard?.status === 'active' ? 'Active / Online' : 'Paused / Offline'}
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {activeCard?.status === 'active' ? (
                                <>
                                  Your smart card is currently <strong>Active & Online</strong>. Tapping the physical card with any NFC-enabled smartphone will instantly share your digital business profile link.
                                </>
                              ) : (
                                <>
                                  NFC sharing is currently <strong>Paused & Offline</strong>. Scanning or tapping the physical card will show a temporary inactive message and prevent profile details from being shared.
                                </>
                              )}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground pt-1">
                              {activeCard?.provisioned_at && (
                                <div className="px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                                  <span className="opacity-75">Linked on:</span>
                                  <span className="text-foreground">{new Date(activeCard.provisioned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                              )}
                              {activeCard?.activated_at && (
                                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="opacity-75">Active since:</span>
                                  <span>{new Date(activeCard.activated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="relative z-10 pt-4 border-t border-border/30 mt-auto">
                            <button
                              onClick={handleToggleCardStatus}
                              className={`w-full px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-1.5 border shrink-0 ${activeCard?.status === 'active'
                                ? 'bg-red-500/5 border-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-500/10'
                                : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                                }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${activeCard?.status === 'active' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                              {activeCard?.status === 'active' ? 'Pause NFC Sharing' : 'Enable NFC Sharing'}
                            </button>
                          </div>
                        </div>

                        {/* Right Grid: Card Nickname */}
                        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none" />

                          <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                              <Sparkles className="size-4 text-[#3f5ce6]" />
                              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Card Nickname</h4>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Assign an easily recognizable nickname to this physical card to distinguish it from other cards in your workspace.
                            </p>

                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Nickname Label</label>
                              <input
                                type="text"
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                placeholder="e.g., Personal Matte Card"
                                className="w-full bg-muted/30 hover:bg-muted/50 focus:bg-background border border-border focus:border-[#3f5ce6] focus:outline-none rounded-xl px-3 py-2.5 text-xs font-medium text-foreground transition-all duration-200"
                              />
                            </div>
                          </div>

                          <div className="relative z-10 pt-4 border-t border-border/30 mt-auto">
                            <button
                              onClick={handleSaveNickname}
                              className="w-full px-4 py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold cursor-pointer active:scale-98 transition-all shrink-0 flex items-center justify-center gap-1.5"
                            >
                              <Save size={13} /> Save Nickname
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* 4. Bottom Element: Sharing & QR Code Card */}
                      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4 text-left relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none" />

                        <div className="relative z-10 flex items-center gap-2 border-b border-border/50 pb-2.5">
                          <Share2 className="size-4 text-[#3f5ce6]" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Sharing & QR Code</h4>
                        </div>

                        <p className="relative z-10 text-xs text-muted-foreground leading-relaxed">
                          This profile URL is programmed on your physical card. When tapped, it displays your active profile. You can copy the link or share/download the QR code.
                        </p>

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                          {/* Left Column: Link Copy */}
                          <div className="space-y-3">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Card Link</label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-0 p-3 rounded-xl bg-muted/40 border border-border text-xs font-mono font-bold select-all truncate text-foreground">
                                {activeCard?.card_url}
                              </div>
                              <button
                                onClick={() => handleCopyLink(activeCard?.card_url)}
                                className="p-3 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all shadow-md shrink-0 flex items-center justify-center border border-border min-w-[38px]"
                                title="Copy Link"
                              >
                                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Share this direct link via email, messaging apps, or embed it on your website.
                            </p>
                          </div>

                          {/* Right Column: QR Code */}
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 bg-muted/20 border border-border/50 rounded-xl p-4">
                            {activeCard?.qr_code_url ? (
                              <>
                                <div className="relative p-2 bg-white rounded-xl border border-border flex items-center justify-center shadow-md shrink-0 max-w-[110px] aspect-square">
                                  <img
                                    src={activeCard.qr_code_url}
                                    alt="QR Code"
                                    className="w-full h-full object-contain"
                                  />
                                </div>

                                <div className="flex-grow space-y-2.5 w-full">
                                  <div className="text-left">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground block">QR Code Scan</span>
                                    <p className="text-[11px] text-muted-foreground">Download and print this QR code to let others scan your card instantly.</p>
                                  </div>

                                  <div className="flex w-full gap-2">
                                    <a
                                      href={activeCard.qr_code_url}
                                      onClick={(e) => handleDownloadQR(e, activeCard.qr_code_url, `qr-${activeCard.slug}.png`)}
                                      className="flex-grow inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#3f5ce6]/10 hover:bg-[#3f5ce6]/25 border border-[#3f5ce6]/20 text-[#3f5ce6] text-xs font-bold cursor-pointer transition-all active:scale-95 text-center"
                                    >
                                      <Download size={13} /> Download QR
                                    </a>
                                    <a
                                      href={activeCard?.card_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center p-2.5 rounded-xl border border-border bg-background text-muted-foreground hover:text-[#3f5ce6] hover:bg-muted cursor-pointer active:scale-95 transition-all"
                                      title="Open Live Page"
                                    >
                                      <ExternalLink size={14} />
                                    </a>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-muted-foreground py-4 font-medium flex items-center gap-2">
                                <Loader2 size={13} className="animate-spin text-[#3f5ce6]" />
                                Generating QR Code...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}


            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: PROFILES                                            */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'profiles' && !isAllCards && (
              <div className="space-y-6 animate-fadeIn text-left">
                <div className="flex justify-between items-center">
                  <div className="hidden sm:block">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">NFC Profile Manager</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Card: <span className="font-semibold text-foreground">{activeCard?.slug}</span> · Create and configure multiple digital profiles. The designated active profile is loaded automatically when your NFC card is tapped or scanned.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCreateProfile}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold cursor-pointer shadow-md transition-all active:scale-98"
                  >
                    <Plus size={14} /> Add Profile
                  </button>
                </div>

                {/* Plan limit banner */}
                {!(profile?.plan === 'pro' || profile?.plan === 'business') && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs">
                    <Sparkles className="size-4 text-amber-500 shrink-0" />
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Free plan: 1 profile per card. <strong>Pro</strong> allows 5 profiles. <button onClick={() => setShowUpgradeModal(true)} className="underline cursor-pointer font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">Upgrade now</button>
                    </span>
                  </div>
                )}

                {/* Profile list */}
                {cardProfiles.length === 0 ? (
                  <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#3f5ce6]/10 flex items-center justify-center mx-auto">
                      <User size={20} className="text-[#3f5ce6]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">No profiles yet</h4>
                      <p className="text-xs text-muted-foreground mt-1">Create your first profile to start sharing with your card.</p>
                    </div>
                    <button
                      onClick={handleOpenCreateProfile}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#3f5ce6] text-white text-xs font-semibold hover:bg-[#3050d8] active:scale-98 transition-all"
                    >
                      <Plus size={13} /> Create First Profile
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
                    {cardProfiles.map((p: any) => (
                      <div
                        key={p.id}
                        className={`group bg-card border rounded-3xl transition-all cursor-pointer hover:shadow-xl relative overflow-hidden flex flex-col justify-between ${p.is_active ? 'border-emerald-500/40 shadow-emerald-500/5' : 'border-border hover:border-[#3f5ce6]/30'
                          }`}
                        onClick={() => {
                          setActiveProfile(p);
                          handleOpenEditProfile(p);
                        }}
                      >
                        {/* Card Top / Header Cover wrapper with padding */}
                        <div className="px-4 pt-4 w-full shrink-0">
                          <div className={`relative w-full h-32 overflow-hidden rounded-[20px] ${p.bg_image_url ? 'bg-gradient-to-br from-sky-200 via-sky-100 to-white' : 'bg-muted'
                            }`}>
                            {p.bg_image_url ? (
                              <img src={p.bg_image_url} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                              /* Identical background layering (bg-[#3f5ce6]/10 on top of bg-muted) as the avatar placeholder */
                              <div className="w-full h-full bg-[#3f5ce6]/10 flex items-center justify-center px-6 text-center select-none text-xl font-black text-[#3f5ce6]">
                                {p.profile_name}
                              </div>
                            )}

                            {/* Primary / Set Primary Action (Top Right) */}
                            <div className="absolute top-3 right-3 z-20">
                              {p.primary_profile ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#3f5ce6] to-[#506df0] text-white text-[10px] font-bold shadow-lg shadow-[#3f5ce6]/25 select-none border border-white/10 flex items-center">
                                  <Check size={11} className="stroke-[3.5] mr-1" /> Primary
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetProfilePrimary(p.id);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-950/60 hover:bg-zinc-950/80 backdrop-blur-md text-zinc-100 hover:text-white border border-white/10 hover:border-white/20 shadow-md text-[10px] font-bold cursor-pointer transition-all active:scale-95 duration-200"
                                >
                                  Set Primary +
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="flex-1 px-5 pb-5 relative flex flex-col justify-between">
                          {/* Avatar Block */}
                          <div className="flex justify-between items-start shrink-0">
                            <div className="relative -mt-10 shrink-0 z-10">
                              <div className="w-20 h-20 rounded-full border-4 border-card bg-muted shadow-sm overflow-hidden flex items-center justify-center">
                                {p.avatar_url ? (
                                  <img src={p.avatar_url} alt={p.profile_name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-[#3f5ce6]/10 flex items-center justify-center text-xl font-black text-[#3f5ce6]">
                                    {p.profile_name?.[0]?.toUpperCase() || 'P'}
                                  </div>
                                )}
                              </div>
                              {/* Live Indication */}
                              {p.is_active ? (
                                <span className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-emerald-500 border-2 border-card rounded-full flex items-center justify-center shadow-sm" title="Profile is Live">
                                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping absolute" />
                                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetProfileLive(p.id);
                                  }}
                                  className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-zinc-400 hover:bg-emerald-400 border-2 border-card rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors"
                                  title="Set Live (Activate)"
                                >
                                  <span className="w-1 h-1 bg-white rounded-full" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Profile Title, Display Name, Tagline & Bio */}
                          <div className="mt-3 text-left">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-extrabold text-foreground truncate">{p.display_name || p.profile_name}</h4>
                                <p className="text-[11px] text-muted-foreground leading-normal mt-0.5 line-clamp-2 min-h-[32px]">{p.title || 'No tagline set'}</p>
                              </div>

                              {/* Profile name capsule badge at the end of name/tagline row */}
                              <div className="shrink-0 pt-0.5">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm select-none">
                                  <div className="w-5 h-5 rounded-full bg-[#3f5ce6] flex items-center justify-center text-[10px] font-black text-white shrink-0">
                                    {p.profile_name?.[0]?.toUpperCase() || 'P'}
                                  </div>
                                  <span className="text-xs font-bold text-zinc-800 dark:text-muted-foreground pr-0.5 truncate max-w-[90px] sm:max-w-[120px]" title={p.profile_name}>
                                    {p.profile_name}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {p.bio && (
                              <p className="text-[11px] text-muted-foreground/75 dark:text-zinc-400/75 leading-relaxed mt-2.5 line-clamp-3">
                                {p.bio}
                              </p>
                            )}
                          </div>

                          {/* vCard Actions Section */}
                          <div className="mt-4">
                            {(() => {
                              const vc = vcardDataMap[p.id];
                              const hasVcard = vc && (
                                vc.first_name?.trim() ||
                                vc.last_name?.trim() ||
                                (vc.phones && vc.phones.length > 0) ||
                                (vc.emails && vc.emails.length > 0)
                              );

                              if (hasVcard) {
                                return (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadVCard(vc, p);
                                    }}
                                    className="w-full py-2 px-3 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 text-[11px] font-bold text-foreground flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                                  >
                                    <Download size={12} /> Save Contact
                                  </button>
                                );
                              } else {
                                return (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push('/dashboard?tab=vcard');
                                    }}
                                    className="w-full py-2 px-3 rounded-xl border border-dashed border-[#3f5ce6]/30 bg-[#3f5ce6]/5 hover:bg-[#3f5ce6]/10 text-[11px] font-bold text-[#3f5ce6] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                                  >
                                    <Plus size={12} /> Add vCard Details
                                  </button>
                                );
                              }
                            })()}
                          </div>
                        </div>

                        {/* Card Bottom / Quick Add Footer */}
                        <div className="border-t border-border grid grid-cols-4 divide-x divide-border bg-muted/10 dark:bg-zinc-800/10 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveProfile(p);
                              router.push('/dashboard?tab=links');
                            }}
                            className="py-3 flex flex-col items-center justify-center gap-1 hover:bg-muted/50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                            title="Add Social & Payment Links"
                          >
                            <span className="text-muted-foreground group-hover:text-[#3f5ce6] transition-colors">
                              <Link2 size={15} />
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground">Links</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveProfile(p);
                              router.push('/dashboard?tab=leads');
                            }}
                            className="py-3 flex flex-col items-center justify-center gap-1 hover:bg-muted/50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                            title="Manage Captured Leads"
                          >
                            <span className="text-muted-foreground group-hover:text-[#3f5ce6] transition-colors">
                              <Users size={15} />
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground">Leads</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveProfile(p);
                              router.push('/dashboard?tab=products');
                            }}
                            className="py-3 flex flex-col items-center justify-center gap-1 hover:bg-muted/50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                            title="Add Showcase Products"
                          >
                            <span className="text-muted-foreground group-hover:text-[#3f5ce6] transition-colors">
                              <Package size={15} />
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground">Products</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveProfile(p);
                              router.push('/dashboard?tab=feeds');
                            }}
                            className="py-3 flex flex-col items-center justify-center gap-1 hover:bg-muted/50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                            title="Add Feeds"
                          >
                            <span className="text-muted-foreground group-hover:text-[#3f5ce6] transition-colors">
                              <Zap size={15} />
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground">Feeds</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Custom Profile Creator/Editor Drawer (Supabase style) */}
                <Sheet open={showProfileModal} onOpenChange={(open: boolean) => {
                  if (!open) {
                    if (isFormChanged()) {
                      setShowCancelConfirm(true)
                    } else {
                      setShowProfileModal(false)
                    }
                  } else {
                    setShowProfileModal(true)
                  }
                }}>
                  {/* Profile Edit Drawer - Theme Adaptive */}
                  <SheetContent className="!w-full sm:!max-w-2xl lg:!max-w-xl bg-background dark:bg-[#18181b] border-l border-border dark:border-zinc-800 p-0 flex flex-col h-full overflow-hidden text-left" showCloseButton={false}>

                    {/* Gradient Accent Line */}
                    <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-[#3f5ce6] to-indigo-600 shrink-0" />

                    <form onSubmit={handleSaveProfile} className="flex flex-col h-full overflow-hidden">
                      <SheetHeader className="pt-0.5 px-6 pb-3 border-b border-border dark:border-zinc-800/80 shrink-0">
                        <div className="space-y-1">
                          <SheetTitle className="text-lg font-bold text-foreground dark:text-white">
                            {editingProfile ? 'Modify Profile Details' : 'Create Smart Card Profile'}
                          </SheetTitle>
                          <SheetDescription className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed font-medium">
                            {editingProfile
                              ? 'Update your profile information and configure dynamic access.'
                              : 'Add another digital profile to your physical card for custom targets.'}
                          </SheetDescription>
                        </div>
                      </SheetHeader>

                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {/* Hidden File Inputs */}
                        <input
                          type="file"
                          ref={avatarInputRef}
                          onChange={handleUploadAvatar}
                          accept="image/*"
                          className="hidden"
                        />
                        <input
                          type="file"
                          ref={bgInputRef}
                          onChange={handleUploadBg}
                          accept="image/*"
                          className="hidden"
                        />

                        {/* Image assets upload section */}
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider block">Profile Assets</label>
                          <div className="relative mb-14 mt-1">

                            {/* Banner Cover Container */}
                            {profileForm.bgImageUrl ? (
                              <div className="relative w-full h-36 rounded-xl border border-border dark:border-zinc-800 bg-muted dark:bg-zinc-900 overflow-hidden flex items-center justify-center group">
                                <img src={profileForm.bgImageUrl} alt="Background" className="w-full h-full object-cover" />
                                {/* Overlay on hover for Changing Image */}
                                <div
                                  onClick={() => bgInputRef.current?.click()}
                                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-white text-xs font-semibold select-none z-10"
                                >
                                  <Camera size={16} className="text-zinc-300 animate-pulse" />
                                  <span>Change Cover Photo</span>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => bgInputRef.current?.click()}
                                className="relative w-full h-36 rounded-xl border-2 border-dashed border-border dark:border-zinc-800 bg-muted/20 dark:bg-zinc-950/10 hover:bg-muted/40 dark:hover:bg-zinc-950/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group"
                              >
                                {uploadingBg ? (
                                  <Loader2 className="w-6 h-6 animate-spin text-[#3f5ce6]" />
                                ) : (
                                  <>
                                    <Upload className="w-5 h-5 text-muted-foreground dark:text-zinc-500 group-hover:text-foreground dark:group-hover:text-zinc-400 transition-colors mb-0.5" />
                                    <span className="text-xs font-semibold text-foreground dark:text-zinc-300 group-hover:text-primary dark:group-hover:text-white transition-colors">Drop or browse files</span>
                                    <span className="text-[10px] text-muted-foreground dark:text-zinc-500">Maximum 5 MB file size</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Overlapping Avatar Container */}
                            <div className="absolute left-6 -bottom-10 z-10 group/avatar rounded-2xl">
                              <div className="relative w-20 h-20 rounded-2xl bg-muted dark:bg-[#18181b] overflow-hidden flex items-center justify-center transition-colors">
                                {uploadingAvatar ? (
                                  <Loader2 className="w-5 h-5 animate-spin text-[#3f5ce6]" />
                                ) : profileForm.avatarUrl ? (
                                  <>
                                    <img src={profileForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    {/* Overlay on hover for Changing Avatar */}
                                    <div
                                      onClick={() => avatarInputRef.current?.click()}
                                      className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer text-white text-[9px] font-bold select-none text-center px-1 z-10"
                                    >
                                      <Camera size={13} className="text-zinc-300" />
                                      <span>Change Avatar</span>
                                    </div>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute inset-0 border-2 border-dashed border-border dark:border-zinc-800 bg-muted/20 dark:bg-zinc-950/10 hover:bg-muted/40 dark:hover:bg-zinc-950/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer group/avatar-empty rounded-2xl"
                                  >
                                    <Upload size={14} className="text-muted-foreground dark:text-zinc-500 group-hover/avatar-empty:text-foreground dark:group-hover/avatar-empty:text-zinc-400 transition-colors" />
                                    <span className="text-[9px] font-bold text-foreground dark:text-zinc-300 group-hover/avatar-empty:text-primary dark:group-hover/avatar-empty:text-white transition-colors">Avatar</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Remove Actions Group (outside the cover image container at the bottom-right corner) */}
                            {(profileForm.bgImageUrl || profileForm.avatarUrl) && (
                              <div className="absolute -bottom-10 right-1 flex items-center gap-2 z-20">
                                {profileForm.avatarUrl && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setProfileForm(prev => ({ ...prev, avatarUrl: '' }))
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-background/80 dark:bg-zinc-950/80 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 hover:text-red-600 border border-border dark:border-zinc-800 text-[10px] font-bold transition-all cursor-pointer active:scale-95 shadow-md select-none"
                                  >
                                    Remove Avatar
                                  </button>
                                )}
                                {profileForm.bgImageUrl && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setProfileForm(prev => ({ ...prev, bgImageUrl: '' }))
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-background/80 dark:bg-zinc-950/80 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 hover:text-red-600 border border-border dark:border-zinc-800 text-[10px] font-bold transition-all cursor-pointer active:scale-95 shadow-md select-none"
                                  >
                                    Remove Cover
                                  </button>
                                )}
                              </div>
                            )}

                          </div>
                        </div>
                        {/* Profile Name label */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider block">Profile Label (Internal)</label>
                          <input
                            type="text"
                            required
                            value={profileForm.profileName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, profileName: e.target.value }))}
                            placeholder="e.g., Personal Matte Card, Work Profile"
                            className="w-full bg-background dark:bg-zinc-900 border border-border dark:border-zinc-800 focus:border-[#3f5ce6] focus:outline-none rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground dark:text-white transition-all placeholder-muted-foreground"
                          />
                        </div>

                        {/* Display Name */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider block">Full Name (Display)</label>
                          <input
                            type="text"
                            required
                            value={profileForm.displayName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                            placeholder="e.g., Manoj Kumar"
                            className="w-full bg-background dark:bg-zinc-900 border border-border dark:border-zinc-800 focus:border-[#3f5ce6] focus:outline-none rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground dark:text-white transition-all placeholder-muted-foreground"
                          />
                        </div>

                        {/* Title */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider block">Job Title / Tagline</label>
                          <input
                            type="text"
                            value={profileForm.title}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Senior Software Architect"
                            className="w-full bg-background dark:bg-zinc-900 border border-border dark:border-zinc-800 focus:border-[#3f5ce6] focus:outline-none rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground dark:text-white transition-all placeholder-muted-foreground"
                          />
                        </div>

                        {/* Bio */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider block">Bio / Summary Description</label>
                          <textarea
                            value={profileForm.bio}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Brief bio to show when this profile is active..."
                            rows={3}
                            className="w-full bg-background dark:bg-zinc-900 border border-border dark:border-zinc-800 focus:border-[#3f5ce6] focus:outline-none rounded-xl px-3 py-2 text-xs font-semibold text-foreground dark:text-white transition-all resize-none placeholder-muted-foreground"
                          />
                        </div>

                        {/* Profile Status Segmented Switch */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider block">Profile Status</label>
                          <div className="flex rounded-xl p-1 bg-muted/40 dark:bg-zinc-950/40 border border-border dark:border-zinc-800/80 w-full">
                            <button
                              type="button"
                              onClick={() => {
                                setProfileForm(prev => ({
                                  ...prev,
                                  status: 'active',
                                  isActive: true
                                }));
                              }}
                              className={`flex-grow py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${profileForm.status === 'active'
                                ? 'bg-[#3f5ce6] text-white shadow-sm border border-[#3f5ce6]'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-zinc-800/20'
                                }`}
                            >
                              Active
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setProfileForm(prev => ({
                                  ...prev,
                                  status: 'inactive',
                                  isActive: false
                                }));
                              }}
                              className={`flex-grow py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${profileForm.status === 'inactive'
                                ? 'bg-[#3f5ce6] text-white shadow-sm border border-[#3f5ce6]'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-zinc-800/20'
                                }`}
                            >
                              Inactive
                            </button>
                          </div>
                        </div>

                        {/* Set Live Immediately toggle */}
                        <div className="pt-2">
                          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-500/10 dark:border-emerald-500/20 bg-emerald-500/5 cursor-pointer select-none transition-all hover:bg-emerald-500/10">
                            <Checkbox
                              id="set-live"
                              checked={profileForm.isActive}
                              onCheckedChange={(checked) => {
                                const isChecked = !!checked;
                                setProfileForm(prev => ({
                                  ...prev,
                                  isActive: isChecked,
                                  status: isChecked ? 'active' : (prev.status === 'active' ? 'inactive' : prev.status)
                                }));
                              }}
                            />
                            <div className="text-left space-y-0.5">
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                                <Activity size={11} className="animate-pulse" /> Set Live Immediately
                              </span>
                              <p className="text-[10px] text-muted-foreground dark:text-zinc-400 font-medium leading-relaxed">
                                Instantly links this profile to your physical card taps, deactivating other profiles.
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* Primary Profile toggle */}
                        <div className="pt-2">
                          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-amber-500/10 dark:border-amber-500/20 bg-amber-500/5 cursor-pointer select-none transition-all hover:bg-amber-500/10">
                            <Checkbox
                              id="set-primary"
                              checked={profileForm.primaryProfile}
                              disabled={editingProfile?.primary_profile && cardProfiles.length > 1}
                              onCheckedChange={(checked) => setProfileForm(prev => ({ ...prev, primaryProfile: !!checked }))}
                            />
                            <div className="text-left space-y-0.5">
                              <span className="text-xs font-black text-amber-500 flex items-center gap-1">
                                <Sparkles size={11} /> Set as Primary Profile
                              </span>
                              <p className="text-[10px] text-muted-foreground dark:text-zinc-400 font-medium leading-relaxed">
                                If your Pro subscription expires, this profile will remain the only active profile.
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row sm:space-x-2 justify-end">
                        {showCancelConfirm ? (
                          <div className="flex flex-col gap-3 w-full text-left">
                            <span className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">You have unsaved changes. What would you like to do?</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCancelConfirm(false)
                                  setShowProfileModal(false)
                                }}
                                className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-650 dark:text-red-400 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                              >
                                Discard Changes
                              </button>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  setShowCancelConfirm(false)
                                  const updatedForm = { ...profileForm, status: 'draft' as const, isActive: false }
                                  setProfileForm(updatedForm)
                                  await handleSaveProfile(e, updatedForm)
                                }}
                                className="flex-1 py-2 rounded-xl bg-secondary dark:bg-zinc-800 hover:bg-secondary/80 dark:hover:bg-zinc-700 text-secondary-foreground dark:text-white text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                              >
                                Save as Draft
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowCancelConfirm(false)}
                                className="px-4 py-2 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/50 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                              >
                                Resume
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3 w-full">
                            {editingProfile && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm("Are you sure you want to delete this profile?")) {
                                    setShowProfileModal(false)
                                    await handleDeleteProfile(editingProfile)
                                  }
                                }}
                                className="py-2 px-3.5 rounded-xl border border-red-500/35 bg-red-500/5 hover:bg-red-550/10 dark:hover:bg-red-500/15 text-red-500 dark:text-red-400 font-semibold text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                                title="Delete Profile"
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (isFormChanged()) {
                                  setShowCancelConfirm(true)
                                } else {
                                  setShowProfileModal(false)
                                }
                              }}
                              className="flex-grow py-2 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/40 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={savingProfile}
                              className="flex-grow py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold shadow-lg shadow-[#3f5ce6]/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                              {savingProfile ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save size={13} />
                                  {editingProfile ? 'Save Changes' : 'Create Profile'}
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </SheetFooter>
                    </form>

                  </SheetContent>
                </Sheet>

              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: V CARD                                              */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'vcard' && !isAllCards && (
              <div className="space-y-6 animate-fadeIn text-left max-w-6xl">
                {/* Header */}
                <div className="hidden sm:block">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">vCard Contact Details</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure contact info shared when this card is tapped.
                  </p>
                </div>

                {/* Info banner */}
                <div className="bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 p-4 rounded-xl text-xs flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-[#3f5ce6] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">Common details for all card profiles</p>
                    <p className="text-muted-foreground leading-relaxed">
                      vCard contact details are shared universally across all profiles of this card. Saving updates here will automatically write these details to all associated profiles.
                    </p>
                  </div>
                </div>

                {loadingVCard ? (
                  <div className="bg-card border border-border/50 rounded-2xl p-8 flex justify-center items-center py-16">
                    <Loader2 className="animate-spin text-[#3f5ce6]" size={24} />
                    <span className="text-xs text-muted-foreground ml-2">Loading vCard details...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Form Editor */}
                    <div className="lg:col-span-7 bg-card border border-border/50 rounded-2xl p-6 sm:p-8 space-y-6">
                      <form onSubmit={(e) => { e.preventDefault(); saveVCard(vcardForm); }} className="space-y-6">

                        {/* Name section */}
                        <div className="space-y-3">
                          <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><User size={13} strokeWidth={2} />Personal Info</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-muted-foreground">First Name</label>
                              <input
                                type="text"
                                required
                                value={vcardForm.firstName}
                                onChange={(e) => setVcardForm(prev => ({ ...prev, firstName: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                                placeholder="Rahul"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-muted-foreground">Last Name</label>
                              <input
                                type="text"
                                required
                                value={vcardForm.lastName}
                                onChange={(e) => setVcardForm(prev => ({ ...prev, lastName: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                                placeholder="Kumar"
                              />
                            </div>
                          </div>
                        </div>

                        <hr className="border-border/50" />

                        {/* Work details */}
                        <div className="space-y-3">
                          <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><Briefcase size={13} strokeWidth={2} />Professional Info</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1 col-span-1">
                              <label className="text-xs font-semibold text-muted-foreground">Company / Org</label>
                              <input
                                type="text"
                                value={vcardForm.organization}
                                onChange={(e) => setVcardForm(prev => ({ ...prev, organization: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                                placeholder="Envitra Technologies"
                              />
                            </div>
                            <div className="space-y-1 col-span-1">
                              <label className="text-xs font-semibold text-muted-foreground">Department</label>
                              <input
                                type="text"
                                value={vcardForm.department}
                                onChange={(e) => setVcardForm(prev => ({ ...prev, department: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                                placeholder="Engineering"
                              />
                            </div>
                            <div className="space-y-1 col-span-1">
                              <label className="text-xs font-semibold text-muted-foreground">Job Title</label>
                              <input
                                type="text"
                                value={vcardForm.jobTitle}
                                onChange={(e) => setVcardForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                                placeholder="Product Designer"
                              />
                            </div>
                          </div>
                        </div>

                        <hr className="border-border/50" />

                        {/* Phones array */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><Phone size={13} strokeWidth={2} />Phone Numbers</h4>
                            <button
                              type="button"
                              onClick={handleAddPhone}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 text-[#3f5ce6] hover:bg-[#3f5ce6]/20 text-xs font-semibold transition-all cursor-pointer"
                            >
                              <Plus size={12} /> Add Phone
                            </button>
                          </div>

                          {vcardForm.phones.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">No phone numbers added yet.</p>
                          ) : (
                            <div className="space-y-3">
                              {vcardForm.phones.map((phone, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="w-full sm:w-28 inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground hover:border-[#3f5ce6]/60 focus:outline-none focus:border-[#3f5ce6] transition-colors cursor-pointer shrink-0"
                                      >
                                        {phone.label}
                                        <ChevronDown size={11} className="text-muted-foreground" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="min-w-[100px]">
                                      {['Mobile', 'Work', 'Home', 'Main', 'Fax'].map(opt => (
                                        <DropdownMenuItem
                                          key={opt}
                                          onClick={() => handlePhoneChange(index, 'label', opt)}
                                          className={phone.label === opt ? 'text-[#3f5ce6] font-semibold' : ''}
                                        >
                                          {phone.label === opt && <Check size={12} className="mr-1.5" />}
                                          {opt}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <input
                                    type="text"
                                    required
                                    value={phone.number}
                                    onChange={(e) => handlePhoneChange(index, 'number', e.target.value)}
                                    className="flex-grow w-full px-3 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:border-[#3f5ce6]"
                                    placeholder="+91 98765 43210"
                                  />
                                  <div className="flex items-center gap-2 w-full sm:w-auto pt-1 sm:pt-0 shrink-0">
                                    {pendingDelete?.type === 'phone' && pendingDelete.index === index ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => { handleRemovePhone(index); setPendingDelete(null) }}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer"
                                        >
                                          <Trash2 size={12} /> Delete
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setPendingDelete(null)}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors cursor-pointer"
                                        >
                                          <X size={12} /> Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground select-none cursor-pointer">
                                          <Checkbox
                                            id={`phone-primary-${index}`}
                                            checked={phone.is_primary}
                                            onCheckedChange={() => {
                                              const updatedPhones = vcardForm.phones.map((p, i) => ({
                                                ...p,
                                                is_primary: i === index
                                              }))
                                              setVcardForm(prev => ({ ...prev, phones: updatedPhones }))
                                              savePrimaryToSupabase('phones', updatedPhones)
                                            }}
                                            className="data-[state=checked]:bg-[#3f5ce6] data-[state=checked]:border-[#3f5ce6]"
                                          />
                                          Primary
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => setPendingDelete({ type: 'phone', index })}
                                          className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors ml-auto sm:ml-0 cursor-pointer"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <hr className="border-border/50" />

                        {/* Emails array */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><Mail size={13} strokeWidth={2} />Email Addresses</h4>
                            <button
                              type="button"
                              onClick={handleAddEmail}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 text-[#3f5ce6] hover:bg-[#3f5ce6]/20 text-xs font-semibold transition-all cursor-pointer"
                            >
                              <Plus size={12} /> Add Email
                            </button>
                          </div>

                          {vcardForm.emails.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">No email addresses added yet.</p>
                          ) : (
                            <div className="space-y-3">
                              {vcardForm.emails.map((email, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="w-full sm:w-28 inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground hover:border-[#3f5ce6]/60 focus:outline-none focus:border-[#3f5ce6] transition-colors cursor-pointer shrink-0"
                                      >
                                        {email.label}
                                        <ChevronDown size={11} className="text-muted-foreground" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="min-w-[100px]">
                                      {['Work', 'Personal', 'Other'].map(opt => (
                                        <DropdownMenuItem
                                          key={opt}
                                          onClick={() => handleEmailChange(index, 'label', opt)}
                                          className={email.label === opt ? 'text-[#3f5ce6] font-semibold' : ''}
                                        >
                                          {email.label === opt && <Check size={12} className="mr-1.5" />}
                                          {opt}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <input
                                    type="email"
                                    required
                                    value={email.email}
                                    onChange={(e) => handleEmailChange(index, 'email', e.target.value)}
                                    className="flex-grow w-full px-3 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:border-[#3f5ce6]"
                                    placeholder="rahul@company.com"
                                  />
                                  <div className="flex items-center gap-2 w-full sm:w-auto pt-1 sm:pt-0 shrink-0">
                                    {pendingDelete?.type === 'email' && pendingDelete.index === index ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => { handleRemoveEmail(index); setPendingDelete(null) }}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer"
                                        >
                                          <Trash2 size={12} /> Delete
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setPendingDelete(null)}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors cursor-pointer"
                                        >
                                          <X size={12} /> Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground select-none cursor-pointer">
                                          <Checkbox
                                            id={`email-primary-${index}`}
                                            checked={email.is_primary}
                                            onCheckedChange={() => {
                                              const updatedEmails = vcardForm.emails.map((em, i) => ({
                                                ...em,
                                                is_primary: i === index
                                              }))
                                              setVcardForm(prev => ({ ...prev, emails: updatedEmails }))
                                              savePrimaryToSupabase('emails', updatedEmails)
                                            }}
                                            className="data-[state=checked]:bg-[#3f5ce6] data-[state=checked]:border-[#3f5ce6]"
                                          />
                                          Primary
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => setPendingDelete({ type: 'email', index })}
                                          className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors ml-auto sm:ml-0 cursor-pointer"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <hr className="border-border/50" />

                        {/* Custom Website URLs array */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><Globe size={13} strokeWidth={2} />Website Links</h4>
                            <button
                              type="button"
                              onClick={handleAddUrl}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 text-[#3f5ce6] hover:bg-[#3f5ce6]/20 text-xs font-semibold transition-all cursor-pointer"
                            >
                              <Plus size={12} /> Add Website
                            </button>
                          </div>

                          {vcardForm.urls.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">No custom websites added yet.</p>
                          ) : (
                            <div className="space-y-3">
                              {vcardForm.urls.map((urlItem, index) => (
                                <div key={index} className="flex gap-3 items-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="w-24 sm:w-28 inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground hover:border-[#3f5ce6]/60 focus:outline-none focus:border-[#3f5ce6] transition-colors cursor-pointer shrink-0"
                                      >
                                        {urlItem.label}
                                        <ChevronDown size={11} className="text-muted-foreground" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="min-w-[100px]">
                                      {['Website', 'Portfolio', 'Blog', 'Company', 'Work', 'Other'].map(opt => (
                                        <DropdownMenuItem
                                          key={opt}
                                          onClick={() => handleUrlChange(index, 'label', opt)}
                                          className={urlItem.label === opt ? 'text-[#3f5ce6] font-semibold' : ''}
                                        >
                                          {urlItem.label === opt && <Check size={12} className="mr-1.5" />}
                                          {opt}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <input
                                    type="url"
                                    required
                                    value={urlItem.url}
                                    onChange={(e) => handleUrlChange(index, 'url', e.target.value)}
                                    className="flex-grow px-3 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:border-[#3f5ce6]"
                                    placeholder="https://mywebsite.com"
                                  />
                                  {pendingDelete?.type === 'url' && pendingDelete.index === index ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => { handleRemoveUrl(index); setPendingDelete(null) }}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer shrink-0"
                                      >
                                        <Trash2 size={12} /> Delete
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPendingDelete(null)}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                                      >
                                        <X size={12} /> Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {urlItem.url && (
                                        <a
                                          href={urlItem.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 rounded hover:bg-[#3f5ce6]/10 text-[#3f5ce6] transition-colors cursor-pointer shrink-0"
                                          title={urlItem.url}
                                        >
                                          <ExternalLink size={14} />
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => setPendingDelete({ type: 'url', index })}
                                        className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer shrink-0"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <hr className="border-border/50" />

                        {/* Social Profile links array */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><Share2 size={13} strokeWidth={2} />Social Profiles</h4>
                            <button
                              type="button"
                              onClick={handleAddSocial}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 text-[#3f5ce6] hover:bg-[#3f5ce6]/20 text-xs font-semibold transition-all cursor-pointer"
                            >
                              <Plus size={12} /> Add Social
                            </button>
                          </div>

                          {vcardForm.socials.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">No social profile links added yet.</p>
                          ) : (
                            <div className="space-y-3">
                              {vcardForm.socials.map((social, index) => (
                                <div key={index} className="flex gap-3 items-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="w-24 sm:w-28 inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground hover:border-[#3f5ce6]/60 focus:outline-none focus:border-[#3f5ce6] transition-colors cursor-pointer shrink-0"
                                      >
                                        {social.platform === 'X' ? 'Twitter/X' : social.platform}
                                        <ChevronDown size={11} className="text-muted-foreground" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="min-w-[110px]">
                                      {[['LinkedIn', 'LinkedIn'], ['Instagram', 'Instagram'], ['X', 'Twitter / X'], ['Facebook', 'Facebook'], ['YouTube', 'YouTube'], ['TikTok', 'TikTok'], ['WhatsApp', 'WhatsApp']].map(([val, label]) => (
                                        <DropdownMenuItem
                                          key={val}
                                          onClick={() => handleSocialChange(index, 'platform', val)}
                                          className={social.platform === val ? 'text-[#3f5ce6] font-semibold' : ''}
                                        >
                                          {social.platform === val && <Check size={12} className="mr-1.5" />}
                                          {label}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <input
                                    type="text"
                                    required
                                    value={social.username}
                                    onChange={(e) => handleSocialChange(index, 'username', e.target.value)}
                                    className="flex-grow px-3 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] min-w-0"
                                    placeholder={
                                      social.platform === 'WhatsApp' ? 'Phone number (e.g. +919876543210)' : 'Username / handle'
                                    }
                                  />
                                  {pendingDelete?.type === 'social' && pendingDelete.index === index ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => { handleRemoveSocial(index); setPendingDelete(null) }}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer shrink-0"
                                      >
                                        <Trash2 size={12} /> Delete
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPendingDelete(null)}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                                      >
                                        <X size={12} /> Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {social.url && (
                                        <a
                                          href={social.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 rounded hover:bg-[#3f5ce6]/10 text-[#3f5ce6] transition-colors cursor-pointer shrink-0"
                                          title={social.url}
                                        >
                                          <ExternalLink size={14} />
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => setPendingDelete({ type: 'social', index })}
                                        className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer shrink-0"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <hr className="border-border/50" />

                        {/* Location details */}
                        <div className="space-y-3">
                          <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><MapPin size={13} strokeWidth={2} />Postal Address</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-muted-foreground">Street Address</label>
                              <input
                                type="text"
                                value={vcardForm.street}
                                onChange={(e) => setVcardForm(prev => ({ ...prev, street: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                                placeholder="82, OMR Road, Karapakkam"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-muted-foreground">City</label>
                              <input
                                type="text"
                                value={vcardForm.city}
                                onChange={(e) => setVcardForm(prev => ({ ...prev, city: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                                placeholder="Chennai"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-muted-foreground">State / Region</label>
                              <input
                                type="text"
                                value={vcardForm.state}
                                onChange={(e) => setVcardForm(prev => ({ ...prev, state: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                                placeholder="Tamil Nadu"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Postal Code</label>
                                <input
                                  type="text"
                                  value={vcardForm.postalCode}
                                  onChange={(e) => setVcardForm(prev => ({ ...prev, postalCode: e.target.value }))}
                                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                                  placeholder="600097"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Country</label>
                                <input
                                  type="text"
                                  value={vcardForm.country}
                                  onChange={(e) => setVcardForm(prev => ({ ...prev, country: e.target.value }))}
                                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                                  placeholder="India"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <hr className="border-border/50" />

                        {/* Notes section */}
                        <div className="space-y-3">
                          <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><FileText size={13} strokeWidth={2} />Notes</h4>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Contact Notes</label>
                            <textarea
                              value={vcardForm.notes}
                              onChange={(e) => setVcardForm(prev => ({ ...prev, notes: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors min-h-[140px] leading-normal resize-y"
                              placeholder="Add brief details or notes to share with this contact..."
                            />
                          </div>
                        </div>

                        {/* Save Action */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={savingVCard}
                            className="w-full flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
                          >
                            {savingVCard ? (
                              <>
                                <Loader2 className="animate-spin text-white" size={13} />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save size={13} />
                                Save vCard Details
                              </>
                            )}
                          </button>
                        </div>

                      </form>
                    </div>

                    {/* Right Column: Visual Device Mockup Preview */}
                    <div className="lg:col-span-5 relative select-none">
                      <div className="sticky top-6">
                        <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-4 select-none">Live Visual Preview</h4>

                        {/* Realistic iPhone Wrapper */}
                        <div className="relative mx-auto w-[310px] h-[610px] select-none">
                          {/* Left buttons (Volume Up/Down) */}
                          <div className="absolute left-[-4px] top-[110px] w-[4px] h-[36px] bg-zinc-700 dark:bg-zinc-800 rounded-l-md z-0" />
                          <div className="absolute left-[-4px] top-[156px] w-[4px] h-[36px] bg-zinc-700 dark:bg-zinc-800 rounded-l-md z-0" />

                          {/* Right button (Power) */}
                          <div className="absolute right-[-4px] top-[130px] w-[4px] h-[60px] bg-zinc-700 dark:bg-zinc-800 rounded-r-md z-0" />

                          {/* Outer Titanium band */}
                          <div className="w-full h-full rounded-[50px] p-[3px] bg-gradient-to-b from-zinc-700 to-zinc-900 dark:from-zinc-800 dark:to-zinc-950 border border-zinc-700/50 shadow-2xl relative flex items-center justify-center z-10">

                            {/* Inner Bezel */}
                            <div className="w-full h-full rounded-[47px] bg-black p-[8px] relative flex flex-col overflow-hidden">

                              {/* Screen Viewport */}
                              <div className="w-full h-full rounded-[39px] bg-zinc-950/95 flex flex-col overflow-hidden relative border border-zinc-900">

                                {/* Dynamic Island */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-[22px] rounded-full bg-black z-50 flex items-center justify-between px-3.5 pointer-events-none">
                                  {/* Camera sensor */}
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#151518]" />
                                  {/* Active green recording indicator */}
                                  <div className="w-1 h-1 rounded-full bg-emerald-500/90 shadow-[0_0_4px_rgba(16,185,129,0.8)] animate-pulse" />
                                </div>

                                {/* Status Bar */}
                                <div className="h-8 px-6 pt-2 flex items-center justify-between text-[9px] font-bold text-white z-40 shrink-0 pointer-events-none select-none">
                                  <span>9:41</span>
                                  <div className="flex items-center gap-1.5">
                                    {/* Cellular Bars */}
                                    <svg className="w-2.5 h-2 text-white fill-current shrink-0" viewBox="0 0 100 100">
                                      <rect x="0" y="70" width="14" height="30" rx="3" />
                                      <rect x="22" y="50" width="14" height="50" rx="3" />
                                      <rect x="44" y="30" width="14" height="70" rx="3" />
                                      <rect x="66" y="10" width="14" height="90" rx="3" />
                                    </svg>
                                    {/* Wifi Icon */}
                                    <svg className="w-2.5 h-2 text-white fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                                      <path d="M12 20h.01M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 14 0M1.5 9.5a15 15 0 0 1 21 0" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    {/* Battery */}
                                    <div className="w-4.5 h-2 rounded-[2.5px] border border-zinc-100/80 p-[0.5px] flex items-center shrink-0">
                                      <div className="w-full h-full bg-zinc-100 rounded-[1px]" />
                                    </div>
                                  </div>
                                </div>

                                {/* Scrollable iOS Contact Page */}
                                <div className="flex-1 overflow-y-auto px-4 pb-8 pt-1.5 space-y-4 scrollbar-none flex flex-col relative">

                                  {/* Centered Profile Header */}
                                  <div className="flex flex-col items-center text-center shrink-0">
                                    <div className="w-18 h-18 rounded-full bg-gradient-to-br from-[#3f5ce6] to-[#506df0] p-[2px] shadow-md select-none relative animate-fadeIn mt-2">
                                      <div className="w-full h-full rounded-full border border-zinc-950 bg-zinc-900 overflow-hidden flex items-center justify-center">
                                        {activeProfile?.avatar_url ? (
                                          <img src={activeProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full bg-[#3f5ce6]/10 flex items-center justify-center text-xl font-black text-[#3f5ce6]">
                                            {vcardForm.firstName?.[0]?.toUpperCase() || activeProfile?.profile_name?.[0]?.toUpperCase() || 'P'}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Centered Name */}
                                    <h4 className="text-sm font-extrabold text-white mt-2 truncate w-full max-w-[200px]">
                                      {vcardForm.firstName || vcardForm.lastName
                                        ? `${vcardForm.firstName} ${vcardForm.lastName}`.trim()
                                        : activeProfile?.display_name || activeProfile?.profile_name || 'Rahul Kumar'}
                                    </h4>

                                    {/* Centered Tagline & Department */}
                                    {(vcardForm.jobTitle || vcardForm.organization) ? (
                                      <p className="text-[9.5px] text-zinc-400 font-semibold mt-0.5 leading-normal truncate w-full max-w-[200px]">
                                        {vcardForm.jobTitle} {vcardForm.organization ? `@ ${vcardForm.organization}` : ''}
                                      </p>
                                    ) : (
                                      <p className="text-[9.5px] text-zinc-400 font-semibold mt-0.5 leading-normal">
                                        Product Designer @ Envitra
                                      </p>
                                    )}
                                    {vcardForm.department && (
                                      <span className="mt-1 px-2 py-0.5 rounded-full bg-[#3f5ce6]/10 border border-[#3f5ce6]/25 text-[#3f5ce6] text-[6.5px] font-black tracking-wider uppercase">
                                        {vcardForm.department}
                                      </span>
                                    )}
                                  </div>

                                  {/* iOS Action Buttons */}
                                  <div className="flex items-center justify-center gap-4 py-2 shrink-0">
                                    {[
                                      { icon: '📞', label: 'call' },
                                      { icon: '✉️', label: 'mail' },
                                      { icon: '💬', label: 'text' },
                                      { icon: '🌐', label: 'web' },
                                    ].map((btn) => (
                                      <div key={btn.label} className="flex flex-col items-center gap-1">
                                        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-base shadow-inner">
                                          {btn.icon}
                                        </div>
                                        <span className="text-[7px] text-zinc-400 font-semibold uppercase tracking-wide">{btn.label}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Contact Info Cards */}
                                  <div className="space-y-2 shrink-0">

                                    {/* Phone */}
                                    {vcardForm.phones && vcardForm.phones.filter(p => p.number).length > 0 && (
                                      <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                                        {vcardForm.phones.filter(p => p.number).map((p, i) => (
                                          <div key={i} className={`px-3 py-2.5 flex items-center justify-between ${i > 0 ? 'border-t border-zinc-800' : ''}`}>
                                            <div>
                                              <p className="text-[8px] text-zinc-500 font-semibold uppercase">{p.label || 'mobile'}</p>
                                              <p className="text-[10px] text-[#4ade80] font-semibold mt-0.5">{p.number}</p>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-[#4ade80]/10 flex items-center justify-center text-[10px]">📞</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Email */}
                                    {vcardForm.emails && vcardForm.emails.filter(e => e.email).length > 0 && (
                                      <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                                        {vcardForm.emails.filter(e => e.email).map((e, i) => (
                                          <div key={i} className={`px-3 py-2.5 flex items-center justify-between ${i > 0 ? 'border-t border-zinc-800' : ''}`}>
                                            <div className="flex-1 min-w-0 pr-2">
                                              <p className="text-[8px] text-zinc-500 font-semibold uppercase">{e.label || 'email'}</p>
                                              <p className="text-[9px] text-[#3f5ce6] font-semibold mt-0.5 truncate">{e.email}</p>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-[#3f5ce6]/10 flex items-center justify-center text-[10px] shrink-0">✉️</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Address */}
                                    {(vcardForm.street || vcardForm.city || vcardForm.country) && (
                                      <div className="bg-zinc-900 rounded-xl px-3 py-2.5 border border-zinc-800 flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[8px] text-zinc-500 font-semibold uppercase">address</p>
                                          <p className="text-[9px] text-white font-medium mt-0.5 leading-relaxed">
                                            {[vcardForm.street, vcardForm.city, vcardForm.state, vcardForm.country].filter(Boolean).join(', ')}
                                          </p>
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] shrink-0 mt-0.5">📍</div>
                                      </div>
                                    )}

                                    {/* Website */}
                                    {vcardForm.urls && vcardForm.urls.filter(u => u.url).length > 0 && (
                                      <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                                        {vcardForm.urls.filter(u => u.url).map((u, i) => (
                                          <div key={i} className={`px-3 py-2.5 flex items-center justify-between gap-2 ${i > 0 ? 'border-t border-zinc-800' : ''}`}>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-[8px] text-zinc-500 font-semibold uppercase tracking-wide">{u.label || 'website'}</p>
                                              <p className="text-[9px] text-[#3f5ce6] font-medium mt-0.5 truncate">{u.url}</p>
                                            </div>
                                            <div className="shrink-0 text-zinc-500">
                                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
                                              </svg>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Socials */}
                                    {vcardForm.socials && vcardForm.socials.filter(s => s.username).length > 0 && (
                                      <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                                        {vcardForm.socials.filter(s => s.username).map((s, i) => {
                                          const displayText = s.url || s.username
                                          const PlatformSvg = () => {
                                            const cls = "w-5 h-5"
                                            const common = { fill: "none" as const, stroke: "currentColor" as const, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24", className: cls }
                                            switch (s.platform) {
                                              case 'WhatsApp': return (
                                                <svg {...common}>
                                                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                                </svg>
                                              )
                                              case 'Instagram': return (
                                                <svg {...common}>
                                                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                                  <circle cx="12" cy="12" r="4" />
                                                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                                                </svg>
                                              )
                                              case 'LinkedIn': return (
                                                <svg {...common}>
                                                  <rect x="2" y="2" width="20" height="20" rx="3" />
                                                  <line x1="7" y1="10" x2="7" y2="17" />
                                                  <line x1="7" y1="7" x2="7" y2="7.5" strokeWidth={2.5} />
                                                  <path d="M11 17v-4a2 2 0 0 1 4 0v4M11 10v7" />
                                                </svg>
                                              )
                                              case 'X': return (
                                                <svg {...common}>
                                                  <path d="M18 6L6 18M6 6l12 12" />
                                                </svg>
                                              )
                                              case 'Facebook': return (
                                                <svg {...common}>
                                                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                                                </svg>
                                              )
                                              case 'YouTube': return (
                                                <svg {...common}>
                                                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45a2.78 2.78 0 0 0-1.95 1.97A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                                                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
                                                </svg>
                                              )
                                              case 'TikTok': return (
                                                <svg {...common}>
                                                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                                </svg>
                                              )
                                              default: return (
                                                <svg {...common}>
                                                  <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
                                                </svg>
                                              )
                                            }
                                          }
                                          return (
                                            <div key={i} className={`px-3 py-2.5 flex items-center justify-between gap-2 ${i > 0 ? 'border-t border-zinc-800' : ''}`}>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-[8px] text-zinc-500 font-semibold uppercase tracking-wide">{s.platform || 'social'}</p>
                                                <p className="text-[9px] text-white font-medium mt-0.5 truncate">{displayText}</p>
                                              </div>
                                              <div className="shrink-0 text-zinc-500">
                                                <PlatformSvg />
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}

                                    {/* Notes */}
                                    {vcardForm.notes && (
                                      <div className="bg-zinc-900 rounded-xl px-3 py-2.5 border border-zinc-800">
                                        <p className="text-[8px] text-zinc-500 font-semibold uppercase mb-1">notes</p>
                                        <p className="text-[9px] text-zinc-300 leading-relaxed line-clamp-3">{vcardForm.notes}</p>
                                      </div>
                                    )}

                                    {/* Placeholder hint when empty */}
                                    {!vcardForm.phones?.some(p => p.number) && !vcardForm.emails?.some(e => e.email) && !vcardForm.street && !vcardForm.urls?.some(u => u.url) && (
                                      <div className="text-center py-4 text-zinc-600">
                                        <p className="text-[8px] font-semibold">Fill in the form to see<br />your contact card here</p>
                                      </div>
                                    )}

                                  </div>

                                </div>
                                {/* End Scrollable iOS Contact Page */}

                              </div>
                              {/* End Screen Viewport */}

                            </div>
                            {/* End Inner Bezel */}

                          </div>
                          {/* End Outer Titanium Band */}

                        </div>
                        {/* End Realistic iPhone Wrapper */}

                      </div>
                      {/* End sticky */}
                    </div>
                    {/* End Right Column */}

                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: MANAGE LINKS */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'links' && !isAllCards && (
              <div className="space-y-6 animate-fadeIn text-left w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="hidden sm:block">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Manage Links</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add, edit, remove, or reorder the links displayed on your public digital card profile page. (Links for <span className="font-semibold text-foreground">{activeProfile?.profile_name || 'selected profile'}</span>)
                    </p>
                  </div>
                  <button
                    onClick={openAddLink}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold shadow-md transition-all cursor-pointer shrink-0 w-full sm:w-auto justify-center"
                  >
                    <Plus size={13} /> Add Link
                  </button>
                </div>

                {/* Links List */}
                {linksLoading ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    <span className="text-xs">Loading links…</span>
                  </div>
                ) : profileLinks.length === 0 ? (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-border rounded-2xl">
                    <div className="w-14 h-14 rounded-2xl bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 flex items-center justify-center">
                      <Link2 size={24} className="text-[#3f5ce6]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">No links yet</h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                        Add social, payment or website links to show on your card page.
                      </p>
                    </div>
                    <button
                      onClick={openAddLink}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                    >
                      <Plus size={13} /> Add your first link
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {([
                      { key: 'Social', label: 'Social', icon: <Share2 size={13} />, bg: 'bg-blue-500/15', tc: 'text-blue-400' },
                      { key: 'Messaging', label: 'Messaging', icon: <MessageCircle size={13} />, bg: 'bg-green-500/15', tc: 'text-green-400' },
                      { key: 'Developer', label: 'Developer', icon: <Code2 size={13} />, bg: 'bg-violet-500/15', tc: 'text-violet-400' },
                      { key: 'Business', label: 'Business', icon: <Briefcase size={13} />, bg: 'bg-amber-500/15', tc: 'text-amber-400' },
                      { key: 'Payments', label: 'Payments', icon: <CreditCard size={13} />, bg: 'bg-emerald-500/15', tc: 'text-emerald-400' },
                      { key: 'Content', label: 'Content', icon: <FileText size={13} />, bg: 'bg-pink-500/15', tc: 'text-pink-400' },
                      { key: 'Music', label: 'Music', icon: <Music size={13} />, bg: 'bg-purple-500/15', tc: 'text-purple-400' },
                      { key: 'Ecommerce', label: 'E-commerce', icon: <ShoppingBag size={13} />, bg: 'bg-orange-500/15', tc: 'text-orange-400' },
                    ] as const).map(({ key: catKey, label, icon, bg, tc }) => {
                      const catLinks = profileLinks.filter(l => getUiCategory(l.category || 'social', l.platform || '') === catKey)
                      if (catLinks.length === 0) return null
                      const isCatCollapsed = collapsedCategories[catKey] ?? false
                      return (
                        <div key={catKey} className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
                          <button
                            type="button"
                            onClick={() => setCollapsedCategories(prev => ({ ...prev, [catKey]: !isCatCollapsed }))}
                            className="w-full px-5 py-3 flex items-center justify-between bg-zinc-50 dark:bg-[#1c1c1e] select-none hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`p-1.5 rounded-lg ${bg}`}>
                                <span className={tc}>{icon}</span>
                              </div>
                              <span className="font-semibold text-sm text-foreground">{label}</span>
                              <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 text-[10px] uppercase font-bold px-2 py-0.5">
                                {catLinks.length}
                              </span>
                            </div>
                            <ChevronDown size={15} className={`text-zinc-400 transition-transform duration-300 ${isCatCollapsed ? 'rotate-0' : 'rotate-180'}`} />
                          </button>
                          {!isCatCollapsed && (
                            <div className="p-3">
                              <Reorder.Group axis="y" values={catLinks} onReorder={(newOrder) => handleCategoryReorder(catKey, newOrder)} className="space-y-2">
                                {catLinks.map((link) => (
                                  <Reorder.Item
                                    key={link.id}
                                    value={link}
                                    className={`group flex items-center bg-white dark:bg-black border border-zinc-200 dark:border-zinc-900 rounded-lg px-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-zinc-350 dark:hover:border-zinc-800 transition-colors min-h-[64px] ${!link.is_active ? 'opacity-60' : ''}`}
                                  >
                                    {/* Grip handle */}
                                    <div className="flex items-center gap-3 mr-4 shrink-0">
                                      <GripVertical className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                                      <div className="flex items-center justify-center w-8 h-8 text-foreground">
                                        <BrandLogoImage url={link.url || ''} platform={link.platform || ''} category={catKey} className="w-6 h-6 object-contain" />
                                      </div>
                                    </div>
                                    {/* Label */}
                                    <div className="flex flex-col min-w-0 flex-1 py-3 select-none justify-center">
                                      <span className="font-semibold text-sm text-foreground truncate capitalize leading-none">
                                        {link.label || link.platform}
                                      </span>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex items-center gap-3 shrink-0 ml-4" onClick={e => e.stopPropagation()}>
                                      {link.click_count > 0 && (
                                        <span className="h-5 px-2 text-[10px] font-black border border-[#3f5ce6]/20 bg-[#3f5ce6]/5 text-[#3f5ce6] tracking-tighter shrink-0 flex items-center rounded-full select-none">
                                          <MousePointer2 className="w-3 h-3 mr-1.5" />{link.click_count}
                                        </span>
                                      )}
                                      <div className="w-px h-5 bg-border mx-1" />
                                      <div className="flex items-center gap-2 select-none">
                                        <span className={`hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider w-[46px] text-right tabular-nums ${link.is_active ? 'text-emerald-500' : 'text-muted-foreground/50'}`}>
                                          {link.is_active ? 'Active' : 'Hidden'}
                                        </span>
                                        <button
                                          onClick={() => toggleLinkActive(link)}
                                          className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors shrink-0 ${link.is_active ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700'}`}
                                        >
                                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${link.is_active ? 'left-[18px]' : 'left-0.5'}`} />
                                        </button>
                                      </div>
                                      <div className="w-px h-5 bg-border" />
                                      <a href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" className="h-8 w-8 text-muted-foreground hover:text-[#3f5ce6] hover:bg-[#3f5ce6]/10 rounded-lg flex items-center justify-center transition-colors cursor-pointer" title="Open URL">
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                      <button onClick={() => handleCopyLinkVal(link.id, link.url)} className="h-8 w-8 text-muted-foreground hover:text-[#3f5ce6] hover:bg-[#3f5ce6]/10 rounded-lg flex items-center justify-center transition-colors cursor-pointer" title="Copy URL">
                                        {copiedLinkId === link.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                      </button>
                                      <button onClick={() => openEditLink(link)} className="h-8 w-8 text-muted-foreground hover:text-[#3f5ce6] hover:bg-[#3f5ce6]/10 rounded-lg flex items-center justify-center transition-colors cursor-pointer">
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      {linkPendingDelete === link.id ? (
                                        <div className="flex items-center gap-1 animate-fadeIn">
                                          <button onClick={() => deleteLink(link.id)} className="h-8 w-8 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-all cursor-pointer" title="Confirm Delete">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => setLinkPendingDelete(null)} className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-all cursor-pointer" title="Cancel">
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button onClick={() => setLinkPendingDelete(link.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all cursor-pointer">
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                    </div>
                                  </Reorder.Item>
                                ))}
                              </Reorder.Group>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    <p className="text-[11px] text-center text-muted-foreground/50 py-1 select-none">
                      Drag to reorder within each section · Changes save instantly
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Add / Edit Link Sliding Sheet Panel */}
            <Sheet open={linkModal.open} onOpenChange={(open: boolean) => {
              if (!open) closeLinkModal();
            }}>
              <SheetContent className="!w-full sm:!max-w-2xl lg:!max-w-xl bg-background dark:bg-[#18181b] border-l border-border dark:border-zinc-800 p-0 flex flex-col h-full overflow-hidden text-left" showCloseButton={false}>
                {/* Accessibility screen-reader elements to satisfy Radix Dialog specifications */}
                <SheetTitle className="sr-only">Add or Edit Link Connection</SheetTitle>
                <SheetDescription className="sr-only">Configure connection and platforms for your public digital business card.</SheetDescription>

                {/* Gradient Accent Line */}
                <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-[#3f5ce6] to-indigo-600 shrink-0" />

                {/* Banner Header Card */}
                <div className="pt-5 px-6 pb-2 shrink-0">
                  <div className="bg-gradient-to-br from-[#3f5ce6] via-[#2f49d1] to-indigo-800 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    {/* Geometric Background Shapes */}
                    <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M 0,100 L 100,0 L 100,100 Z" fill="currentColor" />
                        <path d="M 30,100 L 100,30 L 100,100 Z" fill="currentColor" opacity="0.5" />
                      </svg>
                    </div>

                    {/* Title, description, and input */}
                    <div className="relative z-10 space-y-4">
                      <div>
                        <h3 className="text-base font-black tracking-tight text-white leading-tight">
                          {linkModal.mode === 'add' ? 'Connect a New Platform' : 'Edit Link Connection'}
                        </h3>
                        <p className="text-[11px] text-zinc-100/80 mt-1 max-w-[95%] leading-relaxed font-medium">
                          {linkModal.mode === 'add'
                            ? 'Enter a link or select a platform below to configure your digital business card connection.'
                            : 'Update your link details, custom label, and profile visibility settings.'}
                        </p>
                      </div>

                      {/* White input box embedded inside the blue banner card */}
                      <div className="group bg-white dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800/80 p-1.5 flex items-center gap-2 focus-within:border-[#3f5ce6]/85 focus-within:ring-4 focus-within:ring-[#3f5ce6]/10 dark:focus-within:ring-[#3f5ce6]/15 transition-all shadow-sm">
                        <input
                          id="sheet-url-input"
                          type="text"
                          value={linkForm.url}
                          onChange={e => setLinkForm(p => ({ ...p, url: e.target.value }))}
                          placeholder="Paste your link here..."
                          className="w-full px-2.5 py-1.5 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none font-mono"
                          required
                          autoFocus
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">

                  {/* Platform SVG Selection Grid (shown only in Add Mode and when URL is empty) */}
                  {linkModal.mode === 'add' && !linkForm.url.trim() && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">
                          Select Platform to Start
                        </span>
                      </div>

                      {/* Categories horizontal filter bar */}
                      <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none select-none -mx-2 px-2 shrink-0">
                        {[
                          { id: 'All', label: 'Popular', icon: <Zap size={14} />, bg: 'bg-[#3f5ce6]/15', tc: 'text-[#3f5ce6] dark:text-[#5c75ea]', border: 'border-[#3f5ce6]/35' },
                          { id: 'Social', label: 'Social', icon: <Share2 size={14} />, bg: 'bg-blue-500/15', tc: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/35' },
                          { id: 'Messaging', label: 'Messaging', icon: <MessageCircle size={14} />, bg: 'bg-green-500/15', tc: 'text-green-600 dark:text-green-400', border: 'border-green-500/35' },
                          { id: 'Payments', label: 'Payments', icon: <CreditCard size={14} />, bg: 'bg-emerald-500/15', tc: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/35' },
                          { id: 'Developer', label: 'Developer', icon: <Code2 size={14} />, bg: 'bg-violet-500/15', tc: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/35' },
                          { id: 'Business', label: 'Business', icon: <Briefcase size={14} />, bg: 'bg-amber-500/15', tc: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/35' },
                          { id: 'Content', label: 'Content', icon: <FileText size={14} />, bg: 'bg-pink-500/15', tc: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/35' },
                          { id: 'Music', label: 'Music', icon: <Music size={14} />, bg: 'bg-purple-500/15', tc: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/35' },
                          { id: 'Ecommerce', label: 'E-commerce', icon: <ShoppingBag size={14} />, bg: 'bg-orange-500/15', tc: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/35' }
                        ].map(tab => {
                          const isActive = activePlatformTab === tab.id;
                          return (
                            <Tooltip key={tab.id}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => setActivePlatformTab(tab.id)}
                                  className={`rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 ${isActive
                                      ? `${tab.bg} ${tab.tc} border ${tab.border} shadow-sm px-3.5 h-9 gap-1.5`
                                      : 'w-9 h-9 bg-zinc-100 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800/80 border border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                                >
                                  {tab.icon}
                                  {isActive && (
                                    <span className="text-[10px] font-extrabold tracking-wide whitespace-nowrap animate-fadeIn">
                                      {tab.label}
                                    </span>
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="shadow-md">
                                {tab.label}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>

                      {/* Platform chips selection */}
                      <div className="flex flex-wrap gap-2">
                        {(activePlatformTab === 'All'
                          ? [
                            { name: 'Instagram', category: 'Social' },
                            { name: 'WhatsApp', category: 'Messaging' },
                            { name: 'LinkedIn', category: 'Social' },
                            { name: 'UPI', category: 'Payments' },
                            { name: 'Google Pay', category: 'Payments' },
                            { name: 'PhonePe', category: 'Payments' },
                            { name: 'YouTube', category: 'Social' },
                            { name: 'GitHub', category: 'Developer' },
                            { name: 'Calendly', category: 'Business' },
                            { name: 'Spotify', category: 'Music' },
                            { name: 'Notion', category: 'Business' },
                            { name: 'Amazon', category: 'Ecommerce' }
                          ]
                          : PLATFORM_LIST.filter(p => p.category === activePlatformTab)
                        ).map(p => {
                          const isSelected = linkForm.platform === p.name;
                          return (
                            <button
                              key={p.name}
                              type="button"
                              onClick={() => {
                                setLinkForm(prev => ({
                                  ...prev,
                                  platform: p.name,
                                  category: p.category,
                                  url: getPlatformDefaultPrefix(p.name)
                                }));
                                setTimeout(() => {
                                  const input = document.getElementById('sheet-url-input');
                                  if (input) {
                                    (input as HTMLInputElement).focus();
                                  }
                                }, 50);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer select-none border flex items-center gap-1.5 ${isSelected
                                  ? 'font-bold border-[#3f5ce6] bg-[#3f5ce6]/10 text-[#3f5ce6] shadow-sm'
                                  : 'border-border bg-background dark:bg-zinc-900/40 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-foreground'
                                }`}
                            >
                              <LinkPlatformIcon platform={p.name} category={p.category} className="w-3.5 h-3.5 shrink-0" />
                              <span>{p.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Conditionally show remaining fields once URL is entered or when editing */}
                  {(linkModal.mode === 'edit' || linkForm.url.trim().length > 0) && (
                    <div className="space-y-6 animate-fadeIn">
                      {/* Category selection as chips */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block">Category <span className="text-red-400">*</span></label>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(CATEGORY_MAP).map(cat => {
                            const isSelected = linkForm.category === cat;
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  setLinkForm(p => ({
                                    ...p,
                                    category: cat,
                                    platform: ''
                                  }))
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer select-none border flex items-center gap-1.5 ${isSelected
                                    ? 'font-bold border-[#3f5ce6] bg-[#3f5ce6]/10 text-[#3f5ce6] shadow-sm'
                                    : 'border-border bg-background dark:bg-zinc-900/40 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-foreground'
                                  }`}
                              >
                                {getCategoryIcon(cat)}
                                <span>{cat}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Platform selection as chips */}
                      {(() => {
                        const platforms = CATEGORY_MAP[linkForm.category] || []
                        const isCustomPlatform = linkForm.platform && !platforms.includes(linkForm.platform)
                        return (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block">Platform / Name <span className="text-red-400">*</span></label>
                              <div className="flex flex-wrap gap-2">
                                {platforms.map(p => {
                                  const isSelected = linkForm.platform === p;
                                  return (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => setLinkForm(prev => ({ ...prev, platform: p }))}
                                      className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer select-none border flex items-center gap-1.5 ${isSelected
                                          ? 'font-bold border-[#3f5ce6] bg-[#3f5ce6]/10 text-[#3f5ce6] shadow-sm'
                                          : 'border-border bg-background dark:bg-zinc-900/40 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-foreground'
                                        }`}
                                    >
                                      <LinkPlatformIcon platform={p} category={linkForm.category} className="w-3.5 h-3.5 shrink-0" />
                                      <span>{p}</span>
                                    </button>
                                  );
                                })}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!isCustomPlatform) {
                                      setLinkForm(prev => ({ ...prev, platform: '' }));
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer select-none border flex items-center gap-1.5 ${isCustomPlatform || !linkForm.platform
                                      ? 'font-bold border-[#3f5ce6] bg-[#3f5ce6]/10 text-[#3f5ce6] shadow-sm'
                                      : 'border-border bg-background dark:bg-zinc-900/40 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-foreground'
                                    }`}
                                >
                                  <Link2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>Custom / Other...</span>
                                </button>
                              </div>
                            </div>

                            {/* Custom Platform Input */}
                            {(isCustomPlatform || !linkForm.platform) && (
                              <div className="space-y-1.5 animate-fadeIn">
                                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block">Custom Platform Name <span className="text-red-400">*</span></label>
                                <input
                                  type="text"
                                  value={linkForm.platform}
                                  onChange={e => setLinkForm(p => ({ ...p, platform: e.target.value }))}
                                  placeholder="e.g. My Website"
                                  className="w-full px-3 py-2.5 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                                  required
                                />
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Custom Name */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block">Custom Name <span className="text-zinc-500">(optional)</span></label>
                        <input
                          type="text"
                          value={linkForm.label}
                          onChange={e => setLinkForm(p => ({ ...p, label: e.target.value }))}
                          placeholder="e.g. Personal Website / GPay Number"
                          className="w-full px-3 py-2.5 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                        />
                      </div>

                      {/* Profiles Checklist */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block">Save Link Under Profiles</label>
                          <span className="text-[10px] text-[#3f5ce6] font-semibold">{linkModalCheckedProfiles.length} selected</span>
                        </div>

                        {existingLinkDetected && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 rounded-xl text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                              <p>This link is already added in some of your profiles.</p>
                              <p className="text-[10px] text-muted-foreground/80 font-normal">Select or deselect profiles below to add or remove this link connection.</p>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                          {cardProfiles.map((p) => {
                            const isChecked = linkModalCheckedProfiles.includes(p.id)
                            const isLive = p.is_active // Live badge should show ONLY for active and live profiles!
                            return (
                              <label
                                key={p.id}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all select-none ${isChecked ? 'bg-[#3f5ce6]/10 border-[#3f5ce6]/45 dark:bg-[#3f5ce6]/10 dark:border-[#3f5ce6]/45' : 'bg-zinc-50/50 border-border dark:bg-zinc-900/20 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 hover:border-zinc-350 dark:hover:border-zinc-700'}`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={checked => {
                                      if (checked) {
                                        setLinkModalCheckedProfiles(prev => [...prev, p.id])
                                      } else {
                                        setLinkModalCheckedProfiles(prev => prev.filter(id => id !== p.id))
                                      }
                                    }}
                                    className="w-4 h-4 shrink-0 cursor-pointer"
                                  />
                                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center border border-border dark:border-zinc-850">
                                    {p.avatar_url ? (
                                      <img src={p.avatar_url} alt={p.profile_name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-[#3f5ce6]/10 flex items-center justify-center text-xs font-black text-[#3f5ce6]">
                                        {p.profile_name?.[0]?.toUpperCase() || 'P'}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs font-semibold text-foreground dark:text-zinc-200 truncate pr-2">{p.profile_name}</span>
                                </div>
                                {isLive && (
                                  <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-[9px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wide">
                                    Live
                                  </span>
                                )}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>


                {/* Footer Actions */}
                <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row sm:space-x-2 justify-end">
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={closeLinkModal}
                      className="flex-grow py-2.5 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/40 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveLinkModal}
                      disabled={linkSaving || !linkForm.platform.trim() || !linkForm.url.trim() || linkModalCheckedProfiles.length === 0}
                      className="flex-grow py-2.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold shadow-lg shadow-[#3f5ce6]/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {linkSaving ? (
                        <><Loader2 size={13} className="animate-spin" /> Saving…</>
                      ) : linkModal.mode === 'add' ? (
                        <><Plus size={13} /> Add Link</>
                      ) : (
                        <><Save size={13} /> Save Changes</>
                      )}
                    </button>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>


            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: LEADS [PRO]                                         */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'leads' && !isAllCards && (
              <div className="space-y-6 animate-fadeIn text-left">
                {!(profile?.plan === 'pro' || profile?.plan === 'business') ? (
                  /* PRO gate */
                  <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Lock size={28} className="text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Leads — Pro Feature</h3>
                      <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
                        Capture leads from your card page, build custom forms, manage your pipeline with CRM status, and export to CSV. Upgrade to Pro to unlock.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Sparkles size={14} /> Upgrade to Pro
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="hidden sm:block">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Leads & Custom Capture Forms</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Active Profile: <span className="font-semibold text-foreground">{activeProfile?.profile_name}</span> · Manage submissions from {leadForms.length} custom lead capture form{leadForms.length !== 1 ? 's' : ''} containing {leads.length} total lead{leads.length !== 1 ? 's' : ''}.</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {leadsSubTab === 'crm' && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={handleExportCSV} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer">
                                  <FileDown size={13} /> Export CSV
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">Export leads to CSV</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={openAddLead} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold transition-all shadow-md cursor-pointer">
                                  <Plus size={13} /> Add Lead
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">Add a lead manually</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                        {leadsSubTab === 'forms' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button onClick={() => openFormBuilder()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold transition-all shadow-md cursor-pointer">
                                <Plus size={13} /> New Form
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Create a new lead form</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    {/* Sub-tab bar */}
                    <div className="flex gap-1 p-1 bg-muted/50 dark:bg-zinc-900/50 rounded-xl border border-border w-fit">
                      {([
                        { key: 'crm', label: 'CRM Leads', icon: <Users size={13} /> },
                        { key: 'forms', label: 'Forms', icon: <FileText size={13} /> },
                      ] as const).map(st => (
                        <button
                          key={st.key}
                          onClick={() => setLeadsSubTab(st.key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${leadsSubTab === st.key
                              ? 'bg-background dark:bg-zinc-800 text-foreground shadow-sm border border-border'
                              : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          {st.icon} {st.label}
                        </button>
                      ))}
                    </div>

                    {/* ─── SUB-TAB: CRM Leads ─── */}
                    {leadsSubTab === 'crm' && (
                      <div className="space-y-5">
                        {/* Stats strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: 'Total Leads', value: filteredLeads.length, color: 'text-foreground', bg: 'bg-[#3f5ce6]/8' },
                            { label: 'New', value: filteredLeads.filter((l: any) => l.status === 'new').length, color: 'text-[#3f5ce6]', bg: 'bg-[#3f5ce6]/8' },
                            { label: 'Converted', value: filteredLeads.filter((l: any) => l.status === 'converted').length, color: 'text-emerald-500', bg: 'bg-emerald-500/8' },
                            { label: 'Lost', value: filteredLeads.filter((l: any) => l.status === 'lost').length, color: 'text-red-400', bg: 'bg-red-500/8' },
                          ].map((s) => (
                            <div key={s.label} className={`bg-card border border-border rounded-xl p-4 text-center`}>
                              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Filter bar */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          {/* Search */}
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card flex-1">
                            <Search size={14} className="text-muted-foreground shrink-0" />
                            <input
                              type="text"
                              placeholder="Search by name, email, company..."
                              value={leadsSearch}
                              onChange={(e) => setLeadsSearch(e.target.value)}
                              className="w-full bg-transparent text-xs text-foreground focus:outline-none placeholder-muted-foreground/60"
                            />
                            {leadsSearch && <button onClick={() => setLeadsSearch('')}><X size={13} className="text-muted-foreground" /></button>}
                          </div>
                          {/* Form filter */}
                          {leadForms.length > 1 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card min-w-[160px] text-xs text-foreground hover:bg-muted transition-colors cursor-pointer select-none text-left">
                                  <Layers size={13} className="text-muted-foreground shrink-0" />
                                  <span className="flex-1 truncate">
                                    {leadsFilterFormId === 'all'
                                      ? 'All Forms'
                                      : (leadForms.find(f => f.id === leadsFilterFormId)?.form_name || 'Form')}
                                  </span>
                                  <ChevronDown size={12} className="text-muted-foreground shrink-0 ml-auto" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-[160px] z-[100]">
                                <DropdownMenuItem onClick={() => setLeadsFilterFormId('all')} className="text-xs cursor-pointer">
                                  All Forms
                                </DropdownMenuItem>
                                {leadForms.map((f: any) => (
                                  <DropdownMenuItem key={f.id} onClick={() => setLeadsFilterFormId(f.id)} className="text-xs cursor-pointer">
                                    {f.form_name || 'Form'}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {/* Product filter */}
                          {profileProducts.length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card min-w-[160px] text-xs text-foreground hover:bg-muted transition-colors cursor-pointer select-none text-left">
                                  <Tag size={13} className="text-muted-foreground shrink-0" />
                                  <span className="flex-1 truncate">
                                    {leadsFilterProductId === 'all'
                                      ? 'All Products'
                                      : (profileProducts.find(p => p.id === leadsFilterProductId)?.name || 'Product')}
                                  </span>
                                  <ChevronDown size={12} className="text-muted-foreground shrink-0 ml-auto" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-[160px] z-[100]">
                                <DropdownMenuItem onClick={() => setLeadsFilterProductId('all')} className="text-xs cursor-pointer">
                                  All Products
                                </DropdownMenuItem>
                                {profileProducts.map((p: any) => (
                                  <DropdownMenuItem key={p.id} onClick={() => setLeadsFilterProductId(p.id)} className="text-xs cursor-pointer">
                                    {p.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {/* CRM Table */}
                        {leadsLoading ? (
                          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                            <Loader2 size={18} className="animate-spin" /><span className="text-xs">Loading leads…</span>
                          </div>
                        ) : filteredLeads.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-border rounded-2xl">
                            <div className="w-14 h-14 rounded-2xl bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 flex items-center justify-center">
                              <Users size={24} className="text-[#3f5ce6]" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground">No leads yet</h4>
                              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                                {leads.length > 0 ? 'No leads match your current filters.' : 'Activate a form on your card page to start capturing leads.'}
                              </p>
                            </div>
                            {leads.length === 0 && (
                              <button onClick={() => setLeadsSubTab('forms')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold shadow-md transition-all cursor-pointer">
                                <FileText size={13} /> Manage Forms
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                            {filteredLeads.map((lead) => {
                              const primaryDetails = getLeadPrimaryDetails(lead, leadForms)
                              const { name, email, phone } = primaryDetails
                              const otherFields = getLeadOtherFields(lead, leadForms, primaryDetails)
                              const avatarBg = getAvatarColor(name)
                              const initials = name
                                ? name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                                : 'L'

                              return (
                                <div
                                  key={lead.id}
                                  onClick={() => setLeadSheet({ open: true, mode: 'view', lead })}
                                  className="bg-card border border-border dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-[#3f5ce6] dark:hover:border-[#3f5ce6] hover:shadow-md hover:shadow-[#3f5ce6]/5 transition-all flex flex-col justify-between cursor-pointer"
                                >
                                  {/* Top header row */}
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                      {/* Avatar */}
                                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black border select-none shrink-0 ${avatarBg}`}>
                                        {initials}
                                      </div>
                                      {/* Primary details */}
                                      <div className="min-w-0 space-y-1">
                                        <h4 className="font-bold text-sm text-foreground truncate max-w-[160px] sm:max-w-[200px]">
                                          {name}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-muted-foreground">
                                          {email && (
                                            <span className="flex items-center gap-1">
                                              <Mail size={10} className="shrink-0" />
                                              <span className="truncate max-w-[120px]">{email}</span>
                                            </span>
                                          )}
                                          {email && phone && <span className="text-muted-foreground/30">•</span>}
                                          {phone && (
                                            <span className="flex items-center gap-1">
                                              <Phone size={10} className="shrink-0" />
                                              <span>{phone}</span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action buttons top right */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {email && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <a
                                              href={`mailto:${email}`}
                                              onClick={(e) => e.stopPropagation()}
                                              className="w-8 h-8 rounded-full border border-border dark:border-zinc-800 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                            >
                                              <Mail size={13} />
                                            </a>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom">Email Lead</TooltipContent>
                                        </Tooltip>
                                      )}
                                      {phone && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <a
                                              href={`tel:${phone}`}
                                              onClick={(e) => e.stopPropagation()}
                                              className="w-8 h-8 rounded-full border border-border dark:border-zinc-800 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                            >
                                              <Phone size={13} />
                                            </a>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom">Call Lead</TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </div>

                                  {/* Segmented interactive status bar */}
                                  <div className="flex border border-border dark:border-zinc-800 bg-muted/30 dark:bg-zinc-900/30 rounded-xl p-0.5 w-full text-[10px] font-bold select-none overflow-x-auto scrollbar-none gap-0.5">
                                    {[
                                      { value: 'new', label: 'New', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
                                      { value: 'contacted', label: 'Contacted', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' },
                                      { value: 'following_up', label: 'Following Up', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' },
                                      { value: 'converted', label: 'Converted', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
                                      { value: 'lost', label: 'Lost', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' },
                                      { value: 'spam', label: 'Spam', color: 'bg-zinc-500/10 text-zinc-650 dark:text-zinc-400 border border-zinc-500/20' }
                                    ].map((opt) => {
                                      const isActive = lead.status === opt.value
                                      return (
                                        <button
                                          key={opt.value}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleUpdateLeadStatus(lead.id, opt.value)
                                          }}
                                          className={`flex-1 text-center py-1.5 px-2 rounded-lg transition-all cursor-pointer font-bold whitespace-nowrap ${isActive
                                              ? opt.color
                                              : 'text-muted-foreground hover:text-foreground bg-transparent border border-transparent hover:bg-muted/40'
                                            }`}
                                        >
                                          {isActive ? `✓ ${opt.label}` : opt.label}
                                        </button>
                                      )
                                    })}
                                  </div>

                                  {/* Footer Meta Row */}
                                  <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 border-t border-border/20 pt-2 shrink-0">
                                    <span className="flex items-center gap-1">
                                      <Clock size={9} />
                                      {lead.submitted_at
                                        ? new Date(lead.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : '—'}
                                    </span>
                                    {lead.form_name && (
                                      <span className="flex items-center gap-1 truncate max-w-[160px]">
                                        <Layers size={9} />
                                        {lead.form_name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Unified Lead Sheet (View, Edit, Add) */}
                    <Sheet open={leadSheet.open} onOpenChange={(open: boolean) => !open && setLeadSheet(prev => ({ ...prev, open: false }))}>
                      <SheetContent className="!w-full sm:!max-w-2xl lg:!max-w-xl bg-background dark:bg-[#18181b] border-l border-border dark:border-zinc-800 p-0 flex flex-col h-full overflow-hidden text-left" showCloseButton={false}>
                        {/* Accessibility screen-reader elements */}
                        <SheetTitle className="sr-only">Lead Sheet</SheetTitle>
                        <SheetDescription className="sr-only">CRM Lead details and forms creator.</SheetDescription>

                        {/* Accent line */}
                        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-[#3f5ce6] to-indigo-600 shrink-0" />

                        {(() => {
                          if (!leadSheet.open) return null

                          // CASE 1: Add Lead mode - Form template not selected yet
                          if (leadSheet.mode === 'add' && leadModalSelectedFormId === null) {
                            return (
                              <>
                                {/* Header */}
                                <SheetHeader className="flex flex-row items-center justify-between px-6 py-2 shrink-0 border-b border-border dark:border-zinc-800 space-y-0 text-left">
                                  <div>
                                    <SheetTitle className="font-black text-sm text-foreground">Select Lead Form</SheetTitle>
                                    <SheetDescription className="text-[11px] text-muted-foreground mt-0.5">Choose a form template to create this manual lead under.</SheetDescription>
                                  </div>
                                </SheetHeader>

                                {/* Body */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                                  <p className="text-xs text-muted-foreground">Select the form template you want to add this lead under:</p>
                                  <div className="space-y-2">
                                    {leadForms.map((form: any) => (
                                      <button
                                        key={form.id}
                                        onClick={() => setLeadModalSelectedFormId(form.id)}
                                        className={`w-full p-4 text-left border rounded-xl hover:bg-muted/30 transition-all flex items-center justify-between group cursor-pointer ${form.is_active
                                            ? 'border-emerald-500/40 bg-emerald-500/[0.01] hover:border-emerald-500/60'
                                            : 'border-border hover:border-[#3f5ce6]/60'
                                          }`}
                                      >
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-foreground group-hover:text-[#3f5ce6] transition-colors">{form.form_name}</span>
                                            {form.is_active && (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[8px] font-bold text-emerald-600 dark:text-emerald-400">
                                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> ACTIVE
                                              </span>
                                            )}
                                          </div>
                                          {form.title && <div className="text-[10px] text-muted-foreground mt-0.5">{form.title}</div>}
                                        </div>
                                        <ChevronRight size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Footer */}
                                <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row justify-end">
                                  <button onClick={() => setLeadSheet(prev => ({ ...prev, open: false }))} className="px-4 py-2 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/40 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98">
                                    Close
                                  </button>
                                </SheetFooter>
                              </>
                            )
                          }

                          // Find the selected form template
                          const activeFormId = leadSheet.mode === 'edit' ? leadSheet.lead?.form_id : leadModalSelectedFormId
                          const selectedForm = leadForms.find((f: any) => f.id === activeFormId)
                          const fields = selectedForm?.fields || []
                          const isFormInvalid = fields.some((field: any) => field.required && !leadModalCustomData[field.id])

                          // CASE 2: Add or Edit Lead mode (Form inputs screen)
                          if (leadSheet.mode === 'add' || leadSheet.mode === 'edit') {
                            const title = leadSheet.mode === 'add' ? 'Add CRM Lead' : 'Edit CRM Lead'
                            const subtitle = `Form: ${selectedForm?.form_name || 'CRM Form'}`

                            return (
                              <>
                                {/* Header */}
                                <SheetHeader className="flex flex-row items-center justify-between px-6 py-2 shrink-0 border-b border-border dark:border-zinc-800 space-y-0 text-left">
                                  <div>
                                    <SheetTitle className="font-black text-sm text-foreground">{title}</SheetTitle>
                                    <SheetDescription className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</SheetDescription>
                                  </div>
                                </SheetHeader>

                                {/* Content Area (Scrollable Inputs) */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                                  {/* Lead Status Selection (Segmented interactive status bar) */}
                                  <div className="space-y-1.5 text-left">
                                    <label className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">Lead Status</label>
                                    <div className="flex border border-border dark:border-zinc-800 bg-muted/30 dark:bg-zinc-900/30 rounded-xl p-0.5 w-full text-[10px] font-bold select-none overflow-x-auto scrollbar-none gap-0.5">
                                      {[
                                        { value: 'new', label: 'New', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
                                        { value: 'contacted', label: 'Contacted', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' },
                                        { value: 'following_up', label: 'Following Up', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' },
                                        { value: 'converted', label: 'Converted', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
                                        { value: 'lost', label: 'Lost', color: 'bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/20' },
                                        { value: 'spam', label: 'Spam', color: 'bg-zinc-500/10 text-zinc-650 dark:text-zinc-400 border border-zinc-500/20' }
                                      ].map((opt) => {
                                        const isActive = leadFormState.status === opt.value
                                        return (
                                          <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setLeadFormState(p => ({ ...p, status: opt.value }))}
                                            className={`flex-grow text-center py-2 px-1.5 rounded-lg transition-all cursor-pointer font-bold whitespace-nowrap text-[9px] ${isActive
                                                ? opt.color
                                                : 'text-muted-foreground hover:text-foreground bg-transparent border border-transparent hover:bg-muted/40'
                                              }`}
                                          >
                                            {isActive ? `✓ ${opt.label}` : opt.label}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>

                                  {/* Form fields rendering dynamically */}
                                  {fields.map((field: any) => {
                                    const isRequired = field.required
                                    return (
                                      <div key={field.id} className="space-y-1.5 text-left">
                                        <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-widest block">
                                          {field.label} {isRequired && <span className="text-red-500 dark:text-red-400 font-bold">*</span>}
                                        </label>

                                        {(field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'url') && (
                                          <input
                                            type={field.type === 'phone' ? 'tel' : field.type}
                                            value={leadModalCustomData[field.id] || ''}
                                            onChange={e => setLeadModalCustomData(p => ({ ...p, [field.id]: e.target.value }))}
                                            placeholder={field.placeholder || `Enter ${field.label}...`}
                                            className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                                            required={isRequired}
                                          />
                                        )}

                                        {field.type === 'textarea' && (
                                          <textarea
                                            value={leadModalCustomData[field.id] || ''}
                                            onChange={e => setLeadModalCustomData(p => ({ ...p, [field.id]: e.target.value }))}
                                            placeholder={field.placeholder || `Enter ${field.label}...`}
                                            rows={3}
                                            className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all resize-none"
                                            required={isRequired}
                                          />
                                        )}

                                        {field.type === 'select' && (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground hover:bg-muted/50 transition-all cursor-pointer text-left font-semibold">
                                                <span className="truncate">
                                                  {leadModalCustomData[field.id] || field.placeholder || 'Select option...'}
                                                </span>
                                                <ChevronDown size={14} className="text-muted-foreground ml-auto shrink-0" />
                                              </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[340px] max-h-[200px] overflow-y-auto z-[200]">
                                              {(field.options || []).map((opt: string) => (
                                                <DropdownMenuItem
                                                  key={opt}
                                                  onClick={() => setLeadModalCustomData(p => ({ ...p, [field.id]: opt }))}
                                                  className="text-xs cursor-pointer font-semibold"
                                                >
                                                  {opt}
                                                </DropdownMenuItem>
                                              ))}
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        )}

                                        {field.type === 'radio' && (
                                          <div className="space-y-2 pt-1">
                                            {(field.options || []).map((opt: string) => (
                                              <label key={opt} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-foreground/85 dark:text-zinc-350">
                                                <input
                                                  type="radio"
                                                  name={`sheet-radio-${field.id}`}
                                                  checked={leadModalCustomData[field.id] === opt}
                                                  onChange={() => setLeadModalCustomData(p => ({ ...p, [field.id]: opt }))}
                                                  className="accent-[#3f5ce6]"
                                                />
                                                <span>{opt}</span>
                                              </label>
                                            ))}
                                          </div>
                                        )}

                                        {field.type === 'checkbox' && (
                                          <div className="space-y-2 pt-1">
                                            {(field.options || []).map((opt: string) => {
                                              const checkedList = leadModalCustomData[field.id] || []
                                              const isChecked = checkedList.includes(opt)
                                              return (
                                                <label key={opt} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-foreground/85 dark:text-zinc-350 select-none">
                                                  <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => {
                                                      let newList = [...checkedList]
                                                      if (checked) newList.push(opt)
                                                      else newList = newList.filter(o => o !== opt)
                                                      setLeadModalCustomData(p => ({ ...p, [field.id]: newList }))
                                                    }}
                                                  />
                                                  <span>{opt}</span>
                                                </label>
                                              )
                                            })}
                                            {(field.options || []).length === 0 && (
                                              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-foreground/85 dark:text-zinc-350 select-none">
                                                <Checkbox
                                                  checked={!!leadModalCustomData[field.id]}
                                                  onCheckedChange={(checked) => setLeadModalCustomData(p => ({ ...p, [field.id]: !!checked }))}
                                                />
                                                <span>Confirm / Toggle</span>
                                              </label>
                                            )}
                                          </div>
                                        )}

                                        {(field.type === 'file' || field.type === 'image') && (
                                          <div className="space-y-2">
                                            {(() => {
                                              const attachment = leadModalCustomData[field.id]
                                              const isUploaded = typeof attachment === 'string' && attachment.startsWith('http')
                                              const isLocal = attachment && attachment.file

                                              return (
                                                <div className="group bg-white dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800/80 p-2.5 flex items-center justify-between gap-3 shadow-xs">
                                                  <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-[#3f5ce6]/10 flex items-center justify-center text-[#3f5ce6] shrink-0">
                                                      {field.type === 'image' ? <ImageIcon size={15} /> : <Paperclip size={15} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                      <p className="text-[10px] text-zinc-550 dark:text-zinc-400 font-bold truncate">
                                                        {isUploaded ? 'Uploaded Document' : isLocal ? attachment.name : `Select ${field.type}...`}
                                                      </p>
                                                      {isUploaded && (
                                                        <a href={leadSignedUrls[field.id] || attachment} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-[#3f5ce6] hover:underline flex items-center gap-0.5 truncate">
                                                          View Attachment <ExternalLink size={8} />
                                                        </a>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-1 shrink-0">
                                                    {(isUploaded || isLocal) ? (
                                                      <button
                                                        type="button"
                                                        onClick={() => setLeadModalCustomData(p => {
                                                          const updated = { ...p }
                                                          delete updated[field.id]
                                                          return updated
                                                        })}
                                                        className="p-1 rounded-lg border border-red-200/50 hover:bg-red-500/10 text-red-500 transition-all cursor-pointer"
                                                      >
                                                        <Trash2 size={12} />
                                                      </button>
                                                    ) : (
                                                      <label className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground dark:text-white text-[10px] font-bold transition-all cursor-pointer select-none">
                                                        Browse
                                                        <input
                                                          type="file"
                                                          className="hidden"
                                                          accept={field.type === 'image' ? 'image/*' : '*'}
                                                          onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) handleAttachFile(field.id, file)
                                                          }}
                                                        />
                                                      </label>
                                                    )}
                                                  </div>
                                                </div>
                                              )
                                            })()}
                                          </div>
                                        )}

                                        {field.type === 'signature' && (
                                          <div className="space-y-2">
                                            {leadModalCustomData[field.id] ? (
                                              <div className="border border-border dark:border-zinc-800 rounded-xl p-3 bg-white dark:bg-zinc-950/60 flex items-center justify-between gap-3">
                                                <img src={leadSignedUrls[field.id] || leadModalCustomData[field.id]} alt="Signature" className="h-12 object-contain bg-white rounded-md p-1" />
                                                <button
                                                  type="button"
                                                  onClick={() => setLeadModalCustomData(p => {
                                                    const updated = { ...p }
                                                    delete updated[field.id]
                                                    return updated
                                                  })}
                                                  className="p-1.5 rounded-lg border border-red-200/50 hover:bg-red-500/10 text-red-500 transition-all cursor-pointer"
                                                >
                                                  <Trash2 size={12} />
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="border border-border dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                                                <div className="bg-muted/40 dark:bg-zinc-900/40 px-3 py-1.5 border-b border-border dark:border-zinc-800 flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase select-none">
                                                  <span>Draw Signature Below</span>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const canvas = document.getElementById(`sig-canvas-${field.id}`) as HTMLCanvasElement
                                                      if (canvas) {
                                                        const ctx = canvas.getContext('2d')
                                                        ctx?.clearRect(0, 0, canvas.width, canvas.height)
                                                      }
                                                    }}
                                                    className="text-[9px] text-zinc-550 hover:text-foreground transition-colors cursor-pointer"
                                                  >
                                                    Clear
                                                  </button>
                                                </div>
                                                <canvas
                                                  id={`sig-canvas-${field.id}`}
                                                  width={400}
                                                  height={120}
                                                  className="w-full bg-white dark:bg-zinc-950 h-28 cursor-crosshair touch-none block"
                                                  onMouseDown={(e) => {
                                                    const canvas = e.currentTarget
                                                    const ctx = canvas.getContext('2d')
                                                    if (!ctx) return
                                                    ctx.strokeStyle = '#3f5ce6'
                                                    ctx.lineWidth = 2
                                                    ctx.lineCap = 'round'
                                                    const rect = canvas.getBoundingClientRect()
                                                    ctx.beginPath()
                                                    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
                                                    canvas.dataset.drawing = 'true'
                                                  }}
                                                  onMouseMove={(e) => {
                                                    const canvas = e.currentTarget
                                                    if (canvas.dataset.drawing !== 'true') return
                                                    const ctx = canvas.getContext('2d')
                                                    if (!ctx) return
                                                    const rect = canvas.getBoundingClientRect()
                                                    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
                                                    ctx.stroke()
                                                  }}
                                                  onMouseUp={(e) => {
                                                    const canvas = e.currentTarget
                                                    canvas.dataset.drawing = 'false'
                                                    const dataUrl = canvas.toDataURL()
                                                    setLeadModalCustomData(p => ({ ...p, [field.id]: dataUrl }))
                                                  }}
                                                  onMouseLeave={(e) => {
                                                    const canvas = e.currentTarget
                                                    if (canvas.dataset.drawing === 'true') {
                                                      canvas.dataset.drawing = 'false'
                                                      const dataUrl = canvas.toDataURL()
                                                      setLeadModalCustomData(p => ({ ...p, [field.id]: dataUrl }))
                                                    }
                                                  }}
                                                  onTouchStart={(e) => {
                                                    const canvas = e.currentTarget
                                                    const ctx = canvas.getContext('2d')
                                                    if (!ctx) return
                                                    ctx.strokeStyle = '#3f5ce6'
                                                    ctx.lineWidth = 2
                                                    ctx.lineCap = 'round'
                                                    const rect = canvas.getBoundingClientRect()
                                                    const touch = e.touches[0]
                                                    ctx.beginPath()
                                                    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top)
                                                    canvas.dataset.drawing = 'true'
                                                  }}
                                                  onTouchMove={(e) => {
                                                    const canvas = e.currentTarget
                                                    if (canvas.dataset.drawing !== 'true') return
                                                    const ctx = canvas.getContext('2d')
                                                    if (!ctx) return
                                                    const rect = canvas.getBoundingClientRect()
                                                    const touch = e.touches[0]
                                                    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
                                                    ctx.stroke()
                                                  }}
                                                  onTouchEnd={(e) => {
                                                    const canvas = e.currentTarget
                                                    canvas.dataset.drawing = 'false'
                                                    const dataUrl = canvas.toDataURL()
                                                    setLeadModalCustomData(p => ({ ...p, [field.id]: dataUrl }))
                                                  }}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {field.type === 'date' && (
                                          <div className="space-y-1 text-left">
                                            {(() => {
                                              const dateVal = parseLocalDate(leadModalCustomData[field.id])
                                              return (
                                                <Popover
                                                  open={openDatePickerFieldId === field.id}
                                                  onOpenChange={(open) => setOpenDatePickerFieldId(open ? field.id : null)}
                                                >
                                                  <PopoverTrigger asChild>
                                                    <button
                                                      type="button"
                                                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground hover:bg-muted/50 transition-all cursor-pointer text-left font-semibold ${!leadModalCustomData[field.id] ? 'text-muted-foreground/60' : ''
                                                        }`}
                                                    >
                                                      <span className="truncate">
                                                        {dateVal ? format(dateVal, "dd MMM yyyy") : field.placeholder || 'Select Date...'}
                                                      </span>
                                                      <Calendar size={14} className="text-muted-foreground ml-auto shrink-0" />
                                                    </button>
                                                  </PopoverTrigger>
                                                  <PopoverContent className="w-auto p-0 z-[210]" align="start">
                                                    <CalendarComponent
                                                      mode="single"
                                                      selected={dateVal}
                                                      onSelect={(date: any) => {
                                                        if (date) {
                                                          const pad = (num: number) => (num < 10 ? '0' : '') + num
                                                          const formatted = date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
                                                          setLeadModalCustomData((prev: any) => ({ ...prev, [field.id]: formatted }))
                                                          setOpenDatePickerFieldId(null)
                                                        }
                                                      }}
                                                      initialFocus
                                                    />
                                                  </PopoverContent>
                                                </Popover>
                                              )
                                            })()}
                                          </div>
                                        )}

                                        {field.type === 'number' && (
                                          <input
                                            type="number"
                                            value={leadModalCustomData[field.id] || ''}
                                            onChange={e => setLeadModalCustomData(p => ({ ...p, [field.id]: e.target.value }))}
                                            placeholder={field.placeholder || `Enter ${field.label}...`}
                                            className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                                            required={isRequired}
                                          />
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>

                                {/* Footer (Reset and Save) */}
                                <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row gap-3 justify-end items-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (leadSheet.mode === 'edit') {
                                        // Go back to view mode
                                        setLeadSheet(prev => ({ ...prev, mode: 'view' }))
                                      } else {
                                        // Go back to select template mode
                                        setLeadModalSelectedFormId(null)
                                      }
                                    }}
                                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/40 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                                  >
                                    {leadSheet.mode === 'edit' ? 'Cancel' : '← Back'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={saveLead}
                                    disabled={leadSaving || isFormInvalid}
                                    className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold shadow-lg shadow-[#3f5ce6]/25 transition-all cursor-pointer active:scale-98 disabled:opacity-60 flex items-center justify-center gap-1.5"
                                  >
                                    {leadSaving ? (
                                      <><Loader2 size={13} className="animate-spin" /> Saving…</>
                                    ) : leadSheet.mode === 'add' ? (
                                      <><Plus size={13} /> Add Lead</>
                                    ) : (
                                      <><Save size={13} /> Save Changes</>
                                    )}
                                  </button>
                                </SheetFooter>
                              </>
                            )
                          }

                          // CASE 3: View Lead mode (Details screen)
                          const primaryDetails = getLeadPrimaryDetails(leadSheet.lead, leadForms)
                          const { name, email, phone } = primaryDetails
                          const otherFields = getLeadOtherFields(leadSheet.lead, leadForms, primaryDetails)
                          const avatarBg = getAvatarColor(name)
                          const initials = name
                            ? name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                            : 'L'

                          return (
                            <>
                              {/* Header */}
                              <SheetHeader className="flex flex-row items-center justify-between px-6 py-2 shrink-0 border-b border-border dark:border-zinc-800 space-y-0 text-left">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border select-none shrink-0 ${avatarBg}`}>
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <SheetTitle className="font-black text-sm text-foreground truncate">{name || 'Lead Details'}</SheetTitle>
                                    <SheetDescription className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                      {leadSheet.lead.form_name || 'Manual CRM Entry'} · View details, update status, and manage lead.
                                    </SheetDescription>
                                  </div>
                                </div>
                              </SheetHeader>

                              {/* Content Area (Scrollable Details) */}
                              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                                {/* Contact Information & Quick Actions */}
                                <div className="space-y-3">
                                  <h4 className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-widest block">Contact Information</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {email && (
                                      <div className="p-3 border border-border dark:border-zinc-800 rounded-xl bg-card dark:bg-zinc-900/10 flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                          <p className="text-[9px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">Email Address</p>
                                          <p className="text-xs font-semibold text-foreground dark:text-white truncate mt-0.5">{email}</p>
                                        </div>
                                        <a
                                          href={`mailto:${email}`}
                                          className="w-7 h-7 rounded-lg border border-border dark:border-zinc-800 bg-muted/20 hover:bg-muted dark:hover:bg-zinc-800 flex items-center justify-center text-muted-foreground dark:text-zinc-355 hover:text-foreground dark:hover:text-white shrink-0 transition-colors"
                                        >
                                          <Mail size={12} />
                                        </a>
                                      </div>
                                    )}
                                    {phone && (
                                      <div className="p-3 border border-border dark:border-zinc-800 rounded-xl bg-card dark:bg-zinc-900/10 flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                          <p className="text-[9px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">Phone Number</p>
                                          <p className="text-xs font-semibold text-foreground dark:text-white truncate mt-0.5">{phone}</p>
                                        </div>
                                        <a
                                          href={`tel:${phone}`}
                                          className="w-7 h-7 rounded-lg border border-border dark:border-zinc-800 bg-muted/20 hover:bg-muted dark:hover:bg-zinc-800 flex items-center justify-center text-muted-foreground dark:text-zinc-355 hover:text-foreground dark:hover:text-white shrink-0 transition-colors"
                                        >
                                          <Phone size={12} />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Interactive Status Selector inside Sheet */}
                                <div className="space-y-3 border-t border-border dark:border-zinc-800 pt-5">
                                  <h4 className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-widest block">Lead Status</h4>
                                  <div className="flex border border-border dark:border-zinc-800 bg-muted/30 dark:bg-zinc-900/30 rounded-xl p-0.5 w-full text-[10px] font-bold select-none overflow-x-auto scrollbar-none gap-0.5">
                                    {[
                                      { value: 'new', label: 'New', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
                                      { value: 'contacted', label: 'Contacted', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' },
                                      { value: 'following_up', label: 'Following Up', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' },
                                      { value: 'converted', label: 'Converted', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
                                      { value: 'lost', label: 'Lost', color: 'bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/20' },
                                      { value: 'spam', label: 'Spam', color: 'bg-zinc-500/10 text-zinc-650 dark:text-zinc-400 border border-zinc-500/20' }
                                    ].map((opt) => {
                                      const isActive = leadSheet.lead.status === opt.value
                                      return (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          onClick={async () => {
                                            await handleUpdateLeadStatus(leadSheet.lead.id, opt.value)
                                            setLeadSheet((p: any) => p ? { ...p, lead: { ...p.lead, status: opt.value } } : null)
                                          }}
                                          className={`flex-grow text-center py-2 px-1.5 rounded-lg transition-all cursor-pointer font-bold whitespace-nowrap text-[9px] ${isActive
                                              ? opt.color
                                              : 'text-muted-foreground hover:text-foreground bg-transparent border border-transparent hover:bg-muted/40'
                                            }`}
                                        >
                                          {isActive ? `✓ ${opt.label}` : opt.label}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* Custom Fields Details Section */}
                                <div className="space-y-3 border-t border-border dark:border-zinc-800 pt-5">
                                  <h4 className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-widest block">Submitted Data</h4>
                                  {otherFields.length === 0 ? (
                                    <p className="text-xs italic text-muted-foreground/60 text-left">No additional custom fields were submitted.</p>
                                  ) : (
                                    <div className="space-y-3">
                                      {otherFields.map((field, idx) => {
                                        const valStr = (field.id && leadSignedUrls[field.id]) || (typeof field.value === 'string' ? field.value : '')
                                        const isHttp = valStr.startsWith('http://') || valStr.startsWith('https://')

                                        // Determine visual layout based on field type or value format
                                        const isImageField = field.type === 'image' || field.type === 'signature'
                                        const isFileField = field.type === 'file'

                                        const isHttpImageFallback = !field.type && isHttp && (
                                          valStr.toLowerCase().includes('.png') ||
                                          valStr.toLowerCase().includes('.jpg') ||
                                          valStr.toLowerCase().includes('.jpeg') ||
                                          valStr.toLowerCase().includes('.gif') ||
                                          valStr.toLowerCase().includes('.webp') ||
                                          valStr.toLowerCase().includes('sig')
                                        )

                                        return (
                                          <div key={idx} className="p-3 border border-border/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/10 rounded-xl space-y-1.5 text-left">
                                            <div className="text-[9px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">{field.label}</div>

                                            {isImageField || isHttpImageFallback ? (
                                              <div className="pt-1">
                                                <a href={valStr} target="_blank" rel="noopener noreferrer" className="inline-block relative rounded-lg border border-border dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 p-1 group">
                                                  <img src={valStr} alt={field.label} className="max-h-32 object-contain rounded-md" />
                                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                    <ExternalLink size={14} className="text-white" />
                                                  </div>
                                                </a>
                                              </div>
                                            ) : isFileField ? (
                                              <div className="pt-1">
                                                <a
                                                  href={valStr}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3f5ce6]/30 bg-[#3f5ce6]/5 hover:bg-[#3f5ce6]/10 text-xs font-semibold text-[#3f5ce6] transition-all hover:underline select-none cursor-pointer"
                                                >
                                                  <FileText size={12} /> Open File
                                                </a>
                                              </div>
                                            ) : isHttp ? (
                                              <div className="pt-1 flex items-center gap-1.5">
                                                <a href={valStr} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#3f5ce6] hover:underline flex items-center gap-1 truncate max-w-sm">
                                                  {valStr}
                                                  <ExternalLink size={10} className="shrink-0" />
                                                </a>
                                              </div>
                                            ) : (
                                              <div className="text-xs font-semibold text-foreground dark:text-zinc-100 whitespace-pre-line break-words pt-0.5">
                                                {field.value}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Sticky Footer */}
                              <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row sm:space-x-2 justify-end text-left items-center">
                                <div className="text-[10px] text-muted-foreground/60 flex-1 truncate pr-3">
                                  <span className="flex items-center gap-1 truncate">
                                    <Clock size={10} />
                                    Submitted {leadSheet.lead.submitted_at
                                      ? new Date(leadSheet.lead.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                      : '—'}
                                  </span>
                                </div>
                                <div className="flex gap-2 shrink-0 items-center">
                                  {isConfirmingDelete ? (
                                    <div className="flex items-center gap-1.5 shrink-0 bg-red-500/5 dark:bg-red-500/10 border border-red-500/25 p-1 rounded-xl transition-all">
                                      <span className="text-[10px] font-bold text-red-500 dark:text-red-400 px-2 select-none">Confirm delete?</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          deleteLeadSubmission(leadSheet.lead.id)
                                          setLeadSheet(prev => ({ ...prev, open: false }))
                                          setIsConfirmingDelete(false)
                                        }}
                                        className="py-1 px-2.5 rounded-lg bg-red-600 text-white font-bold text-[10px] cursor-pointer hover:bg-red-700 transition-colors active:scale-95 shrink-0"
                                      >
                                        Yes, Delete
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setIsConfirmingDelete(false)}
                                        className="py-1 px-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground font-bold text-[10px] cursor-pointer transition-colors active:scale-95 shrink-0"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setIsConfirmingDelete(true)}
                                      className="py-2 px-3.5 rounded-xl border border-red-500/35 bg-red-500/5 hover:bg-red-550/10 dark:hover:bg-red-500/15 text-red-500 dark:text-red-400 font-semibold text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                                    >
                                      <Trash2 size={13} /> Delete
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Transition inline to Edit mode!
                                      setLeadFormState({ status: leadSheet.lead.status || 'new' })
                                      setLeadModalSelectedFormId(leadSheet.lead.form_id || null)
                                      setLeadModalCustomData(leadSheet.lead.data || {})
                                      setLeadSheet(prev => ({ ...prev, mode: 'edit' }))
                                    }}
                                    className="py-2 px-3.5 rounded-xl border border-border dark:border-zinc-800 bg-card hover:bg-muted text-foreground dark:text-white text-xs font-semibold cursor-pointer transition-all active:scale-98 flex items-center gap-1.5 shrink-0"
                                  >
                                    <Edit size={13} /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLeadSheet(prev => ({ ...prev, open: false }))}
                                    className="py-2 px-3.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold transition-all cursor-pointer active:scale-98 flex items-center gap-1.5 shrink-0"
                                  >
                                    Close
                                  </button>
                                </div>
                              </SheetFooter>
                            </>
                          )
                        })()}
                      </SheetContent>
                    </Sheet>

                    {/* ─── SUB-TAB: Forms ─── */}
                    {leadsSubTab === 'forms' && (
                      <div className="space-y-4">
                        {leadFormsLoading ? (
                          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                            <Loader2 size={18} className="animate-spin" /><span className="text-xs">Loading forms…</span>
                          </div>
                        ) : leadForms.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-border rounded-2xl">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                              <FileText size={24} className="text-emerald-500" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground">No forms yet</h4>
                              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                                Create your first lead form to start capturing enquiries from your card page.
                              </p>
                            </div>
                            <button onClick={() => openFormBuilder()} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold shadow-md transition-all cursor-pointer">
                              <Plus size={13} /> Create First Form
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {leadForms.map((form: any) => {
                              const subCount = leads.filter((l: any) => l.form_id === form.id).length
                              const fieldCount = (form.fields || []).length
                              const totalFields = fieldCount
                              return (
                                <div key={form.id} className={`bg-card border rounded-xl p-4 transition-all ${form.is_active ? 'border-emerald-500/40 shadow-sm shadow-emerald-500/10' : 'border-border'}`}>
                                  <div className="flex items-start gap-4">
                                    {/* Left: icon + status */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${form.is_active ? 'bg-emerald-500/15' : 'bg-muted'}`}>
                                      <FileText size={18} className={form.is_active ? 'text-emerald-500' : 'text-muted-foreground'} />
                                    </div>
                                    {/* Middle: info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-sm text-foreground truncate">{form.form_name || 'Lead Form'}</span>
                                        {form.is_active ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-bold text-emerald-500">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ACTIVE
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] font-bold text-muted-foreground">DRAFT</span>
                                        )}

                                      </div>
                                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{form.title || 'Untitled Form'}</p>
                                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                          <SlidersHorizontal size={9} /> {totalFields} field{totalFields !== 1 ? 's' : ''}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                          <Users size={9} /> {subCount} submission{subCount !== 1 ? 's' : ''}
                                        </span>
                                        {(form.product_ids || []).length > 0 && (
                                          <span className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                                            <Package size={9} /> {(form.product_ids || []).length} product{(form.product_ids || []).length !== 1 ? 's' : ''}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {/* Right: actions */}
                                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                                      {form.is_active ? (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              onClick={() => deactivateForm(form.id)}
                                              className="px-3 py-1.5 rounded-lg bg-zinc-500/10 border border-zinc-500/25 text-zinc-600 dark:text-zinc-400 text-[11px] font-bold hover:bg-zinc-500/20 transition-all cursor-pointer"
                                            >
                                              Deactivate
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom">Deactivate this form</TooltipContent>
                                        </Tooltip>
                                      ) : (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              onClick={() => activateForm(form.id)}
                                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
                                            >
                                              Activate
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom">Activate this form</TooltipContent>
                                        </Tooltip>
                                      )}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button onClick={() => openFormBuilder(form)} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-[#3f5ce6] hover:bg-[#3f5ce6]/10 flex items-center justify-center transition-colors cursor-pointer">
                                            <Edit size={14} />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">Edit Form</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>
                                            <button
                                              onClick={() => openDuplicateDialog(form)}
                                              disabled={cardProfiles.filter((p: any) => p.id !== activeProfile?.id).length === 0}
                                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed w-full"
                                            >
                                              <Layers size={14} />
                                            </button>
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                          {cardProfiles.filter((p: any) => p.id !== activeProfile?.id).length === 0 ? 'Need another profile to duplicate to' : 'Duplicate to another profile'}
                                        </TooltipContent>
                                      </Tooltip>
                                      {formPendingDelete === form.id ? (
                                        <div className="flex items-center gap-1 animate-fadeIn">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <button onClick={() => deleteForm(form.id)} className="h-8 w-8 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center cursor-pointer">
                                                <Trash2 size={13} />
                                              </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">Confirm Delete</TooltipContent>
                                          </Tooltip>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <button onClick={() => setFormPendingDelete(null)} className="h-8 w-8 rounded-lg bg-muted text-foreground hover:bg-muted/80 flex items-center justify-center cursor-pointer">
                                                <X size={13} />
                                              </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">Cancel</TooltipContent>
                                          </Tooltip>
                                        </div>
                                      ) : (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              onClick={() => setFormPendingDelete(form.id)}
                                              className="h-8 w-8 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom">Delete Form</TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                            <p className="text-[11px] text-center text-muted-foreground/50 py-1">Only one form can be active at a time · Leads are tracked per form independently</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ═══ FORM BUILDER SHEET ═══════════════════════════════════ */}
            <Sheet open={formBuilderOpen} onOpenChange={(open: boolean) => { if (!open) setFormBuilderOpen(false) }}>
              <SheetContent className="!w-full sm:!max-w-4xl lg:!max-w-5xl bg-background dark:bg-[#18181b] border-l border-border dark:border-zinc-800 p-0 flex flex-col h-full overflow-hidden text-left" showCloseButton={false}>

                {/* Accent line */}
                <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-[#3f5ce6] to-indigo-600 shrink-0" />

                {/* Header */}
                <SheetHeader className="flex flex-row items-center justify-between px-6 py-2 shrink-0 border-b border-border dark:border-zinc-800 space-y-0 text-left">
                  <div>
                    <SheetTitle className="font-black text-sm text-foreground">{editingFormId ? 'Edit Form' : 'New Form'}</SheetTitle>
                    <SheetDescription className="text-[11px] text-muted-foreground mt-0.5">Build fields, link products, configure your form.</SheetDescription>
                  </div>
                </SheetHeader>

                {/* Split Builder & Preview Body */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                  {/* Left Column: Form Controls (Scrollable) */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 border-b md:border-b-0 md:border-r border-border dark:border-zinc-800 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                    {/* Form identity */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Form Identity</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Form Name <span className="text-red-400">*</span></label>
                          <input
                            type="text"
                            value={formBuilderDraft.form_name}
                            onChange={e => setFormBuilderDraft((p: any) => ({ ...p, form_name: e.target.value }))}
                            placeholder="e.g. Product Enquiry"
                            className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Button Label</label>
                          <input
                            type="text"
                            value={formBuilderDraft.button_label}
                            onChange={e => setFormBuilderDraft((p: any) => ({ ...p, button_label: e.target.value }))}
                            placeholder="Submit"
                            className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Heading (shown on card page)</label>
                        <input
                          type="text"
                          value={formBuilderDraft.title}
                          onChange={e => setFormBuilderDraft((p: any) => ({ ...p, title: e.target.value }))}
                          placeholder="Get in Touch"
                          className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Sub-heading</label>
                        <input
                          type="text"
                          value={formBuilderDraft.subtitle}
                          onChange={e => setFormBuilderDraft((p: any) => ({ ...p, subtitle: e.target.value }))}
                          placeholder="Fill out the form below to connect."
                          className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                        />
                      </div>
                    </div>

                    {/* Product linking */}
                    {profileProducts.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Link to Products</h4>
                        <div className="space-y-2">
                          {profileProducts.map((prod: any) => {
                            const isLinked = (formBuilderDraft.product_ids || []).includes(prod.id)
                            return (
                              <label key={prod.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-[#3f5ce6]/30 cursor-pointer transition-colors">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isLinked ? 'bg-[#3f5ce6] border-[#3f5ce6]' : 'border-border bg-background'}`}
                                  onClick={() => setFormBuilderDraft((p: any) => ({
                                    ...p,
                                    product_ids: isLinked
                                      ? (p.product_ids || []).filter((id: string) => id !== prod.id)
                                      : [...(p.product_ids || []), prod.id]
                                  }))}
                                >
                                  {isLinked && <Check size={10} className="text-white" />}
                                </div>
                                <span className="text-xs font-semibold text-foreground">{prod.name}</span>
                                {prod.price_inr && <span className="text-[10px] text-muted-foreground ml-auto">₹{(prod.price_inr / 100).toLocaleString('en-IN')}</span>}
                              </label>
                            )
                          })}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60">Leads from this form will be linked to the selected products for product-specific filtering.</p>
                      </div>
                    )}

                    {/* Custom fields */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Custom Fields ({formBuilderDraft.fields.length})</h4>
                        <div className="relative">
                          <button
                            onClick={() => setFieldTypePickerOpen(p => !p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3f5ce6]/10 border border-[#3f5ce6]/25 text-[#3f5ce6] text-[11px] font-bold hover:bg-[#3f5ce6]/20 transition-all cursor-pointer"
                          >
                            <Plus size={12} /> Add Field
                          </button>
                          {fieldTypePickerOpen && (
                            <div className="absolute right-0 top-full mt-2 z-50 bg-popover border border-border dark:border-zinc-800 rounded-2xl shadow-2xl p-3 w-72 animate-fadeIn">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2 px-1">Choose Field Type</p>
                              <div className="grid grid-cols-3 gap-1.5">
                                {[
                                  { type: 'text', label: 'Text', icon: <Type size={14} /> },
                                  { type: 'email', label: 'Email', icon: <Mail size={14} /> },
                                  { type: 'phone', label: 'Phone', icon: <Phone size={14} /> },
                                  { type: 'textarea', label: 'Textarea', icon: <AlignLeft size={14} /> },
                                  { type: 'number', label: 'Number', icon: <Hash size={14} /> },
                                  { type: 'url', label: 'URL', icon: <Globe size={14} /> },
                                  { type: 'date', label: 'Date', icon: <Calendar size={14} /> },
                                  { type: 'select', label: 'Dropdown', icon: <ChevronDown size={14} /> },
                                  { type: 'radio', label: 'Radio', icon: <RadioTower size={14} /> },
                                  { type: 'checkbox', label: 'Checkbox', icon: <ListChecks size={14} /> },
                                  { type: 'file', label: 'File', icon: <Paperclip size={14} /> },
                                  { type: 'image', label: 'Image', icon: <Camera size={14} /> },
                                  { type: 'signature', label: 'Signature', icon: <PenLine size={14} /> },
                                  { type: 'heading', label: 'Heading', icon: <Heading1 size={14} /> },
                                ].map(({ type, label, icon }) => (
                                  <button
                                    key={type}
                                    onClick={() => addField(type)}
                                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-card hover:border-[#3f5ce6]/40 hover:bg-[#3f5ce6]/5 text-muted-foreground hover:text-[#3f5ce6] transition-all cursor-pointer"
                                  >
                                    {icon}
                                    <span className="text-[9px] font-bold">{label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Field list */}
                      {formBuilderDraft.fields.length === 0 ? (
                        <div className="border border-dashed border-border rounded-xl py-8 text-center text-muted-foreground/50">
                          <SlidersHorizontal size={20} className="mx-auto mb-2 opacity-40" />
                          <p className="text-xs font-semibold">No custom fields yet</p>
                          <p className="text-[10px] mt-0.5">Click "Add Field" to start building your form</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {formBuilderDraft.fields.map((field: any, idx: number) => (
                            <div key={field.id} className="bg-card border border-border rounded-xl overflow-hidden">
                              {/* Field header */}
                              <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30 dark:bg-zinc-900/30 border-b border-border">
                                <GripVertical size={13} className="text-muted-foreground/40 shrink-0" />
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex-1">{field.type}</span>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => moveField(idx, 'up')} disabled={idx === 0} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed">
                                    <ChevronUp size={12} />
                                  </button>
                                  <button onClick={() => moveField(idx, 'down')} disabled={idx === formBuilderDraft.fields.length - 1} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed">
                                    <ChevronDown size={12} />
                                  </button>
                                  <button onClick={() => removeField(field.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 cursor-pointer">
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                              {/* Field editor */}
                              <div className="p-3 space-y-2">
                                {field.type === 'heading' || field.type === 'paragraph' ? (
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{field.type === 'heading' ? 'Heading Text' : 'Paragraph Text'}</label>
                                    <input
                                      type="text"
                                      value={field.content || field.label}
                                      onChange={e => updateField(field.id, { label: e.target.value, content: e.target.value })}
                                      placeholder={field.type === 'heading' ? 'Section heading...' : 'Helper text...'}
                                      className="w-full px-3 py-2 rounded-lg border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs focus:outline-none focus:border-[#3f5ce6] transition-all"
                                    />
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Label</label>
                                      <input
                                        type="text"
                                        value={field.label}
                                        onChange={e => updateField(field.id, { label: e.target.value })}
                                        placeholder="Field label"
                                        className="w-full px-3 py-2 rounded-lg border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs focus:outline-none focus:border-[#3f5ce6] transition-all"
                                      />
                                    </div>
                                    {['text', 'email', 'phone', 'number', 'url', 'textarea', 'date'].includes(field.type) && (
                                      <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Placeholder</label>
                                        <input
                                          type="text"
                                          value={field.placeholder || ''}
                                          onChange={e => updateField(field.id, { placeholder: e.target.value })}
                                          placeholder="Hint text..."
                                          className="w-full px-3 py-2 rounded-lg border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs focus:outline-none focus:border-[#3f5ce6] transition-all"
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Options for select/radio/checkbox */}
                                {['select', 'radio', 'checkbox'].includes(field.type) && (
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Options</label>
                                    <div className="space-y-1.5">
                                      {(field.options || []).map((opt: string, oIdx: number) => (
                                        <div key={oIdx} className="flex items-center gap-1.5">
                                          <input
                                            type="text"
                                            value={opt}
                                            onChange={e => {
                                              const newOpts = [...(field.options || [])]
                                              newOpts[oIdx] = e.target.value
                                              updateField(field.id, { options: newOpts })
                                            }}
                                            placeholder={`Option ${oIdx + 1}`}
                                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs focus:outline-none focus:border-[#3f5ce6] transition-all"
                                          />
                                          <button
                                            onClick={() => {
                                              const newOpts = (field.options || []).filter((_: string, i: number) => i !== oIdx)
                                              updateField(field.id, { options: newOpts })
                                            }}
                                            className="p-1 rounded text-muted-foreground hover:text-red-400 cursor-pointer"
                                          >
                                            <X size={11} />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => updateField(field.id, { options: [...(field.options || []), `Option ${(field.options || []).length + 1}`] })}
                                        className="text-[10px] font-bold text-[#3f5ce6] hover:underline cursor-pointer"
                                      >
                                        + Add Option
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Required toggle (not for headings/paragraphs) */}
                                {!['heading', 'paragraph', 'signature'].includes(field.type) && (
                                  <div className="flex items-center justify-between pt-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Required</span>
                                    <button
                                      type="button"
                                      onClick={() => updateField(field.id, { required: !field.required })}
                                      className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors ${field.required ? 'bg-[#3f5ce6]' : 'bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700'}`}
                                    >
                                      <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${field.required ? 'left-[14px]' : 'left-0.5'}`} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Live Preview (Scrollable) */}
                  <div className="w-full md:w-[340px] lg:w-[380px] shrink-0 bg-muted/20 dark:bg-zinc-900/10 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 flex flex-col justify-start">
                    <div className="sticky top-0 space-y-4">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Live Preview</h4>

                      {/* Public Mock Lead Form Container */}
                      <div className="bg-background dark:bg-zinc-950 border border-border dark:border-zinc-900 rounded-2xl p-5 shadow-lg space-y-4 text-left">
                        {/* Title & Subtitle */}
                        <div>
                          <h3 className="font-bold text-sm text-foreground">{formBuilderDraft.title || 'Get in Touch'}</h3>
                          {formBuilderDraft.subtitle && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{formBuilderDraft.subtitle}</p>
                          )}
                        </div>

                        {/* Product links mock */}
                        {(formBuilderDraft.product_ids || []).length > 0 && (
                          <div className="space-y-1.5 border-t border-border dark:border-zinc-900 pt-3">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Product Enquiry for:</label>
                            <div className="flex flex-wrap gap-1.5">
                              {formBuilderDraft.product_ids.map((prodId: string) => {
                                const prod = profileProducts.find((p: any) => p.id === prodId)
                                if (!prod) return null
                                return (
                                  <span key={prodId} className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-500 flex items-center gap-1">
                                    <Package size={8} /> {prod.name}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Custom fields mock */}
                        <div className="space-y-3.5 pt-1">
                          {formBuilderDraft.fields.length === 0 ? (
                            <p className="text-[10px] italic text-muted-foreground/40 text-center py-4">Add custom fields to preview form inputs</p>
                          ) : (
                            formBuilderDraft.fields.map((field: any) => {
                              if (field.type === 'heading') {
                                return (
                                  <h4 key={field.id} className="text-xs font-bold text-foreground pt-1 border-b border-border/40 pb-1">{field.label}</h4>
                                )
                              }
                              if (field.type === 'paragraph') {
                                return (
                                  <p key={field.id} className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-line">{field.label}</p>
                                )
                              }
                              if (field.type === 'textarea') {
                                return (
                                  <div key={field.id} className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-foreground/80 block">
                                      {field.label} {field.required && <span className="text-red-400">*</span>}
                                    </label>
                                    <textarea
                                      rows={2}
                                      disabled
                                      placeholder={field.placeholder || 'Type here...'}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/10 text-[11px] focus:outline-none resize-none cursor-not-allowed opacity-80"
                                    />
                                  </div>
                                )
                              }
                              if (field.type === 'select') {
                                return (
                                  <div key={field.id} className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-foreground/80 block">
                                      {field.label} {field.required && <span className="text-red-400">*</span>}
                                    </label>
                                    <select
                                      disabled
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/10 text-[11px] cursor-not-allowed opacity-80"
                                    >
                                      <option>{field.placeholder || 'Select option...'}</option>
                                      {(field.options || []).map((o: string) => (
                                        <option key={o}>{o}</option>
                                      ))}
                                    </select>
                                  </div>
                                )
                              }
                              if (field.type === 'radio') {
                                return (
                                  <div key={field.id} className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-foreground/80 block">
                                      {field.label} {field.required && <span className="text-red-400">*</span>}
                                    </label>
                                    <div className="flex flex-wrap gap-2.5">
                                      {(field.options || []).map((o: string) => (
                                        <label key={o} className="flex items-center gap-1.5 text-[10px] text-foreground/70 cursor-not-allowed">
                                          <input type="radio" disabled className="w-3 h-3 text-[#3f5ce6]" />
                                          <span>{o}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                )
                              }
                              if (field.type === 'checkbox') {
                                const options = field.options || []
                                if (options.length > 0) {
                                  return (
                                    <div key={field.id} className="space-y-1.5">
                                      <label className="text-[10px] font-semibold text-foreground/80 block">
                                        {field.label} {field.required && <span className="text-red-400">*</span>}
                                      </label>
                                      <div className="flex flex-wrap gap-2.5">
                                        {options.map((o: string) => (
                                          <label key={o} className="flex items-center gap-1.5 text-[10px] text-foreground/70 cursor-not-allowed">
                                            <input type="checkbox" disabled className="w-3 h-3 text-[#3f5ce6] rounded" />
                                            <span>{o}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                } else {
                                  return (
                                    <div key={field.id} className="flex items-center justify-between py-1 border-b border-border/40">
                                      <span className="text-[10px] font-semibold text-foreground/80">{field.label} {field.required && <span className="text-red-400">*</span>}</span>
                                      <input type="checkbox" disabled className="w-3 h-3 text-[#3f5ce6] rounded cursor-not-allowed" />
                                    </div>
                                  )
                                }
                              }
                              if (field.type === 'file' || field.type === 'image') {
                                return (
                                  <div key={field.id} className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-foreground/80 block">
                                      {field.label} {field.required && <span className="text-red-400">*</span>}
                                    </label>
                                    <div className="border border-dashed border-border rounded-lg p-3 text-center bg-muted/10">
                                      <Paperclip size={14} className="mx-auto text-muted-foreground opacity-60 mb-1" />
                                      <span className="text-[9px] font-bold text-[#3f5ce6]">Upload {field.type === 'image' ? 'Image' : 'File'}</span>
                                    </div>
                                  </div>
                                )
                              }
                              if (field.type === 'signature') {
                                return (
                                  <div key={field.id} className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-foreground/80 block">
                                      {field.label} {field.required && <span className="text-red-400">*</span>}
                                    </label>
                                    <div className="h-16 border border-border rounded-lg bg-muted/10 flex items-center justify-center text-[9px] text-muted-foreground italic select-none">
                                      Draw Signature Canvas (Live Preview)
                                    </div>
                                  </div>
                                )
                              }

                              if (field.type === 'date') {
                                return (
                                  <div key={field.id} className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-foreground/80 block">
                                      {field.label} {field.required && <span className="text-red-400">*</span>}
                                    </label>
                                    <div className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/10 text-[11px] text-muted-foreground/60 flex items-center gap-2 cursor-not-allowed opacity-80 select-none">
                                      <Calendar size={12} className="text-muted-foreground/60 shrink-0" />
                                      <span>{field.placeholder || `Select ${field.label}...`}</span>
                                    </div>
                                  </div>
                                )
                              }

                              const inputType =
                                field.type === 'number'
                                  ? 'number'
                                  : field.type === 'email'
                                    ? 'email'
                                    : field.type === 'phone'
                                      ? 'tel'
                                      : field.type === 'url'
                                        ? 'url'
                                        : field.type === 'time'
                                          ? 'time'
                                          : 'text'

                              return (
                                <div key={field.id} className="space-y-1.5">
                                  <label className="text-[10px] font-semibold text-foreground/80 block">
                                    {field.label} {field.required && <span className="text-red-400">*</span>}
                                  </label>
                                  <input
                                    type={inputType}
                                    disabled
                                    placeholder={field.placeholder || `Enter ${field.label}...`}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/10 text-[11px] focus:outline-none cursor-not-allowed opacity-80"
                                  />
                                </div>
                              )
                            })
                          )}
                        </div>

                        {/* Submit Button */}
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3f5ce6] to-indigo-600 text-white text-xs font-bold shadow-md cursor-not-allowed opacity-90 select-none text-center"
                        >
                          {formBuilderDraft.button_label || 'Submit'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <SheetFooter className="p-5 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 flex-row gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setFormBuilderOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs font-semibold cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveFormBuilder}
                    disabled={formBuilderSaving || !formBuilderDraft.form_name?.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] disabled:opacity-60 text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {formBuilderSaving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> {editingFormId ? 'Save Changes' : 'Create Form'}</>}
                  </button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* ═══ FORM DUPLICATE DIALOG ═════════════════════════════════ */}
            {duplicateDialogOpen && duplicatingForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
                <div className="bg-background dark:bg-[#18181b] border border-border dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scaleUp text-left">
                  <div className="p-5 border-b border-border dark:border-zinc-800 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Duplicate Form</h3>
                    <button onClick={() => setDuplicateDialogOpen(false)} className="text-zinc-400 hover:text-foreground transition-colors cursor-pointer"><X size={16} /></button>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Copy form template to another profile. Leads will be tracked independently in the new profile.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Target Profile</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left">
                            <span className="truncate">
                              {cardProfiles.find((p: any) => p.id === duplicateTargetProfileId)?.profile_name || 'Select target profile'}
                            </span>
                            <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[340px] z-[150]">
                          {cardProfiles.filter((p: any) => p.id !== activeProfile?.id).map((p: any) => (
                            <DropdownMenuItem
                              key={p.id}
                              onClick={() => {
                                setDuplicateTargetProfileId(p.id)
                                if (duplicatingForm) {
                                  checkDuplicateConflict(duplicateFormName, p.id, duplicatingForm.fields)
                                }
                              }}
                              className="text-xs cursor-pointer"
                            >
                              {p.profile_name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Form Name in Target Profile</label>
                      <input
                        type="text"
                        value={duplicateFormName}
                        onChange={e => {
                          const newName = e.target.value
                          setDuplicateFormName(newName)
                          if (duplicatingForm) {
                            checkDuplicateConflict(newName, duplicateTargetProfileId, duplicatingForm.fields)
                          }
                        }}
                        placeholder="Form name"
                        className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                      />
                    </div>

                    {duplicateCheckingConflict ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground animate-pulse py-1">
                        <Loader2 size={11} className="animate-spin" /> Checking target duplicates...
                      </div>
                    ) : duplicateConflict ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> Form Already Present
                        </div>
                        <p className="leading-relaxed">
                          A form with the same name and fields is already present in that target profile. You can change the form name and duplicate, or process anyway.
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <div className="p-5 border-t border-border dark:border-zinc-800 flex gap-3">
                    <button onClick={() => setDuplicateDialogOpen(false)} className="flex-1 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">Cancel</button>
                    <button
                      onClick={confirmDuplicateForm}
                      disabled={duplicating || !duplicateTargetProfileId || !duplicateFormName.trim()}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-white ${duplicateConflict
                          ? 'bg-amber-500 hover:bg-amber-600'
                          : 'bg-[#3f5ce6] hover:bg-[#3050d8]'
                        }`}
                    >
                      {duplicating ? (
                        <><Loader2 size={12} className="animate-spin" /> Duplicating…</>
                      ) : duplicateConflict ? (
                        <><AlertCircle size={12} /> Duplicate Anyway</>
                      ) : (
                        <><Layers size={12} /> Duplicate</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ PRODUCT DUPLICATE DIALOG ═══════════════════════════════ */}
            {duplicateProductDialogOpen && duplicatingProduct && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
                <div className="bg-background dark:bg-[#18181b] border border-border dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scaleUp text-left">
                  <div className="p-5 border-b border-border dark:border-zinc-800 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Duplicate Product</h3>
                    <button onClick={() => setDuplicateProductDialogOpen(false)} className="text-zinc-400 hover:text-foreground transition-colors cursor-pointer"><X size={16} /></button>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Copy product details to another profile. Reviews and linked forms will not be copied over.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Target Profile</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left">
                            <span className="truncate">
                              {cardProfiles.find((p: any) => p.id === duplicateProductTargetProfileId)?.profile_name || 'Select target profile'}
                            </span>
                            <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[340px] z-[150]">
                          {cardProfiles.filter((p: any) => p.id !== activeProfile?.id).map((p: any) => (
                            <DropdownMenuItem
                              key={p.id}
                              onClick={() => {
                                setDuplicateProductTargetProfileId(p.id)
                                checkDuplicateProductConflict(duplicateProductName, p.id)
                              }}
                              className="text-xs cursor-pointer"
                            >
                              {p.profile_name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Product Name in Target Profile</label>
                      <input
                        type="text"
                        value={duplicateProductName}
                        onChange={e => {
                          const newName = e.target.value
                          setDuplicateProductName(newName)
                          checkDuplicateProductConflict(newName, duplicateProductTargetProfileId)
                        }}
                        placeholder="Product name"
                        className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                      />
                    </div>

                    {duplicateProductCheckingConflict ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground animate-pulse py-1">
                        <Loader2 size={11} className="animate-spin" /> Checking target duplicates...
                      </div>
                    ) : duplicateProductConflict ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> Product Already Present
                        </div>
                        <p className="leading-relaxed">
                          A product with this name already exists in that target profile. Duplicating will create a second instance of this product. You can change the product name, or process anyway.
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <div className="p-5 border-t border-border dark:border-zinc-800 flex gap-3">
                    <button onClick={() => setDuplicateProductDialogOpen(false)} className="flex-1 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">Cancel</button>
                    <button
                      onClick={confirmDuplicateProduct}
                      disabled={duplicatingProductProgress || !duplicateProductTargetProfileId || !duplicateProductName.trim()}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-white ${duplicateProductConflict
                          ? 'bg-amber-500 hover:bg-amber-600'
                          : 'bg-[#3f5ce6] hover:bg-[#3050d8]'
                        }`}
                    >
                      {duplicatingProductProgress ? (
                        <><Loader2 size={12} className="animate-spin" /> Duplicating…</>
                      ) : duplicateProductConflict ? (
                        <><AlertCircle size={12} /> Duplicate Anyway</>
                      ) : (
                        <><Layers size={12} /> Duplicate</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ DUPLICATE FROM OTHERS DIALOG ═══════════════════════════ */}
            {duplicateFromOthersDialogOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
                <div className="bg-background dark:bg-[#18181b] border border-border dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scaleUp text-left">
                  <div className="p-5 border-b border-border dark:border-zinc-800 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Duplicate Product From Another Profile</h3>
                    <button onClick={() => setDuplicateFromOthersDialogOpen(false)} className="text-zinc-400 hover:text-foreground transition-colors cursor-pointer"><X size={16} /></button>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Select a product from another profile to duplicate it to your current active profile.
                    </p>

                    {/* Dropdown: Source Profile */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Source Profile</label>
                      {(() => {
                        const sourceProfiles = cardProfiles.filter(profile => 
                          allAccountProducts.some(p => p.profile_id === profile.id) && profile.id !== activeProfile?.id
                        );
                        return (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left">
                                <span className="truncate">
                                  {sourceProfiles.find((p: any) => p.id === selectedSourceProfileId)?.profile_name || 'Select source profile'}
                                </span>
                                <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[340px] z-[150]">
                              {sourceProfiles.map((p: any) => (
                                <DropdownMenuItem
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedSourceProfileId(p.id)
                                    const firstProduct = allAccountProducts.find(prod => prod.profile_id === p.id)
                                    if (firstProduct) {
                                      setSelectedSourceProductId(firstProduct.id)
                                      setDuplicateFromOthersProductName(firstProduct.name || '')
                                      if (activeProfile?.id) {
                                        checkDuplicateFromOthersConflict(firstProduct.name, activeProfile.id)
                                      }
                                    } else {
                                      setSelectedSourceProductId('')
                                      setDuplicateFromOthersProductName('')
                                      setDuplicateFromOthersConflict(false)
                                    }
                                  }}
                                  className="text-xs cursor-pointer"
                                >
                                  {p.profile_name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      })()}
                    </div>

                    {/* Dropdown: Product */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Select Product to Copy</label>
                      {(() => {
                        const sourceProducts = allAccountProducts.filter(p => p.profile_id === selectedSourceProfileId);
                        return (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button disabled={!selectedSourceProfileId} className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left disabled:opacity-50">
                                <span className="truncate">
                                  {sourceProducts.find((p: any) => p.id === selectedSourceProductId)?.name || 'Select product'}
                                </span>
                                <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[340px] z-[150]">
                              {sourceProducts.map((prod: any) => (
                                <DropdownMenuItem
                                  key={prod.id}
                                  onClick={() => {
                                    setSelectedSourceProductId(prod.id)
                                    setDuplicateFromOthersProductName(prod.name || '')
                                    if (activeProfile?.id) {
                                      checkDuplicateFromOthersConflict(prod.name, activeProfile.id)
                                    }
                                  }}
                                  className="text-xs cursor-pointer"
                                >
                                  {prod.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      })()}
                    </div>

                    {/* Product name in current active profile */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Product Name in Current Profile</label>
                      <input
                        type="text"
                        disabled={!selectedSourceProductId}
                        value={duplicateFromOthersProductName}
                        onChange={e => {
                          const newName = e.target.value
                          setDuplicateFromOthersProductName(newName)
                          if (activeProfile?.id) {
                            checkDuplicateFromOthersConflict(newName, activeProfile.id)
                          }
                        }}
                        placeholder="Product name"
                        className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all disabled:opacity-50"
                      />
                    </div>

                    {duplicateFromOthersCheckingConflict ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground animate-pulse py-1">
                        <Loader2 size={11} className="animate-spin" /> Checking target duplicates...
                      </div>
                    ) : duplicateFromOthersConflict ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> Product Already Present
                        </div>
                        <p className="leading-relaxed">
                          A product with this name already exists in your current active profile. Duplicating will create a second instance of this product. You can change the name, or process anyway.
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <div className="p-5 border-t border-border dark:border-zinc-800 flex gap-3">
                    <button onClick={() => setDuplicateFromOthersDialogOpen(false)} className="flex-1 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">Cancel</button>
                    <button
                      onClick={confirmDuplicateFromOthers}
                      disabled={duplicatingFromOthersProgress || !selectedSourceProductId || !duplicateFromOthersProductName.trim()}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-white ${duplicateFromOthersConflict
                          ? 'bg-amber-500 hover:bg-amber-600'
                          : 'bg-[#3f5ce6] hover:bg-[#3050d8]'
                        }`}
                    >
                      {duplicatingFromOthersProgress ? (
                        <><Loader2 size={12} className="animate-spin" /> Duplicating…</>
                      ) : duplicateFromOthersConflict ? (
                        <><AlertCircle size={12} /> Duplicate Anyway</>
                      ) : (
                        <><Layers size={12} /> Duplicate</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ FEED DUPLICATE DIALOG ═══════════════════════════════════ */}
            {duplicateFeedDialogOpen && duplicatingFeed && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
                <div className="bg-background dark:bg-[#18181b] border border-border dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scaleUp text-left">
                  <div className="p-5 border-b border-border dark:border-zinc-800 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Duplicate Feed Post</h3>
                    <button onClick={() => setDuplicateFeedDialogOpen(false)} className="text-zinc-400 hover:text-foreground transition-colors cursor-pointer"><X size={16} /></button>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Copy this feed post details to another profile. Post reactions will not be copied over. The duplicated post will be archived (draft status) on the target profile.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Target Profile</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left">
                            <span className="truncate">
                              {cardProfiles.find((p: any) => p.id === duplicateFeedTargetProfileId)?.profile_name || 'Select target profile'}
                            </span>
                            <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[340px] z-[150]">
                          {cardProfiles.filter((p: any) => p.id !== activeProfile?.id).map((p: any) => (
                            <DropdownMenuItem
                              key={p.id}
                              onClick={() => setDuplicateFeedTargetProfileId(p.id)}
                              className="text-xs cursor-pointer"
                            >
                              {p.profile_name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-[11px] text-muted-foreground space-y-1">
                      <div className="font-bold text-foreground capitalize flex items-center gap-1">
                        Post Preview ({duplicatingFeed.feed_type})
                      </div>
                      <p className="line-clamp-3 leading-relaxed">
                        {duplicatingFeed.caption || '(No caption)'}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 border-t border-border dark:border-zinc-800 flex gap-3">
                    <button onClick={() => setDuplicateFeedDialogOpen(false)} className="flex-1 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">Cancel</button>
                    <button
                      onClick={confirmDuplicateFeed}
                      disabled={duplicatingFeedProgress || !duplicateFeedTargetProfileId}
                      className="flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-white bg-[#3f5ce6] hover:bg-[#3050d8] disabled:opacity-50"
                    >
                      {duplicatingFeedProgress ? (
                        <><Loader2 size={12} className="animate-spin" /> Duplicating…</>
                      ) : (
                        <><Layers size={12} /> Duplicate</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ FEED DUPLICATE FROM OTHERS DIALOG ═══════════════════════ */}
            {duplicateFeedFromOthersDialogOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
                <div className="bg-background dark:bg-[#18181b] border border-border dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scaleUp text-left">
                  <div className="p-5 border-b border-border dark:border-zinc-800 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Duplicate Feed From Another Profile</h3>
                    <button onClick={() => setDuplicateFeedFromOthersDialogOpen(false)} className="text-zinc-400 hover:text-foreground transition-colors cursor-pointer"><X size={16} /></button>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Select a feed post from another profile to duplicate it to your current active profile.
                    </p>

                    {/* Dropdown: Source Profile */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Source Profile</label>
                      {(() => {
                        const sourceProfiles = cardProfiles.filter(profile =>
                          allAccountFeeds.some(f => f.profile_id === profile.id) && profile.id !== activeProfile?.id
                        );
                        return (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left">
                                <span className="truncate">
                                  {sourceProfiles.find((p: any) => p.id === selectedSourceFeedProfileId)?.profile_name || 'Select source profile'}
                                </span>
                                <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[340px] z-[150]">
                              {sourceProfiles.map((p: any) => (
                                <DropdownMenuItem
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedSourceFeedProfileId(p.id)
                                    const firstFeed = allAccountFeeds.find(f => f.profile_id === p.id)
                                    if (firstFeed) {
                                      setSelectedSourceFeedId(firstFeed.id)
                                    } else {
                                      setSelectedSourceFeedId('')
                                    }
                                  }}
                                  className="text-xs cursor-pointer"
                                >
                                  {p.profile_name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      })()}
                    </div>

                    {/* Dropdown: Feed */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Select Feed Post to Copy</label>
                      {(() => {
                        const sourceFeeds = allAccountFeeds.filter(f => f.profile_id === selectedSourceFeedProfileId);
                        const selectedFeed = sourceFeeds.find(f => f.id === selectedSourceFeedId);
                        return (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button disabled={!selectedSourceFeedProfileId} className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left disabled:opacity-50">
                                <span className="truncate">
                                  {selectedFeed ? `${selectedFeed.feed_type.toUpperCase()}: ${selectedFeed.caption ? selectedFeed.caption.substring(0, 30) + '...' : '(No Caption)'}` : 'Select post'}
                                </span>
                                <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[340px] z-[150]">
                              {sourceFeeds.map((feed: any) => (
                                <DropdownMenuItem
                                  key={feed.id}
                                  onClick={() => setSelectedSourceFeedId(feed.id)}
                                  className="text-xs cursor-pointer"
                                >
                                  <div className="flex flex-col text-left gap-0.5">
                                    <span className="font-bold text-[10px] uppercase text-[#3f5ce6]">{feed.feed_type}</span>
                                    <span className="truncate max-w-[300px]">{feed.caption || '(No caption)'}</span>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="p-5 border-t border-border dark:border-zinc-800 flex gap-3">
                    <button onClick={() => setDuplicateFeedFromOthersDialogOpen(false)} className="flex-1 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">Cancel</button>
                    <button
                      onClick={confirmDuplicateFeedFromOthers}
                      disabled={duplicatingFeedFromOthersProgress || !selectedSourceFeedId}
                      className="flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-white bg-[#3f5ce6] hover:bg-[#3050d8] disabled:opacity-50"
                    >
                      {duplicatingFeedFromOthersProgress ? (
                        <><Loader2 size={12} className="animate-spin" /> Duplicating…</>
                      ) : (
                        <><Layers size={12} /> Duplicate</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add / Edit Product Sliding Sheet Panel */}
            <Sheet open={productSheetOpen} onOpenChange={(open: boolean) => {
              if (!open) setProductSheetOpen(false);
            }}>
              <SheetContent className="!w-full sm:!max-w-2xl lg:!max-w-xl bg-background dark:bg-[#18181b] border-l border-border dark:border-zinc-800 p-0 flex flex-col h-full overflow-hidden text-left" showCloseButton={false}>
                {/* Gradient Accent Line */}
                <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-[#3f5ce6] to-indigo-600 shrink-0" />

                {productFormMode === 'view' ? (
                  <>
                    <SheetHeader className="pt-0.5 px-6 pb-3 border-b border-border dark:border-zinc-800/80 shrink-0">
                      <div className="space-y-1">
                        <SheetTitle className="text-lg font-bold text-foreground dark:text-white">
                          {productForm.name}
                        </SheetTitle>
                        <SheetDescription className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed font-medium">
                          Product Showcase Details
                        </SheetDescription>
                      </div>
                    </SheetHeader>

                    {/* Scrollable details */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                      {/* Image Gallery */}
                      {productImages.length > 0 && (
                        <div className="space-y-2.5">
                          <h4 className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-widest block">Product Images</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {productImages.map((img) => (
                              <div key={img.id} className="relative aspect-square rounded-xl border border-border overflow-hidden bg-muted">
                                <img src={img.url} alt="Product Image" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-widest block">Description</h4>
                        <p className="text-xs text-foreground dark:text-zinc-200 bg-muted/20 dark:bg-zinc-900/10 p-3 rounded-xl border border-border/80 dark:border-zinc-800/80 leading-relaxed whitespace-pre-wrap">
                          {productForm.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border border-border dark:border-zinc-800 rounded-xl bg-card dark:bg-zinc-900/10">
                          <p className="text-[9px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">Price per Unit</p>
                          <p className="text-sm font-black text-[#3f5ce6] mt-1">
                            {productForm.price_inr ? `₹${parseFloat(productForm.price_inr).toLocaleString('en-IN')}` : 'Price on Request'}
                          </p>
                        </div>
                        <div className="p-3 border border-border dark:border-zinc-800 rounded-xl bg-card dark:bg-zinc-900/10">
                          <p className="text-[9px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">Net Quantity Available</p>
                          <p className="text-sm font-bold text-foreground dark:text-white mt-1">
                            {productForm.net_quantity || '0'}
                          </p>
                        </div>
                      </div>

                      {/* External Link & Enquiry form details */}
                      <div className="space-y-4 border-t border-border dark:border-zinc-800 pt-5">
                        {productForm.link_url && (
                          <div className="p-3 border border-border dark:border-zinc-800 rounded-xl bg-card dark:bg-zinc-900/10 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[9px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">External Link</p>
                              <a href={productForm.link_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#3f5ce6] hover:underline flex items-center gap-1 mt-0.5 truncate max-w-sm">
                                {productForm.link_url}
                                <ExternalLink size={10} className="shrink-0" />
                              </a>
                            </div>
                          </div>
                        )}

                        <div className="p-3 border border-border dark:border-zinc-800 rounded-xl bg-card dark:bg-zinc-900/10">
                          <p className="text-[9px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">Enquiry Form Integration</p>
                          <p className="text-xs font-semibold text-foreground dark:text-white mt-0.5">
                            {leadForms.find(f => f.id === productForm.enquiry_form_id)?.form_name || 'No Enquiry Form Linked'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10">
                          <div>
                            <h4 className="text-xs font-bold text-foreground">Visible on profile</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Showcase this product on your public NFC profile page</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${productForm.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'}`}>
                            {productForm.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Rating & Customer Reviews section */}
                        <div className="p-5 border border-border dark:border-zinc-850 rounded-2xl bg-card/40 dark:bg-zinc-900/10 space-y-4">
                          <div className="flex items-center gap-1.5">
                            <Star size={13} className="text-[#3f5ce6] fill-[#3f5ce6]" />
                            <p className="text-[10px] font-black text-foreground uppercase tracking-wider">Customer Reviews & Ratings</p>
                          </div>
                          {(() => {
                            const currentProductReviews = editingProduct ? productReviews.filter(r => r.product_id === editingProduct.id) : [];
                            return (
                              <>
                                {/* Professional rating overview panel */}
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-500/[0.03] dark:bg-zinc-950/15 border border-border/40 dark:border-zinc-850/40">
                                  {editingProduct?.rating ? (
                                    <>
                                      <div className="text-center shrink-0 border-r border-border/40 dark:border-zinc-800/40 pr-4">
                                        <span className="text-2xl font-black text-foreground bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                                          {parseFloat(editingProduct.rating).toFixed(1)}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground block font-bold leading-none mt-0.5">out of 5</span>
                                      </div>
                                      <div className="space-y-1">
                                        {renderStars(editingProduct.rating)}
                                        <span className="text-[10px] font-bold text-muted-foreground block">
                                          Based on {currentProductReviews.length} {currentProductReviews.length === 1 ? 'review' : 'reviews'}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="w-10 h-10 rounded-xl bg-zinc-500/10 flex items-center justify-center text-muted-foreground/40 shrink-0">
                                        <Star size={18} />
                                      </div>
                                      <div className="text-left">
                                        <span className="text-xs font-bold text-foreground block">No ratings yet</span>
                                        <span className="text-[10px] text-muted-foreground block leading-none">Be the first to provide feedback</span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {currentProductReviews.length > 0 ? (
                                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                                    {currentProductReviews.map((rev) => {
                                      const initials = (rev.reviewer_name || 'Anonymous')
                                        .split(' ')
                                        .map((n: string) => n[0])
                                        .join('')
                                        .substring(0, 2)
                                        .toUpperCase();
                                      
                                      const colors = [
                                        'from-blue-500 to-indigo-600 text-white',
                                        'from-purple-500 to-pink-600 text-white',
                                        'from-emerald-500 to-teal-600 text-white',
                                        'from-amber-500 to-orange-600 text-white',
                                        'from-rose-500 to-red-600 text-white',
                                        'from-sky-500 to-blue-600 text-white',
                                      ];
                                      let sum = 0;
                                      const name = rev.reviewer_name || 'Anonymous';
                                      for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
                                      const avatarBg = colors[sum % colors.length];

                                      return (
                                        <div key={rev.id} className="flex gap-3 bg-zinc-500/[0.02] dark:bg-zinc-950/25 p-3.5 rounded-2xl border border-border/40 dark:border-zinc-850/40 hover:border-border/60 transition-all duration-200">
                                          {/* Left side: Initials Avatar */}
                                          <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black tracking-wider bg-gradient-to-br ${avatarBg} shadow-xs`}>
                                            {initials}
                                          </div>

                                          {/* Right side: Review info */}
                                          <div className="flex-1 min-w-0 space-y-1.5 text-left">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-xs font-bold text-foreground truncate">{rev.reviewer_name || 'Anonymous'}</span>
                                              <span className="text-[10px] text-muted-foreground/60 shrink-0 font-medium">
                                                {new Date(rev.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                              </span>
                                            </div>

                                            {/* Stars & numeric score */}
                                            <div className="flex items-center gap-1.5">
                                              {renderStars(rev.rating)}
                                              <span className="text-[10px] font-black text-amber-500 ml-0.5">
                                                {parseFloat(rev.rating).toFixed(1)}
                                              </span>
                                            </div>

                                            {rev.review && (
                                              <p className="text-xs text-muted-foreground leading-relaxed italic bg-zinc-500/[0.01] dark:bg-zinc-950/45 px-2.5 py-1.5 rounded-xl border-l-2 border-[#3f5ce6] dark:border-indigo-500">
                                                "{rev.review}"
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground/55 italic px-1 select-none">
                                    No reviews have been provided.
                                  </p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row sm:space-x-2 justify-end items-center">
                      <div className="flex-1 text-[10px] text-muted-foreground/60 flex items-center gap-1 select-none pr-3">
                        <Clock size={10} />
                        Views: {editingProduct?.view_count || 0}
                      </div>
                      <div className="flex gap-2 shrink-0 items-center">
                        {isConfirmingProductDelete ? (
                          <div className="flex items-center gap-1.5 shrink-0 bg-red-500/5 dark:bg-red-500/10 border border-red-500/25 p-1 rounded-xl transition-all">
                            <span className="text-[10px] font-bold text-red-500 dark:text-red-400 px-2 select-none">Confirm delete?</span>
                            <button
                              type="button"
                              onClick={async () => {
                                if (editingProduct?.id) {
                                  await confirmDeleteProduct(editingProduct.id)
                                  setProductSheetOpen(false)
                                  setIsConfirmingProductDelete(false)
                                }
                              }}
                              className="py-1 px-2.5 rounded-lg bg-red-650 text-white font-bold text-[10px] cursor-pointer hover:bg-red-700 transition-colors active:scale-95 shrink-0"
                            >
                              Yes, Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsConfirmingProductDelete(false)}
                              className="py-1 px-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground font-bold text-[10px] cursor-pointer transition-colors active:scale-95 shrink-0"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsConfirmingProductDelete(true)}
                            className="py-2 px-3.5 rounded-xl border border-red-500/35 bg-red-500/5 hover:bg-red-550/10 dark:hover:bg-red-500/15 text-red-500 dark:text-red-400 font-semibold text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setProductFormMode('edit')}
                          className="py-2 px-3.5 rounded-xl border border-border dark:border-zinc-800 bg-card hover:bg-muted text-foreground dark:text-white text-xs font-semibold cursor-pointer transition-all active:scale-98 flex items-center gap-1.5 shrink-0"
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductSheetOpen(false)}
                          className="py-2 px-3.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 shrink-0"
                        >
                          Close
                        </button>
                      </div>
                    </SheetFooter>
                  </>
                ) : (
                  <form onSubmit={handleSaveProduct} className="flex flex-col h-full overflow-hidden">
                    <SheetHeader className="pt-0.5 px-6 pb-3 border-b border-border dark:border-zinc-800/80 shrink-0">
                      <div className="space-y-1">
                        <SheetTitle className="text-lg font-bold text-foreground dark:text-white">
                          {productFormMode === 'add' ? 'Showcase a New Product' : 'Edit Showcase Product'}
                        </SheetTitle>
                        <SheetDescription className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed font-medium">
                          {productFormMode === 'add'
                            ? 'Add product details, quantities, client reviews, external purchase links, and link enquiry forms.'
                            : 'Update product information, upload media, or configure enquiry forms.'}
                        </SheetDescription>
                      </div>
                    </SheetHeader>

                    {/* Scrollable Form Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                      
                      {/* Name field */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Product Name *</label>
                        <input
                          type="text"
                          required
                          value={productForm.name}
                          onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                          placeholder="e.g. Elite Metal NFC Card"
                          className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                        />
                      </div>

                      {/* Description field */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Product Description</label>
                        <textarea
                          value={productForm.description}
                          onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                          placeholder="e.g. Premium laser-engraved matte black metal card with built-in NFC chip."
                          rows={6}
                          className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all resize-y min-h-[140px]"
                        />
                      </div>

                      {/* Pricing and Stock info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Price per Unit (INR)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={productForm.price_inr}
                            onChange={e => setProductForm(p => ({ ...p, price_inr: e.target.value }))}
                            placeholder="Leave blank for price on request"
                            className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Net Quantity Available</label>
                          <input
                            type="number"
                            min="0"
                            value={productForm.net_quantity}
                            onChange={e => setProductForm(p => ({ ...p, net_quantity: e.target.value }))}
                            placeholder="e.g. 50"
                            className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                          />
                        </div>
                      </div>

                      {/* External Link & Enquiry form */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">External Purchase/Detail Link (Add & Navigate)</label>
                        <input
                          type="url"
                          value={productForm.link_url}
                          onChange={e => setProductForm(p => ({ ...p, link_url: e.target.value }))}
                          placeholder="https://example.com/product"
                          className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                        />
                      </div>



                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Enquiry Form integration</label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground flex items-center justify-between hover:bg-muted/30 transition-all cursor-pointer">
                                  <span className="truncate">
                                    {leadForms.find(f => f.id === productForm.enquiry_form_id)?.form_name || 'No Enquiry Form Linked'}
                                  </span>
                                  <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-[340px] p-1.5 bg-background dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-2xl shadow-xl z-[60]" align="start">
                                <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                                  <DropdownMenuItem
                                    onClick={() => setProductForm(p => ({ ...p, enquiry_form_id: '' }))}
                                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-foreground hover:bg-muted dark:hover:bg-zinc-800/60 transition-colors flex items-center justify-between cursor-pointer focus:bg-muted dark:focus:bg-zinc-800/60 focus:text-foreground"
                                  >
                                    <span>No Enquiry Form (Disable Enquiry Button)</span>
                                    {!productForm.enquiry_form_id && <Check size={14} className="text-[#3f5ce6]" />}
                                  </DropdownMenuItem>
                                  {leadForms.map(f => (
                                    <DropdownMenuItem
                                      key={f.id}
                                      onClick={() => setProductForm(p => ({ ...p, enquiry_form_id: f.id }))}
                                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-foreground hover:bg-muted dark:hover:bg-zinc-800/60 transition-colors flex items-center justify-between cursor-pointer focus:bg-muted dark:focus:bg-zinc-800/60 focus:text-foreground"
                                    >
                                      <span>{f.form_name}</span>
                                      {productForm.enquiry_form_id === f.id && <Check size={14} className="text-[#3f5ce6]" />}
                                    </DropdownMenuItem>
                                  ))}
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setProductSheetOpen(false)
                              router.push('/dashboard?tab=leads&newForm=true')
                            }}
                            className="px-3 rounded-xl border border-dashed border-border hover:border-[#3f5ce6]/40 text-[#3f5ce6] text-xs font-semibold hover:bg-[#3f5ce6]/5 transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                          >
                            <Plus size={13} /> Create Form
                          </button>
                        </div>
                      </div>

                      {/* Active Switcher */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-muted/10">
                        <div>
                          <h4 className="text-xs font-bold text-foreground">Visible on profile</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Showcase this product on your public NFC profile page</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProductForm(p => ({ ...p, is_active: !p.is_active }))}
                          className={`w-10 h-6 rounded-full p-1 transition-all duration-200 cursor-pointer ${productForm.is_active ? 'bg-[#3f5ce6] flex justify-end' : 'bg-zinc-300 dark:bg-zinc-700 flex justify-start'}`}
                        >
                          <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                        </button>
                      </div>

                      {/* Upload Images Section */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Product Images (List of Images)</label>
                        <div className="grid grid-cols-4 gap-3">
                          {productImages.map((img, index) => {
                            const url = img.type === 'existing' ? img.url : img.previewUrl
                            return (
                              <div key={img.id} className="relative aspect-square rounded-xl border border-border overflow-hidden bg-muted group animate-fadeIn">
                                <img src={url} alt="Product Image" className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/55 backdrop-blur-xs flex items-center justify-between gap-1.5 z-10">
                                  <div className="flex gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveProductImage(index, 'up'); }}
                                          disabled={index === 0}
                                          className="p-1 rounded bg-white/15 text-white hover:bg-white/35 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                        >
                                          <ChevronLeft size={11} />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Move Left</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveProductImage(index, 'down'); }}
                                          disabled={index === productImages.length - 1}
                                          className="p-1 rounded bg-white/15 text-white hover:bg-white/35 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                        >
                                          <ChevronRight size={11} />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Move Right</TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProductImage(img.id); }}
                                        className="p-1 rounded bg-red-500/80 hover:bg-red-650 text-white transition-colors cursor-pointer"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Delete Image</TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            )
                          })}

                          {/* Add Image Button */}
                          <label className="border-2 border-dashed border-border rounded-xl aspect-square flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-[#3f5ce6]/40 hover:text-[#3f5ce6] transition-all cursor-pointer">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleUploadProductImage}
                              className="hidden"
                              disabled={uploadingProductImages}
                            />
                            {uploadingProductImages ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <>
                                <Upload size={16} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
                              </>
                            )}
                          </label>
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 leading-normal">
                          Drag hover elements or use left/right arrows to reorder. The first image will be shown as primary.
                        </p>
                      </div>

                      {/* Manage Product Reviews (Only Deleting Allowed) */}
                      {productFormMode === 'edit' && (
                        <div className="space-y-4 border-t border-border dark:border-zinc-800 pt-5">
                          <div>
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Manage Product Reviews</h4>
                            
                            {/* List of existing reviews */}
                            <div className="space-y-2">
                              {productReviews.filter(r => r.product_id === editingProduct?.id).length > 0 ? (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                                  {productReviews.filter(r => r.product_id === editingProduct?.id).map((rev) => (
                                    <div key={rev.id} className="flex items-start justify-between gap-3 bg-muted/20 dark:bg-zinc-900/20 p-2.5 rounded-xl border border-border/80 dark:border-zinc-800/80">
                                      <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-foreground truncate">{rev.reviewer_name}</span>
                                          <div className="flex items-center gap-0.5">
                                            {renderStars(rev.rating)}
                                            <span className="text-[10px] font-black text-amber-500 ml-1">
                                              {parseFloat(rev.rating).toFixed(1)}
                                            </span>
                                          </div>
                                        </div>
                                        {rev.review && (
                                          <p className="text-xs text-muted-foreground italic leading-normal pl-2 border-l border-border">
                                            "{rev.review}"
                                          </p>
                                        )}
                                      </div>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteReview(rev.id, editingProduct.id)}
                                            className="p-1.5 rounded-lg text-red-500 hover:text-red-650 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Delete Review</TooltipContent>
                                      </Tooltip>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground/60 italic pl-1">
                                  No client reviews added yet.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Actions Footer */}
                    <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row sm:space-x-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setProductSheetOpen(false)}
                        className="flex-grow py-2 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/40 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={productSaving || uploadingProductImages}
                        className="flex-grow py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold shadow-lg shadow-[#3f5ce6]/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {productSaving ? (
                          <>
                            <Loader2 size={13} className="animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save size={13} /> {productFormMode === 'add' ? 'Create Product' : 'Save Changes'}
                          </>
                        )}
                      </button>
                    </SheetFooter>
                  </form>
                )}
              </SheetContent>
            </Sheet>

            {/* Add / Edit Feed Post Sliding Sheet Panel */}
            <Sheet open={feedSheetOpen} onOpenChange={(open: boolean) => {
              if (!open) setFeedSheetOpen(false);
            }}>
              <SheetContent className="!w-full sm:!max-w-2xl lg:!max-w-xl bg-background dark:bg-[#18181b] border-l border-border dark:border-zinc-800 p-0 flex flex-col h-full overflow-hidden text-left" showCloseButton={false}>
                {/* Gradient Accent Line */}
                <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-[#3f5ce6] to-indigo-600 shrink-0" />

                <SheetHeader className="pt-0.5 px-6 pb-3 border-b border-border dark:border-zinc-800/80 shrink-0">
                  <div className="space-y-1">
                    <SheetTitle className="text-lg font-bold text-foreground dark:text-white">
                      {feedFormMode === 'add' ? 'Add Feed Post' : 'Edit Feed Post'}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed font-medium">
                      {feedFormMode === 'add' ? 'Create a new update, media highlight, or link to showcase on your page.' : 'Modify your feed post details.'}
                    </SheetDescription>
                  </div>
                </SheetHeader>

                <form onSubmit={handleSubmitFeed} className="flex flex-col flex-1 overflow-hidden">
                  {/* Scrollable Form Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Post Type Selector (Button group) */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Post Type</label>
                      <div className="flex gap-2">
                        {[
                          { type: 'text', label: 'Text', icon: PenLine },
                          { type: 'image', label: 'Image', icon: ImageIcon },
                          { type: 'video', label: 'Video', icon: Video },
                          { type: 'link', label: 'Link', icon: Link2 }
                        ].map((item) => {
                          const IconComponent = item.icon;
                          const isActive = feedForm.feed_type === item.type;
                          return (
                            <button
                              key={item.type}
                              type="button"
                              onClick={() => setFeedForm(prev => ({ ...prev, feed_type: item.type as any }))}
                              className={`flex-grow py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 ${isActive ? 'bg-[#3f5ce6]/10 border-[#3f5ce6] text-[#3f5ce6]' : 'border-border bg-card hover:bg-muted text-foreground'}`}
                            >
                              <IconComponent size={13} className={isActive ? 'text-[#3f5ce6]' : 'text-muted-foreground'} />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Caption / Description */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Caption / Post Text</label>
                      <textarea
                        value={feedForm.caption}
                        onChange={e => setFeedForm(p => ({ ...p, caption: e.target.value }))}
                        placeholder="What's on your mind? Add caption or post body text here..."
                        rows={5}
                        className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all resize-y min-h-[120px]"
                      />
                    </div>

                    {/* Media Upload Section for Image type */}
                    {feedForm.feed_type === 'image' && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Feed Images (List of Images)</label>
                        <div className="grid grid-cols-4 gap-3">
                          {feedImages.map((img, index) => {
                            const url = img.type === 'existing' ? img.url : img.previewUrl
                            return (
                              <div key={img.id} className="relative aspect-square rounded-xl border border-border overflow-hidden bg-muted group animate-fadeIn">
                                <img src={url} alt="Feed Image" className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/55 backdrop-blur-xs flex items-center justify-between gap-1.5 z-10">
                                  <div className="flex gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveFeedImage(index, 'up'); }}
                                          disabled={index === 0}
                                          className="p-1 rounded bg-white/15 text-white hover:bg-white/35 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                        >
                                          <ChevronLeft size={11} />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Move Left</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveFeedImage(index, 'down'); }}
                                          disabled={index === feedImages.length - 1}
                                          className="p-1 rounded bg-white/15 text-white hover:bg-white/35 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                        >
                                          <ChevronRight size={11} />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Move Right</TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteFeedImage(img.id); }}
                                        className="p-1 rounded bg-red-500/80 hover:bg-red-650 text-white transition-colors cursor-pointer"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Delete Image</TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            )
                          })}

                          {/* Add Image Button */}
                          <label className="border-2 border-dashed border-border rounded-xl aspect-square flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-[#3f5ce6]/40 hover:text-[#3f5ce6] transition-all cursor-pointer">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleUploadFeedImage}
                              className="hidden"
                            />
                            <Upload size={16} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
                          </label>
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 leading-normal">
                          Add multiple images to showcase a scrollable card carousel on your profile. The first image is primary.
                        </p>
                      </div>
                    )}

                    {/* Media Upload Section for Video type */}
                    {feedForm.feed_type === 'video' && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Feed Video</label>
                        {feedVideo ? (
                          <div className="relative aspect-video rounded-xl border border-border overflow-hidden bg-muted group max-w-sm">
                            {feedVideo.type === 'existing' ? (
                              <video src={feedVideo.url} controls className="w-full h-full object-cover" />
                            ) : (
                              <video src={feedVideo.previewUrl} controls className="w-full h-full object-cover" />
                            )}
                            <div className="absolute top-2 right-2 z-10">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteFeedVideo(); }}
                                    className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-650 text-white transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Remove Video</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-border rounded-xl w-full h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-[#3f5ce6]/40 hover:text-[#3f5ce6] transition-all cursor-pointer bg-card/20">
                            <input
                              type="file"
                              accept="video/*"
                              onChange={handleUploadFeedVideo}
                              className="hidden"
                            />
                            <Upload size={20} />
                            <span className="text-xs font-semibold">Select Video File</span>
                          </label>
                        )}
                      </div>
                    )}

                    {/* Link Fields (Only for Link type) */}
                    {feedForm.feed_type === 'link' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Link URL</label>
                          <input
                            type="url"
                            value={feedForm.link_url}
                            onChange={e => setFeedForm(p => ({ ...p, link_url: e.target.value }))}
                            placeholder="https://example.com/page"
                            required={feedForm.feed_type === 'link'}
                            className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Link Title</label>
                          <input
                            type="text"
                            value={feedForm.link_title}
                            onChange={e => setFeedForm(p => ({ ...p, link_title: e.target.value }))}
                            placeholder="e.g. Read Our Blog"
                            className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                          />
                        </div>
                      </div>
                    )}

                    {/* Publish Switcher */}
                    <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-muted/10">
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Active Status</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Toggle to publish instantly or move to archive</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFeedForm(p => ({ ...p, is_published: !p.is_published }))}
                        className={`w-10 h-6 rounded-full p-1 transition-all duration-200 cursor-pointer ${feedForm.is_published ? 'bg-[#3f5ce6] flex justify-end' : 'bg-zinc-300 dark:bg-zinc-700 flex justify-start'}`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row sm:space-x-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setFeedSheetOpen(false)}
                      className="flex-grow py-2 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/40 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={feedSaving || uploadingFeedMedia}
                      className="flex-grow py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold shadow-lg shadow-[#3f5ce6]/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {feedSaving || uploadingFeedMedia ? (
                        <>
                          <Loader2 size={13} className="animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save size={13} /> {feedFormMode === 'add' ? 'Create Post' : 'Save Changes'}
                        </>
                      )}
                    </button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: PRODUCTS [PRO]                                      */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'products' && !isAllCards && (
              <div className="space-y-6 animate-fadeIn text-left">
                {!(profile?.plan === 'pro' || profile?.plan === 'business') ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Lock size={28} className="text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Products — Pro Feature</h3>
                      <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
                        Showcase products and services on your card page, track clicks, and export product analytics. Upgrade to Pro to unlock.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Sparkles size={14} /> Upgrade to Pro
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <div className="hidden sm:block">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Product & Services Catalogue</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Active Profile: <span className="font-semibold text-foreground">{activeProfile?.profile_name}</span> · Showcase and manage {profileProducts.length} active product{profileProducts.length !== 1 ? 's' : ''} or service offering{profileProducts.length !== 1 ? 's' : ''} directly on your profile card.</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleExportProductsCSV} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer">
                          <FileDown size={13} /> Export CSV
                        </button>
                        <button onClick={openAddProduct} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold transition-all shadow-md cursor-pointer">
                          <Plus size={13} /> Add Product
                        </button>
                      </div>
                    </div>

                    {profileProductsLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                        <Loader2 size={24} className="animate-spin text-[#3f5ce6]" />
                        <p className="text-xs text-muted-foreground">Loading products...</p>
                      </div>
                    ) : profileProducts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-card border border-border border-dashed rounded-3xl p-6">
                        <div className="w-12 h-12 rounded-xl bg-[#3f5ce6]/8 flex items-center justify-center text-[#3f5ce6]">
                          <Package size={22} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">No Products Showcased</h4>
                          <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                            Add products or services to showcase them on your card profile. You can also link lead forms for enquiries.
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                          <button
                            onClick={openAddProduct}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                          >
                            <Plus size={13} /> Add Showcase Product
                          </button>
                          {(() => {
                            const otherProducts = allAccountProducts.filter(p => p.profile_id !== activeProfile?.id);
                            return otherProducts.length > 0 && (
                              <button
                                onClick={openDuplicateFromOthersDialog}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-bold transition-all shadow-sm cursor-pointer bg-card"
                              >
                                <Layers size={13} /> Duplicate from Another Profile
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      /* Product grid */
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {profileProducts.map((p: any) => {
                          const hasImages = p.image_urls && Array.isArray(p.image_urls) && p.image_urls.length > 0
                          const linkedForm = p.enquiry_form_id ? leadForms.find(f => f.id === p.enquiry_form_id) : null
                          return (
                            <div
                              key={p.id}
                              onClick={() => openViewProduct(p)}
                              className={`group bg-card border rounded-2xl overflow-hidden transition-all hover:shadow-lg flex flex-col justify-between cursor-pointer ${p.is_active ? 'border-border hover:border-[#3f5ce6]/30' : 'border-border/60 bg-muted/10 opacity-70'}`}
                            >
                              <div>
                                {hasImages ? (
                                  <div className="h-40 relative overflow-hidden bg-muted border-b border-border">
                                    <ProductCardCarousel imageUrls={p.image_urls} alt={p.name} />
                                    {!p.is_active && (
                                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-zinc-950/80 text-zinc-300 backdrop-blur-sm z-10">
                                        Inactive
                                      </span>
                                    )}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); openDuplicateProductDialog(p); }}
                                          className={`absolute p-1.5 rounded-lg bg-background/80 hover:bg-background dark:bg-zinc-900/80 dark:hover:bg-zinc-800 border border-border/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm backdrop-blur-sm z-20 ${!p.is_active ? 'top-2.5 left-2.5' : 'top-2.5 right-2.5'}`}
                                        >
                                          <CopyPlus size={12} />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Duplicate to another profile</TooltipContent>
                                    </Tooltip>
                                  </div>
                                ) : (
                                  <div className="h-40 bg-gradient-to-br from-[#3f5ce6]/8 to-indigo-650/4 flex items-center justify-center border-b border-border relative">
                                    <Package size={36} className="text-[#3f5ce6]/30" />
                                    {!p.is_active && (
                                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-zinc-950/80 text-zinc-300 backdrop-blur-sm z-10">
                                        Inactive
                                      </span>
                                    )}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); openDuplicateProductDialog(p); }}
                                          className={`absolute p-1.5 rounded-lg bg-background/80 hover:bg-background dark:bg-zinc-900/80 dark:hover:bg-zinc-800 border border-border/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm backdrop-blur-sm z-20 ${!p.is_active ? 'top-2.5 left-2.5' : 'top-2.5 right-2.5'}`}
                                        >
                                          <CopyPlus size={12} />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Duplicate to another profile</TooltipContent>
                                    </Tooltip>
                                  </div>
                                )}
                                <div className="p-4 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-sm font-bold text-foreground leading-tight">{p.name}</h4>
                                    <span className="text-xs font-black text-[#3f5ce6] shrink-0">
                                      {p.price_inr ? `₹${(p.price_inr / 100).toLocaleString('en-IN')}` : 'Price on Request'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{p.description || 'No description provided.'}</p>
                                  
                                  {/* Info badges */}
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {p.net_quantity !== undefined && (
                                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-muted text-muted-foreground rounded-md">
                                        Qty: {p.net_quantity}
                                      </span>
                                    )}
                                    {linkedForm && (
                                      <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 rounded-md flex items-center gap-1 max-w-[130px] truncate" title={linkedForm.form_name}>
                                        <FileText size={9} className="shrink-0" /> {linkedForm.form_name}
                                      </span>
                                    )}
                                    <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-muted text-muted-foreground border border-border/10 rounded-md flex items-center gap-1 shrink-0" title="Views">
                                      <Eye size={10} className="shrink-0 text-muted-foreground" /> {p.view_count || 0}
                                    </span>
                                  </div>

                                  {/* Ratings row */}
                                  <div className="flex items-center gap-1.5 pt-1">
                                    {renderStars(p.rating)}
                                    {(() => {
                                      const reviewsForThisProduct = productReviews.filter(r => r.product_id === p.id);
                                      const reviewsCount = reviewsForThisProduct.length;
                                      return p.rating !== null && p.rating !== undefined ? (
                                        <span className="text-[10px] font-black text-amber-500 dark:text-amber-400">
                                          {parseFloat(p.rating).toFixed(1)} / 5.0 ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-semibold text-muted-foreground">
                                          No ratings yet
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        
                        {/* Add placeholder button */}
                        <button
                          onClick={openAddProduct}
                          className="border-2 border-dashed border-border rounded-2xl min-h-[220px] flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-[#3f5ce6]/40 hover:text-[#3f5ce6] bg-card/45 hover:bg-card/90 transition-all cursor-pointer w-full"
                        >
                          <Plus size={24} />
                          <span className="text-xs font-semibold">Add Showcase Product</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: FEEDS [PRO]                                         */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'feeds' && !isAllCards && (
              <div className="space-y-6 animate-fadeIn text-left">
                {!(profile?.plan === 'pro' || profile?.plan === 'business') ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Lock size={28} className="text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Feeds — Pro Feature</h3>
                      <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
                        Post images, videos, text, and links to your card page feed. Keep your audience engaged with fresh content. Upgrade to Pro to unlock.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Sparkles size={14} /> Upgrade to Pro
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center flex-wrap gap-3">
                      <div className="hidden sm:block">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                          {isReorderingFeeds ? 'Arrange Feed Deck' : 'Activity & Updates Feed'}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isReorderingFeeds 
                            ? 'Drag cards to rearrange the visual order on your profile.' 
                            : <>Active Profile: <span className="font-semibold text-foreground">{activeProfile?.profile_name}</span> · Publish and organize {profileFeeds.length} update{profileFeeds.length !== 1 ? 's' : ''} (text, links, images, or videos) to engage with visitors.</>
                          }
                        </p>
                      </div>
                      {isReorderingFeeds ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            <span className="italic font-medium">Changes synced live</span>
                          </div>
                          <button
                            onClick={() => setIsReorderingFeeds(false)}
                            className="px-5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-900 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        profileFeeds.length > 0 && (
                          <div className="flex items-center gap-2">
                            {profileFeeds.length > 1 && (
                              <button
                                onClick={() => setIsReorderingFeeds(true)}
                                className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                              >
                                <GripVertical size={14} className="text-muted-foreground" />
                                <span>Reorder</span>
                              </button>
                            )}
                            <button
                              onClick={() => openAddFeed('text')}
                              className="px-4 py-2.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                            >
                              <Plus size={14} />
                              <span>New Post</span>
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    {profileFeedsLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 bg-card/10 border border-border/80 rounded-2xl">
                        <Loader2 className="animate-spin text-muted-foreground" size={24} />
                        <p className="text-xs text-muted-foreground mt-2">Loading feed posts...</p>
                      </div>
                    ) : profileFeeds.length === 0 ? (
                      <div className="border border-dashed border-border rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-6 bg-muted/5 w-full">
                        <div className="w-14 h-14 rounded-2xl bg-[#3f5ce6]/5 dark:bg-[#3f5ce6]/10 flex items-center justify-center text-[#3f5ce6] border border-[#3f5ce6]/10 shadow-xs animate-pulse">
                          <Activity size={26} />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-bold text-foreground">No posts yet</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                            Share updates, media, and links to keep your NFC profile page fresh and engaging.
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Create First Post</span>
                          <div className="flex flex-wrap gap-2.5 justify-center">
                            {[
                              { type: 'text', label: 'Text Post', icon: PenLine },
                              { type: 'image', label: 'Image Post', icon: ImageIcon },
                              { type: 'video', label: 'Video Post', icon: Video },
                              { type: 'link', label: 'Link Post', icon: Link2 }
                            ].map((item) => {
                              const IconComponent = item.icon;
                              return (
                                <button
                                  key={item.type}
                                  onClick={() => openAddFeed(item.type as any)}
                                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer shadow-sm hover:border-[#3f5ce6]/30 active:scale-98"
                                >
                                  <IconComponent size={14} className="text-muted-foreground" />
                                  <span>{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          {(() => {
                            const otherFeeds = allAccountFeeds.filter(f => f.profile_id !== activeProfile?.id);
                            return otherFeeds.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/60 w-full max-w-xs flex justify-center">
                                <button
                                  onClick={openDuplicateFeedFromOthersDialog}
                                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all shadow-sm cursor-pointer w-full justify-center hover:border-[#3f5ce6]/30 active:scale-98"
                                >
                                  <Layers size={13} /> Duplicate from Another Profile
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (() => {

                      const archivedFeedsCount = profileFeeds.filter(feed => !feed.is_published).length;
                      const activeFeedsCount = profileFeeds.filter(feed => feed.is_published).length;
                      const filteredFeeds = profileFeeds.filter(feed => 
                        feedsFilterTab === 'active' ? feed.is_published : !feed.is_published
                      );

                      return (
                        <>
                          {/* Feeds Sub-tabs: Active vs Archived */}
                          <div className="flex border-b border-border/60 pb-px gap-6 mt-2 mb-6">
                            <button
                              onClick={() => setFeedsFilterTab('active')}
                              className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${feedsFilterTab === 'active' ? 'text-[#3f5ce6]' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              <span>Active Feeds</span>
                              {activeFeedsCount > 0 && (
                                <span className={`px-1.5 py-px rounded-full text-[10px] font-semibold ${feedsFilterTab === 'active' ? 'bg-[#3f5ce6]/10 text-[#3f5ce6]' : 'bg-muted text-muted-foreground'}`}>
                                  {activeFeedsCount}
                                </span>
                              )}
                              {feedsFilterTab === 'active' && (
                                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#3f5ce6] rounded-full" />
                              )}
                            </button>
                            <button
                              onClick={() => setFeedsFilterTab('archived')}
                              className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${feedsFilterTab === 'archived' ? 'text-zinc-500' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              <span>Archive</span>
                              {archivedFeedsCount > 0 && (
                                <span className={`px-1.5 py-px rounded-full text-[10px] font-semibold ${feedsFilterTab === 'archived' ? 'bg-zinc-500/10 text-zinc-500' : 'bg-muted text-muted-foreground'}`}>
                                  {archivedFeedsCount}
                                </span>
                              )}
                              {feedsFilterTab === 'archived' && (
                                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-zinc-500 rounded-full" />
                              )}
                            </button>
                          </div>

                          {filteredFeeds.length === 0 ? (
                            <div className="border border-dashed border-border/80 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-4 bg-muted/5 w-full">
                              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground border border-border/50">
                                <Archive size={20} />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-foreground">
                                  {feedsFilterTab === 'active' ? 'No active feed posts' : 'Archive is empty'}
                                </h4>
                                <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
                                  {feedsFilterTab === 'active'
                                    ? 'Create a new post or restore posts from the Archive.'
                                    : 'Inactive or archived posts will be listed here.'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            /* Feed grid */
                            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
                              {filteredFeeds.map((feed) => {
                          const hasMedia = ['image', 'video'].includes(feed.feed_type) && feed.media_url;
                          const formattedTime = new Date(feed.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' });
                          return (
                            <div 
                              key={feed.id}
                              draggable={isReorderingFeeds}
                              onDragStart={(e) => handleDragStart(e, feed.id)}
                              onDragOver={(e) => handleDragOver(e, feed.id)}
                              onDragEnd={handleDragEnd}
                              onDrop={(e) => handleDrop(e, feed.id)}
                              className={`break-inside-avoid bg-card border rounded-2xl overflow-hidden flex flex-col justify-between relative select-none transition-all duration-200 ${
                                isReorderingFeeds 
                                  ? `cursor-grab active:cursor-grabbing border-dashed ${
                                      draggedFeedId === feed.id 
                                        ? 'opacity-30 border-[#3f5ce6] scale-98 bg-[#3f5ce6]/5' 
                                        : dragOverFeedId === feed.id 
                                          ? 'border-[#3f5ce6] border-2 scale-97 bg-[#3f5ce6]/5 opacity-60' 
                                          : 'border-[#3f5ce6]/45 hover:border-[#3f5ce6] dark:border-[#3f5ce6]/45 hover:scale-[1.015] hover:shadow-lg'
                                    }`
                                  : 'border-border hover:border-[#3f5ce6]/30 group'
                              }`}
                            >
                              {isReorderingFeeds && (
                                <div className="absolute top-3 right-3 bg-[#3f5ce6] text-white border border-white/20 px-2 py-1 rounded-xl flex items-center gap-1.5 shadow-lg z-30 select-none pointer-events-none">
                                  <GripVertical size={11} className="text-white/80" />
                                  <span className="text-[9px] font-mono font-black">
                                    {String(profileFeeds.indexOf(feed) + 1).padStart(2, '0')}
                                  </span>
                                </div>
                              )}
                              {!isReorderingFeeds && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openDuplicateFeedDialog(feed); }}
                                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-background/80 hover:bg-background dark:bg-zinc-900/80 dark:hover:bg-zinc-800 border border-border/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm backdrop-blur-sm z-30 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    >
                                      <CopyPlus size={12} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="text-[10px] py-1 px-2">Duplicate to another profile</TooltipContent>
                                </Tooltip>
                              )}
                              <div className={isReorderingFeeds ? "pointer-events-none select-none" : ""}>
                                <div>
                                {feed.feed_type === 'image' && (feed.media_urls?.length || feed.media_url) && (() => {
                                  const urls = feed.media_urls && feed.media_urls.length > 0 ? feed.media_urls : [feed.media_url];
                                  return (
                                    <div className="relative overflow-hidden bg-muted border-b border-border">
                                      {urls.length === 1 ? (
                                        <img
                                          src={urls[0]}
                                          alt="Feed media"
                                          onLoad={(e) => {
                                            const { naturalWidth, naturalHeight } = e.currentTarget;
                                            setImageDimensions(prev => ({
                                              ...prev,
                                              [feed.id]: { width: naturalWidth, height: naturalHeight }
                                            }));
                                          }}
                                          className="w-full h-auto block object-contain transition-transform group-hover:scale-102 duration-300"
                                        />
                                      ) : (
                                        <div
                                          className="w-full relative overflow-hidden bg-muted"
                                          style={{
                                            aspectRatio: imageDimensions[feed.id]
                                              ? `${imageDimensions[feed.id].width} / ${imageDimensions[feed.id].height}`
                                              : '16/9'
                                          }}
                                        >
                                          <img
                                            src={urls[0]}
                                            alt="invisible loader"
                                            className="hidden"
                                            onLoad={(e) => {
                                              const { naturalWidth, naturalHeight } = e.currentTarget;
                                              setImageDimensions(prev => ({
                                                ...prev,
                                                [feed.id]: { width: naturalWidth, height: naturalHeight }
                                              }));
                                            }}
                                          />
                                          <ProductCardCarousel
                                            imageUrls={urls}
                                            alt="Feed media"
                                            objectFit="contain"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                                {feed.feed_type === 'video' && feed.media_url && (
                                  <div className="relative overflow-hidden bg-muted border-b border-border">
                                    <video
                                      src={feed.media_url}
                                      autoPlay
                                      muted
                                      playsInline
                                      controls
                                      onLoadedMetadata={(e) => {
                                        const { videoWidth, videoHeight } = e.currentTarget;
                                        setImageDimensions(prev => ({
                                          ...prev,
                                          [feed.id]: { width: videoWidth, height: videoHeight }
                                        }));
                                      }}
                                      className="w-full h-auto block"
                                    />
                                  </div>
                                )}
                                <div className="p-4 space-y-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded">
                                        {feed.feed_type}
                                      </span>
                                      {!feed.is_published && (
                                        <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-500/10 px-1.5 py-0.5 rounded border border-zinc-500/20 flex items-center gap-1">
                                          <Archive size={8} />
                                          <span>Archived</span>
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-muted-foreground/70">{formattedTime}</span>
                                  </div>

                                  {feed.caption && (
                                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap text-left">
                                      {feed.caption}
                                    </p>
                                  )}

                                  {feed.feed_type === 'link' && feed.link_url && (
                                    <div className="p-2.5 rounded-xl border border-border/80 bg-muted/10 flex items-start gap-2.5 text-left group/link">
                                      <Link2 size={13} className="text-[#3f5ce6] shrink-0 mt-0.5" />
                                      <div className="min-w-0 flex-grow">
                                        {feed.link_title && (
                                          <p className="text-xs font-bold text-foreground truncate group-hover/link:text-[#3f5ce6] transition-colors">
                                            {feed.link_title}
                                          </p>
                                        )}
                                        <a 
                                          href={feed.link_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-[10px] text-muted-foreground font-mono truncate block hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {feed.link_url}
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Reactions & Actions Footer */}
                            {!isReorderingFeeds && (
                                <div className="p-4 pt-0 border-t border-border/20 mt-2 space-y-3">
                                  {/* Reactions Bar */}
                                  <div className="flex flex-wrap gap-1.5 pt-3">
                                    {[
                                      { type: 'like', emoji: '👍' },
                                      { type: 'love', emoji: '❤️' },
                                      { type: 'fire', emoji: '🔥' },
                                      { type: 'clap', emoji: '🎉' }
                                    ].map((react) => {
                                      const reactionsObj = feed.reactions || {};
                                      const count = reactionsObj[react.type] || 0;
                                      return (
                                        <button
                                          key={react.type}
                                          onClick={(e) => { e.stopPropagation(); handleIncrementReaction(feed.id, react.type); }}
                                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all hover:bg-[#3f5ce6]/5 hover:border-[#3f5ce6]/20 cursor-pointer ${count > 0 ? 'bg-[#3f5ce6]/5 border-[#3f5ce6]/25 text-[#3f5ce6]' : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'}`}
                                        >
                                          <span className="text-[11px] leading-none">{react.emoji}</span>
                                          <span>{count}</span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Edit & Delete Controls */}
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openEditFeed(feed); }}
                                      className="flex-grow py-1 rounded-lg border border-border hover:bg-muted text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-98"
                                    >
                                      <SquarePen size={11} /> Edit
                                    </button>
                                    {feedPendingDelete === feed.id ? (
                                      <div className="flex items-center gap-1 bg-red-500/5 border border-red-500/25 p-0.5 rounded-lg">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); confirmDeleteFeed(feed.id); }}
                                          disabled={feedDeleting === feed.id}
                                          className="py-1 px-2 rounded bg-red-500 hover:bg-red-650 text-white text-[9px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                        >
                                          {feedDeleting === feed.id ? 'Deleting...' : 'Confirm'}
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setFeedPendingDelete(null); }}
                                          className="py-1 px-2 rounded bg-muted hover:bg-muted/80 text-muted-foreground text-[9px] font-bold cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setFeedPendingDelete(feed.id); }}
                                        className="py-1 px-2.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-650 transition-all cursor-pointer flex items-center justify-center active:scale-98"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}


                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: ANALYTICS                                           */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-fadeIn text-left">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div className="hidden sm:block">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      Analytics 
                      {analyticsData && (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                          analyticsData.isSimulated 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${analyticsData.isSimulated ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-ping'}`} />
                          {analyticsData.isSimulated ? 'Demo Data' : 'Live Data'}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isAllCards
                        ? 'Aggregated activity data across all smart cards'
                        : `Card: ${activeCard?.slug}${activeProfile ? ` · Profile: ${activeProfile.profile_name}` : ''}`}
                    </p>
                  </div>
                  {/* Date range */}
                  <div className="flex gap-1">
                    {(['7d', '30d', '90d'] as const).map((r) => (
                      <button 
                        key={r} 
                        onClick={() => setAnalyticsRange(r)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          analyticsRange === r 
                            ? 'bg-[#3f5ce6] text-white shadow-sm' 
                            : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {analyticsLoading && !analyticsData ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3f5ce6]" />
                    <p className="text-xs text-muted-foreground font-semibold">Loading real-time analytics...</p>
                  </div>
                ) : !analyticsData ? (
                  <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border space-y-4 max-w-lg mx-auto p-6">
                    <div className="w-12 h-12 rounded-full bg-[#3f5ce6]/10 text-[#3f5ce6] flex items-center justify-center mx-auto">
                      <BarChart3 size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">No Analytics Loaded</h4>
                      <p className="text-xs text-muted-foreground">
                        Failed to fetch analytics metrics or setup timeline. Please refresh the dashboard.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Taps', value: analyticsData.summary.totalTaps, trend: '+12%', color: '#3f5ce6', desc: 'NFC card tap scans' },
                        { label: 'Unique Visitors', value: analyticsData.summary.uniqueVisitors, trend: '+8%', color: '#10b981', desc: 'Distinct IP addresses' },
                        { label: 'Link Clicks', value: analyticsData.summary.linkClicks, trend: '+19%', color: '#f59e0b', desc: 'Social profile redirects' },
                        { label: 'Leads Captured', value: analyticsData.summary.leadsCaptured, trend: '+5%', color: '#8b5cf6', desc: 'Lead form entries' },
                      ].map((s) => (
                        <div key={s.label} className="bg-card border border-border rounded-xl p-5 space-y-2 flex flex-col justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                            <span className="text-2xl font-black text-foreground block mt-1 leading-none">{s.value}</span>
                          </div>
                          
                          <div className="space-y-2 pt-2">
                            <div className="flex items-end justify-between">
                              <span className="text-[9px] text-muted-foreground">{s.desc}</span>
                              <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 rounded px-1.5 py-0.5">{s.trend}</span>
                            </div>
                            <div className="flex items-end gap-0.5 h-6">
                              {[35, 60, 45, 80, 55, 90, 70].map((h, i) => (
                                <div key={i} className="flex-1 rounded-sm opacity-70" style={{ height: `${h}%`, backgroundColor: s.color }} />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tap timeline chart */}
                    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Tap Timeline — Last {analyticsRange === '7d' ? '7' : analyticsRange === '90d' ? '90' : '30'} Days
                        </h4>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Hover bars to view details
                        </span>
                      </div>
                      <div className="h-40 flex items-end gap-1 sm:gap-1.5 border-b border-border pb-2 relative">
                        {analyticsData.timeline.map((day: any, i: number) => {
                          const maxTaps = Math.max(...analyticsData.timeline.map((d: any) => d.taps), 1)
                          const hPct = Math.max(5, Math.min(100, (day.taps / maxTaps) * 100))
                          const isLast = i === analyticsData.timeline.length - 1
                          return (
                            <div key={i} className="flex-1 group relative cursor-pointer h-full flex flex-col justify-end">
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-popover border border-border rounded-lg shadow-xl p-2.5 text-[10px] font-semibold text-popover-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-20 whitespace-nowrap min-w-[120px]">
                                <p className="border-b border-border pb-1 mb-1 font-bold text-foreground">{day.date}</p>
                                <div className="flex justify-between gap-4 mt-0.5">
                                  <span className="text-muted-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#3f5ce6]" /> Taps:</span>
                                  <span className="font-extrabold text-foreground">{day.taps}</span>
                                </div>
                                <div className="flex justify-between gap-4 mt-0.5">
                                  <span className="text-muted-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" /> Clicks:</span>
                                  <span className="font-extrabold text-foreground">{day.clicks}</span>
                                </div>
                                <div className="flex justify-between gap-4 mt-0.5">
                                  <span className="text-muted-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" /> Leads:</span>
                                  <span className="font-extrabold text-foreground">{day.leads}</span>
                                </div>
                              </div>
                              {/* Bar */}
                              <div
                                className={`w-full rounded-t transition-all group-hover:opacity-100 group-hover:scale-y-105 duration-150 ${isLast ? 'opacity-100' : 'opacity-65'}`}
                                style={{ height: `${hPct}%`, backgroundColor: '#3f5ce6' }}
                              />
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground font-bold uppercase">
                        <span>{analyticsData.timeline[0]?.date}</span>
                        <span>{analyticsData.timeline[Math.floor(analyticsData.timeline.length / 2)]?.date}</span>
                        <span>{analyticsData.timeline[analyticsData.timeline.length - 1]?.date}</span>
                      </div>
                    </div>

                    {/* Device + OS + Browser breakdown row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Device breakdown */}
                      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Device Breakdown</h4>
                        <div className="space-y-4">
                          {analyticsData.devices.map((d: any) => (
                            <div key={d.label} className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                  {d.label}
                                </span>
                                <span className="font-bold text-muted-foreground text-[10px]">{d.count} taps · <span style={{ color: d.color }}>{d.pct}%</span></span>
                              </div>
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* OS breakdown */}
                      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">OS & Platform</h4>
                          {!(profile?.plan === 'pro' || profile?.plan === 'business') && (
                            <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 rounded px-1.5 py-0.5 border border-amber-500/20 flex items-center gap-1">
                              <Lock size={9} /> PRO
                            </span>
                          )}
                        </div>
                        <div className={`space-y-4 ${!(profile?.plan === 'pro' || profile?.plan === 'business') ? 'opacity-30 pointer-events-none select-none' : ''}`}>
                          {analyticsData.os.map((d: any) => (
                            <div key={d.label} className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                  {d.label}
                                </span>
                                <span className="font-bold text-muted-foreground text-[10px]">{d.count} taps · <span style={{ color: d.color }}>{d.pct}%</span></span>
                              </div>
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Browser breakdown */}
                      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Web Browsers</h4>
                        <div className="space-y-4">
                          {analyticsData.browsers.map((d: any) => (
                            <div key={d.label} className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                  {d.label}
                                </span>
                                <span className="font-bold text-muted-foreground text-[10px]">{d.count} taps · <span style={{ color: d.color }}>{d.pct}%</span></span>
                              </div>
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Geo Location Breakdown & Top Links Clicked Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Geographic locations */}
                      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Geographic Tap Performance</h4>
                        <div className="space-y-3">
                          {analyticsData.locations.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-6 text-center">No location tap data logged yet.</p>
                          ) : (
                            analyticsData.locations.map((loc: any, i: number) => (
                              <div key={i} className="flex items-center justify-between text-xs border-b border-border/40 pb-2 last:border-0 last:pb-0">
                                <div>
                                  <span className="font-bold text-foreground">{loc.city}</span>
                                  <span className="text-[10px] text-muted-foreground ml-1.5">{loc.country}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-muted-foreground">{loc.count} taps</span>
                                  <span className="font-black text-[#3f5ce6] w-8 text-right">{loc.pct}%</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Top Links Clicked */}
                      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Top Links Clicked</h4>
                        <div className="space-y-3">
                          {analyticsData.topLinks.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-6 text-center">No link clicks logged yet.</p>
                          ) : (
                            analyticsData.topLinks.map((l: any, i: number) => (
                              <div key={i} className="flex items-center gap-4">
                                <span className="text-xs font-bold text-foreground w-28 shrink-0 truncate">{l.label}</span>
                                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full rounded-full bg-[#3f5ce6]" style={{ width: `${l.pct}%` }} />
                                </div>
                                <span className="text-xs font-black text-[#3f5ce6] w-12 text-right shrink-0">{l.clicks} clicks</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Catalog Products Performance */}
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Product Catalog Engagement (CTR)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border/80 text-muted-foreground font-bold text-[10px] uppercase">
                              <th className="pb-3 w-1/2">Product Offering</th>
                              <th className="pb-3 text-center">Views</th>
                              <th className="pb-3 text-center">Clicks</th>
                              <th className="pb-3 text-right">Click-Through Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {analyticsData.topProducts.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-6 text-center text-muted-foreground">No catalog product performance logged yet.</td>
                              </tr>
                            ) : (
                              analyticsData.topProducts.map((p: any, i: number) => (
                                <tr key={i} className="hover:bg-muted/10">
                                  <td className="py-3 font-bold text-foreground">{p.name}</td>
                                  <td className="py-3 text-center text-muted-foreground font-semibold">{p.views}</td>
                                  <td className="py-3 text-center text-muted-foreground font-semibold">{p.clicks}</td>
                                  <td className="py-3 text-right">
                                    <div className="inline-flex items-center gap-1.5 font-black text-foreground">
                                      <span className={`w-1.5 h-1.5 rounded-full ${p.ctr > 20 ? 'bg-emerald-500' : p.ctr > 10 ? 'bg-blue-500' : 'bg-amber-500'}`} />
                                      {p.ctr}%
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: SETTINGS                                            */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl space-y-6 animate-fadeIn text-left">
                {/* Account */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Account Settings</h3>
                  <form onSubmit={handleSaveAccount} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Registered Email</label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground focus:outline-none cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                      <input
                        type="text"
                        required
                        value={accountForm.fullName}
                        onChange={(e) => setAccountForm({ fullName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6]/20 focus:outline-none placeholder-muted-foreground/60 transition-colors"
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingAccount}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
                      >
                        {savingAccount ? <><div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white" /> Saving...</> : <><Save size={13} /> Save Changes</>}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Plan */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Plan & Billing</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground capitalize">{profile?.plan || 'Free'} Plan</p>
                      {profile?.plan_expires_at && (
                        <p className="text-xs text-muted-foreground mt-0.5">Expires: {new Date(profile.plan_expires_at).toLocaleDateString()}</p>
                      )}
                    </div>
                    <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-[#3f5ce6]/10 text-[#3f5ce6] border-[#3f5ce6]/20">
                      {profile?.plan || 'free'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      { label: 'Profiles / Card', value: (profile?.plan === 'pro' || profile?.plan === 'business') ? '5' : '1' },
                      { label: 'Social Links', value: (profile?.plan === 'pro' || profile?.plan === 'business') ? 'Unlimited' : '5' },
                      { label: 'Payment Links', value: (profile?.plan === 'pro' || profile?.plan === 'business') ? 'Unlimited' : '3' },
                      { label: 'Leads / Products / Feeds', value: (profile?.plan === 'pro' || profile?.plan === 'business') ? '✓ Included' : '✗ Pro only' },
                    ].map((f) => (
                      <div key={f.label} className="flex justify-between items-center py-2 border-b border-border last:border-0 col-span-2">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className={`font-bold ${f.value.startsWith('✗') ? 'text-red-400' : 'text-foreground'}`}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                  {!(profile?.plan === 'pro' || profile?.plan === 'business') && (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Sparkles size={13} /> Upgrade to Pro — Unlock Everything
                    </button>
                  )}
                </div>

                {/* Card nickname */}
                {!isAllCards && (
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Card Nickname</h3>
                    <p className="text-xs text-muted-foreground">Give your card a friendly name to identify it in your dashboard.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue={activeCard?.card_nickname || ''}
                        placeholder={`Card ${activeCard?.slug}`}
                        className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                      />
                      <button className="px-4 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold transition-all">
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Danger zone */}
                <div className="bg-card border border-red-500/20 rounded-xl p-6 space-y-3">
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground">These actions are irreversible. Proceed with caution.</p>
                  <div className="flex gap-3">
                    <Link href="/orders" className="text-xs text-[#3f5ce6] hover:underline font-bold inline-flex items-center gap-1">
                      View Orders <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: ORDERS                                              */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'orders' && isAllCards && (
              <div className="space-y-6 animate-fadeIn text-left">
                {selectedOrderId === null ? (
                  // General List of Orders View
                  <>
                    <div className="hidden sm:block">
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Your Orders</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Select an order to view its status, download invoices, and track your smart cards.
                      </p>
                    </div>

                    {userOrders.length === 0 ? (
                      <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border space-y-4 max-w-lg mx-auto p-6">
                        <div className="w-12 h-12 rounded-full bg-[#3f5ce6]/10 text-[#3f5ce6] flex items-center justify-center mx-auto">
                          <Package size={22} />
                        </div>
                        <h3 className="text-base font-bold text-foreground">No orders found</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          You haven't purchased any custom smart cards yet. Explore our store to build your premium NFC card.
                        </p>
                        <Link
                          href="/shop"
                          className="inline-flex items-center gap-1 px-5 py-2.5 rounded-lg bg-[#3f5ce6] text-white text-xs font-semibold hover:bg-[#3050d8] shadow-md transition-all active:scale-98"
                        >
                          Browse NFC Cards <ArrowRight size={13} />
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userOrders.map((order) => {
                          const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                          const itemCount = order.order_items?.length || 0
                          const mainItem = order.order_items?.[0]

                          // Extract personalization from main item
                          const pers = mainItem?.personalisation || {}
                          const itemTitle = pers.title || pers.name || 'Your Name'
                          const itemTagline = pers.tagline || 'Short description'
                          const itemLogoUrl = pers.logoUrl || pers.logoImageUrl
                          const itemLogoPlacement = pers.logoPlacement || pers.logoplacement || 'top-left'
                          const itemLogoHeight = pers.logoHeight || 32

                          const itemTitleColor = pers.titleColor
                          const itemTitleFont = pers.titleFont || 'font-sans'

                          const itemTaglineColor = pers.taglineColor || pers.descColor || pers.tagColor || pers.tagcolor
                          const itemTaglineFont = pers.taglineFont || pers.descFont || 'font-sans'

                          const isSolid = pers.colorHex || !pers.backgroundUrl
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

                          // Compute status badge styling
                          let statusColor = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                          let statusText = order.status.replace(/_/g, ' ')
                          if (order.status === 'delivered') {
                            statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          } else if (order.status === 'dispatched') {
                            statusColor = "bg-sky-500/10 text-sky-400 border-sky-500/20"
                          } else if (order.status === 'in_production') {
                            statusColor = "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          } else if (order.status === 'pending_production') {
                            statusColor = "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          } else if (order.status === 'pending_payment') {
                            statusColor = "bg-red-500/10 text-red-400 border-red-500/20"
                          }

                          return (
                            <div
                              key={order.id}
                              onClick={() => setSelectedOrderId(order.id)}
                              className="p-5 rounded-2xl border bg-card border-border/50 hover:border-[#3f5ce6]/50 hover:shadow-[0_0_20px_rgba(63,92,230,0.08)] transition-all cursor-pointer relative text-left flex flex-col justify-between min-h-[320px] select-none"
                            >
                              {/* 1. Mini Card Preview */}
                              <div
                                className={`w-full aspect-[1.586/1] rounded-xl overflow-hidden shadow-md border relative flex flex-col justify-between p-3 select-none text-[8px] leading-tight mb-4 ${cardBorderColor}`}
                                style={cardBgStyle}
                              >
                                {/* Background image if custom */}
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
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.1)_0%,transparent_60%)] pointer-events-none" />

                                <div className="relative z-10 flex justify-between items-start w-full">
                                  <div className="flex items-start">
                                    {itemLogoUrl ? (
                                      (itemLogoPlacement === 'top-left') ? (
                                        <img
                                          src={itemLogoUrl}
                                          alt="Logo"
                                          className="object-contain"
                                          style={{ height: `${itemLogoHeight * 0.4}px`, width: 'auto' }}
                                        />
                                      ) : null
                                    ) : (
                                      <img
                                        src="/default-brand-logo.png"
                                        alt="Logo"
                                        className="object-contain -mt-1 -ml-1"
                                        style={{ height: '20px' }}
                                      />
                                    )}
                                  </div>
                                  <div className={isCardDark ? 'text-white/60' : 'text-zinc-800/60'}>
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                      <path d="M12 2a10 10 0 0 1 10 10" />
                                      <path d="M12 6a6 6 0 0 1 6 6" />
                                      <circle cx="12" cy="12" r="2" />
                                    </svg>
                                  </div>
                                </div>

                                {/* Center logo if centered */}
                                {itemLogoUrl && itemLogoPlacement === 'center' && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                    <img
                                      src={itemLogoUrl}
                                      alt="Logo"
                                      className="object-contain"
                                      style={{ height: `${itemLogoHeight * 0.4}px`, width: 'auto' }}
                                    />
                                  </div>
                                )}

                                <div className="relative z-10 w-full text-left max-w-[90%]">
                                  <h4
                                    style={itemTitleColor ? { color: itemTitleColor } : undefined}
                                    className={`${itemTitleFont} font-bold text-[9px] tracking-wide leading-tight truncate ${!itemTitleColor ? cardTextColor : ''}`}
                                  >
                                    {itemTitle}
                                  </h4>
                                  <p
                                    style={itemTaglineColor ? { color: itemTaglineColor } : undefined}
                                    className={`${itemTaglineFont} font-medium text-[6px] tracking-wide leading-normal mt-0.5 truncate ${!itemTaglineColor ? cardSubColor : ''}`}
                                  >
                                    {itemTagline}
                                  </p>
                                </div>
                              </div>

                              {/* 2. Order Metadata & Details */}
                              <div className="space-y-3 flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <span className="text-xs font-bold text-foreground group-hover:text-[#3f5ce6] transition-colors">{order.order_number}</span>
                                      <p className="text-[10px] text-muted-foreground mt-0.5">{dateStr}</p>
                                    </div>
                                    <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}>
                                      {statusText}
                                    </span>
                                  </div>

                                  <div className="space-y-1">
                                    {mainItem && (
                                      <p className="text-xs font-semibold text-foreground/80 truncate">
                                        {mainItem.product_name}
                                      </p>
                                    )}
                                    {itemCount > 1 && (
                                      <p className="text-[10px] text-muted-foreground font-medium">
                                        + {itemCount - 1} other item{itemCount - 1 > 1 ? 's' : ''}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex justify-between items-center border-t border-border/40 pt-3 mt-auto">
                                  <span className="text-sm font-extrabold text-foreground">
                                    {formatPrice(order.total_inr)}
                                  </span>
                                  <span className="text-[9px] font-bold text-[#3f5ce6] flex items-center gap-1 uppercase tracking-wider">
                                    Track Details <ArrowRight size={11} />
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  // Detailed Order Logistics & Stepper view
                  (() => {
                    const order = userOrders.find(o => o.id === selectedOrderId)
                    if (!order) {
                      return (
                        <div className="bg-card border border-border/50 rounded-2xl p-8 text-center text-muted-foreground h-64 flex flex-col justify-center items-center">
                          <Package size={30} className="mb-2 text-muted-foreground/40" />
                          <p className="text-xs font-medium">Order details not found.</p>
                          <button
                            onClick={() => setSelectedOrderId(null)}
                            className="mt-4 px-4 py-2 rounded-lg bg-[#3f5ce6] text-white text-xs font-semibold"
                          >
                            Back to Orders
                          </button>
                        </div>
                      )
                    }

                    const statusText = order.status.replace(/_/g, ' ')
                    let statusColor = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    if (order.status === 'delivered') {
                      statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    } else if (order.status === 'dispatched') {
                      statusColor = "bg-sky-500/10 text-sky-400 border-sky-500/20"
                    } else if (order.status === 'in_production') {
                      statusColor = "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    } else if (order.status === 'pending_production') {
                      statusColor = "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    } else if (order.status === 'pending_payment') {
                      statusColor = "bg-red-500/10 text-red-400 border-red-500/20"
                    }

                    const itemCount = order.order_items?.length || 0

                    let currentStepLevel = 1
                    if (order.status === 'delivered') {
                      currentStepLevel = 4
                    } else if (order.status === 'dispatched') {
                      currentStepLevel = 3
                    } else if (order.status === 'in_production') {
                      currentStepLevel = 2
                    } else if (['pending_production', 'pending_payment'].includes(order.status)) {
                      currentStepLevel = 1
                    }

                    const isDispatched = ['dispatched', 'delivered'].includes(order.status)

                    const trackingSteps = [
                      {
                        label: 'Order Placed',
                        desc: 'Payment verified & design queued',
                        date: order.paid_at || order.created_at,
                        icon: CreditCard
                      },
                      {
                        label: 'In Production',
                        desc: 'Laser engraving & programming',
                        date: ['in_production', 'dispatched', 'delivered'].includes(order.status) ? 'Started' : (order.status === 'pending_production' ? 'Queued' : ''),
                        icon: Activity
                      },
                      {
                        label: 'Dispatched',
                        desc: 'Handed to courier partner',
                        date: order.dispatched_at,
                        icon: Package
                      },
                      {
                        label: 'Delivered',
                        desc: 'Smart cards successfully delivered',
                        date: order.delivered_at,
                        icon: Check
                      },
                    ]

                    return (
                      <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">

                        {/* Header Section */}
                        <div className="flex justify-between items-center border-b border-border/50 pb-5">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setSelectedOrderId(null)}
                              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted/70 transition-all text-foreground cursor-pointer select-none active:scale-95"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                              Order Details
                            </h3>
                          </div>
                          {order.invoice_url && (
                            <a
                              href={order.invoice_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3f5ce6] text-white hover:bg-[#3050d8] text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-[#3f5ce6]/20 select-none active:scale-95"
                            >
                              <FileDown size={14} /> Download Invoice
                            </a>
                          )}
                        </div>

                        {/* Order Details Strip */}
                        <div className="bg-card border border-border/50 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-5 gap-6 text-left">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Order Number</span>
                            <span className="text-sm font-bold text-foreground mt-1.5 block">
                              <span className="select-none">#</span>{order.order_number}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Order Placed</span>
                            <span className="text-sm font-bold text-foreground mt-1.5 block">
                              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Order Delivered</span>
                            <span className="text-sm font-bold text-foreground mt-1.5 block">
                              {order.delivered_at
                                ? new Date(order.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : 'Pending'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">No of Items</span>
                            <span className="text-sm font-bold text-foreground mt-1.5 block">
                              {String(itemCount).padStart(2, '0')} {itemCount > 1 ? 'Items' : 'Item'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Status</span>
                            <div className="mt-1">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                                {statusText}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Courier Logistics Strip / Info Notice */}
                        {isDispatched ? (
                          <div className="bg-card border border-border/50 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left animate-fadeIn">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Courier Partner</span>
                              <span className="text-sm font-bold text-foreground mt-1.5 block">
                                {order.courier_name || 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Tracking Number</span>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="text-sm font-mono font-bold text-foreground select-all">
                                  {order.tracking_number ? (
                                    <>
                                      <span className="select-none font-mono">#</span>{order.tracking_number}
                                    </>
                                  ) : (
                                    'N/A'
                                  )}
                                </span>
                                {order.tracking_number && (
                                  <button
                                    onClick={() => handleCopyTracking(order.tracking_number)}
                                    className="p-1 rounded hover:bg-[#3f5ce6]/10 text-[#3f5ce6] hover:text-[#3050d8] transition-all cursor-pointer animate-scaleIn"
                                    title="Copy tracking number"
                                  >
                                    {copiedTracking ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Dispatched Date</span>
                              <span className="text-sm font-bold text-foreground mt-1.5 block">
                                {order.dispatched_at
                                  ? new Date(order.dispatched_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Tracking Link</span>
                              <div className="flex items-center gap-2 mt-1">
                                {order.tracking_url ? (
                                  <>
                                    <a
                                      href={order.tracking_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs font-bold text-[#3f5ce6] hover:underline"
                                    >
                                      Track Shipment <ExternalLink size={12} />
                                    </a>
                                    <button
                                      onClick={() => handleCopyLinkUrl(order.tracking_url)}
                                      className="p-1 rounded hover:bg-[#3f5ce6]/10 text-[#3f5ce6] hover:text-[#3050d8] transition-all cursor-pointer animate-scaleIn"
                                      title="Copy tracking link"
                                    >
                                      {copiedLink ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground font-semibold">N/A</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl border bg-[#3f5ce6]/10 border-[#3f5ce6]/20 text-[#3f5ce6] dark:text-[#3f5ce6]/90 text-xs font-semibold flex items-center gap-2 select-none animate-fadeIn">
                            <AlertCircle size={15} className="shrink-0 text-[#3f5ce6]" />
                            <span>Tracking and courier details will be updated once the product is dispatched.</span>
                          </div>
                        )}

                        {/* Order Tracking Progress Timeline */}
                        <div className="space-y-4">
                          <div className="flex items-center px-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Tracking</span>
                          </div>

                          <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
                            <div className="relative flex justify-between items-start max-w-3xl mx-auto">
                              {/* Background Line */}
                              <div className="absolute top-5 left-[12%] right-[12%] h-[2px] bg-border/40 pointer-events-none" />
                              {/* Active Progress Line */}
                              <div
                                className="absolute top-5 left-[12%] h-[2px] bg-[#3f5ce6] transition-all duration-500 pointer-events-none"
                                style={{ width: `${((currentStepLevel - 1) / 3) * 76}%` }}
                              />

                              {trackingSteps.map((step, idx) => {
                                const stepNum = idx + 1
                                const isCompleted = stepNum < currentStepLevel
                                const isActive = stepNum === currentStepLevel

                                let circleStyle = ""
                                if (isCompleted) {
                                  circleStyle = "bg-[#3f5ce6] border-[#3f5ce6] text-white shadow-[0_0_12px_rgba(63,92,230,0.2)]"
                                } else if (isActive) {
                                  circleStyle = "bg-card border-[#3f5ce6] text-[#3f5ce6] ring-4 ring-[#3f5ce6]/10 font-bold"
                                } else {
                                  circleStyle = "bg-card border-border text-muted-foreground"
                                }

                                return (
                                  <div key={idx} className="flex flex-col items-center text-center relative z-10 w-[22%]">
                                    {/* Step Circle */}
                                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all duration-300 ${circleStyle}`}>
                                      {(() => {
                                        const IconComponent = step.icon
                                        return <IconComponent className="w-5 h-5" />
                                      })()}
                                    </div>

                                    {/* Step Info */}
                                    <span className={`text-xs font-bold mt-3 block ${isActive ? 'text-[#3f5ce6]' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                      {step.label}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground leading-normal mt-0.5 max-w-[120px] hidden sm:block">
                                      {step.desc}
                                    </span>
                                    {step.date && (
                                      <span className="text-[9px] font-mono text-muted-foreground mt-1 block">
                                        {typeof step.date === 'string' && step.date !== 'Queued' && step.date !== 'Started'
                                          ? new Date(step.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                          : step.date}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Items from the order */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground text-left">Items from the order</h4>
                          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                            {/* Table Header (hidden on mobile) */}
                            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/20 border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-left">
                              <div className="col-span-5">Product</div>
                              <div className="col-span-3">Material</div>
                              <div className="col-span-2 text-center">Quantity</div>
                              <div className="col-span-2 text-right">Price</div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-border/40">
                              {order.order_items?.map((item: any) => {
                                const pers = item.personalisation || {}
                                const itemTitle = pers.title || pers.name || 'Your Name'
                                const itemTagline = pers.tagline || 'Short description'
                                const itemLogoUrl = pers.logoUrl || pers.logoImageUrl
                                const itemLogoPlacement = pers.logoPlacement || 'top-left'
                                const itemLogoHeight = pers.logoHeight || 32

                                const itemTitleColor = pers.titleColor
                                const itemTitleFont = pers.titleFont || 'font-sans'
                                const itemTaglineColor = pers.taglineColor || pers.descColor || pers.tagColor || pers.tagcolor
                                const itemTaglineFont = pers.taglineFont || pers.descFont || 'font-sans'

                                const isSolid = pers.colorHex || !pers.backgroundUrl
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

                                return (
                                  <div
                                    key={item.id}
                                    className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-6 py-5 items-center text-left"
                                  >
                                    {/* Column 1: Mini Card Preview + Details */}
                                    <div className="col-span-12 sm:col-span-5 flex items-center gap-4">
                                      <div
                                        className={`w-24 aspect-[1.586/1] rounded-lg overflow-hidden shadow-sm border relative flex flex-col justify-between p-2 select-none text-[6px] leading-tight shrink-0 ${cardBorderColor}`}
                                        style={cardBgStyle}
                                      >
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
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.1)_0%,transparent_60%)] pointer-events-none" />

                                        <div className="relative z-10 flex justify-between items-start w-full">
                                          <div className="flex items-start">
                                            {itemLogoUrl ? (
                                              (itemLogoPlacement === 'top-left') ? (
                                                <img
                                                  src={itemLogoUrl}
                                                  alt="Logo"
                                                  className="object-contain"
                                                  style={{ height: `${itemLogoHeight * 0.25}px`, width: 'auto' }}
                                                />
                                              ) : null
                                            ) : (
                                              <img
                                                src="/default-brand-logo.png"
                                                alt="Logo"
                                                className="object-contain -mt-0.5 -ml-0.5"
                                                style={{ height: '12px' }}
                                              />
                                            )}
                                          </div>
                                          <div className={isCardDark ? 'text-white/60' : 'text-zinc-800/60'}>
                                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                              <path d="M12 2a10 10 0 0 1 10 10" />
                                              <path d="M12 6a6 6 0 0 1 6 6" />
                                              <circle cx="12" cy="12" r="2" />
                                            </svg>
                                          </div>
                                        </div>

                                        {itemLogoUrl && itemLogoPlacement === 'center' && (
                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                            <img
                                              src={itemLogoUrl}
                                              alt="Logo"
                                              className="object-contain"
                                              style={{ height: `${itemLogoHeight * 0.25}px`, width: 'auto' }}
                                            />
                                          </div>
                                        )}

                                        <div className="relative z-10 w-full text-left max-w-[90%] font-medium">
                                          <h4
                                            style={itemTitleColor ? { color: itemTitleColor } : undefined}
                                            className={`${itemTitleFont} font-bold text-[6px] tracking-wide leading-tight truncate ${!itemTitleColor ? cardTextColor : ''}`}
                                          >
                                            {itemTitle}
                                          </h4>
                                          <p
                                            style={itemTaglineColor ? { color: itemTaglineColor } : undefined}
                                            className={`${itemTaglineFont} font-medium text-[4px] tracking-wide leading-normal mt-0.5 truncate ${!itemTaglineColor ? cardSubColor : ''}`}
                                          >
                                            {itemTagline}
                                          </p>
                                        </div>
                                      </div>

                                      <div>
                                        <h5 className="text-xs font-bold text-foreground truncate max-w-[180px]">
                                          {item.product_name}
                                        </h5>
                                      </div>
                                    </div>

                                    {/* Column 2: Material */}
                                    <div className="col-span-12 sm:col-span-3 text-left">
                                      <span className="text-xs font-semibold text-foreground/80">{item.material}</span>
                                    </div>

                                    {/* Column 3: Quantity */}
                                    <div className="col-span-12 sm:col-span-2 text-left sm:text-center">
                                      <span className="text-xs font-bold text-foreground/80">
                                        {String(item.quantity).padStart(2, '0')}
                                      </span>
                                    </div>

                                    {/* Column 4: Price */}
                                    <div className="col-span-12 sm:col-span-2 text-left sm:text-right">
                                      <span className="text-xs font-extrabold text-foreground">
                                        {formatPrice(item.price_inr)}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Shipping Address Strip */}
                        {order.shipping_address && (
                          <div className="bg-card border border-border/50 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Deliver To</span>
                              <span className="text-sm font-bold text-foreground mt-1.5 block">{order.shipping_address.fullName}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Shipping Address</span>
                              <span className="text-xs text-muted-foreground mt-1.5 block leading-relaxed font-medium">
                                {order.shipping_address.addressLine1}
                                {order.shipping_address.addressLine2 ? `, ${order.shipping_address.addressLine2}` : ''}
                                <br />
                                {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Contact Number</span>
                              <span className="text-xs text-muted-foreground mt-1.5 block font-mono font-semibold">{order.shipping_address.phone}</span>
                            </div>
                          </div>
                        )}

                        {/* Payment & Transaction Details Strip */}
                        <div className="bg-card border border-border/50 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-6 text-left">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Transaction ID (Razorpay)</span>
                            <span className="text-xs font-mono font-bold text-foreground mt-1.5 block select-all">{order.razorpay_payment_id || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Razorpay Order ID</span>
                            <span className="text-xs font-mono font-bold text-foreground mt-1.5 block select-all">{order.razorpay_order_id || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Invoice Number</span>
                            <span className="text-xs font-mono font-bold text-foreground mt-1.5 block select-all">
                              {order.invoice_number ? (
                                <>
                                  <span className="select-none font-mono">#</span>{order.invoice_number}
                                </>
                              ) : (
                                'N/A'
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Payment Status</span>
                            <div className="mt-1.5">
                              {order.paid_at ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Paid
                                  </span>
                                  <span className="text-[9px] font-mono text-muted-foreground block mt-0.5">
                                    {new Date(order.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Pending Payment
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dual Summary Footer Panels */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          {/* Left Panel */}
                          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 text-left">
                            <div className="flex justify-between items-center text-xs font-medium border-b border-border/40 pb-3">
                              <span className="text-muted-foreground">GST (18%)</span>
                              <span className="text-foreground font-semibold">{formatPrice(order.gst_inr || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-medium">
                              <span className="text-muted-foreground">Shipping</span>
                              <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px]">Free</span>
                            </div>
                          </div>

                          {/* Right Panel */}
                          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 text-left">
                            <div className="flex justify-between items-center text-xs font-medium border-b border-border/40 pb-3">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span className="text-foreground font-semibold">
                                {formatPrice(order.subtotal_inr || (order.total_inr - (order.gst_inr || 0)))}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-foreground">Grand Total</span>
                              <span className="text-lg font-extrabold text-[#3f5ce6]">
                                {formatPrice(order.total_inr)}
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>
                    )
                  })()
                )}
              </div>
            )}


            <UpgradeModal
              isOpen={showUpgradeModal}
              onClose={() => setShowUpgradeModal(false)}
              onUpgradeSuccess={handleUpgradeSuccess}
            />
          </main>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  )
}

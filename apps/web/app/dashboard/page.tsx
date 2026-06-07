'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, isDarkColor } from '@/lib/utils'
import {
  CreditCard, User, Copy, Download, Plus, Trash2,
  Save, Settings, Activity, LogOut, ExternalLink,
  ChevronDown, Check, Sparkles, AlertCircle, Share2,
  LayoutDashboard, Users, Menu, X, Search, FileDown,
  ArrowRight, ChevronLeft, ChevronRight, Magnet, BarChart3,
  Lock, Link2, Package, Contact, Loader2, Clock, Zap,
  UserCheck, Cpu, Calendar, QrCode, Camera, Upload
} from 'lucide-react'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
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

// Mock leads data
const MOCK_LEADS = [
  { id: '1', date: '2026-06-03 14:24', name: 'Rohan Sharma', email: 'rohan.sharma@techcorp.co.in', phone: '+91 98765 43210', company: 'TechCorp Solutions', notes: 'Interested in bulk orders of NFC business cards.' },
  { id: '2', date: '2026-06-02 11:05', name: 'Anjali Desai', email: 'anjali@desaimedia.com', phone: '+91 87654 32109', company: 'Desai Media', notes: 'Wants integration with corporate directory.' },
  { id: '3', date: '2026-05-31 16:50', name: 'Vikram Malhotra', email: 'vikram.m@indiahart.com', phone: '+91 76543 21098', company: 'IndiaHart Ltd', notes: 'Shared contact details. Follow up in a week.' },
  { id: '4', date: '2026-05-29 09:12', name: 'Priya Patel', email: 'priya@pateldesign.in', phone: '+91 65432 10987', company: 'Patel Design Studio', notes: 'Met at Bangalore Tech Summit. Impressed by the card design.' },
  { id: '5', date: '2026-05-25 18:33', name: 'Amit Verma', email: 'amit.verma@ventures.in', phone: '+91 91234 56789', company: 'Verma Ventures', notes: 'Venture Capitalist. Kept for future connection.' },
]

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

  // Local state for mock products, feeds, and new product form
  const [dummyProducts, setDummyProducts] = useState<any[]>([
    { id: 'p1', name: 'Elite Metal NFC Card', price: 2999, description: 'Premium laser-engraved matte black metal card with built-in NFC chip.', link: '/shop' },
    { id: 'p2', name: 'Bamboo Eco NFC Card', price: 1499, description: 'Eco-friendly sustainable bamboo wood card, organic texture.', link: '/shop' },
    { id: 'p3', name: 'Classic PVC Matte Card', price: 999, description: 'Waterproof high-grade matte black PVC card with premium branding.', link: '/shop' }
  ])
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    link: ''
  })
  const [dummyFeeds, setDummyFeeds] = useState<any[]>([
    { id: 'f1', location: 'Bengaluru, Karnataka', device: 'Chrome / Windows', time: '2 hours ago', status: 'Success' },
    { id: 'f2', location: 'Mumbai, Maharashtra', device: 'Safari / iPhone', time: '1 day ago', status: 'Success' },
    { id: 'f3', location: 'New Delhi, NCR', device: 'Firefox / Android', time: '3 days ago', status: 'Success' },
    { id: 'f4', location: 'Chennai, Tamil Nadu', device: 'Edge / Windows', time: '5 days ago', status: 'Success' },
    { id: 'f5', location: 'Hyderabad, Telangana', device: 'Chrome / Android', time: '1 week ago', status: 'Success' }
  ])

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.price) return
    const prod = {
      id: Math.random().toString(36).substring(2, 9),
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      description: newProduct.description,
      link: newProduct.link || '/shop'
    }
    setDummyProducts(prev => [...prev, prod])
    setNewProduct({ name: '', price: '', description: '', link: '' })
  }

  const handleDeleteProduct = (id: string) => {
    setDummyProducts(prev => prev.filter(p => p.id !== id))
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

  const isAllCards = activeCard?.id === 'all'

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
    website: '',
    phones: [] as Array<{ label: string; number: string; is_primary: boolean }>,
    emails: [] as Array<{ label: string; email: string; is_primary: boolean }>,
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    customFields: [] as Array<{ key: string; value: string }>,
  })
  const [savingVCard, setSavingVCard] = useState(false)
  const [loadingVCard, setLoadingVCard] = useState(false)

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
            website: '',
            phones: [],
            emails: [],
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India',
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
            website: vcardData.website || '',
            phones: vcardData.phones || [],
            emails: vcardData.emails || [],
            street: vcardData.street || '',
            city: vcardData.city || '',
            state: vcardData.state || '',
            postalCode: vcardData.postal_code || '',
            country: vcardData.country || 'India',
            customFields: vcardData.custom_fields || [],
          })
        } else {
          setVcardForm({
            firstName: '',
            lastName: '',
            organization: '',
            jobTitle: '',
            website: '',
            phones: [],
            emails: [],
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India',
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
            website: vcardData.website,
            phones: vcardData.phones,
            emails: vcardData.emails,
            street: vcardData.street,
            city: vcardData.city,
            state: vcardData.state,
            postal_code: vcardData.postalCode,
            country: vcardData.country,
            custom_fields: vcardData.customFields,
          }, {
            onConflict: 'profile_id'
          })

        if (error) throw error
      }

      setMessage({ type: 'success', text: 'vCard details updated for all profiles.' })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to save vCard details.' })
    } finally {
      setSavingVCard(false)
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

  // Export leads to CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Name', 'Email', 'Phone', 'Company', 'Notes']
    const rows = MOCK_LEADS.map(l => [l.date, l.name, l.email, l.phone, l.company, l.notes])
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `envitra_leads_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter leads based on search query
  const filteredLeads = MOCK_LEADS.filter(lead => {
    const query = leadsSearch.toLowerCase()
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      lead.company.toLowerCase().includes(query)
    )
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
                      <span className="text-2xl font-extrabold tracking-tight text-foreground">{MOCK_LEADS.length}</span>
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
                  <div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Profiles</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Manage profiles under <span className="font-mono text-[#3f5ce6] font-bold">{activeCard?.slug}</span>. The active profile is shown when the card is tapped.
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
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {cardProfiles.map((p: any) => (
                      <div
                        key={p.id}
                        className={`group bg-card border rounded-2xl p-5 space-y-4 transition-all cursor-pointer hover:shadow-lg relative overflow-hidden ${p.is_active ? 'border-emerald-500/40 shadow-emerald-500/5' : 'border-border hover:border-[#3f5ce6]/30'
                          }`}
                        onClick={() => setActiveProfile(p)}
                      >
                        {/* Dynamic background theme gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/2 to-transparent pointer-events-none" />

                        {/* Avatar + name row */}
                        <div className="relative z-10 flex items-start gap-3">
                          <div className="relative shrink-0">
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt={p.profile_name} className="w-12 h-12 rounded-xl object-cover border border-border" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-[#3f5ce6]/10 flex items-center justify-center text-lg font-bold text-[#3f5ce6]">
                                {p.profile_name?.[0]?.toUpperCase() || 'P'}
                              </div>
                            )}
                            {p.is_active && (
                              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-bold text-foreground truncate">{p.display_name || p.profile_name}</h4>
                              {p.is_active && (
                                <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 rounded-full px-2 py-0.5 border border-emerald-500/20 uppercase tracking-wider shrink-0">LIVE</span>
                              )}
                              {p.primary_profile && (
                                <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 rounded-full px-2 py-0.5 border border-amber-500/20 uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                                  <Sparkles size={8} className="fill-amber-500/20" /> Primary
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">{p.title || 'No title set'}</p>
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">{p.profile_name}</p>
                          </div>
                        </div>

                        {p.bio && (
                          <p className="relative z-10 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{p.bio}</p>
                        )}

                        {/* Actions */}
                        <div className="relative z-10 flex gap-2 pt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditProfile(p);
                            }}
                            className="flex-grow py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-center cursor-pointer"
                          >
                            Edit
                          </button>
                          {!p.is_active && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetProfileLive(p.id);
                              }}
                              className="flex-grow py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/10 transition-all text-center cursor-pointer"
                            >
                              Set Live
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProfile(p);
                            }}
                            className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/15 cursor-pointer active:scale-95 transition-all flex items-center justify-center shrink-0"
                            title="Delete Profile"
                          >
                            <Trash2 size={13} />
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
                      <SheetHeader className="pt-1 px-6 pb-3 border-b border-border dark:border-zinc-800/80 shrink-0">
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
                              className={`flex-grow py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                profileForm.status === 'active'
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
                              className={`flex-grow py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                profileForm.status === 'inactive'
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
                            <button
                              type="button"
                              onClick={() => {
                                if (isFormChanged()) {
                                  setShowCancelConfirm(true)
                                } else {
                                  setShowProfileModal(false)
                                }
                              }}
                              className="flex-1 py-2 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/40 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={savingProfile}
                              className="flex-1 py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold shadow-lg shadow-[#3f5ce6]/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-60"
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
              <div className="space-y-6 animate-fadeIn text-left max-w-4xl">
                {/* Header */}
                <div>
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

                <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 space-y-6">
                  {loadingVCard ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="animate-spin text-[#3f5ce6]" size={24} />
                      <span className="text-xs text-muted-foreground ml-2">Loading vCard details...</span>
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); saveVCard(vcardForm); }} className="space-y-6">

                      {/* Name section */}
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

                      {/* Work details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Job Title</label>
                          <input
                            type="text"
                            value={vcardForm.jobTitle}
                            onChange={(e) => setVcardForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                            placeholder="Product Designer"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Company / Organization</label>
                          <input
                            type="text"
                            value={vcardForm.organization}
                            onChange={(e) => setVcardForm(prev => ({ ...prev, organization: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                            placeholder="Envitra Technologies"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Website URL</label>
                          <input
                            type="url"
                            value={vcardForm.website}
                            onChange={(e) => setVcardForm(prev => ({ ...prev, website: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                            placeholder="https://envitra.in"
                          />
                        </div>
                      </div>

                      <hr className="border-border/50" />

                      {/* Phones array */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Phone Numbers</h4>
                          <button
                            type="button"
                            onClick={handleAddPhone}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 text-[#3f5ce6] hover:bg-[#3f5ce6]/20 text-xs font-semibold transition-all"
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
                                <select
                                  value={phone.label}
                                  onChange={(e) => handlePhoneChange(index, 'label', e.target.value)}
                                  className="w-full sm:w-28 px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:border-[#3f5ce6]"
                                >
                                  <option value="Mobile">Mobile</option>
                                  <option value="Work">Work</option>
                                  <option value="Home">Home</option>
                                  <option value="Main">Main</option>
                                  <option value="Fax">Fax</option>
                                </select>
                                <input
                                  type="text"
                                  required
                                  value={phone.number}
                                  onChange={(e) => handlePhoneChange(index, 'number', e.target.value)}
                                  className="flex-grow w-full px-3 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:border-[#3f5ce6]"
                                  placeholder="+91 98765 43210"
                                />
                                <div className="flex items-center gap-3 w-full sm:w-auto pt-1 sm:pt-0">
                                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground select-none cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={phone.is_primary}
                                      onChange={(e) => {
                                        // set primary and reset other phones primary
                                        const updatedPhones = vcardForm.phones.map((p, i) => ({
                                          ...p,
                                          is_primary: i === index
                                        }))
                                        setVcardForm(prev => ({ ...prev, phones: updatedPhones }))
                                      }}
                                      className="rounded text-[#3f5ce6] focus:ring-[#3f5ce6]"
                                    />
                                    Primary
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhone(index)}
                                    className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors ml-auto sm:ml-0"
                                  >
                                    <Trash2 size={14} />
                                  </button>
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
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Email Addresses</h4>
                          <button
                            type="button"
                            onClick={handleAddEmail}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 text-[#3f5ce6] hover:bg-[#3f5ce6]/20 text-xs font-semibold transition-all"
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
                                <select
                                  value={email.label}
                                  onChange={(e) => handleEmailChange(index, 'label', e.target.value)}
                                  className="w-full sm:w-28 px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:border-[#3f5ce6]"
                                >
                                  <option value="Work">Work</option>
                                  <option value="Personal">Personal</option>
                                  <option value="Other">Other</option>
                                </select>
                                <input
                                  type="email"
                                  required
                                  value={email.email}
                                  onChange={(e) => handleEmailChange(index, 'email', e.target.value)}
                                  className="flex-grow w-full px-3 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:border-[#3f5ce6]"
                                  placeholder="rahul@company.com"
                                />
                                <div className="flex items-center gap-3 w-full sm:w-auto pt-1 sm:pt-0">
                                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground select-none cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={email.is_primary}
                                      onChange={(e) => {
                                        const updatedEmails = vcardForm.emails.map((em, i) => ({
                                          ...em,
                                          is_primary: i === index
                                        }))
                                        setVcardForm(prev => ({ ...prev, emails: updatedEmails }))
                                      }}
                                      className="rounded text-[#3f5ce6] focus:ring-[#3f5ce6]"
                                    />
                                    Primary
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEmail(index)}
                                    className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors ml-auto sm:ml-0"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <hr className="border-border/50" />

                      {/* Location details */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Postal Address</h4>
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

                      {/* Custom/social fields array */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Custom Fields</h4>
                            <p className="text-[10px] text-muted-foreground">Add custom links (e.g. LinkedIn, Twitter, Custom Label)</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddCustomField}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 text-[#3f5ce6] hover:bg-[#3f5ce6]/20 text-xs font-semibold transition-all"
                          >
                            <Plus size={12} /> Add Field
                          </button>
                        </div>

                        {vcardForm.customFields.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No custom fields added yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {vcardForm.customFields.map((field, index) => (
                              <div key={index} className="flex gap-3 items-center">
                                <input
                                  type="text"
                                  required
                                  value={field.key}
                                  onChange={(e) => handleCustomFieldChange(index, 'key', e.target.value)}
                                  className="w-28 sm:w-36 px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:border-[#3f5ce6]"
                                  placeholder="LinkedIn"
                                />
                                <input
                                  type="text"
                                  required
                                  value={field.value}
                                  onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                                  className="flex-grow px-3 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:border-[#3f5ce6]"
                                  placeholder="https://linkedin.com/in/rahulkumar"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomField(index)}
                                  className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <hr className="border-border/50" />

                      {/* Save action */}
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={savingVCard}
                          className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
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
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB: MANAGE LINKS                                        */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeTab === 'links' && !isAllCards && (
              <div className="space-y-6 animate-fadeIn text-left max-w-3xl">
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Manage Links</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Social and payment links for <span className="font-semibold text-foreground">{activeProfile?.profile_name || 'selected profile'}</span>
                  </p>
                </div>

                {/* Top clicked links strip */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Instagram', clicks: 142, pct: 100 },
                    { label: 'LinkedIn', clicks: 97, pct: 68 },
                    { label: 'WhatsApp', clicks: 61, pct: 43 },
                  ].map((l) => (
                    <div key={l.label} className="bg-card border border-border rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-foreground">{l.label}</span>
                        <span className="text-xs font-black text-[#3f5ce6]">{l.clicks}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-[#3f5ce6]" style={{ width: `${l.pct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">clicks this month</p>
                    </div>
                  ))}
                </div>

                {/* Social links section */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Social Links</h4>
                      <p className="text-[10px] text-muted-foreground">Free: up to 5 links</p>
                    </div>
                    <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 text-[#3f5ce6] text-xs font-semibold hover:bg-[#3f5ce6]/20 transition-all">
                      <Plus size={12} /> Add Social
                    </button>
                  </div>
                  {[
                    { platform: 'Instagram', url: 'https://instagram.com/envitra', clicks: 142, active: true },
                    { platform: 'LinkedIn', url: 'https://linkedin.com/in/envitra', clicks: 97, active: true },
                    { platform: 'GitHub', url: 'https://github.com/envitra', clicks: 38, active: false },
                  ].map((link, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-[#3f5ce6]/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-[#3f5ce6] uppercase">{link.platform.slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground">{link.platform}</p>
                        <p className="text-[10px] text-muted-foreground truncate font-mono">{link.url}</p>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground shrink-0">{link.clicks} clicks</span>
                      <div className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${link.active ? 'bg-emerald-500' : 'bg-muted'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${link.active ? 'left-4' : 'left-0.5'}`} />
                      </div>
                      <button className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>

                {/* Payment links section */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Payment Links</h4>
                      <p className="text-[10px] text-muted-foreground">Free: up to 3 links</p>
                    </div>
                    <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 text-[#3f5ce6] text-xs font-semibold hover:bg-[#3f5ce6]/20 transition-all">
                      <Plus size={12} /> Add Payment
                    </button>
                  </div>
                  {[
                    { platform: 'UPI / GPay', url: 'upi://pay?pa=envitra@okaxis', clicks: 56, active: true },
                    { platform: 'Razorpay', url: 'https://rzp.io/l/envitra', clicks: 23, active: true },
                  ].map((link, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-emerald-600 uppercase">{link.platform.slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground">{link.platform}</p>
                        <p className="text-[10px] text-muted-foreground truncate font-mono">{link.url}</p>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground shrink-0">{link.clicks} clicks</span>
                      <div className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${link.active ? 'bg-emerald-500' : 'bg-muted'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${link.active ? 'left-4' : 'left-0.5'}`} />
                      </div>
                      <button className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    {/* Leads header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Leads</h3>
                        <p className="text-xs text-muted-foreground">Profile: <span className="font-semibold text-foreground">{activeProfile?.profile_name}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition-all">
                          <FileDown size={13} /> Export CSV
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold transition-all shadow-md">
                          <Settings size={13} /> Edit Form
                        </button>
                      </div>
                    </div>

                    {/* Stats strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Total Leads', value: MOCK_LEADS.length, color: 'text-foreground' },
                        { label: 'New', value: 2, color: 'text-[#3f5ce6]' },
                        { label: 'Converted', value: 1, color: 'text-emerald-500' },
                        { label: 'Lost', value: 0, color: 'text-red-400' },
                      ].map((s) => (
                        <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
                          <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card max-w-md">
                      <Search size={15} className="text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        placeholder="Search leads by name, email, company..."
                        value={leadsSearch}
                        onChange={(e) => setLeadsSearch(e.target.value)}
                        className="w-full bg-transparent text-xs text-foreground focus:outline-none placeholder-muted-foreground/60"
                      />
                      {leadsSearch && <button onClick={() => setLeadsSearch('')}><X size={14} className="text-muted-foreground" /></button>}
                    </div>

                    {/* CRM Table */}
                    <div className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-muted/30 text-muted-foreground text-[10px] font-bold uppercase tracking-wider select-none">
                              <th className="px-5 py-3.5">Contact</th>
                              <th className="px-5 py-3.5">Company</th>
                              <th className="px-5 py-3.5">Date</th>
                              <th className="px-5 py-3.5">Status</th>
                              <th className="px-5 py-3.5">Notes</th>
                              <th className="px-5 py-3.5"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-xs text-foreground">
                            {filteredLeads.map((lead) => (
                              <tr key={lead.id} className="hover:bg-muted/20 transition-colors">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#3f5ce6]/10 flex items-center justify-center text-[10px] font-black text-[#3f5ce6] shrink-0">
                                      {lead.name[0]}
                                    </div>
                                    <div>
                                      <div className="font-bold text-foreground">{lead.name}</div>
                                      <div className="text-[10px] text-muted-foreground font-mono">{lead.email}</div>
                                      <div className="text-[10px] text-muted-foreground font-mono">{lead.phone}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4 font-semibold text-foreground/80">{lead.company}</td>
                                <td className="px-5 py-4 text-muted-foreground font-mono whitespace-nowrap">{lead.date}</td>
                                <td className="px-5 py-4">
                                  <select className="text-[10px] font-bold px-2 py-1 rounded-full border border-border bg-card cursor-pointer focus:outline-none focus:border-[#3f5ce6]">
                                    <option value="new">🔵 New</option>
                                    <option value="contacted">🟡 Contacted</option>
                                    <option value="following_up">🟠 Following Up</option>
                                    <option value="converted">🟢 Converted</option>
                                    <option value="lost">🔴 Lost</option>
                                    <option value="spam">⚫ Spam</option>
                                  </select>
                                </td>
                                <td className="px-5 py-4 text-muted-foreground max-w-[200px]">
                                  <p className="line-clamp-2">{lead.notes}</p>
                                </td>
                                <td className="px-5 py-4">
                                  <button className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                    <Settings size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

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
                      <div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Products</h3>
                        <p className="text-xs text-muted-foreground">Profile: <span className="font-semibold text-foreground">{activeProfile?.profile_name}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition-all">
                          <FileDown size={13} /> Export CSV
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold transition-all shadow-md">
                          <Plus size={13} /> Add Product
                        </button>
                      </div>
                    </div>

                    {/* Product grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {dummyProducts.map((p: any) => (
                        <div key={p.id} className="group bg-card border border-border hover:border-[#3f5ce6]/30 rounded-2xl overflow-hidden transition-all hover:shadow-lg">
                          <div className="h-32 bg-gradient-to-br from-[#3f5ce6]/10 to-indigo-600/5 flex items-center justify-center">
                            <Package size={32} className="text-[#3f5ce6]/40" />
                          </div>
                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-bold text-foreground leading-tight">{p.name}</h4>
                              <span className="text-xs font-black text-[#3f5ce6] shrink-0">₹{(p.price / 100).toLocaleString('en-IN')}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2">{p.description}</p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-muted-foreground font-medium">
                                <span className="font-bold text-foreground">{Math.floor(Math.random() * 80 + 20)}</span> clicks
                              </span>
                              <div className="flex gap-1">
                                <button className="px-2 py-1 rounded-md text-[10px] font-semibold border border-border hover:bg-muted text-muted-foreground transition-all">Edit</button>
                                <button className="px-2 py-1 rounded-md text-[10px] font-semibold border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all">
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Add placeholder */}
                      <button className="border-2 border-dashed border-border rounded-2xl h-full min-h-[200px] flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-[#3f5ce6]/40 hover:text-[#3f5ce6] transition-all">
                        <Plus size={24} />
                        <span className="text-xs font-semibold">Add Product</span>
                      </button>
                    </div>
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
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Feeds</h3>
                        <p className="text-xs text-muted-foreground">Profile: <span className="font-semibold text-foreground">{activeProfile?.profile_name}</span></p>
                      </div>
                      <div className="flex gap-2">
                        {(['📷 Image', '🎥 Video', '📝 Text', '🔗 Link'] as const).map((type) => (
                          <button key={type} className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-semibold text-foreground transition-all">
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feed grid */}
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
                      {[
                        { type: 'image', caption: 'New card designs just dropped 🔥', time: '2 hours ago' },
                        { type: 'text', caption: 'Excited to announce our new partnership with TechCorp. Digital networking is the future!', time: '1 day ago' },
                        { type: 'link', caption: 'Check out our latest blog post on NFC technology', link: 'https://blog.envitra.com', time: '3 days ago' },
                        { type: 'image', caption: 'Behind the scenes of card production', time: '5 days ago' },
                      ].map((feed, i) => (
                        <div key={i} className="break-inside-avoid bg-card border border-border rounded-2xl overflow-hidden hover:border-[#3f5ce6]/30 transition-all group">
                          {feed.type === 'image' && (
                            <div className="h-40 bg-gradient-to-br from-[#3f5ce6]/10 to-purple-600/5 flex items-center justify-center">
                              <span className="text-4xl">📷</span>
                            </div>
                          )}
                          <div className="p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded">{feed.type}</span>
                              <span className="text-[10px] text-muted-foreground">{feed.time}</span>
                            </div>
                            <p className="text-xs text-foreground leading-relaxed">{feed.caption}</p>
                            {feed.link && <a href={feed.link} className="text-[10px] text-[#3f5ce6] font-mono truncate block hover:underline">{feed.link}</a>}
                            <div className="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="flex-1 py-1 rounded-lg border border-border text-[10px] font-semibold text-muted-foreground hover:bg-muted transition-all">Edit</button>
                              <button className="py-1 px-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all"><Trash2 size={11} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Add placeholder */}
                      <button className="break-inside-avoid border-2 border-dashed border-border rounded-2xl w-full h-40 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-[#3f5ce6]/40 hover:text-[#3f5ce6] transition-all">
                        <Plus size={24} />
                        <span className="text-xs font-semibold">New Post</span>
                      </button>
                    </div>
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
                  <div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Analytics</h3>
                    <p className="text-xs text-muted-foreground">
                      {isAllCards
                        ? 'Aggregated tap data across all cards'
                        : `Card: ${activeCard?.slug}${activeProfile ? ` · Profile: ${activeProfile.profile_name}` : ''}`}
                    </p>
                  </div>
                  {/* Date range */}
                  <div className="flex gap-1">
                    {['7d', '30d', '90d'].map((r) => (
                      <button key={r} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${r === '30d' ? 'bg-[#3f5ce6] text-white' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Taps', value: isAllCards ? cards.reduce((s: number, c: any) => s + (c.tap_count || 0), 0) : (activeCard?.tap_count || 0), trend: '+12%', color: '#3f5ce6' },
                    { label: 'Unique Visitors', value: 28, trend: '+8%', color: '#10b981' },
                    { label: 'Link Clicks', value: 142, trend: '+19%', color: '#f59e0b' },
                    { label: 'Leads Captured', value: MOCK_LEADS.length, trend: '+5%', color: '#8b5cf6' },
                  ].map((s) => (
                    <div key={s.label} className="bg-card border border-border rounded-xl p-5 space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                      <div className="flex items-end justify-between">
                        <span className="text-2xl font-black text-foreground">{s.value}</span>
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 rounded px-1.5 py-0.5">{s.trend}</span>
                      </div>
                      <div className="flex items-end gap-0.5 h-8">
                        {[40, 60, 35, 80, 55, 90, 70].map((h, i) => (
                          <div key={i} className="flex-1 rounded-sm opacity-70" style={{ height: `${h}%`, backgroundColor: s.color }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tap timeline chart */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Tap Timeline — Last 30 Days</h4>
                  <div className="h-40 flex items-end gap-1.5 border-b border-border pb-2">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const h = Math.floor(Math.random() * 80 + 5)
                      const isToday = i === 29
                      return (
                        <div key={i} className="flex-1 group relative cursor-pointer">
                          <div
                            className={`w-full rounded-t transition-all group-hover:opacity-100 ${isToday ? 'opacity-100' : 'opacity-50'}`}
                            style={{ height: `${h}%`, backgroundColor: '#3f5ce6' }}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground font-bold uppercase">
                    <span>May 5</span><span>May 15</span><span>May 25</span><span>Jun 4</span>
                  </div>
                </div>

                {/* Device + Geo row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Device breakdown */}
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Device Breakdown</h4>
                    {[
                      { label: 'Mobile', pct: 74, color: '#3f5ce6' },
                      { label: 'Desktop', pct: 19, color: '#10b981' },
                      { label: 'Tablet', pct: 7, color: '#f59e0b' },
                    ].map((d) => (
                      <div key={d.label} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-foreground">{d.label}</span>
                          <span className="font-bold" style={{ color: d.color }}>{d.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                        </div>
                      </div>
                    ))}
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
                    {[
                      { label: 'iOS / Safari', pct: 51, color: '#3f5ce6' },
                      { label: 'Android / Chrome', pct: 35, color: '#10b981' },
                      { label: 'Windows', pct: 10, color: '#8b5cf6' },
                      { label: 'macOS', pct: 4, color: '#f59e0b' },
                    ].map((d) => (
                      <div key={d.label} className={`space-y-1.5 ${!(profile?.plan === 'pro' || profile?.plan === 'business') ? 'opacity-30 pointer-events-none select-none' : ''}`}>
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-foreground">{d.label}</span>
                          <span className="font-bold" style={{ color: d.color }}>{d.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top links */}
                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Top Links Clicked</h4>
                  <div className="space-y-3">
                    {[
                      { platform: 'Instagram', clicks: 142, pct: 100 },
                      { platform: 'LinkedIn', clicks: 97, pct: 68 },
                      { platform: 'WhatsApp', clicks: 61, pct: 43 },
                      { platform: 'UPI / GPay', clicks: 56, pct: 39 },
                      { platform: 'GitHub', clicks: 38, pct: 27 },
                    ].map((l) => (
                      <div key={l.platform} className="flex items-center gap-4">
                        <span className="text-xs font-bold text-foreground w-28 shrink-0 truncate">{l.platform}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-[#3f5ce6]" style={{ width: `${l.pct}%` }} />
                        </div>
                        <span className="text-xs font-black text-[#3f5ce6] w-12 text-right shrink-0">{l.clicks}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                    <div>
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

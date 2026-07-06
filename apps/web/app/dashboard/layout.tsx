'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { DashboardContext } from './context'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { HeaderProfile } from '@/components/layout/HeaderProfile'
import { UpgradeModal } from '@/components/dashboard/UpgradeModal'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { 
  CreditCard, User, Activity, Users, LogOut, AlertCircle, X, ChevronDown, Laptop, Smartphone, Tablet, Globe, Loader2, Check 
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ALL_CARDS_WORKSPACE = {
  id: 'all',
  slug: 'all-cards',
  profile_data: {
    name: 'All Cards',
    colorHex: '#3f5ce6'
  }
}

const getBrowserAndOS = (customUa?: string) => {
  const ua = customUa || (typeof window !== 'undefined' ? window.navigator.userAgent : '')
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'

  if (!ua) return { browser, os }

  if (ua.indexOf('Firefox') > -1) browser = 'Mozilla Firefox'
  else if (ua.indexOf('SamsungBrowser') > -1) browser = 'Samsung Internet'
  else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera'
  else if (ua.indexOf('Trident') > -1) browser = 'Internet Explorer'
  else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) browser = 'Microsoft Edge'
  else if (ua.indexOf('Chrome') > -1) browser = 'Google Chrome'
  else if (ua.indexOf('Safari') > -1) browser = 'Apple Safari'

  if (ua.indexOf('Windows NT 10.0') > -1) os = 'Windows 10/11'
  else if (ua.indexOf('Windows NT 6.2') > -1) os = 'Windows 8'
  else if (ua.indexOf('Windows NT 6.1') > -1) os = 'Windows 7'
  else if (ua.indexOf('Macintosh') > -1) os = 'macOS'
  else if (ua.indexOf('iPhone') > -1) os = 'iOS'
  else if (ua.indexOf('iPad') > -1) os = 'iPadOS'
  else if (ua.indexOf('Android') > -1) os = 'Android'
  else if (ua.indexOf('Linux') > -1) os = 'Linux'

  return { browser, os }
}

const getDeviceIcon = (os: string) => {
  const osLower = os.toLowerCase()
  if (osLower.includes('ios') || osLower.includes('android')) {
    return <Smartphone className="w-4 h-4 text-muted-foreground" />
  }
  if (osLower.includes('ipad')) {
    return <Tablet className="w-4 h-4 text-muted-foreground" />
  }
  if (osLower.includes('mac') || osLower.includes('win') || osLower.includes('linux')) {
    return <Laptop className="w-4 h-4 text-muted-foreground" />
  }
  return <Globe className="w-4 h-4 text-muted-foreground" />
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Derive current tab from URL path for profile-switcher visibility
  const currentTab = pathname.split('/').filter(Boolean)[1] || 'overview'
  const PROFILE_SWITCHER_HIDDEN_TABS = new Set(['overview', 'card', 'profiles', 'vcard', 'settings'])

  // Shared States
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [userOrders, setUserOrders] = useState<any[]>([])
  
  const [cards, setCards] = useState<any[]>([])
  const [activeCard, setActiveCard] = useState<any>(ALL_CARDS_WORKSPACE)
  const [cardProfiles, setCardProfiles] = useState<any[]>([])
  const [activeProfile, setActiveProfile] = useState<any>(null)
  const [vcardDataMap, setVcardDataMap] = useState<Record<string, any>>({})

  // Feedback/Notification states
  const [message, setMessageState] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const setMessage = (msg: { type: 'success' | 'error'; text: string } | string | null) => {
    if (!msg) {
      setMessageState(null)
      return
    }
    if (typeof msg === 'string') {
      setMessageState(msg)
      setMessageType('success')
      toast.success(msg)
    } else {
      setMessageState(msg.text)
      setMessageType(msg.type)
      if (msg.type === 'success') {
        toast.success(msg.text)
      } else {
        toast.error(msg.text)
      }
    }
  }

  // Lists and Sub-lists (Products, Feeds, Links, Leads)
  const [profileProducts, setProfileProducts] = useState<any[]>([])
  const [profileProductsLoading, setProfileProductsLoading] = useState(false)
  const [allAccountProducts, setAllAccountProducts] = useState<any[]>([])
  const [allAccountProductsLoading, setAllAccountProductsLoading] = useState(false)

  const [profileFeeds, setProfileFeeds] = useState<any[]>([])
  const [profileFeedsLoading, setProfileFeedsLoading] = useState(false)
  const [allAccountFeeds, setAllAccountFeeds] = useState<any[]>([])
  const [allAccountFeedsLoading, setAllAccountFeedsLoading] = useState(false)

  const [profileLinks, setProfileLinks] = useState<any[]>([])
  const [profileLinksLoading, setProfileLinksLoading] = useState(false)
  const [allAccountLinks, setAllAccountLinks] = useState<any[]>([])
  const [allAccountLinksLoading, setAllAccountLinksLoading] = useState(false)

  const [leads, setLeads] = useState<any[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadForms, setLeadForms] = useState<any[]>([])
  const [leadFormsLoading, setLeadFormsLoading] = useState(false)
  const [allAccountLeadForms, setAllAccountLeadForms] = useState<any[]>([])
  const [allAccountLeadFormsLoading, setAllAccountLeadFormsLoading] = useState(false)
  const [lastActivity, setLastActivity] = useState<string | null>(null)

  // Session & Security tracking states
  const [currentSessionId, setCurrentSessionId] = useState('')
  const [loggedSessions, setLoggedSessions] = useState<any[]>([])
  const [deviceLockout, setDeviceLockout] = useState(false)
  const [sessionDisconnecting, setSessionDisconnecting] = useState<any>(false)

  // Account editing form states (needed in Settings)
  const [accountForm, setAccountForm] = useState({
    fullName: '',
    nfcRedirectToDashboard: false,
    agreedToTerms: false
  })

  // Upgrade Modal control states
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [upgradeModalFeature, setUpgradeModalFeature] = useState('gated')

  // Helper: clear local storage states
  const clearLocalStorageStates = () => {
    if (typeof window === 'undefined') return
    const keys = [
      'envitra_active_card_id',
      'envitra_active_profile_id',
      'envitra_link_modal',
      'envitra_link_form',
      'envitra_link_modal_checked_profiles',
      'envitra_feed_sheet_open',
      'envitra_feed_form',
      'envitra_feed_form_mode',
      'envitra_editing_feed',
      'envitra_product_sheet_open',
      'envitra_product_form',
      'envitra_product_form_mode',
      'envitra_editing_product',
      'envitra_lead_sheet',
      'envitra_lead_modal_selected_form_id',
      'envitra_lead_modal_custom_data',
      'envitra_show_profile_modal',
      'envitra_profile_form',
      'envitra_editing_profile'
    ]
    keys.forEach(k => localStorage.removeItem(k))
  }

  // ── Database Fetching Callbacks ──────────────────────────────────
  const fetchProfileLinks = async (profileId: string, silent = false) => {
    if (!profileId) return
    if (!silent) setProfileLinksLoading(true)
    try {
      const { data, error } = await supabase
        .from('profile_links')
        .select(`
          id,
          profile_id,
          link_id,
          sort_order,
          is_active,
          click_count,
          social_links (
            id,
            category,
            platform,
            label,
            url
          )
        `)
        .eq('profile_id', profileId)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('fetchProfileLinks error:', error)
        if (!silent) setProfileLinksLoading(false)
        return
      }

      if (data) {
        const flattened = data
          .filter((item: any) => item.social_links)
          .map((item: any) => ({
            // id = profile_links.id (junction row id — used by toggle/delete/reorder)
            id: item.id,
            profile_id: item.profile_id,
            link_id: item.link_id,
            sort_order: item.sort_order,
            is_active: item.is_active ?? true,
            click_count: item.click_count ?? 0,
            // Fields from social_links
            category: item.social_links.category,
            platform: item.social_links.platform,
            label: item.social_links.label,
            url: item.social_links.url,
          }))
        setProfileLinks(flattened)
      }
    } catch (err) {
      console.error('Failed to fetch profile links:', err)
    } finally {
      if (!silent) setProfileLinksLoading(false)
    }
  }


  const fetchProfileProducts = async (profileId: string, silent = false) => {
    if (!profileId) return
    if (!silent) setProfileProductsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profile_products')
        .select('*')
        .eq('profile_id', profileId)
        .order('sort_order', { ascending: true })
      if (!error && data) {
        setProfileProducts(data)
      }
    } catch (err) {
      console.error('Failed to fetch profile products:', err)
    } finally {
      if (!silent) setProfileProductsLoading(false)
    }
  }

  const fetchProfileFeeds = async (profileId: string, silent = false) => {
    if (!profileId) return
    if (!silent) setProfileFeedsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profile_feeds')
        .select('*')
        .eq('profile_id', profileId)
        .order('sort_order', { ascending: true })
      if (!error && data) {
        setProfileFeeds(data)
      }
    } catch (err) {
      console.error('Failed to fetch profile feeds:', err)
    } finally {
      if (!silent) setProfileFeedsLoading(false)
    }
  }

  const fetchLeadForms = async (profileId: string, silent = false) => {
    if (!profileId) return
    if (!silent) setLeadFormsLoading(true)
    try {
      const { data, error } = await supabase
        .from('lead_forms')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
      if (!error && data) {
        setLeadForms(data)
      }
    } catch (err) {
      console.error('Failed to fetch lead forms:', err)
    } finally {
      if (!silent) setLeadFormsLoading(false)
    }
  }

  const fetchLeads = async (profileId: string, silent = false) => {
    if (!profileId) return
    if (!silent) setLeadsLoading(true)
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
      if (!silent) setLeadsLoading(false)
    }
  }

  const fetchAllAccountProducts = async (silent = false) => {
    if (!user?.id) return
    if (!silent) setAllAccountProductsLoading(true)
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
      if (!silent) setAllAccountProductsLoading(false)
    }
  }

  const fetchAllAccountFeeds = async (silent = false) => {
    if (!user?.id) return
    if (!silent) setAllAccountFeedsLoading(true)
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
      if (!silent) setAllAccountFeedsLoading(false)
    }
  }

  const fetchAllAccountLinks = async (silent = false) => {
    if (!user?.id) return
    if (!silent) setAllAccountLinksLoading(true)
    try {
      const { data, error } = await supabase
        .from('profile_links')
        .select(`
          id,
          profile_id,
          link_id,
          sort_order,
          is_active,
          social_links!inner (
            id,
            category,
            platform,
            label,
            url,
            account_id
          )
        `)
        .eq('social_links.account_id', user.id)
      if (!error && data) {
        const flattened = data
          .filter((item: any) => item.social_links)
          .map((item: any) => ({
            id: item.link_id,
            profileLinkId: item.id,
            profile_id: item.profile_id,
            category: item.social_links.category,
            platform: item.social_links.platform,
            label: item.social_links.label,
            url: item.social_links.url,
            is_active: item.is_active,
            sort_order: item.sort_order
          }))
        setAllAccountLinks(flattened)
      }
    } catch (err) {
      console.error('Failed to fetch all account links:', err)
    } finally {
      if (!silent) setAllAccountLinksLoading(false)
    }
  }

  const fetchAllAccountLeadForms = async (silent = false) => {
    if (!user?.id) return
    if (!silent) setAllAccountLeadFormsLoading(true)
    try {
      const { data, error } = await supabase
        .from('lead_forms')
        .select('*')
        .eq('account_id', user.id)
      if (error) throw error
      if (data) {
        setAllAccountLeadForms(data)
      }
    } catch (err) {
      console.error('Failed to fetch all account lead forms:', err)
    } finally {
      if (!silent) setAllAccountLeadFormsLoading(false)
    }
  }

  // ── Sync User Session & Max 2 Devices Limit ─────────────────────
  const syncUserSession = async (userId: string, activeSid?: string) => {
    if (!userId) return

    try {
      const currentSid = activeSid || currentSessionId
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : ''
      
      const res = await fetch('/api/auth/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userAgent, currentSessionId: currentSid })
      })

      if (!res.ok) {
        console.error('Failed to sync active session')
        return
      }

      const data = await res.json()
      const sessions = data.sessions || []
      setLoggedSessions(sessions)

      if (currentSid) {
        const sorted = [...sessions].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        const activeIndex = sorted.findIndex((s) => s.id === currentSid)

        // Lock if current device is not part of the 2 oldest devices
        if (sessions.length > 2 && (activeIndex === -1 || activeIndex >= 2)) {
          setDeviceLockout(true)
        } else {
          setDeviceLockout(false)

          // Auto-signout check: if our current SID is completely absent from active sessions list
          if (sessions.length > 0 && !sessions.some((s: any) => s.id === currentSid)) {
            clearLocalStorageStates()
            await supabase.auth.signOut({ scope: 'local' })
            window.location.href = '/login'
          }
        }
      }
    } catch (err) {
      console.error('Failed to verify active sessions:', err)
    }
  }

  // Logout / Disconnect actions
  const handleLogoutCurrentDevice = async () => {
    setSessionDisconnecting(true)
    try {
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (err) {
      console.error('Failed to sign out current device:', err)
    } finally {
      setSessionDisconnecting(false)
    }
  }

  const disconnectSession = async (sessionId: string) => {
    setSessionDisconnecting(true)
    try {
      const res = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to disconnect session')
      }

      const updated = loggedSessions.filter(s => s.id !== sessionId)
      setLoggedSessions(updated)

      if (user?.id) {
        await syncUserSession(user.id)
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to disconnect device')
    } finally {
      setSessionDisconnecting(false)
    }
  }

  const disconnectAllOtherSessions = async () => {
    setSessionDisconnecting(true)
    try {
      const res = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          all: true,
          currentSessionId: currentSessionId
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to disconnect other sessions')
      }

      setDeviceLockout(false)
      if (user?.id) {
        await syncUserSession(user.id)
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to disconnect devices')
    } finally {
      setSessionDisconnecting(false)
    }
  }

  // ── Card Workspace Selection ──────────────────────────────────────
  const handleSelectCard = async (card: any) => {
    setActiveCard(card)
    setMessage(null)

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
            await supabase
              .from('card_profiles')
              .update({ is_active: false })
              .eq('card_id', card.id)

            await supabase
              .from('card_profiles')
              .update({ is_active: true })
              .eq('id', primary.id)

            const { data: updated } = await supabase
              .from('card_profiles')
              .select('*')
              .eq('card_id', card.id)
              .order('sort_order', { ascending: true })

            if (updated) {
              currentProfiles = updated
            }
          }
        }

        setCardProfiles(currentProfiles)
        const live = currentProfiles.find((p: any) => p.is_active) || currentProfiles[0] || null
        setActiveProfile(live)

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

  // Reload lists when the active profile switches or when in All Cards view
  useEffect(() => {
    if (activeProfile?.id) {
      fetchProfileLinks(activeProfile.id)
      fetchLeads(activeProfile.id)
      fetchLeadForms(activeProfile.id)
      fetchProfileProducts(activeProfile.id)
      fetchAllAccountProducts()
      fetchProfileFeeds(activeProfile.id)
      fetchAllAccountFeeds()
      fetchAllAccountLinks()
      fetchAllAccountLeadForms()
    } else {
      setProfileLinks([])
      setLeads([])
      setLeadForms([])
      setProfileProducts([])
      setProfileFeeds([])
      
      // If we are in "All Cards" view, fetch account-wide data for all setups
      if (activeCard?.id === 'all' && user?.id) {
        fetchAllAccountProducts()
        fetchAllAccountFeeds()
        fetchAllAccountLinks()
        fetchAllAccountLeadForms()
      }
    }
  }, [activeProfile?.id, activeCard?.id, user?.id])

  // Initial authentication check & account fetching
  const refreshAllData = async () => {
    let active = true
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('envitra_recovery_mode') === 'true') {
        localStorage.removeItem('envitra_recovery_mode')
        await supabase.auth.signOut()
        router.push('/login')
        return
      }

      const { data: { session: authSession }, error: authErr } = await supabase.auth.getSession()
      const authUser = authSession?.user
      if (authErr || !authUser || !authSession) {
        router.push('/login?redirect=/dashboard')
        return
      }

      setUser(authUser)
      let parsedSid = ''
      try {
        const token = authSession.access_token
        if (token) {
          const base64Url = token.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const payload = JSON.parse(window.atob(base64))
          const sidVal = payload.session_id || payload.sid || ''
          if (sidVal) {
            parsedSid = sidVal
            setCurrentSessionId(sidVal)
          }
        }
      } catch (jwtErr) {
        console.error('Failed to parse user session ID:', jwtErr)
      }
      await syncUserSession(authUser.id, parsedSid)

      // Account detail
      const { data: accData } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (accData) {
        setProfile(accData)
        setAccountForm({
          fullName: accData.full_name || '',
          nfcRedirectToDashboard: !!accData.nfc_redirect_to_dashboard,
          agreedToTerms: !!accData.agreed_to_terms
        })
      }

      // Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('account_id', authUser.id)
        .order('created_at', { ascending: false })

      if (ordersData) {
        setUserOrders(ordersData)
      }

      // Cards
      const { data: cardsData, error: cardsErr } = await supabase
        .from('nfc_cards')
        .select('*, order_items(personalisation)')
        .eq('account_id', authUser.id)
        .order('provisioned_at', { ascending: false })

      if (!cardsErr && cardsData) {
        setCards(cardsData)
        
        let cardToSelect = ALL_CARDS_WORKSPACE
        const storedCardId = typeof window !== 'undefined' ? localStorage.getItem('envitra_active_card_id') : null
        if (storedCardId && storedCardId !== 'all') {
          const found = cardsData.find((c: any) => c.id === storedCardId)
          if (found) {
            cardToSelect = found
          }
        }
        await handleSelectCard(cardToSelect)
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshAllData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && typeof window !== 'undefined' && localStorage.getItem('envitra_recovery_mode') === 'true') {
        localStorage.removeItem('envitra_recovery_mode')
        await supabase.auth.signOut()
        router.push('/login')
        return
      }

      if (session?.user) {
        setUser(session.user)
      } else if (!session) {
        router.push('/login?redirect=/dashboard')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 10-Second Active Session heartbeats
  useEffect(() => {
    if (!user?.id) return
    const interval = setInterval(() => {
      syncUserSession(user.id)
    }, 10000)
    return () => clearInterval(interval)
  }, [user?.id, currentSessionId])

  // Realtime Listeners Sync
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('dashboard-realtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts', filter: `id=eq.${user.id}` },
        async (payload) => {
          const { data: accData } = await supabase
            .from('accounts')
            .select('*')
            .eq('id', user.id)
            .single()
          if (accData) {
            setProfile(accData)
            setAccountForm({
              fullName: accData.full_name || '',
              nfcRedirectToDashboard: !!accData.nfc_redirect_to_dashboard,
              agreedToTerms: !!accData.agreed_to_terms
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'nfc_cards', filter: `account_id=eq.${user.id}` },
        async (payload) => {
          const { data: cardsData } = await supabase
            .from('nfc_cards')
            .select('*, order_items(personalisation)')
            .eq('account_id', user.id)
            .order('provisioned_at', { ascending: false })
          if (cardsData) {
            setCards(cardsData)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'card_profiles' },
        (payload) => {
          if (activeCard) handleSelectCard(activeCard)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vcard_details' },
        (payload) => {
          if (activeCard) handleSelectCard(activeCard)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profile_links' },
        (payload) => {
          if (activeProfile?.id) {
            fetchProfileLinks(activeProfile.id, true)
            fetchAllAccountLinks(true)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profile_products' },
        (payload) => {
          if (activeProfile?.id) {
            fetchProfileProducts(activeProfile.id, true)
            fetchAllAccountProducts(true)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profile_feeds' },
        (payload) => {
          if (activeProfile?.id) {
            fetchProfileFeeds(activeProfile.id, true)
            fetchAllAccountFeeds(true)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lead_submissions' },
        (payload) => {
          if (activeProfile?.id) fetchLeads(activeProfile.id, true)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lead_forms' },
        (payload) => {
          if (activeProfile?.id) {
            fetchLeadForms(activeProfile.id, true)
            fetchAllAccountLeadForms(true)
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user?.id, activeCard?.id, activeProfile?.id])

  const isAllCards = activeCard?.id === 'all'

  // Context value compilation
  const contextValue = {
    user,
    setUser,
    profile,
    setProfile,
    cards,
    setCards,
    activeCard,
    setActiveCard,
    handleSelectCard,
    activeProfile,
    setActiveProfile,
    cardProfiles,
    setCardProfiles,
    vcardDataMap,
    setVcardDataMap,
    userOrders,
    setUserOrders,
    lastActivity,
    setLastActivity,
    
    loading,
    setLoading,
    message,
    setMessage,
    messageType,
    setMessageType,

    fetchProfileProducts,
    fetchProfileFeeds,
    fetchProfileLinks,
    fetchLeadForms,
    fetchLeads,

    profileProducts,
    setProfileProducts,
    profileProductsLoading,
    setProfileProductsLoading,
    allAccountProducts,
    setAllAccountProducts,
    allAccountProductsLoading,
    setAllAccountProductsLoading,

    profileFeeds,
    setProfileFeeds,
    profileFeedsLoading,
    setProfileFeedsLoading,
    allAccountFeeds,
    setAllAccountFeeds,
    allAccountFeedsLoading,
    setAllAccountFeedsLoading,

    profileLinks,
    setProfileLinks,
    profileLinksLoading,
    setProfileLinksLoading,
    allAccountLinks,
    setAllAccountLinks,
    allAccountLinksLoading,
    setAllAccountLinksLoading,

    leads,
    setLeads,
    leadsLoading,
    setLeadsLoading,
    leadForms,
    setLeadForms,
    leadFormsLoading,
    setLeadFormsLoading,
    allAccountLeadForms,
    setAllAccountLeadForms,
    allAccountLeadFormsLoading,
    setAllAccountLeadFormsLoading,

    accountForm,
    setAccountForm,
    currentSessionId,
    setCurrentSessionId,
    loggedSessions,
    setLoggedSessions,
    sessionDisconnecting,
    setSessionDisconnecting,

    upgradeModalOpen,
    setUpgradeModalOpen,
    upgradeModalFeature,
    setUpgradeModalFeature,

    refreshAllData
  }

  // ── Loading Fallback ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#3f5ce6]" />
      </div>
    )
  }

  // ── Session limit Lockout view rendering ────────────────────────
  if (deviceLockout) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950 p-4 text-left">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6">
          <div className="flex items-center gap-3.5 text-amber-500">
            <AlertCircle size={36} className="shrink-0" />
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Dashboard Lockout</h2>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-zinc-300 leading-relaxed font-semibold">
              This account is currently active on more than the allowed limit of <strong className="text-white">2 devices</strong>.
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your subscription works like an OTT platform session limit. To access your dashboard from this device, please disconnect one of the other active devices list below.
            </p>
          </div>

          <div className="space-y-3.5">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Device Sessions</h3>
            <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/40">
              {loggedSessions.map((session) => {
                const isCurrent = session.id === currentSessionId
                const { browser, os } = getBrowserAndOS(session.user_agent)
                return (
                  <div key={session.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold text-zinc-200">
                        {getDeviceIcon(os)}
                        <span>{os}</span>
                        <span className="text-zinc-600 font-bold">•</span>
                        <span>{browser}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-[#3f5ce6]/10 text-[#3f5ce6] border border-[#3f5ce6]/20">
                            This Device
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-zinc-500">
                        Last active: {session.updated_at ? new Date(session.updated_at).toLocaleString() : new Date(session.created_at).toLocaleString()}
                      </p>
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => disconnectSession(session.id)}
                        disabled={sessionDisconnecting}
                        className="px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10px] font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {sessionDisconnecting ? (
                          <Loader2 className="animate-spin w-3.5 h-3.5" />
                        ) : (
                          'Disconnect'
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-6 border-t border-zinc-800">
            <button
              onClick={handleLogoutCurrentDevice}
              disabled={sessionDisconnecting}
              className="px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-800/50 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <LogOut size={14} />
              Logout Current Device
            </button>

            <button
              onClick={disconnectAllOtherSessions}
              disabled={sessionDisconnecting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all active:scale-98 disabled:opacity-50 cursor-pointer shadow-md"
            >
              {sessionDisconnecting ? (
                <>
                  <Loader2 className="animate-spin w-3 h-3" /> Disconnecting...
                </>
              ) : (
                'Disconnect Other Devices'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Layout Frame ──────────────────────────────────────────────────
  return (
    <DashboardContext.Provider value={contextValue}>
      <SidebarProvider>
        <TooltipProvider>
          {/* Collapsible Sidebar */}
          <AppSidebar
            activeCard={activeCard}
            cards={cards}
            account={profile}
            handleSelectCard={handleSelectCard}
            onUpgradeClick={() => {
              setUpgradeModalFeature('gated')
              setUpgradeModalOpen(true)
            }}
          />

          {/* Sidebar Inset Layout Shell */}
          <SidebarInset className="bg-background text-foreground flex flex-col h-screen overflow-hidden">
            {/* Sticky Header Bar */}
            <header className="flex h-16 shrink-0 items-center border-b border-border bg-background px-4 sticky top-0 z-30 select-none gap-3">

              {/* ── LEFT: Sidebar trigger + Card workspace dropdown ── */}
              <div className="flex items-center gap-2 shrink-0">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground cursor-pointer shrink-0" />
                <div className="h-4 w-px bg-border shrink-0" />

                {/* Card Workspace Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/70 transition-colors text-xs font-semibold text-foreground cursor-pointer select-none active:scale-98">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#3f5ce6]" />
                      <span className="truncate max-w-[150px] hidden sm:inline">
                        {isAllCards ? 'All Cards' : (activeCard?.card_nickname ? `${activeCard.slug} (${activeCard.card_nickname})` : activeCard?.slug || 'Select Card')}
                      </span>
                      <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 mt-1 border border-border bg-popover text-popover-foreground rounded-xl shadow-2xl p-1.5 space-y-1 z-[100]">
                    <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Workspaces</div>

                    <DropdownMenuItem
                      onClick={() => handleSelectCard(ALL_CARDS_WORKSPACE)}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        isAllCards
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

                    {cards.map((c) => (
                      <DropdownMenuItem
                        key={c.id}
                        onClick={() => handleSelectCard(c)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          activeCard?.id === c.id
                            ? 'bg-[#3f5ce6]/10 text-[#3f5ce6] focus:bg-[#3f5ce6]/10 focus:text-[#3f5ce6] border border-[#3f5ce6]/20'
                            : 'hover:bg-accent focus:bg-accent text-muted-foreground border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className="w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[7px] font-bold text-white uppercase shrink-0"
                            style={{ backgroundColor: c.profile_data?.colorHex || '#3f5ce6' }}
                          >
                            {c.slug.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate flex flex-col items-start leading-none gap-0.5">
                            <span className="font-semibold text-foreground truncate max-w-[140px]">
                              {c.card_nickname || c.slug}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[140px]">
                              {c.slug}
                            </span>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* ── CENTER: Dynamic Breadcrumb ── */}
              <div className="flex-1 flex items-center justify-center">
                <nav className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
                  <span className="font-semibold text-foreground capitalize">
                    {currentTab === 'overview' ? 'Overview'
                      : currentTab === 'card' ? 'My Card'
                      : currentTab === 'profiles' ? 'Profiles'
                      : currentTab === 'vcard' ? 'vCard'
                      : currentTab === 'links' ? 'Manage Links'
                      : currentTab === 'leads' ? 'Leads'
                      : currentTab === 'products' ? 'Products'
                      : currentTab === 'feeds' ? 'Feeds'
                      : currentTab === 'analytics' ? 'Analytics'
                      : currentTab === 'orders' ? 'Orders'
                      : currentTab === 'settings' ? 'Settings'
                      : currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
                  </span>
                </nav>
              </div>

              {/* ── RIGHT: Profile Switcher + Avatar ── */}
              <div className="flex items-center gap-2 shrink-0">

                {/* Profile Switcher — hidden on: overview, card, profiles, vcard, settings */}
                {!isAllCards && cardProfiles.length > 0 && !PROFILE_SWITCHER_HIDDEN_TABS.has(currentTab) && (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/70 transition-colors text-xs font-semibold text-foreground cursor-pointer select-none active:scale-98">
                          {/* Live indicator dot on trigger */}
                          {activeProfile?.is_active && (
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                          )}
                          {activeProfile?.avatar_url ? (
                            <img
                              src={activeProfile.avatar_url}
                              alt={activeProfile.profile_name || 'Profile'}
                              className="w-4 h-4 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-[#3f5ce6]/15 flex items-center justify-center shrink-0">
                              <span className="text-[8px] font-bold text-[#3f5ce6]">
                                {(activeProfile?.profile_name || 'P')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="truncate max-w-[120px] hidden sm:inline">
                            {activeProfile?.profile_name || 'Select Profile'}
                          </span>
                          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 mt-1 border border-border bg-popover text-popover-foreground rounded-xl shadow-2xl p-1.5 space-y-0.5 z-[100]">
                        <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Profiles</div>
                        {cardProfiles.map((p) => {
                          const isSelected = activeProfile?.id === p.id
                          const isLive = p.is_active === true
                          const isPrimary = p.primary_profile === true
                          return (
                            <DropdownMenuItem
                              key={p.id}
                              onClick={() => setActiveProfile(p)}
                              className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#3f5ce6]/10 text-[#3f5ce6] focus:bg-[#3f5ce6]/10 focus:text-[#3f5ce6] border border-[#3f5ce6]/20'
                                  : 'hover:bg-accent focus:bg-accent text-muted-foreground border border-transparent'
                              }`}
                            >
                              {/* Avatar */}
                              {p.avatar_url ? (
                                <img src={p.avatar_url} alt={p.profile_name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <span className="text-[9px] font-bold text-muted-foreground">
                                    {(p.profile_name || 'P')[0].toUpperCase()}
                                  </span>
                                </div>
                              )}

                              {/* Name + display_name */}
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="truncate font-semibold text-foreground">{p.profile_name}</span>
                                {p.display_name && (
                                  <span className="text-[9px] text-muted-foreground truncate">{p.display_name}</span>
                                )}
                              </div>

                              {/* Badges row */}
                              <div className="flex items-center gap-1 shrink-0">
                                {isLive && (
                                  <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-500 bg-emerald-500/10 rounded px-1.5 py-0.5 border border-emerald-500/25">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                    LIVE
                                  </span>
                                )}
                                {isPrimary && (
                                  <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 rounded px-1.5 py-0.5 border border-amber-500/20">
                                    PRIMARY
                                  </span>
                                )}
                                {isSelected && <Check className="size-3 text-[#3f5ce6] shrink-0" />}
                              </div>
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="h-4 w-px bg-border shrink-0" />
                  </>
                )}


                {/* Avatar / account menu */}
                <HeaderProfile />
              </div>
            </header>


            {/* Main scrollable body */}
            <main className="flex-1 overflow-y-auto p-6 relative">
              {/* Alert Message Banner replaced by Sonner Toasts */}
              {children}
            </main>
          </SidebarInset>

          {/* Subscription Upgrade Modal */}
          <UpgradeModal
            isOpen={upgradeModalOpen}
            onClose={() => setUpgradeModalOpen(false)}
            onUpgradeSuccess={(updatedPlan: string, expiresAt: string) => {
              setProfile((prev: any) => ({
                ...prev,
                plan: updatedPlan,
                plan_expires_at: expiresAt,
              }))
              setMessageType('success')
              setMessage(`Account upgraded to Pro successfully! Gated features are now unlocked.`)
            }}
          />
        </TooltipProvider>
      </SidebarProvider>
    </DashboardContext.Provider>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDashboard } from '../context'
import { NfcCardVisual } from '@/components/dashboard/NfcCardVisual'
import { createClient } from '@/lib/supabase/client'
import {
  CreditCard, User, Users, ExternalLink, Contact, Link2,
  ChevronDown, ChevronRight, CheckCircle2, Cpu, FileText, ShoppingBag,
  Rss, MousePointerClick, BookOpen, Star, Sparkles, Trophy, ArrowRight,
  Loader2,
} from 'lucide-react'

/* ─── Checklist definition ───────────────────────────────────── */
const CHECKLIST = [
  {
    id: 'card',
    step: 1,
    label: 'Activate your NFC card',
    desc: 'Enable NFC sharing so your card goes live when tapped.',
    tab: '/dashboard/card',
    icon: Cpu,
    color: '#3f5ce6',
  },
  {
    id: 'profile',
    step: 2,
    label: 'Create your first digital profile',
    desc: 'Build the public page people see when they scan your card.',
    tab: '/dashboard/profiles',
    icon: User,
    color: '#8b5cf6',
  },
  {
    id: 'vcard',
    step: 3,
    label: 'Fill in your vCard contact details',
    desc: 'Add phone, email and address — auto-shared on every tap.',
    tab: '/dashboard/vcard',
    icon: Contact,
    color: '#06b6d4',
  },
  {
    id: 'links',
    step: 4,
    label: 'Add your first social / website link',
    desc: 'Connect Instagram, LinkedIn, portfolio, UPI and more.',
    tab: '/dashboard/links',
    icon: Link2,
    color: '#10b981',
  },
  {
    id: 'leads',
    step: 5,
    label: 'Create a lead capture form',
    desc: 'Let visitors leave their details so you can follow up.',
    tab: '/dashboard/leads',
    icon: FileText,
    color: '#f59e0b',
  },
  {
    id: 'products',
    step: 6,
    label: 'Add a product to your profile',
    desc: 'Showcase what you sell directly on your public page.',
    tab: '/dashboard/products',
    icon: ShoppingBag,
    color: '#ec4899',
  },
  {
    id: 'feeds',
    step: 7,
    label: 'Publish your first feed post',
    desc: 'Share updates, announcements or portfolio pieces.',
    tab: '/dashboard/feeds',
    icon: Rss,
    color: '#14b8a6',
  },
]

/* ─── Guide data ─────────────────────────────────────────── */
const GUIDE_SECTIONS = [
  {
    id: 'workspace',
    icon: CreditCard,
    color: '#3f5ce6',
    title: 'Navigating Your Workspace',
    steps: [
      'Click any card sleeve in the grid below to enter its dedicated dashboard workspace. Each physical card acts as an independent space, keeping its profiles and assets isolated.',
      'Use the workspace selector dropdown in the top header to instantly switch between different card setups without returning to the main overview screen.',
      'Manage card-specific content: Each workspace contains standalone tabs for Profiles, Links, vCards, Products, Feeds, Leads, and real-time Analytics.',
      'View physical card layouts and check NFC configurations directly by opening the Card tab, where you can preview your custom card, download its unique QR code, and verify connection logs.',
    ],
  },
  {
    id: 'activate',
    icon: Cpu,
    color: '#6366f1',
    title: 'Activating Your NFC Card',
    steps: [
      'Navigate to the Card tab inside your active card workspace. Locate the "Card Status" card, which shows if your card is ready to scan or offline.',
      'Activate NFC sharing by toggling the switch to "Active". This enables the Envitra network route for your card, making it live for real-time contact sharing.',
      'Test the tap connection: Hold your physical smart card against any NFC-enabled smartphone (near the top back for iOS or center back for Android). The phone will instantly trigger a browser popup opening your active digital profile page.',
      'Pause sharing anytime: If you lose your card or want to go offline temporarily, toggle NFC sharing to "Paused / Offline". Scans will show a secure placeholder page instead of your contact details.',
    ],
  },
  {
    id: 'profile',
    icon: User,
    color: '#8b5cf6',
    title: 'Creating a Digital Profile',
    steps: [
      'Go to the Profiles tab and click "New Profile". A profile acts as your landing page. You can create multiple profiles (e.g., "Freelance", "Social", "Personal Branding") to suit different networking contexts.',
      'Fill in key brand info: Upload a high-resolution profile photo, cover banner, set a bold professional name, a custom tagline, and add a brief bio summarizing your work.',
      'Set the active landing page: Only one profile can be "Active" at a time per card workspace. Toggling a profile active sets it as the primary target for your NFC tap and QR code scans.',
      'Enable layout sections: Choose which content tabs (links, products, lead capture forms) are visible to your visitors by toggling them in the profile editor.',
    ],
  },
  {
    id: 'vcard',
    icon: Contact,
    color: '#06b6d4',
    title: 'Setting Up Your vCard',
    steps: [
      'Open the vCard tab. Enter your full name, job title, company, work phone, personal phone, emails, and address. This generates an industry-standard .vcf file.',
      'Auto-save on tap: When visitors tap your card or scan your QR code, a "Save Contact" button is prominently displayed at the top of your profile. Clicking this instantly downloads your complete contact card to their phone\'s native address book.',
      'Keep details synced: Whenever you change your number, address, or email in this tab, your live downloaded vCard file updates instantly. You never need to reprint or reconfigure cards.',
    ],
  },
  {
    id: 'links',
    icon: Link2,
    color: '#10b981',
    title: 'Links — Add, Enable & Duplicate',
    steps: [
      'Go to the Links tab. Click "Add Link" and select from social media, custom website URLs, portfolios, PDF files, or payment links (like UPI, Razorpay, or PayPal).',
      'Manage public visibility: Use the toggle switch on any link card to instantly show or hide it on your live page. You can also drag and drop links to rearrange their layout order.',
      'Contextual Link Duplication: If you have created a link (e.g., a portfolio link) in one profile and want to reuse it, click the options menu (⋯) and select "Duplicate to Profile" to copy it to another profile in one click.',
    ],
  },
  {
    id: 'leads',
    icon: Users,
    color: '#f59e0b',
    title: 'Lead Forms — Create, Enable & Manage',
    steps: [
      'Navigate to Leads → Forms and click "New Form". Build custom contact capture fields (e.g., Name, Email, Phone, Company, or custom text questions) to collect visitor info.',
      'Capture leads on scan: Toggling your lead form to "Active" embeds it directly on your public profile page. Scanners can submit their information to connect with you.',
      'Export and follow up: View captured contact data under Leads → Captured. Review response times, add notes, and export your list as a CSV file to import directly into your CRM.',
    ],
  },
  {
    id: 'products',
    icon: ShoppingBag,
    color: '#ec4899',
    title: 'Products — Create, Link & Duplicate',
    steps: [
      'Go to the Products tab and click "Add Product". Upload a product image, set a title, price, description, and buy button redirect link.',
      'Direct inquiries: You can link a custom Lead Form directly to a product. When visitors click to enquire, they fill out a form that logs their specific interest in that item.',
      'Duplicate to other profiles: Reuse your product catalog across different profiles by selecting "Duplicate to Profile" from the product context menu (⋯).',
    ],
  },
  {
    id: 'feeds',
    icon: Rss,
    color: '#14b8a6',
    title: 'Feeds — Post, Manage & Duplicate',
    steps: [
      'Open the Feeds tab and click "New Post". Write updates, write announcements, share portfolio pieces, or write quick news stories, and upload an optional feature image.',
      'Interactive blogging: Published posts are displayed in a clean, scrollable feed section on your public profile, letting visitors read your latest updates without leaving your page.',
      'Archive posts: Toggle the publish status on any post to hide it from your public feed or re-enable it whenever you want.',
    ],
  },
]

/* ─── GuideSection accordion ─────────────────────────────── */
function GuideSection({ section }: { section: typeof GUIDE_SECTIONS[0] }) {
  const [open, setOpen] = useState(false)
  const Icon = section.icon
  return (
    <div className="border border-border/60 rounded-xl overflow-hidden transition-all duration-200">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${section.color}18` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: section.color }} />
          </div>
          <span className="text-xs font-bold text-foreground">{section.title}</span>
        </div>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border/40 bg-muted/10">
          <ol className="space-y-2.5 mt-2">
            {section.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                  style={{ backgroundColor: `${section.color}20`, color: section.color }}
                >
                  {i + 1}
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   OnboardingChecklist — shared component
   mode="hero"    → full-width with progress ring (All Cards view)
   mode="compact" → tighter rows, no ring (Single Workspace view)
───────────────────────────────────────────────────────────────── */
interface ChecklistProps {
  checkState: Record<string, boolean>
  onItemClick: (itemId: string) => void
  mode: 'hero' | 'compact'
}

function OnboardingChecklist({ checkState, onItemClick, mode }: ChecklistProps) {
  const doneCount = CHECKLIST.filter((item) => checkState[item.id] ?? false).length
  const pct = Math.round((doneCount / CHECKLIST.length) * 100)
  const nextIdx = CHECKLIST.findIndex((item) => !(checkState[item.id] ?? false))

  const pendingSteps = CHECKLIST.filter((item) => !(checkState[item.id] ?? false))
  const completedSteps = CHECKLIST.filter((item) => checkState[item.id] ?? false)

  return (
    <div className="relative rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden text-left">

      {/* ── Header ── */}
      <div className={`relative border-b border-border/50 bg-gradient-to-r from-[#3f5ce6]/8 via-transparent to-indigo-500/5 ${mode === 'hero' ? 'px-6 pt-6 pb-5' : 'px-5 pt-4 pb-4'}`}>
        <div className="flex items-center gap-4">
          {/* Left: label + title + subtitle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#3f5ce6]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#3f5ce6]">Setup Guide</span>
            </div>
            {mode === 'hero' && (
              <h3 className="text-base font-black text-foreground tracking-tight animate-pulse">Complete your profile setup</h3>
            )}
            <p className={`text-muted-foreground ${mode === 'hero' ? 'text-xs mt-0.5' : 'text-[11px]'}`}>
              {doneCount === CHECKLIST.length
                ? "You're all set! Your profile is fully configured."
                : `${CHECKLIST.length - doneCount} step${CHECKLIST.length - doneCount !== 1 ? 's' : ''} left to complete your setup.`}
            </p>
          </div>

          {/* Right: progress */}
          {mode === 'hero' ? (
            /* Big circular ring for hero */
            <div className="flex items-center gap-4 shrink-0">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/20" />
                  <circle
                    cx="32" cy="32" r="26" fill="none"
                    stroke="url(#prog-grad)" strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${(pct / 100) * 163.4} 163.4`}
                    className="transition-all duration-700"
                  />
                  <defs>
                    <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3f5ce6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black text-foreground leading-none">{pct}%</span>
                </div>
              </div>
              <div className="text-left">
                <div className="text-xl font-black text-foreground">
                  {doneCount}<span className="text-sm font-bold text-muted-foreground">/{CHECKLIST.length}</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">steps done</div>
                {doneCount === CHECKLIST.length && (
                  <div className="flex items-center gap-1 mt-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-500">Complete!</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Compact pill for single-workspace */
            <div className="shrink-0 flex items-center gap-2">
              <div className="text-right">
                <span className="text-lg font-black text-foreground">{doneCount}</span>
                <span className="text-xs text-muted-foreground font-bold">/{CHECKLIST.length}</span>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#3f5ce6]/10 border border-[#3f5ce6]/20">
                {doneCount === CHECKLIST.length
                  ? <Star className="w-3.5 h-3.5 text-amber-500" />
                  : <span className="text-[10px] font-black text-[#3f5ce6]">{pct}%</span>
                }
              </div>
            </div>
          )}
        </div>

        {/* Progress bar (both modes) */}
        <div className={`w-full h-1.5 bg-muted/30 rounded-full overflow-hidden ${mode === 'hero' ? 'mt-4' : 'mt-3'}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#3f5ce6] to-indigo-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Items Body ── */}
      <div className="p-5 space-y-4">
        {/* Pending Configurations */}
        {pendingSteps.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-wider px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Pending Configurations ({pendingSteps.length})
            </div>
            <div className={mode === 'hero' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
              {pendingSteps.map((item) => {
                const Icon = item.icon
                const isNext = item.id === CHECKLIST[nextIdx]?.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onItemClick(item.id)}
                    className={`w-full text-left group/step flex items-start gap-3 p-3.5 border rounded-xl transition-all cursor-pointer ${
                      isNext
                        ? 'bg-[#3f5ce6]/[0.03] border-[#3f5ce6]/35 hover:border-[#3f5ce6]/50 hover:bg-[#3f5ce6]/[0.06]'
                        : 'bg-card border-border/50 hover:border-border/80 hover:bg-muted/10'
                    }`}
                  >
                    <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10">
                      <Icon className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11.5px] font-black text-foreground block group-hover/step:text-[#3f5ce6] transition-colors leading-tight">
                          {item.label}
                        </span>
                        {isNext && (
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#3f5ce6]/15 text-[#3f5ce6]">
                            Up next
                          </span>
                        )}
                      </div>
                      <p className="text-[9.5px] text-muted-foreground leading-normal mt-1">{item.desc}</p>
                    </div>
                    <div className="shrink-0 self-center opacity-0 group-hover/step:opacity-100 group-hover/step:translate-x-0.5 transition-all text-[#3f5ce6]">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Completed Setup */}
        {completedSteps.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-wider px-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed Setup ({completedSteps.length})
            </div>
            <div className={`grid gap-2 ${mode === 'hero' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {completedSteps.map((item) => {
                return (
                  <button
                    key={item.id}
                    onClick={() => onItemClick(item.id)}
                    className="w-full flex items-center gap-2.5 p-2 bg-muted/20 border border-border/30 rounded-lg hover:border-emerald-500/35 hover:bg-emerald-500/[0.02] transition-all cursor-pointer opacity-75 hover:opacity-100"
                  >
                    <div className="w-5.5 h-5.5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground truncate flex-1 leading-none text-left">
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── All-done banner ── */}
      {doneCount === CHECKLIST.length && (
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-t border-emerald-500/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-black">All Done!</p>
            <p className="text-[11px] text-muted-foreground">All onboarding steps complete. This card workspace is fully configured.</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────── */
export function OverviewTab() {
  const {
    cards,
    activeCard,
    handleSelectCard,
    profile,
    leads,
    cardProfiles,
    profileLinks,
    profileFeeds,
    profileProducts,
    leadForms,
    vcardDataMap,
    allAccountProducts,
    allAccountFeeds,
    allAccountLinks,
    allAccountLeadForms,
  } = useDashboard()

  const router = useRouter()
  const isAllCards = activeCard?.id === 'all'

  const supabase = createClient()
  const [allProfiles, setAllProfiles] = useState<any[]>([])
  const [allVcards, setAllVcards] = useState<any[]>([])
  const [loadingConfig, setLoadingConfig] = useState(false)

  useEffect(() => {
    if (!isAllCards || cards.length === 0) return

    const fetchAllData = async () => {
      setLoadingConfig(true)
      try {
        const cardIds = cards.map((c) => c.id)

        // Fetch all profiles for all cards
        const { data: profilesData, error: profError } = await supabase
          .from('card_profiles')
          .select('*')
          .in('card_id', cardIds)

        if (!profError && profilesData) {
          setAllProfiles(profilesData)

          // Fetch all vcards for these profiles
          const profileIds = profilesData.map((p: any) => p.id)
          if (profileIds.length > 0) {
            const { data: vcardsData, error: vcError } = await supabase
              .from('vcard_details')
              .select('*')
              .in('profile_id', profileIds)

            if (!vcError && vcardsData) {
              setAllVcards(vcardsData)
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch global onboarding config data:', err)
      } finally {
        setLoadingConfig(false)
      }
    }

    fetchAllData()
  }, [isAllCards, cards])

  /* ── Helper to calculate checkState for a single card workspace ── */
  const getCardCheckState = (card: any): Record<string, boolean> => {
    const cardProfilesList = allProfiles.filter((p) => p.card_id === card.id)
    const activeProj = cardProfilesList.find((p) => p.is_active) || cardProfilesList[0]

    const hasVcard = activeProj ? allVcards.some((v) => v.profile_id === activeProj.id) : false
    const hasLinks = activeProj ? allAccountLinks.some((l) => l.profile_id === activeProj.id) : false
    const hasLeads = activeProj ? allAccountLeadForms.some((f) => f.profile_id === activeProj.id) : false
    const hasProducts = activeProj ? allAccountProducts.some((p) => p.profile_id === activeProj.id) : false
    const hasFeeds = activeProj ? allAccountFeeds.some((f) => f.profile_id === activeProj.id) : false

    return {
      card: card.status === 'active',
      profile: cardProfilesList.length > 0,
      vcard: hasVcard,
      links: hasLinks,
      leads: hasLeads,
      products: hasProducts,
      feeds: hasFeeds,
    }
  }

  /* ── Check state (global — all cards) ───────────────────── */
  const globalCheckState: Record<string, boolean> = {
    card:     cards.some((c) => c.status === 'active'),
    profile:  cards.some((c) => allProfiles.some((p) => p.card_id === c.id)),
    vcard:    cards.some((c) => {
      const cardProfs = allProfiles.filter((p) => p.card_id === c.id)
      const activeProj = cardProfs.find((p) => p.is_active) || cardProfs[0]
      return activeProj ? allVcards.some((v) => v.profile_id === activeProj.id) : false
    }),
    links:    cards.some((c) => {
      const cardProfs = allProfiles.filter((p) => p.card_id === c.id)
      const activeProj = cardProfs.find((p) => p.is_active) || cardProfs[0]
      return activeProj ? allAccountLinks.some((l) => l.profile_id === activeProj.id) : false
    }),
    leads:    cards.some((c) => {
      const cardProfs = allProfiles.filter((p) => p.card_id === c.id)
      const activeProj = cardProfs.find((p) => p.is_active) || cardProfs[0]
      return activeProj ? allAccountLeadForms.some((f) => f.profile_id === activeProj.id) : false
    }),
    products: cards.some((c) => {
      const cardProfs = allProfiles.filter((p) => p.card_id === c.id)
      const activeProj = cardProfs.find((p) => p.is_active) || cardProfs[0]
      return activeProj ? allAccountProducts.some((p) => p.profile_id === activeProj.id) : false
    }),
    feeds:    cards.some((c) => {
      const cardProfs = allProfiles.filter((p) => p.card_id === c.id)
      const activeProj = cardProfs.find((p) => p.is_active) || cardProfs[0]
      return activeProj ? allAccountFeeds.some((f) => f.profile_id === activeProj.id) : false
    }),
  }

  /* ── Check state (per-workspace — current active card) ───── */
  const hasVcard   = activeCard?.id ? !!vcardDataMap?.[activeCard.id] : false
  const workspaceCheckState: Record<string, boolean> = {
    card:     activeCard?.status === 'active',
    profile:  (cardProfiles?.length ?? 0) > 0,
    vcard:    hasVcard,
    links:    (profileLinks?.length ?? 0) > 0,
    leads:    (leadForms?.length ?? 0) > 0,
    products: (profileProducts?.length ?? 0) > 0,
    feeds:    (profileFeeds?.length ?? 0) > 0,
  }

  /* ── Derived card targets ────────────────────────────────── */
  const firstNonActiveCard = cards.find((c) => c.status !== 'active')
  const firstActiveCard    = cards.find((c) => c.status === 'active')
  const firstCard          = cards[0]

  /* ── All-cards: select a card then navigate ─────────────── */
  const handleAllCardsClick = (itemId: string) => {
    const targetCard =
      itemId === 'card'
        ? (firstNonActiveCard ?? firstCard)
        : (firstActiveCard ?? firstCard)
    const targetPath = CHECKLIST.find((i) => i.id === itemId)?.tab ?? '/dashboard/overview'
    router.push(targetPath)
    if (targetCard) handleSelectCard(targetCard)
  }

  /* ── Single workspace: just navigate (card already set) ─── */
  const handleWorkspaceClick = (itemId: string) => {
    const targetPath = CHECKLIST.find((i) => i.id === itemId)?.tab ?? '/dashboard/overview'
    router.push(targetPath)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {cards.length > 0 ? (
        isAllCards ? (
          <div className="space-y-6 text-left">
            {/* Welcome */}
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight">
                Welcome to Envitra,{' '}
                <span className="text-[#3f5ce6]">{profile?.full_name?.split(' ')[0] || 'there'}!</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Select a card workspace below to get started. Each card has its own profile, links, leads, and more.
              </p>
            </div>

            {/* Workspaces List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Your Card Workspaces</h3>
                <span className="text-[10px] text-muted-foreground font-bold">{cards.length} card{cards.length !== 1 ? 's' : ''} owned</span>
              </div>

              {loadingConfig ? (
                <div className="flex flex-col items-center justify-center p-12 border border-border/50 bg-card/40 rounded-2xl space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-[#3f5ce6]" />
                  <span className="text-xs text-muted-foreground font-medium">Loading workspace configurations...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cards.map((c) => {
                    const dateToUse = c.provisioned_at || c.activated_at || c.created_at
                    const { day, monthAndYear, formattedDate } = (() => {
                      if (!dateToUse) return { day: '--', monthAndYear: 'N/A', formattedDate: '' }
                      const date = new Date(dateToUse)
                      const d = String(date.getDate()).padStart(2, '0')
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                      const m = months[date.getMonth()]
                      const y = date.getFullYear()
                      const f = `${d} ${m} ${y}`
                      return { day: d, monthAndYear: `${m} ${y}`, formattedDate: f }
                    })()

                    const cardCheck = getCardCheckState(c)
                    const nextStep = CHECKLIST.find((step) => {
                      if (step.id === 'card' && c.status !== 'provisioned') {
                        return false
                      }
                      return !(cardCheck[step.id] ?? false)
                    })

                    return (
                      <div
                        key={c.id}
                        onClick={() => { router.push('/dashboard/card'); handleSelectCard(c) }}
                        className="group relative rounded-3xl border-[6px] border-[#151518] bg-[#151518] overflow-hidden shadow-lg aspect-[1.58/1] cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:border-[#1b1b20] hover:bg-[#1b1b20] select-none"
                      >
                        {/* Background: NFC Card Visual */}
                        <div className="absolute inset-0 w-full h-full transform transition-transform duration-500 group-hover:scale-[1.04]">
                          <NfcCardVisual card={c} className="w-full h-full object-cover" hideText={true} />
                        </div>

                        {/* Pocket SVG Mask Overlay */}
                        <svg
                          className="absolute inset-x-0 bottom-0 w-full h-[70%] drop-shadow-[0_-4px_12px_rgba(0,0,0,0.55)]"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          <path
                            d="M 0,100 L 0,25 L 38,25 Q 43,25 46,28 L 52,36 Q 54,39 58,39 L 100,39 L 100,100 Z"
                            fill="#151518"
                            className="transition-colors duration-200 group-hover:fill-[#1b1b20]"
                          />
                        </svg>

                        {/* Inside Pocket Content */}
                        <div className="absolute inset-0 p-4.5 pointer-events-none">
                          {/* Left: Tab Area (Slug name + "workspace" label) */}
                          <div className="absolute top-[54%] left-[6%] text-left flex flex-col max-w-[45%]">
                            <span className="block text-xs sm:text-sm font-black text-white truncate lowercase tracking-wider leading-none">
                              {c.slug}
                            </span>
                            <span className="block text-[9px] sm:text-[10.5px] text-zinc-400 font-bold lowercase tracking-normal mt-1 opacity-70">
                              workspace
                            </span>
                          </div>

                          {/* Right: Status and Link date */}
                          <div className="absolute top-[64%] right-[6%] text-right flex flex-col items-end max-w-[45%]">
                            {c.status === 'active' ? (
                              <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black text-emerald-400 lowercase tracking-wider leading-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                active
                              </span>
                            ) : c.status === 'provisioned' ? (
                              <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black text-amber-400 lowercase tracking-wider leading-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                provisioned
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black text-red-400 lowercase tracking-wider leading-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                paused
                              </span>
                            )}
                            {formattedDate && (
                              <span className="text-[7.5px] sm:text-[8.5px] text-zinc-400 font-bold tracking-wide mt-1.5 opacity-70 lowercase leading-none">
                                linked on {formattedDate.toLowerCase()}
                              </span>
                            )}
                          </div>

                          {/* Bottom Row: Left (Next Pending Step) & Right (Config Button) */}
                          <div className="absolute bottom-[4%] inset-x-[6%] flex items-center justify-between">
                            {/* Bottom Left: Next pending task details */}
                            {nextStep ? (
                              <div className="flex items-center gap-3 max-w-[70%] text-left">
                                <div
                                  className="shrink-0 w-7.5 h-7.5 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center border shadow-sm"
                                  style={{
                                    backgroundColor: `${nextStep.color}15`,
                                    borderColor: `${nextStep.color}33`
                                  }}
                                >
                                  {React.createElement(nextStep.icon, {
                                    className: "w-3.5 h-3.5 sm:w-4.5 sm:h-4.5",
                                    style: { color: nextStep.color }
                                  })}
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-[10px] sm:text-[12.5px] font-black text-white leading-tight truncate">
                                    {nextStep.label}
                                  </span>
                                  <span className="block text-[8px] sm:text-[9.5px] text-zinc-400 font-bold truncate tracking-normal mt-0.5 max-w-[120px] sm:max-w-[200px]">
                                    {nextStep.desc}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 max-w-[70%] text-left pointer-events-none">
                                <div className="shrink-0 w-7.5 h-7.5 sm:w-9.5 sm:h-9.5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-emerald-400" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-[10px] sm:text-[12.5px] font-black text-emerald-400 leading-tight">
                                    all setup completed
                                  </span>
                                  <span className="block text-[8px] sm:text-[9.5px] text-zinc-400 font-bold mt-0.5">
                                    view workspace to start
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Bottom Right: Setup / View Workspace Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectCard(c)
                                router.push(nextStep ? nextStep.tab : '/dashboard/card')
                              }}
                              className="px-3 py-1.5 sm:px-4.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#3f5ce6] hover:bg-[#3349d0] text-white text-[9.5px] sm:text-[10.5px] font-black transition-colors shadow-sm inline-flex items-center gap-1 cursor-pointer pointer-events-auto shrink-0 border border-white/5 whitespace-nowrap"
                            >
                              {nextStep ? 'Setup' : 'View Workspace'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* User Guide - Bottom Section */}
            <div className="border-t border-border/50 pt-12 mt-16 max-w-6xl mx-auto">
              <div className="text-center space-y-2 mb-12">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#3f5ce6]/10 text-[#3f5ce6] border border-[#3f5ce6]/15">
                  <BookOpen className="w-3.5 h-3.5" /> User Guide & Documentation
                </span>
                <h2 className="text-3xl font-black text-foreground tracking-tight leading-none">
                  Learn How to Optimize Your Smart Cards
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Everything you need to know to set up digital profiles, links, lead captures, and physical taps.
                </p>
              </div>

              <div className="divide-y divide-border/30">
                {GUIDE_SECTIONS.map((section, idx) => {
                  const isTitleLeft = idx % 2 === 1
                  return (
                    <div key={section.id} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center py-12 first:pt-0 last:pb-0">
                      {isTitleLeft ? (
                        <>
                          {/* Title Side */}
                          <div className="lg:col-span-5 text-left space-y-4 lg:sticky lg:top-24 self-start">
                            <div
                              className="rounded-2xl flex items-center justify-center border shadow-sm"
                              style={{
                                width: '44px',
                                height: '44px',
                                backgroundColor: `${section.color}12`,
                                borderColor: `${section.color}25`
                              }}
                            >
                              {React.createElement(section.icon, {
                                className: "w-5 h-5",
                                style: { color: section.color }
                              })}
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-snug">
                              {section.title}
                            </h3>
                            <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                              Follow these steps to fully configure, customize and get the most out of your {section.title.toLowerCase()} setup.
                            </p>
                          </div>

                          {/* Steps Side */}
                          <div className="lg:col-span-7 w-full">
                            <div className="space-y-4">
                              {section.steps.map((step, stepIdx) => (
                                <div
                                  key={stepIdx}
                                  className="flex items-start gap-4 p-4 rounded-2xl bg-card/60 border border-border/40 hover:border-border/80 hover:shadow-md transition-all duration-200"
                                >
                                  <div
                                    className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border"
                                    style={{
                                      backgroundColor: `${section.color}15`,
                                      color: section.color,
                                      borderColor: `${section.color}25`
                                    }}
                                  >
                                    {stepIdx + 1}
                                  </div>
                                  <p className="text-xs sm:text-[12.5px] font-bold text-muted-foreground leading-relaxed mt-1">{step}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Steps Side */}
                          <div className="lg:col-span-7 w-full order-2 lg:order-1">
                            <div className="space-y-4">
                              {section.steps.map((step, stepIdx) => (
                                <div
                                  key={stepIdx}
                                  className="flex items-start gap-4 p-4 rounded-2xl bg-card/60 border border-border/40 hover:border-border/80 hover:shadow-md transition-all duration-200"
                                >
                                  <div
                                    className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border"
                                    style={{
                                      backgroundColor: `${section.color}15`,
                                      color: section.color,
                                      borderColor: `${section.color}25`
                                    }}
                                  >
                                    {stepIdx + 1}
                                  </div>
                                  <p className="text-xs sm:text-[12.5px] font-bold text-muted-foreground leading-relaxed mt-1">{step}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Title Side */}
                          <div className="lg:col-span-5 text-left space-y-4 order-1 lg:order-2 lg:sticky lg:top-24 self-start">
                            <div
                              className="rounded-2xl flex items-center justify-center border shadow-sm"
                              style={{
                                width: '44px',
                                height: '44px',
                                backgroundColor: `${section.color}12`,
                                borderColor: `${section.color}25`
                              }}
                            >
                              {React.createElement(section.icon, {
                                className: "w-5 h-5",
                                style: { color: section.color }
                              })}
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-snug">
                              {section.title}
                            </h3>
                            <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                              Follow these steps to fully configure, customize and get the most out of your {section.title.toLowerCase()} setup.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-10 flex items-start gap-2.5 p-4 rounded-2xl bg-[#3f5ce6]/5 border border-[#3f5ce6]/15 max-w-xl mx-auto">
                <MousePointerClick className="w-4 h-4 text-[#3f5ce6] shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <strong className="text-foreground font-black">Tip:</strong> Most actions (enable, duplicate, link) are in the <strong className="text-foreground font-black">... menu</strong> on each item page.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════
             SINGLE WORKSPACE — Stats + Checklist + Guide
             ══════════════════════════════════════════════════ */
          <div className="space-y-5 text-left">

            {/* ── Workspace Identity Bar ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Card mini-preview → clicking goes to card tab */}
              <div
                className="shrink-0 w-24 rounded-xl overflow-hidden shadow-md ring-1 ring-border/60 cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => router.push('/dashboard/card')}
              >
                <NfcCardVisual card={activeCard} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black border
                    ${activeCard?.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${activeCard?.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {activeCard?.status === 'active' ? 'NFC Active' : 'NFC Inactive'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-muted/50 text-muted-foreground border border-border/50 uppercase">
                    {activeCard?.slug}
                  </span>
                </div>
                <h3 className="text-xl font-black text-foreground tracking-tight truncate">
                  {activeCard?.card_nickname || activeCard?.slug || 'My Workspace'}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {profile?.full_name?.split(' ')[0] || 'Your'}'s workspace — complete the steps below to go live.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => router.push('/dashboard/card')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#3f5ce6] text-white text-[11px] font-bold hover:bg-[#3349d0] transition-colors shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Open Card
                </button>
                {activeCard?.slug && (
                  <Link
                    href={`https://envitra.com/${activeCard.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted/60 text-foreground text-[11px] font-bold hover:bg-muted border border-border/60 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Live Page
                  </Link>
                )}
              </div>
            </div>

            {/* ── Content Stats Grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                {
                  label: 'Profiles',
                  value: cardProfiles?.length ?? 0,
                  icon: User,
                  color: '#8b5cf6',
                  sub: `${cardProfiles?.filter((p: any) => p.is_active)?.length ?? 0} active`,
                  href: '/dashboard/profiles',
                },
                {
                  label: 'vCard',
                  value: hasVcard ? 'Set' : 'Empty',
                  icon: Contact,
                  color: '#06b6d4',
                  sub: hasVcard ? 'contact info ready' : 'not filled yet',
                  href: '/dashboard/vcard',
                  isText: true,
                  done: hasVcard,
                },
                {
                  label: 'Links',
                  value: profileLinks?.length ?? 0,
                  icon: Link2,
                  color: '#10b981',
                  sub: `${profileLinks?.filter((l: any) => l.is_visible)?.length ?? 0} visible`,
                  href: '/dashboard/links',
                },
                {
                  label: 'Lead Forms',
                  value: leadForms?.length ?? 0,
                  icon: FileText,
                  color: '#f59e0b',
                  sub: `${leads.length} leads captured`,
                  href: '/dashboard/leads',
                },
                {
                  label: 'Products',
                  value: profileProducts?.length ?? 0,
                  icon: ShoppingBag,
                  color: '#ec4899',
                  sub: 'in your profile',
                  href: '/dashboard/products',
                },
                {
                  label: 'Feeds',
                  value: profileFeeds?.length ?? 0,
                  icon: Rss,
                  color: '#14b8a6',
                  sub: 'published posts',
                  href: '/dashboard/feeds',
                },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <button
                    key={stat.label}
                    onClick={() => router.push(stat.href)}
                    className="group bg-card border border-border/50 rounded-xl px-4 py-3.5 text-left hover:border-border hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}18` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                      </div>
                      {'done' in stat && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                          stat.done
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-muted/40 text-muted-foreground border-border/50'
                        }`}>{stat.done ? '✓' : '—'}</span>
                      )}
                    </div>
                    <div className={`font-black leading-none mb-0.5 ${stat.isText ? 'text-sm' : 'text-xl'} ${
                      'done' in stat
                        ? stat.done ? 'text-emerald-500' : 'text-amber-500'
                        : 'text-foreground'
                    }`}>
                      {stat.value}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                    <div className="text-[9px] text-muted-foreground/50 mt-0.5 truncate">{stat.sub}</div>
                  </button>
                )
              })}
            </div>

            {/* ── Checklist (3/5) + User Guide (2/5) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
              <div className="lg:col-span-3">
                <OnboardingChecklist
                  checkState={workspaceCheckState}
                  onItemClick={handleWorkspaceClick}
                  mode="compact"
                />
              </div>
              <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                  <BookOpen className="w-4 h-4 text-[#3f5ce6]" />
                  <h4 className="text-xs font-black text-foreground uppercase tracking-wider">User Guide</h4>
                </div>
                <div className="space-y-1.5">
                  {GUIDE_SECTIONS.map((section) => (
                    <GuideSection key={section.id} section={section} />
                  ))}
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#3f5ce6]/5 border border-[#3f5ce6]/15">
                  <MousePointerClick className="w-3.5 h-3.5 text-[#3f5ce6] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Tip:</strong> Most actions (enable, duplicate, link) are in the <strong className="text-foreground">⋯ menu</strong> on each item.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        /* ── No cards ── */
        <div className="text-center py-20 bg-card rounded-xl border border-border space-y-4 max-w-lg mx-auto p-6">
          <div className="w-12 h-12 rounded-full bg-[#3f5ce6]/10 text-[#3f5ce6] flex items-center justify-center mx-auto">
            <CreditCard size={22} />
          </div>
          <h3 className="text-base font-bold text-foreground">No NFC cards owned</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You haven't ordered any smart business cards yet. Explore our store to design your premium NFC cards.
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
  )
}

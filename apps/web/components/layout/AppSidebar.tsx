"use client"

import * as React from "react"
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  User,
  Link2,
  Magnet,
  Package,
  Rss,
  Settings,
  ShoppingBag,
  ChevronLeft,
  Lock,
  Sparkles,
  Contact,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// ── Types ─────────────────────────────────────────────────────────────────────

interface SidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeCard: any
  cards: any[]
  account: any               // { plan: 'free' | 'pro' | 'business' }
  handleSelectCard: (card: any) => void
  onUpgradeClick?: () => void
}

// ── Menu Definitions ──────────────────────────────────────────────────────────

const ALL_CARDS_NAV = [
  { icon: LayoutDashboard, label: 'Overview',  tab: 'overview'  },
  { icon: Package,         label: 'Orders',    tab: 'orders'    },
  { icon: Settings,        label: 'Settings',  tab: 'settings'  },
]

const CARD_NAV = [
  { icon: LayoutDashboard, label: 'Overview',      tab: 'overview',  pro: false },
  { icon: CreditCard,      label: 'Card',          tab: 'card',      pro: false },
  { icon: User,            label: 'Profiles',      tab: 'profiles',  pro: false },
  { icon: Contact,         label: 'v Card',        tab: 'vcard',     pro: false },
  { icon: Link2,           label: 'Manage Links',  tab: 'links',     pro: false },
  { icon: Magnet,          label: 'Leads',         tab: 'leads',     pro: true  },
  { icon: Package,         label: 'Products',      tab: 'products',  pro: true  },
  { icon: Rss,             label: 'Feeds',         tab: 'feeds',     pro: true  },
  { icon: BarChart3,       label: 'Analytics',     tab: 'analytics', pro: false },
  { icon: Settings,        label: 'Settings',      tab: 'settings',  pro: false },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function AppSidebar({ activeCard, cards, account, handleSelectCard, onUpgradeClick, ...props }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const segments = pathname.split('/').filter(Boolean)
  const activeTab = segments[0] === 'dashboard' && segments[1] ? segments[1] : 'overview'

  const isAllCards = !activeCard || activeCard?.id === 'all'
  const isPro = account?.plan === 'pro' || account?.plan === 'business'

  const menuItems = isAllCards ? ALL_CARDS_NAV : CARD_NAV

  const handleBackToAll = () => {
    handleSelectCard({ id: 'all' })
    router.push('/dashboard/overview')
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border" {...props}>

      {/* ── Header: Logo ──────────────────────────────────── */}
      <SidebarHeader className="pb-0">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Expanded: full logo */}
            <div className="group-data-[collapsible=icon]:hidden px-1 py-3 select-none">
              <Logo />
            </div>
            {/* Collapsed: icon only */}
            <div className="hidden group-data-[collapsible=icon]:flex justify-center py-2">
              <img src="/logo.png" alt="Envitra Logo" className="size-7 object-contain" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>


      {/* ── Navigation ────────────────────────────────────── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-0.5">
            {menuItems.map((item) => {
              const isActive = activeTab === item.tab
              const href = (item as any).href || `/dashboard/${item.tab}`
              const isLocked = (item as any).pro && !isPro

              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild={!isLocked}
                    isActive={isActive}
                    tooltip={isLocked ? `${item.label} — Upgrade to Pro` : item.label}
                    className={cn(
                      "rounded-lg font-medium text-sm transition-all duration-150",
                      isActive
                        ? "bg-[#3f5ce6]/10 text-[#3f5ce6] hover:bg-[#3f5ce6]/15"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      isLocked && "opacity-60 cursor-pointer"
                    )}
                    onClick={isLocked ? (e: React.MouseEvent) => {
                      e.preventDefault()
                      onUpgradeClick?.()
                    } : undefined}
                  >
                    {isLocked ? (
                      <div className="flex items-center gap-2 w-full select-none">
                        <item.icon className="size-4 shrink-0" />
                        <span className="flex-1 group-data-[collapsible=icon]:hidden">{item.label}</span>
                        <span className="group-data-[collapsible=icon]:hidden ml-auto flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-500/10 rounded px-1.5 py-0.5 border border-amber-500/20">
                          <Lock className="size-2.5" />
                          PRO
                        </span>
                      </div>
                    ) : (
                      <Link href={href} className="flex items-center gap-2 w-full">
                        <item.icon className="size-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* ── Upgrade Banner (Free users, expanded only) ─── */}
        {!isPro && (
          <div className="group-data-[collapsible=icon]:hidden mx-2 mt-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-500" />
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  Upgrade to Pro
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Unlock Leads, Products, Feeds, 5 profiles per card, and geo analytics.
              </p>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onUpgradeClick?.()
                }}
                className="block w-full text-center py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-colors cursor-pointer"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </SidebarContent>

      {/* ── Footer: Buy Card ──────────────────────────────── */}
      {isAllCards && (
        <SidebarFooter className="pb-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Buy a New Card"
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg font-medium text-sm"
              >
                <Link href="/shop" className="flex items-center gap-2">
                  <CreditCard className="size-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">Buy a New Card</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}

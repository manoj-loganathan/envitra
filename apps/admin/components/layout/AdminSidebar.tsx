'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, CreditCard,
  Users, BarChart3, LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [adminEmail, setAdminEmail] = useState('admin@envitra.in')
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const fetchAdminSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setAdminEmail(session.user.email || 'admin@envitra.in')
      }
      try {
        const res = await fetch('/api/dashboard')
        if (res.ok) {
          const data = await res.json()
          setPendingCount(data.pendingCount || 0)
        }
      } catch (err) {
        console.error('Sidebar count fetch error:', err)
      }
    }
    fetchAdminSession()

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAdminSession())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const menuItems = [
    { name: 'Overview',   href: '/',          icon: LayoutDashboard },
    { name: 'Orders',     href: '/orders',     icon: ShoppingBag,    badge: pendingCount },
    { name: 'NFC Cards',  href: '/cards',      icon: CreditCard },
    { name: 'Users',      href: '/users',      icon: Users },
    { name: 'Analytics',  href: '/analytics',  icon: BarChart3 },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">

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

      {/* ── Nav Items ── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.name}
                    className={cn(
                      "rounded-lg font-medium text-sm transition-all duration-150",
                      isActive
                        ? "bg-[#3f5ce6]/10 text-[#3f5ce6] hover:bg-[#3f5ce6]/15"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <Link href={item.href} className="flex items-center gap-2 w-full">
                      <Icon className="size-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden whitespace-nowrap">{item.name}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={cn(
                          "group-data-[collapsible=icon]:hidden ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                          isActive ? "bg-[#3f5ce6] text-white" : "bg-[#3f5ce6]/25 text-[#3f5ce6]"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer: Admin email + Sign out ── */}
      <SidebarFooter className="pb-3">
        <div className="group-data-[collapsible=icon]:hidden mx-2 mb-2 overflow-hidden">
          <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">Logged in as</p>
          <p className="text-[11px] font-medium text-[var(--text-secondary)] truncate mt-0.5" title={adminEmail}>{adminEmail}</p>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Sign Out"
              className="text-red-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg font-medium text-sm transition-all duration-150"
            >
              <button onClick={handleSignOut} className="flex items-center gap-2 w-full">
                <LogOut className="size-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

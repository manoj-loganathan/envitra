'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Check, Inbox, LayoutDashboard, ShoppingBag, CreditCard, Users, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from './ThemeToggle'
import { SidebarTrigger } from '@/components/ui/sidebar'

import { Separator } from '@/components/ui/separator'

interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbConfig {
  crumbs: Crumb[];
  icon: React.ElementType;
}

// Route → breadcrumb trail config
const routeConfig: Record<string, BreadcrumbConfig> = {
  '/':          { crumbs: [{ label: 'Overview' }],                                          icon: LayoutDashboard },
  '/orders':    { crumbs: [{ label: 'Orders' }],                                             icon: ShoppingBag },
  '/cards':     { crumbs: [{ label: 'NFC Cards' }],                                          icon: CreditCard },
  '/users':     { crumbs: [{ label: 'Users' }],                                              icon: Users },
  '/analytics': { crumbs: [{ label: 'Analytics' }],                                          icon: BarChart3 },
}

function getBreadcrumbs(pathname: string): BreadcrumbConfig {
  // Exact match
  if (routeConfig[pathname]) return routeConfig[pathname]
  // Prefix match (e.g. /orders/123)
  for (const [route, config] of Object.entries(routeConfig)) {
    if (route !== '/' && pathname.startsWith(route)) {
      const sub = pathname.slice(route.length + 1)
      return {
        ...config,
        crumbs: [
          { label: config.crumbs[0].label, href: route },
          { label: sub ? `#${sub}` : config.crumbs[0].label },
        ],
      }
    }
  }
  return { crumbs: [{ label: 'Admin Panel' }], icon: LayoutDashboard }
}

export function AdminHeader() {
  const pathname = usePathname()
  const supabase = createClient()

  const [notifications, setNotifications] = useState<any[]>([])
  const [bellOpen, setBellOpen] = useState(false)

  const { crumbs, icon: RouteIcon } = getBreadcrumbs(pathname)

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setNotifications(data)
  }

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('admin-notifs-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, () => {
        fetchNotifications()
        if (Notification.permission === 'granted') {
          new Notification('Envitra Admin Alert', { body: 'A new event occurred on the dashboard.' })
        }
      })
      .subscribe()

    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => { supabase.removeChannel(channel) }
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAllRead = async () => {
    await supabase.from('admin_notifications').update({ is_read: true }).eq('is_read', false)
    fetchNotifications()
    setBellOpen(false)
  }

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--bg-surface)] flex items-center transition-colors shrink-0">

      {/* ── Left: sidebar trigger + separator ── */}
      <div className="flex items-center gap-2 px-3">
        <SidebarTrigger className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded p-1.5 transition-colors" />
        <Separator orientation="vertical" className="h-5 bg-[var(--border)]" />
      </div>

      {/* ── Center: Dynamic Page Title ── */}
      <div className="flex-1 flex items-center justify-center">
        <span className="text-xs font-semibold text-[var(--text-primary)] select-none">
          {crumbs[crumbs.length - 1]?.label || 'Admin Panel'}
        </span>
      </div>

      {/* ── Right: Theme toggle + Notification bell ── */}
      <div className="flex items-center gap-3 px-4">
        <ThemeToggle />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setBellOpen(!bellOpen)}
            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-purple-600 hover:border-purple-600/30 transition-all cursor-pointer relative"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          {bellOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-2 shadow-lg z-20 space-y-2">
                <div className="flex justify-between items-center px-2 py-1 text-xs">
                  <span className="font-bold text-[var(--text-primary)]">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-purple-600 font-semibold hover:underline flex items-center gap-0.5 text-[10px]"
                    >
                      <Check size={11} /> Mark all read
                    </button>
                  )}
                </div>

                <hr className="border-[var(--border)]" />

                <div className="max-h-60 overflow-y-auto space-y-1.5">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-zinc-500 text-[10px] space-y-1">
                      <Inbox size={18} className="mx-auto text-zinc-400" />
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2 rounded-lg text-[11px] space-y-1 border ${
                          n.is_read
                            ? 'border-transparent text-[var(--text-secondary)]'
                            : 'border-purple-600/10 bg-purple-600/5 text-[var(--text-primary)] font-medium'
                        }`}
                      >
                        <p>{n.body}</p>
                        <p className="text-[9px] text-zinc-500">
                          {new Date(n.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

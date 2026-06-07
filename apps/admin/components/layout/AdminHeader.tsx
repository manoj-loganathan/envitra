'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Check, Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from './ThemeToggle'

export function AdminHeader() {
  const pathname = usePathname()
  const supabase = createClient()

  const [notifications, setNotifications] = useState<any[]>([])
  const [bellOpen, setBellOpen] = useState(false)

  // Get Page Title from Pathname
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard Overview'
    if (pathname.startsWith('/orders')) return 'Order Management'
    if (pathname.startsWith('/cards')) return 'NFC Card Stock'
    if (pathname.startsWith('/users')) return 'User & Subscription Accounts'
    if (pathname.startsWith('/analytics')) return 'Analytics Reports'
    return 'Admin Panel'
  }

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

    // Subscribe to admin notifications real-time insertion
    const channel = supabase
      .channel('admin-notifs-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        () => {
          fetchNotifications()
          // Trigger browser notification
          if (Notification.permission === 'granted') {
            new Notification('Envitra Admin Alert', {
              body: 'A new event occurred on the dashboard.',
            })
          }
        }
      )
      .subscribe()

    // Ask notification permission
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAllRead = async () => {
    await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('is_read', false)
    
    fetchNotifications()
    setBellOpen(false)
  }

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 flex justify-between items-center transition-colors">
      
      <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
        {getPageTitle()}
      </h1>

      <div className="flex items-center gap-4">
        
        <ThemeToggle />

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setBellOpen(!bellOpen)}
            className="p-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-purple-600 transition-all cursor-pointer relative"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          {bellOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setBellOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-72 rounded-card border border-[var(--border)] bg-[var(--bg-surface)] p-2 shadow-lg z-20 space-y-2">
                <div className="flex justify-between items-center px-2 py-1 text-xs">
                  <span className="font-bold text-[var(--text-primary)]">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead}
                      className="text-purple-600 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      <Check size={12} /> Mark all read
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
                        className={`p-2 rounded-btn text-[11px] space-y-1 border ${
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

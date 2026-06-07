'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, ShoppingBag, CreditCard, 
  Users, BarChart3, LogOut 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

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
      
      // Fetch pending orders count
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_production')

      if (count !== null) setPendingCount(count)
    }
    fetchAdminSession()

    // Realtime channel for order status updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchAdminSession()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const menuItems = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Orders', href: '/orders', icon: ShoppingBag, badge: pendingCount },
    { name: 'NFC Cards', href: '/cards', icon: CreditCard },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <aside className="w-56 fixed left-0 top-0 bottom-0 bg-[#0A0A0A] border-r border-zinc-900 text-white flex flex-col justify-between p-4 z-40 transition-colors">
      
      <div className="space-y-8">
        {/* Brand Header */}
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-6 h-6 rounded bg-gradient-primary flex items-center justify-center shadow-purple-sm">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M4 8 C4 5.8 5.8 4 8 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M2 8 C2 4.7 4.7 2 8 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <circle cx="8" cy="8" r="1.5" fill="white"/>
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight">envitra</span>
            <span className="text-[9px] font-semibold text-purple-400 block -mt-1 uppercase tracking-wider">admin</span>
          </div>
        </div>

        {/* Sidebar Nav items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-btn text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-primary text-white shadow-purple-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    isActive ? 'bg-white text-purple-600' : 'bg-purple-600 text-white animate-pulse'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Admin Profile bottom block */}
      <div className="border-t border-zinc-900 pt-4 space-y-3">
        <div className="px-2">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Logged in as</p>
          <p className="text-[11px] font-medium text-zinc-300 truncate mt-0.5" title={adminEmail}>
            {adminEmail}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-btn text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  )
}

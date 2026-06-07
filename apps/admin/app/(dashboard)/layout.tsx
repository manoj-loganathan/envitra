'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        // Check if user is in public.admin_users
        const { data, error } = await supabase
          .from('admin_users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (error || !data) {
          console.warn('User not in admin_users database: logging out.')
          await supabase.auth.signOut()
          router.push('/login?error=unauthorized')
        } else {
          setAuthorized(true)
        }
      } catch (err) {
        console.error('Admin verification error:', err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-600" />
      </div>
    )
  }

  if (!authorized) return null

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-200 antialiased flex">
        
        {/* Sidebar Left fixed navigation */}
        <AdminSidebar />

        {/* Content Shell */}
        <div className="flex-grow ml-56 flex flex-col min-h-screen">
          <AdminHeader />
          <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
            {children}
          </main>
        </div>

      </div>
    </ThemeProvider>
  )
}

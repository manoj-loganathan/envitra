'use client'

import { useParams, useRouter } from 'next/navigation'
import { useDashboard } from '../context'
import { OverviewTab } from '../_components/OverviewTab'
import { CardTab } from '../_components/CardTab'
import { ProfilesTab } from '../_components/ProfilesTab'
import { VCardTab } from '../_components/VCardTab'
import { LinksTab } from '../_components/LinksTab'
import { ProductsTab } from '../_components/ProductsTab'
import { FeedsTab } from '../_components/FeedsTab'
import { LeadsTab } from '../_components/LeadsTab'
import { AnalyticsTab } from '../_components/AnalyticsTab'
import { OrdersTab } from '../_components/OrdersTab'
import { SettingsTab } from '../_components/SettingsTab'
import { useEffect } from 'react'

export default function TabPage() {
  const { tab } = useParams()
  const router = useRouter()
  const { loading, activeCard } = useDashboard()

  const activeTab = (Array.isArray(tab) ? tab[0] : tab) || 'overview'

  // Tab permissions check mirroring previous parameters logic
  useEffect(() => {
    if (!loading) {
      if (activeCard?.id === 'all') {
        if (!['overview', 'orders', 'settings'].includes(activeTab)) {
          router.replace('/dashboard/overview')
        }
      } else {
        if (['orders'].includes(activeTab)) {
          router.replace('/dashboard/overview')
        }
      }
    }
  }, [loading, activeCard, activeTab, router])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#3f5ce6]" size={32} />
        <p className="text-xs text-muted-foreground mt-2 font-semibold">Loading dashboard...</p>
      </div>
    )
  }

  // Pre-render boundary check to avoid flash rendering of gated views
  if (activeCard?.id === 'all' && !['overview', 'orders', 'settings'].includes(activeTab)) {
    return null
  }
  if (activeCard?.id !== 'all' && ['orders'].includes(activeTab)) {
    return null
  }

  switch (activeTab) {
    case 'overview': return <OverviewTab />
    case 'card': return <CardTab />
    case 'profiles': return <ProfilesTab />
    case 'vcard': return <VCardTab />
    case 'links': return <LinksTab />
    case 'products': return <ProductsTab />
    case 'feeds': return <FeedsTab />
    case 'leads': return <LeadsTab />
    case 'analytics': return <AnalyticsTab />
    case 'orders': return <OrdersTab />
    case 'settings': return <SettingsTab />
    default: return <OverviewTab />
  }
}

// Simple loader icon placeholder
function Loader2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      className={`animate-spin ${className || ''}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={size}
      height={size}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

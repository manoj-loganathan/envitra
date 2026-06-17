'use client'

import React, { useState, useEffect } from 'react'
import { useDashboard } from '../context'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import {
  BarChart3, Calendar, Lock, Sparkles, Smartphone, Tablet, Laptop, Globe, Loader2, ArrowRight
} from 'lucide-react'

import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { formatPrice } from '@/lib/utils'

export function AnalyticsTab() {
  const {
    user,
    profile,
    activeCard,
    cards,
    cardProfiles,
    activeProfile
  } = useDashboard()

  const supabase = createClient()
  const isAllCards = activeCard?.id === 'all'

  // Local States
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsRange, setAnalyticsRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d')
  const [analyticsCustomDate, setAnalyticsCustomDate] = useState<any>(undefined)

  const getEarliestCardDate = () => {
    if (activeCard?.id === 'all') {
      if (cards && cards.length > 0) {
        const dates = cards.map(c => c.created_at ? new Date(c.created_at).getTime() : Date.now())
        return new Date(Math.min(...dates))
      }
      return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    }
    return activeCard?.created_at ? new Date(activeCard.created_at) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  }

  const fetchAnalyticsData = async () => {
    if (!user?.id) return
    setAnalyticsLoading(true)
    try {
      let days = 30
      let startDateISO = ''
      let endDateISO = ''

      if (analyticsRange === 'custom' && analyticsCustomDate?.from) {
        const start = new Date(analyticsCustomDate.from)
        start.setHours(0, 0, 0, 0)
        const end = analyticsCustomDate.to ? new Date(analyticsCustomDate.to) : new Date()
        end.setHours(23, 59, 59, 999)
        
        startDateISO = start.toISOString()
        endDateISO = end.toISOString()
        
        const diffTime = Math.abs(end.getTime() - start.getTime())
        days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
      } else {
        const presetDays = analyticsRange === '7d' ? 7 : analyticsRange === '90d' ? 90 : 30
        days = presetDays
        const start = new Date()
        start.setDate(start.getDate() - presetDays)
        start.setHours(0, 0, 0, 0)
        startDateISO = start.toISOString()
        endDateISO = new Date().toISOString()
      }

      // 1. Fetch taps
      let tapsQuery = supabase
        .from('card_taps')
        .select('*')
        .gte('tapped_at', startDateISO)
        .lte('tapped_at', endDateISO)

      if (isAllCards) {
        const cardIds = cards.map((c: any) => c.id).filter(Boolean)
        if (cardIds.length > 0) {
          tapsQuery = tapsQuery.in('card_id', cardIds)
        } else {
          tapsQuery = tapsQuery.eq('card_id', '00000000-0000-0000-0000-000000000000')
        }
      } else {
        tapsQuery = tapsQuery.eq('card_id', activeCard.id)
        if (activeProfile?.id) {
          tapsQuery = tapsQuery.eq('profile_id', activeProfile.id)
        }
      }

      const { data: tapsData, error: tapsErr } = await tapsQuery
      if (tapsErr) throw tapsErr

      // 2. Fetch link clicks (raw log records)
      let clicksQuery = supabase
        .from('link_clicks')
        .select('link_id, profile_id, clicked_at')
        .gte('clicked_at', startDateISO)
        .lte('clicked_at', endDateISO)

      const profileIds = isAllCards
        ? cardProfiles.map((p: any) => p.id).filter(Boolean)
        : (activeProfile?.id ? [activeProfile.id] : cardProfiles.filter((p: any) => p.card_id === activeCard.id).map((p: any) => p.id))

      if (profileIds.length > 0) {
        clicksQuery = clicksQuery.in('profile_id', profileIds)
      } else {
        clicksQuery = clicksQuery.eq('profile_id', '00000000-0000-0000-0000-000000000000')
      }

      const { data: clicksData, error: clicksErr } = await clicksQuery
      if (clicksErr) throw clicksErr

      // 3. Fetch lead submissions
      let leadsQuery = supabase
        .from('lead_submissions')
        .select('*')
        .gte('submitted_at', startDateISO)
        .lte('submitted_at', endDateISO)

      if (profileIds.length > 0) {
        leadsQuery = leadsQuery.in('profile_id', profileIds)
      } else {
        leadsQuery = leadsQuery.eq('profile_id', '00000000-0000-0000-0000-000000000000')
      }

      const { data: leadsData, error: leadsErr } = await leadsQuery
      if (leadsErr) throw leadsErr

      // 4. Fetch social links from profile_links (joining social_links to read platforms/labels/URLs)
      let linksQuery = supabase
        .from('profile_links')
        .select('*, social_links(*)')

      if (profileIds.length > 0) {
        linksQuery = linksQuery.in('profile_id', profileIds)
      } else {
        linksQuery = linksQuery.eq('profile_id', '00000000-0000-0000-0000-000000000000')
      }
      const { data: allLinksData } = await linksQuery

      // 5. Fetch profile products
      let productsQuery = supabase
        .from('profile_products')
        .select('*')

      if (profileIds.length > 0) {
        productsQuery = productsQuery.in('profile_id', profileIds)
      } else {
        productsQuery = productsQuery.eq('profile_id', '00000000-0000-0000-0000-000000000000')
      }
      const { data: allProductsData } = await productsQuery

      // Check if we have real taps. If 0, indicate there is no data.
      if (!tapsData || tapsData.length === 0) {
        setAnalyticsData({
          hasNoData: true
        })
      } else {
        // Process real database analytics
        const timelineMap: Record<string, { taps: number, clicks: number, leads: number }> = {}
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date()
          if (analyticsRange === 'custom' && analyticsCustomDate?.from) {
            const end = analyticsCustomDate.to ? new Date(analyticsCustomDate.to) : new Date()
            d.setTime(end.getTime() - i * 24 * 60 * 60 * 1000)
          } else {
            d.setDate(d.getDate() - i)
          }
          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          timelineMap[dateStr] = { taps: 0, clicks: 0, leads: 0 }
        }

        tapsData.forEach((t: any) => {
          const dateStr = new Date(t.tapped_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (timelineMap[dateStr]) {
            timelineMap[dateStr].taps++
          }
        })

        clicksData.forEach((c: any) => {
          const dateStr = new Date(c.clicked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (timelineMap[dateStr]) {
            timelineMap[dateStr].clicks++
          }
        })

        leadsData.forEach((l: any) => {
          const dateStr = new Date(l.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (timelineMap[dateStr]) {
            timelineMap[dateStr].leads++
          }
        })

        const timeline = Object.entries(timelineMap).map(([date, val]) => ({
          date,
          taps: val.taps,
          clicks: val.clicks,
          leads: val.leads,
        }))

        const totalTapsCount = tapsData.length
        const totalClicksCount = clicksData.length  // link_clicks table is the single source of truth
        const totalLeadsCount = leadsData.length
        const uniqueVisitorsCount = new Set(tapsData.map((t: any) => t.ip_address).filter(Boolean)).size || Math.round(totalTapsCount * 0.75)

        // OS aggregates
        const osMap: Record<string, number> = {}
        tapsData.forEach((t: any) => {
          const key = t.os || 'Other'
          osMap[key] = (osMap[key] || 0) + 1
        })
        const osColors: Record<string, string> = {
          'iOS': '#3f5ce6', 'Android': '#10b981', 'Windows': '#8b5cf6', 'macOS': '#f59e0b', 'Other': '#6b7280'
        }
        const osList = Object.entries(osMap).map(([label, count]) => ({
          label,
          count,
          pct: totalTapsCount > 0 ? Math.round((count / totalTapsCount) * 100) : 0,
          color: osColors[label] || '#6b7280'
        })).sort((a, b) => b.count - a.count)

        // Device aggregates
        const deviceMap: Record<string, number> = {}
        tapsData.forEach((t: any) => {
          const key = t.device_type ? (t.device_type.charAt(0).toUpperCase() + t.device_type.slice(1)) : 'Other'
          deviceMap[key] = (deviceMap[key] || 0) + 1
        })
        const deviceColors: Record<string, string> = {
          'Mobile': '#3f5ce6', 'Desktop': '#10b981', 'Tablet': '#f59e0b', 'Other': '#6b7280'
        }
        const deviceList = Object.entries(deviceMap).map(([label, count]) => ({
          label,
          count,
          pct: totalTapsCount > 0 ? Math.round((count / totalTapsCount) * 100) : 0,
          color: deviceColors[label] || '#6b7280'
        })).sort((a, b) => b.count - a.count)

        // Browser aggregates
        const browserMap: Record<string, number> = {}
        tapsData.forEach((t: any) => {
          const key = t.browser || 'Other'
          browserMap[key] = (browserMap[key] || 0) + 1
        })
        const browserColors: Record<string, string> = {
          'Safari': '#3f5ce6', 'Chrome': '#10b981', 'Firefox': '#8b5cf6', 'Edge': '#f59e0b', 'Other': '#6b7280'
        }
        const browserList = Object.entries(browserMap).map(([label, count]) => ({
          label,
          count,
          pct: totalTapsCount > 0 ? Math.round((count / totalTapsCount) * 100) : 0,
          color: browserColors[label] || '#6b7280'
        })).sort((a, b) => b.count - a.count)

        // Geographic aggregates
        const locMap: Record<string, { city: string, country: string, count: number }> = {}
        tapsData.forEach((t: any) => {
          if (!t.city && !t.country) return
          const key = `${t.city || 'Unknown'}, ${t.country || 'Unknown'}`
          if (!locMap[key]) {
            locMap[key] = { city: t.city || 'Unknown', country: t.country || 'Unknown', count: 0 }
          }
          locMap[key].count++
        })
        const locationList = Object.values(locMap).map((loc) => ({
          city: loc.city,
          country: loc.country,
          count: loc.count,
          pct: totalTapsCount > 0 ? Math.round((loc.count / totalTapsCount) * 100) : 0
        })).sort((a, b) => b.count - a.count).slice(0, 5)

        // Link clicks aggregates
        const linkMap: Record<string, any> = {}
        clicksData.forEach((c: any) => {
          linkMap[c.link_id] = (linkMap[c.link_id] || 0) + 1
        })

        const linksList = (allLinksData || [])
          .filter((link: any) => link.social_links)
          .map((link: any) => {
            // Use only link_clicks event log — profile_links.click_count is a
            // denormalized cache incremented by the same trigger, so adding both
            // would double the count.
            const clicks = linkMap[link.link_id] || 0
            return {
              platform: link.social_links.platform,
              label: link.social_links.label || link.social_links.platform,
              url: link.social_links.url,
              clicks,
              pct: 0
            }
          })
        const maxClicks = Math.max(...linksList.map(l => l.clicks), 1)
        linksList.forEach(l => {
          l.pct = Math.round((l.clicks / maxClicks) * 100)
        })
        linksList.sort((a, b) => b.clicks - a.clicks)

        // Top products aggregates
        const productsList = (allProductsData || []).map((prod: any) => {
          const views = prod.view_count || 0
          const clicks = prod.click_count || 0
          const ctr = views > 0 ? Math.round((clicks / views) * 100) : 0
          const leads = (leadsData || []).filter((l: any) => 
            (prod.enquiry_form_id && l.form_id === prod.enquiry_form_id) || 
            (l.product_id === prod.id)
          ).length
          return {
            name: prod.name,
            views,
            clicks,
            ctr,
            leads
          }
        }).sort((a, b) => b.clicks - a.clicks).slice(0, 5)

        const totalProductViews = (allProductsData || []).reduce((sum: number, p: any) => sum + (p.view_count || 0), 0)
        const totalProductClicks = (allProductsData || []).reduce((sum: number, p: any) => sum + (p.click_count || 0), 0)

        setAnalyticsData({
          isSimulated: false,
          summary: {
            totalTaps: totalTapsCount,
            uniqueVisitors: uniqueVisitorsCount,
            linkClicks: totalClicksCount,
            leadsCaptured: totalLeadsCount,
            conversionRate: totalTapsCount > 0 ? Math.round((totalLeadsCount / totalTapsCount) * 100) : 0,
            productViews: totalProductViews,
            productClicks: totalProductClicks,
          },
          timeline,
          os: osList,
          devices: deviceList,
          browsers: browserList,
          locations: locationList,
          topLinks: linksList.slice(0, 5),
          topProducts: productsList,
        })
      }
    } catch (err) {
      console.error('Failed to load analytics metrics:', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [user, activeCard, activeProfile, analyticsRange, analyticsCustomDate])

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="hidden sm:block">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            Analytics 
            {analyticsData && !analyticsData.hasNoData && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Analytics
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAllCards
              ? 'Aggregated activity data across all smart cards'
              : `Card: ${activeCard?.slug}${activeProfile ? ` · Profile: ${activeProfile.profile_name}` : ''}`}
          </p>
        </div>
        {/* Date range */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button 
                key={r} 
                onClick={() => {
                  setAnalyticsRange(r)
                  setAnalyticsCustomDate(undefined)
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  analyticsRange === r 
                    ? 'bg-[#3f5ce6] text-white shadow-sm' 
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-card border border-border ${
                  analyticsRange === 'custom' 
                    ? 'border-[#3f5ce6] text-[#3f5ce6] bg-[#3f5ce6]/5' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Calendar className="h-3 w-3" />
                {analyticsCustomDate?.from ? (
                  analyticsCustomDate.to ? (
                    <>
                      {format(analyticsCustomDate.from, "MMM dd")} - {format(analyticsCustomDate.to, "MMM dd")}
                    </>
                  ) : (
                    format(analyticsCustomDate.from, "MMM dd")
                  )
                ) : (
                  <span>Custom Date</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={analyticsCustomDate?.from || new Date()}
                selected={analyticsCustomDate}
                onSelect={(range: any) => {
                  setAnalyticsCustomDate(range)
                  if (range?.from) {
                    setAnalyticsRange('custom')
                  }
                }}
                numberOfMonths={2}
                disabled={(date) => {
                  const earliest = getEarliestCardDate()
                  return date > new Date() || date < earliest
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {analyticsLoading && !analyticsData ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3f5ce6]" />
          <p className="text-xs text-muted-foreground font-semibold">Loading real-time analytics...</p>
        </div>
      ) : !analyticsData ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border space-y-4 max-w-lg mx-auto p-6">
          <div className="w-12 h-12 rounded-full bg-[#3f5ce6]/10 text-[#3f5ce6] flex items-center justify-center mx-auto">
            <BarChart3 size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">No Analytics Loaded</h4>
            <p className="text-xs text-muted-foreground">
              Failed to fetch analytics metrics or setup timeline. Please refresh the dashboard.
            </p>
          </div>
        </div>
      ) : analyticsData.hasNoData ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border space-y-4 max-w-lg mx-auto p-6 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-[#3f5ce6]/10 text-[#3f5ce6] flex items-center justify-center mx-auto">
            <BarChart3 size={20} />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-foreground">No Analytics Data Yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed font-medium">
              Your digital profile hasn't received any taps or interactions yet. Share your profile URL or scan your physical card to start capturing live analytics!
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Taps', value: analyticsData.summary.totalTaps, trend: '+12%', color: '#3f5ce6', desc: 'NFC card tap scans' },
              { label: 'Unique Visitors', value: analyticsData.summary.uniqueVisitors, trend: '+8%', color: '#10b981', desc: 'Distinct IP addresses' },
              { label: 'Link Clicks', value: analyticsData.summary.linkClicks, trend: '+19%', color: '#f59e0b', desc: 'Social profile redirects' },
              { label: 'Leads Captured', value: analyticsData.summary.leadsCaptured, trend: '+5%', color: '#8b5cf6', desc: 'Lead form entries' },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-5 space-y-2 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <span className="text-2xl font-black text-foreground block mt-1 leading-none">{s.value}</span>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div className="flex items-end justify-between">
                    <span className="text-[9px] text-muted-foreground">{s.desc}</span>
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 rounded px-1.5 py-0.5">{s.trend}</span>
                  </div>
                  <div className="flex items-end gap-0.5 h-6">
                    {[35, 60, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm opacity-70" style={{ height: `${h}%`, backgroundColor: s.color }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tap timeline chart */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Tap Timeline — {
                  analyticsRange === 'custom' 
                    ? 'Custom Range' 
                    : `Last ${analyticsRange === '7d' ? '7' : analyticsRange === '90d' ? '90' : '30'} Days`
                }
              </h4>
              <span className="text-[10px] font-medium text-muted-foreground">
                Hover bars to view details
              </span>
            </div>
            <div className="h-40 flex items-end gap-1 sm:gap-1.5 border-b border-border pb-2 relative">
              {analyticsData.timeline.map((day: any, i: number) => {
                const maxTaps = Math.max(...analyticsData.timeline.map((d: any) => d.taps), 1)
                const hPct = Math.max(5, Math.min(100, (day.taps / maxTaps) * 100))
                const isLast = i === analyticsData.timeline.length - 1
                return (
                  <div key={i} className="flex-1 group relative cursor-pointer h-full flex flex-col justify-end">
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-popover border border-border rounded-lg shadow-xl p-2.5 text-[10px] font-semibold text-popover-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-20 whitespace-nowrap min-w-[120px]">
                      <p className="border-b border-border pb-1 mb-1 font-bold text-foreground">{day.date}</p>
                      <div className="flex justify-between gap-4 mt-0.5">
                        <span className="text-muted-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#3f5ce6]" /> Taps:</span>
                        <span className="font-extrabold text-foreground">{day.taps}</span>
                      </div>
                      <div className="flex justify-between gap-4 mt-0.5">
                        <span className="text-muted-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" /> Clicks:</span>
                        <span className="font-extrabold text-foreground">{day.clicks}</span>
                      </div>
                      <div className="flex justify-between gap-4 mt-0.5">
                        <span className="text-muted-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" /> Leads:</span>
                        <span className="font-extrabold text-foreground">{day.leads}</span>
                      </div>
                    </div>
                    {/* Bar */}
                    <div
                      className={`w-full rounded-t transition-all group-hover:opacity-100 group-hover:scale-y-105 duration-150 ${isLast ? 'opacity-100' : 'opacity-65'}`}
                      style={{ height: `${hPct}%`, backgroundColor: '#3f5ce6' }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground font-bold uppercase">
              <span>{analyticsData.timeline[0]?.date}</span>
              <span>{analyticsData.timeline[Math.floor(analyticsData.timeline.length / 2)]?.date}</span>
              <span>{analyticsData.timeline[analyticsData.timeline.length - 1]?.date}</span>
            </div>
          </div>

          {/* Device + OS + Browser breakdown row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Device breakdown */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Device Breakdown</h4>
              <div className="space-y-4">
                {analyticsData.devices.map((d: any) => (
                  <div key={d.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.label}
                      </span>
                      <span className="font-bold text-muted-foreground text-[10px]">{d.count} taps · <span style={{ color: d.color }}>{d.pct}%</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                    </div>
                  </div>
                ))}
              </div>
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
              <div className={`space-y-4 ${!(profile?.plan === 'pro' || profile?.plan === 'business') ? 'opacity-30 pointer-events-none select-none' : ''}`}>
                {analyticsData.os.map((d: any) => (
                  <div key={d.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.label}
                      </span>
                      <span className="font-bold text-muted-foreground text-[10px]">{d.count} taps · <span style={{ color: d.color }}>{d.pct}%</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Browser breakdown */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Web Browsers</h4>
              <div className="space-y-4">
                {analyticsData.browsers.map((d: any) => (
                  <div key={d.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.label}
                      </span>
                      <span className="font-bold text-muted-foreground text-[10px]">{d.count} taps · <span style={{ color: d.color }}>{d.pct}%</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Geo Location Breakdown & Top Links Clicked Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Geographic locations */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Geographic Tap Performance</h4>
              <div className="space-y-3">
                {analyticsData.locations.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No location tap data logged yet.</p>
                ) : (
                  analyticsData.locations.map((loc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs border-b border-border/40 pb-2 last:border-0 last:pb-0">
                      <div>
                        <span className="font-bold text-foreground">{loc.city}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">{loc.country}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground">{loc.count} taps</span>
                        <span className="font-black text-[#3f5ce6] w-8 text-right">{loc.pct}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Links Clicked */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Top Links Clicked</h4>
              <div className="space-y-3">
                {analyticsData.topLinks.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No link clicks logged yet.</p>
                ) : (
                  analyticsData.topLinks.map((l: any, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-xs font-bold text-foreground w-28 shrink-0 truncate">{l.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-[#3f5ce6]" style={{ width: `${l.pct}%` }} />
                      </div>
                      <span className="text-xs font-black text-[#3f5ce6] w-12 text-right shrink-0">{l.clicks} clicks</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Catalog Products Performance */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Product Catalog Engagement (CTR)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground font-bold text-[10px] uppercase">
                    <th className="pb-3 w-1/2">Product Offering</th>
                    <th className="pb-3 text-center">Views</th>
                    <th className="pb-3 text-center">Clicks</th>
                    <th className="pb-3 text-center">Leads</th>
                    <th className="pb-3 text-right">Click-Through Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {analyticsData.topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">No catalog product performance logged yet.</td>
                    </tr>
                  ) : (
                    analyticsData.topProducts.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/10">
                        <td className="py-3 font-bold text-foreground">{p.name}</td>
                        <td className="py-3 text-center text-muted-foreground font-semibold">{p.views}</td>
                        <td className="py-3 text-center text-muted-foreground font-semibold">{p.clicks}</td>
                        <td className="py-3 text-center text-muted-foreground font-semibold">{p.leads || 0}</td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-1.5 font-black text-foreground">
                            <span className={`w-1.5 h-1.5 rounded-full ${p.ctr > 20 ? 'bg-emerald-500' : p.ctr > 10 ? 'bg-blue-500' : 'bg-amber-500'}`} />
                            {p.ctr}%
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

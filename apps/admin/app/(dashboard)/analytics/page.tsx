'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Loader2, DollarSign, Calendar, CreditCard, Award } from 'lucide-react'

const COLORS = ['#7C3AED', '#A855F7', '#C084FC', '#047857', '#F59E0B']

export default function AdminAnalyticsPage() {
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    mrr: 0,
    cardsShipped: 0,
    activeCards: 0,
  })

  const [revenueData, setRevenueData] = useState<any[]>([])
  const [statusData, setStatusData] = useState<any[]>([])
  const [planData, setPlanData] = useState<any[]>([])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics')
      if (res.ok) {
        const data = await res.json()

        if (data.revSummary && data.revSummary.length > 0) {
          const formattedRev = data.revSummary.map((r: any) => ({
            date: new Date(r.day_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
            revenue: r.daily_revenue_paise,
          })).reverse()
          setRevenueData(formattedRev)
        } else {
          setRevenueData([])
        }

        if (data.statusSummary && data.statusSummary.length > 0) {
          const formattedStatus = data.statusSummary.map((s: any) => ({
            name: s.status.replace('_', ' ').toUpperCase(),
            value: s.status_count,
          }))
          setStatusData(formattedStatus)
        } else {
          setStatusData([])
        }

        if (data.accountsPlans && data.accountsPlans.length > 0) {
          const plans = data.accountsPlans.reduce((acc: any, cur: any) => {
            acc[cur.plan] = (acc[cur.plan] || 0) + 1
            return acc
          }, {})
          
          setPlanData([
            { name: 'Free Tier', value: plans.free || 0 },
            { name: 'Pro Tier', value: plans.pro || 0 },
            { name: 'Business Tier', value: plans.business || 0 },
          ])

          // MRR
          const calculatedMrr = (plans.pro || 0) * 19900 // 199 paise

          setKpis({
            totalRevenue: data.totalRevenue || 0,
            mrr: calculatedMrr || 0,
            cardsShipped: data.totalCards || 0,
            activeCards: data.activeCards || 0,
          })
        } else {
          setPlanData([])
          setKpis({
            totalRevenue: data.totalRevenue || 0,
            mrr: 0,
            cardsShipped: data.totalCards || 0,
            activeCards: data.activeCards || 0,
          })
        }
      } else {
        throw new Error('Analytics API failed')
      }
    } catch (err) {
      console.error(err)
      setRevenueData([])
      setStatusData([])
      setPlanData([])
      setKpis({
        totalRevenue: 0,
        mrr: 0,
        cardsShipped: 0,
        activeCards: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchAnalytics()
  }, [])

  if (!mounted || loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    )
  }

  const kpiCards = [
    { name: 'All-Time Revenue', value: formatPrice(kpis.totalRevenue), icon: DollarSign, desc: 'Accumulated paid invoices.' },
    { name: 'MRR (Pro Users)', value: formatPrice(kpis.mrr), icon: Calendar, desc: 'Monthly subscription recurrences.' },
    { name: 'NFC Cards Shipped', value: kpis.cardsShipped, icon: CreditCard, desc: 'Provisioned stock shipments.' },
    { name: 'Active Tapped Profiles', value: kpis.activeCards, icon: Award, desc: 'Cards with active tap setup.' },
  ]

  return (
    <div className="space-y-8">
      
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">Platform Analytics</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Track revenue summaries, monthly MRR growth, and order status percentages.</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div 
              key={card.name}
              className="p-6 rounded-card border border-[var(--border)] bg-[var(--bg-surface)] flex gap-4 items-center"
            >
              <div className="w-10 h-10 rounded-btn flex items-center justify-center bg-purple-600/10 text-purple-600 shrink-0">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">{card.name}</p>
                <p className="text-xl font-bold text-[var(--text-primary)] mt-0.5">{card.value}</p>
                <p className="text-[9px] text-[var(--text-muted)] mt-1">{card.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Daily Revenue Bar Chart (2 columns width) */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Revenue (Last 30 Days)</h3>
          <div className="h-72 w-full text-xs">
            {revenueData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-[var(--border)] rounded-card bg-[var(--bg-muted)]/10">
                <DollarSign size={24} className="text-zinc-600 opacity-60" />
                <p className="text-xs font-semibold text-[var(--text-primary)]">No Revenue Data</p>
                <p className="text-[10px] text-[var(--text-muted)]">There is no revenue data recorded for this period.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `₹${val/100000}k`}
                  />
                  <Tooltip 
                    formatter={(val: any) => [formatPrice(val), 'Revenue']}
                    contentStyle={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Plan Distribution Pie Chart (1 column width) */}
        <div className="bg-[var(--bg-surface)] p-6 rounded-card border border-[var(--border)] shadow-sm space-y-4 flex flex-col justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Active Profile Plans</h3>
          {planData.length === 0 || planData.reduce((sum, item) => sum + item.value, 0) === 0 ? (
            <div className="h-60 w-full text-xs flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-[var(--border)] rounded-card bg-[var(--bg-muted)]/10">
              <Calendar size={24} className="text-zinc-600 opacity-60" />
              <p className="text-xs font-semibold text-[var(--text-primary)]">No Active Profiles</p>
              <p className="text-[10px] text-[var(--text-muted)]">There are no user plan subscriptions in the system.</p>
            </div>
          ) : (
            <>
              <div className="h-60 w-full text-xs flex justify-center items-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Label */}
                <div className="absolute text-center">
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {planData.reduce((sum, item) => sum + item.value, 0)}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Total Users</p>
                </div>
              </div>

              {/* Custom Legends list */}
              <div className="space-y-1.5 text-xs text-[var(--text-secondary)] pt-4 border-t border-[var(--border)]">
                {planData.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-bold text-[var(--text-primary)]">{item.value} users</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

    </div>
  )
}

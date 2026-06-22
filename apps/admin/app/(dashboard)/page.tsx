'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Truck, 
  ArrowRight, 
  CreditCard, 
  Search,
  Filter,
  RefreshCw,
  Award,
  Clock,
  Package,
  Check,
  ChevronLeft,
  ChevronRight,
  Settings,
  ArrowDown,
  ArrowUp,
  X
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts'


const SUBSCRIBED_TABLES = ['orders', 'nfc_cards', 'accounts']

export default function AdminOverviewPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Search & Filter stats for recent orders
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingProduction: 0,
    pendingPayment: 0,
    inProductionCount: 0,
    dispatchedCount: 0,
    usersFree: 0,
    usersPro: 0,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [salesTrend, setSalesTrend] = useState<any[]>([])
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [billingSchedules, setBillingSchedules] = useState<any[]>([])

  useEffect(() => {
    queueMicrotask(() => {
      // Read from localStorage on mount
      const saved = localStorage.getItem('envitra_audio_alerts')
      if (saved !== null) {
        setAudioEnabled(saved === 'true')
      }
    })
  }, [])



  const playOrderChime = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      
      const playBeep = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0.15, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.05)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + duration)
      }
      
      playBeep(523.25, ctx.currentTime, 0.15) // C5
      playBeep(659.25, ctx.currentTime + 0.12, 0.25) // E5
    } catch (err) {
      console.warn('Failed to play audio chime:', err)
    }
  }

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true)
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalOrders: data.totalOrders || 0,
          pendingProduction: data.pendingProduction || 0,
          pendingPayment: data.pendingPayment || 0,
          inProductionCount: data.inProductionCount || 0,
          dispatchedCount: data.dispatchedCount || 0,
          usersFree: data.usersFree || 0,
          usersPro: data.usersPro || 0,
        })
        setRecentOrders(data.recentOrders || [])
        setSalesTrend(data.salesTrend || [])
        setBillingSchedules(data.billingSchedules || [])
      } else {
        throw new Error('API request failed')
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRealtimeEvent = (payload: any, tableName: string) => {
    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
    const record = payload.new || payload.old
    let message = `${eventType} event on table "${tableName}"`
    
    if (tableName === 'orders') {
      const orderNum = record?.order_number || 'N/A'
      const status = record?.status || 'pending'
      const total = record?.total_inr ? formatPrice(record.total_inr) : 'N/A'
      if (eventType === 'INSERT') {
        message = `🛒 Order ${orderNum} created for ${total}`
        if (audioEnabled) {
          playOrderChime()
        }
        if (Notification.permission === 'granted') {
          new Notification(`New Order ${orderNum}`, {
            body: `Amount: ${total}`,
          })
        }
      } else if (eventType === 'UPDATE') {
        message = `🔄 Order ${orderNum} status changed to "${status.replace('_', ' ')}"`
      } else if (eventType === 'DELETE') {
        message = `🗑️ Order ${orderNum} was deleted`
      }
    } else if (tableName === 'nfc_cards') {
      const cardId = record?.id || 'N/A'
      const cardStatus = record?.status || 'N/A'
      if (eventType === 'INSERT') {
        message = `💳 NFC Card #${cardId} registered`
      } else if (eventType === 'UPDATE') {
        message = `🔄 NFC Card #${cardId} status changed to "${cardStatus}"`
      } else if (eventType === 'DELETE') {
        message = `🗑️ NFC Card #${cardId} was deleted`
      }
    } else if (tableName === 'accounts') {
      const email = record?.email || 'N/A'
      const plan = record?.plan || 'free'
      if (eventType === 'INSERT') {
        message = `👤 User registered: ${email}`
      } else if (eventType === 'UPDATE') {
        message = `🔄 User ${email} tier changed to "${plan.toUpperCase()}"`
      } else if (eventType === 'DELETE') {
        message = `🗑️ User account ${email} was deleted`
      }
    }

    console.log(message)
    fetchDashboardData(true)
  }

  useEffect(() => {
    queueMicrotask(() => {
      fetchDashboardData()
    })
  }, [])

  useEffect(() => {
    if (SUBSCRIBED_TABLES.length === 0) {
      return
    }

    const channel = supabase.channel('admin-realtime-console')
    
    SUBSCRIBED_TABLES.forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        (payload) => {
          handleRealtimeEvent(payload, table)
        }
      )
    })

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioEnabled])





  // Filtered orders list mapping
  const filteredOrders = useMemo(() => {
    return recentOrders.filter(order => {
      const matchSearch = 
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shipping_address?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchStatus = statusFilter === 'all' || order.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [recentOrders, searchTerm, statusFilter])

  const formattedSalesTrend = useMemo(() => {
    return salesTrend.map(item => {
      try {
        const parsedDate = new Date(`${item.date}, ${new Date().getFullYear()}`)
        const weekday = parsedDate.toLocaleDateString('en-US', { weekday: 'short' })
        return {
          ...item,
          displayDate: weekday || item.date
        }
      } catch (e) {
        return {
          ...item,
          displayDate: item.date
        }
      }
    })
  }, [salesTrend])

  const avgRevenue = useMemo(() => {
    if (!salesTrend.length) return 0
    const sum = salesTrend.reduce((acc, curr) => acc + (curr.revenue || 0), 0)
    return sum / salesTrend.length
  }, [salesTrend])

  // Initial display circles builder
  const getInitials = (name?: string) => {
    if (!name) return 'C'
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'pending_payment':
      case 'pending_production':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
      case 'in_production':
        return 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
      case 'dispatched':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
      case 'delivered':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
      default:
        return 'bg-red-500/10 text-red-500 border border-red-500/20'
    }
  }

  const formatDateToDot = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      const d = new Date(dateString)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}.${month}.${year}`
    } catch (e) {
      return 'N/A'
    }
  }

  const getAvatarColors = (name?: string) => {
    const defaultColor = 'bg-zinc-500 text-white border border-zinc-600/10'
    if (!name) return defaultColor
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = [
      'bg-indigo-500 text-white border border-indigo-600/10',
      'bg-emerald-500 text-white border border-emerald-600/10',
      'bg-rose-500 text-white border border-rose-600/10',
      'bg-amber-500 text-white border border-amber-600/10',
      'bg-blue-500 text-white border border-blue-600/10',
      'bg-purple-500 text-white border border-purple-600/10',
      'bg-teal-500 text-white border border-teal-600/10'
    ]
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 flex items-center justify-center shrink-0">
            <ArrowDown className="w-5 h-5" />
          </div>
        )
      case 'dispatched':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30 flex items-center justify-center shrink-0">
            <ArrowUp className="w-5 h-5" />
          </div>
        )
      case 'in_production':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 border border-purple-100/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30 flex items-center justify-center shrink-0">
            <ArrowUp className="w-5 h-5" />
          </div>
        )
      case 'pending_payment':
      case 'pending_production':
        return (
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 border border-amber-100/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 border border-red-100/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 flex items-center justify-center shrink-0">
            <X className="w-5 h-5" />
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Title & Realtime Pulse Connection Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">Overview Command Center</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Realtime workspace performance diagnostics and operations inventory ledger.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchDashboardData()} 
            disabled={refreshing || loading}
            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
            title="Force refresh database snapshot"
          >
            <RefreshCw size={15} className={refreshing || loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse select-none">
          {/* ── Left Column: Activity & Orders ── */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Skeleton Card 1: Activity */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-6 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-5 w-24 bg-[var(--border)] rounded" />
                  <div className="h-3 w-40 bg-[var(--border)] rounded" />
                </div>
              </div>
              <div className="h-10 w-32 bg-[var(--border)] rounded mt-1" />
              <div className="h-[150px] w-full bg-[var(--border)]/30 rounded-lg mt-2 flex items-end gap-2 p-2">
                <div className="h-[20%] w-full bg-[var(--border)]/70 rounded" />
                <div className="h-[40%] w-full bg-[var(--border)]/70 rounded" />
                <div className="h-[30%] w-full bg-[var(--border)]/70 rounded" />
                <div className="h-[80%] w-full bg-[var(--border)]/70 rounded" />
                <div className="h-[50%] w-full bg-[var(--border)]/70 rounded" />
                <div className="h-[90%] w-full bg-[var(--border)]/70 rounded" />
                <div className="h-[60%] w-full bg-[var(--border)]/70 rounded" />
              </div>
            </div>

            {/* Skeleton Card 2: Orders List */}
            <div className="flex flex-col gap-2.5">
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[32px] p-3 flex items-center gap-3.5 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-[var(--border)] shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-3 w-28 bg-[var(--border)] rounded" />
                      <div className="h-2 w-20 bg-[var(--border)] rounded" />
                    </div>
                    <div className="text-right shrink-0 space-y-2 flex flex-col items-end">
                      <div className="h-3 w-12 bg-[var(--border)] rounded" />
                      <div className="h-2.5 w-16 bg-[var(--border)] rounded" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end px-1">
                <div className="h-3 w-16 bg-[var(--border)] rounded" />
              </div>
            </div>
          </div>

          {/* ── Middle & Right Columns (col-span-2) ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Top Row: Progress statistics & Memberships */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Skeleton Card 3: Progress statistics */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-6 shadow-sm flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-[var(--border)] rounded" />
                  <div className="h-3 w-48 bg-[var(--border)] rounded" />
                </div>
                <div className="h-10 w-24 bg-[var(--border)] rounded mt-2" />
                <div className="h-2 w-full bg-[var(--border)] rounded-full mt-2" />
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[var(--border)]/40 mt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-[var(--border)]" />
                      <div className="h-3 w-6 bg-[var(--border)] rounded" />
                      <div className="h-2 w-12 bg-[var(--border)] rounded" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Skeleton Card 4: Membership Distribution */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-6 shadow-sm flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-[var(--border)] rounded" />
                  <div className="h-3 w-full bg-[var(--border)] rounded" />
                  <div className="h-3 w-5/6 bg-[var(--border)] rounded" />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="h-3 w-16 bg-[var(--border)] rounded" />
                  <div className="flex -space-x-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-6 w-6 rounded-full bg-[var(--border)] ring-2 ring-[var(--bg-surface)]" />
                    ))}
                  </div>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="h-2 w-full bg-[var(--border)] rounded-full" />
                  <div className="flex justify-between">
                    <div className="h-2.5 w-16 bg-[var(--border)] rounded" />
                    <div className="h-2.5 w-16 bg-[var(--border)] rounded" />
                  </div>
                </div>
                <div className="h-10 w-full bg-[var(--border)] rounded-xl mt-2" />
              </div>

            </div>

            {/* Skeleton Card 5: My Schedule */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[32px] p-5 flex flex-col justify-between h-[130px]">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="h-2.5 w-32 bg-[var(--border)] rounded" />
                        <div className="h-4 w-24 bg-[var(--border)] rounded" />
                        <div className="h-3 w-20 bg-[var(--border)] rounded" />
                      </div>
                      <div className="w-9 h-9 rounded-full bg-[var(--border)] shrink-0" />
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="h-3 w-24 bg-[var(--border)] rounded" />
                      <div className="h-3 w-16 bg-[var(--border)] rounded" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end px-1">
                <div className="h-3 w-16 bg-[var(--border)] rounded" />
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Dashboard Grid Layout inspired by Mockup ── */}
        
        {/* ── Left Column: Activity & Orders ── */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Card 1: Activity (Revenue Bar Chart) */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-6 shadow-sm flex flex-col gap-4 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-[var(--text-primary)]">Activity</h3>
                <p className="text-[10px] text-[var(--text-muted)]">7-day gross sales activity telemetry</p>
              </div>
            </div>

            {(() => {
              const totalWeeklyRevenue = salesTrend.reduce((acc, curr) => acc + (curr.revenue || 0), 0)
              // Format with comma instead of dot to match the mockup visual style
              const totalRevK = (totalWeeklyRevenue / 1000).toFixed(1).replace('.', ',')
              return (
                <div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)] leading-none">
                    ₹{totalRevK}
                  </div>
                  <p className="text-[9px] text-[var(--text-muted)] font-semibold mt-1">Revenue generated</p>
                </div>
              )
            })()}

            <div className="h-[150px] w-full select-none mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={formattedSalesTrend} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="var(--text-muted)" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={5}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(37, 99, 235, 0.03)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value as number
                        return (
                          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md px-2 py-1 text-[9px] font-bold text-[#2563eb] shadow-sm">
                            {formatPrice(val)}
                          </div>
                        )
                      }
                      return null
                    }}
                  />

                  <Bar 
                    dataKey="revenue" 
                    radius={[4, 4, 0, 0]} 
                    barSize={16}
                    minPointSize={4}
                  >
                    {formattedSalesTrend.map((entry, index) => {
                      const maxVal = Math.max(...formattedSalesTrend.map(d => d.revenue || 0))
                      const isMax = entry.revenue === maxVal && maxVal > 0
                      // Active/Max day is dark blue, others are soft blue
                      const fill = isMax ? '#2563eb' : '#93c5fd'
                      return <Cell key={`cell-${index}`} fill={fill} />
                    })}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Orders List */}
          <div className="flex flex-col gap-2.5 text-left">
            <div className="space-y-2">
              {recentOrders.slice(0, 4).map((order) => {
                const qty = Math.max(1, Math.round((order.total_inr || 49900) / 49900))
                return (
                  <div 
                    key={order.id} 
                    className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[32px] p-3 flex items-center gap-3.5 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    {/* Customer Initials Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${getAvatarColors(order.shipping_address?.fullName)}`}>
                      {getInitials(order.shipping_address?.fullName)}
                    </div>

                    {/* Customer & Order Metadata */}
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-xs text-[var(--text-primary)] truncate leading-tight">
                        {order.shipping_address?.fullName || 'Anonymous Customer'}
                      </p>
                      <p className="text-[9px] text-[var(--text-muted)] font-bold mt-0.5 truncate flex items-center gap-1 leading-none">
                        <CreditCard size={11} className="shrink-0 text-[var(--text-muted)]" />
                        {order.order_number} • {qty} {qty === 1 ? 'card' : 'cards'}
                      </p>
                    </div>

                    {/* Price & Date */}
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-[var(--text-primary)] leading-tight">
                        {formatPrice(order.total_inr)}
                      </p>
                      <p className="text-[9px] text-[var(--text-muted)] font-bold mt-1 leading-none">
                        {formatDateToDot(order.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end items-center px-1 mt-1">
              <Link 
                href="/orders" 
                className="text-[10px] font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 hover:underline transition-colors cursor-pointer"
              >
                view more &rarr;
              </Link>
            </div>
          </div>

        </div>

        {/* ── Middle & Right Columns (col-span-2) ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Top Row: Progress statistics & Memberships */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 3: Progress statistics */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-6 shadow-sm text-left flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[var(--text-primary)]">Progress statistics</h3>
                <p className="text-[10px] text-[var(--text-muted)]">NFC Card production workflow metrics</p>
              </div>

              {(() => {
                const pendingProdCount = stats.pendingProduction || 0
                const inProdCount = stats.inProductionCount || 0
                const dispatchedCount = stats.dispatchedCount || 0
                
                const total = pendingProdCount + inProdCount + dispatchedCount
                const pendingProdPercent = total > 0 ? Math.round((pendingProdCount / total) * 100) : 0
                const inProdPercent = total > 0 ? Math.round((inProdCount / total) * 100) : 0
                const dispatchedPercent = total > 0 ? Math.round((dispatchedCount / total) * 100) : 0
                
                const totalCompleted = stats.totalOrders > 0 
                  ? Math.round(((stats.totalOrders - stats.pendingProduction - stats.pendingPayment) / stats.totalOrders) * 100) 
                  : 80

                return (
                  <>
                    <div className="mt-2">
                      <div className="text-4xl font-black text-[var(--text-primary)] tracking-tight">
                        {totalCompleted}% <span className="text-xs font-semibold text-[var(--text-muted)] lowercase">total activity</span>
                      </div>
                    </div>

                    {/* 3-Segment Progress Bar */}
                    <div className="h-2 w-full bg-[var(--bg-muted)] rounded-full overflow-hidden flex mt-2">
                      <div className="h-full bg-blue-600" style={{ width: `${pendingProdPercent}%` }} title={`Pending: ${pendingProdPercent}%`} />
                      <div className="h-full bg-emerald-500" style={{ width: `${inProdPercent}%` }} title={`in production: ${inProdPercent}%`} />
                      <div className="h-full bg-orange-500" style={{ width: `${dispatchedPercent}%` }} title={`dispached: ${dispatchedPercent}%`} />
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-[var(--text-muted)] font-bold px-1">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> {pendingProdPercent}%</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {inProdPercent}%</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> {dispatchedPercent}%</span>
                    </div>

                    {/* Circular Badges grid with Link routing */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[var(--border)]/40 mt-2 text-center">
                      <Link 
                        href="/orders?status=pending_production" 
                        className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:bg-blue-700 transition-colors">
                          <Clock size={15} />
                        </div>
                        <span className="text-sm font-black text-[var(--text-primary)]">{pendingProdCount}</span>
                        <span className="text-[9px] text-[var(--text-muted)] font-bold mt-0.5 group-hover:text-blue-600 transition-colors">Pending</span>
                      </Link>

                      <Link 
                        href="/orders?status=in_production" 
                        className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
                      >
                        <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:bg-emerald-600 transition-colors">
                          <Settings size={15} />
                        </div>
                        <span className="text-sm font-black text-[var(--text-primary)]">{inProdCount}</span>
                        <span className="text-[9px] text-[var(--text-muted)] font-bold mt-0.5 group-hover:text-emerald-500 transition-colors">in production</span>
                      </Link>

                      <Link 
                        href="/orders?status=dispatched" 
                        className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
                      >
                        <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:bg-orange-600 transition-colors">
                          <Truck size={15} />
                        </div>
                        <span className="text-sm font-black text-[var(--text-primary)]">{dispatchedCount}</span>
                        <span className="text-[9px] text-[var(--text-muted)] font-bold mt-0.5 group-hover:text-orange-500 transition-colors">dispached</span>
                      </Link>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Card 4: Membership Tier Distribution */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-6 shadow-sm text-left flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-lg font-black text-[var(--text-primary)]">Membership Distribution</h4>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    Track and manage subscriber metrics across active user accounts. Pro and Business subscriptions unlock premium NFC template blocks and custom CSS styles.
                  </p>
                </div>
              </div>

              {(() => {
                const totalUsers = stats.usersPro + stats.usersFree
                const proPercent = totalUsers > 0 ? Math.round((stats.usersPro / totalUsers) * 100) : 75

                return (
                  <div className="space-y-4">
                    {/* Avatars with Pro on left, Free on right, and Total at the end */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Participants</span>
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {/* Pro user avatars */}
                        <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white font-bold text-[8px] ring-2 ring-[var(--bg-surface)]">RS</div>
                        <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[8px] ring-2 ring-[var(--bg-surface)]">PN</div>
                        {/* Free user avatars */}
                        <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-zinc-400 text-white font-bold text-[8px] ring-2 ring-[var(--bg-surface)]">AV</div>
                        <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-zinc-500 text-white font-bold text-[8px] ring-2 ring-[var(--bg-surface)]">SD</div>
                        {/* Total Count avatar */}
                        <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-extrabold text-[7px] ring-2 ring-[var(--bg-surface)]">
                          +{totalUsers || 12}
                        </div>
                      </div>
                    </div>

                    {/* Single progress bar for both ratio */}
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-[var(--bg-muted)] rounded-full overflow-hidden flex shadow-inner">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${proPercent}%` }} title={`Pro: ${proPercent}%`} />
                        <div className="h-full bg-zinc-400 dark:bg-zinc-600" style={{ width: `${100 - proPercent}%` }} title={`Free: ${100 - proPercent}%`} />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-bold">
                        <span className="text-blue-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {proPercent}% Pro ({stats.usersPro || 8})
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                          {100 - proPercent}% Free ({stats.usersFree || 4})
                        </span>
                      </div>
                    </div>

                    <Link 
                      href="/users" 
                      className="w-full text-center py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 font-bold text-xs transition-opacity mt-2 flex items-center justify-center gap-1.5 shadow"
                    >
                      Manage subscriber directory
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                )
              })()}
            </div>

          </div>

          {/* Card 5: My Schedule (Account Expiries & Billing) */}
          <div className="flex flex-col gap-3 text-left">
            {(() => {
              const activeSchedules = billingSchedules.length > 0 
                ? billingSchedules.map((acc, i) => {
                    const expDate = new Date(acc.plan_expires_at)
                    const diffTime = expDate.getTime() - Date.now()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    
                    let durationText = ''
                    let badgeText = ''
                    
                    if (diffDays < 0) {
                      durationText = `Expired ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'} ago`
                      badgeText = 'Grace Period'
                    } else if (diffDays === 0) {
                      durationText = 'Expiring Today'
                      badgeText = 'Renewal Due'
                    } else {
                      durationText = `Expiring in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`
                      badgeText = 'Active Plan'
                    }
                    
                    return {
                      id: acc.id || `db-${i}`,
                      full_name: acc.full_name || acc.email.split('@')[0],
                      email: acc.email,
                      plan: acc.plan,
                      durationText,
                      badgeText,
                      cardsCount: acc.nfc_cards?.length || 0
                    }
                  })
                : [
                    {
                      id: 'mock-1',
                      full_name: 'Rohan Sharma',
                      email: 'rohan.sharma@gmail.com',
                      plan: 'pro',
                      durationText: 'Expiring in 2 Days',
                      badgeText: 'Renewal Due',
                      cardsCount: 2
                    },
                    {
                      id: 'mock-2',
                      full_name: 'Priya Nair',
                      email: 'priya.nair@outlook.com',
                      plan: 'business',
                      durationText: 'Billing Tomorrow',
                      badgeText: 'Auto-Renew',
                      cardsCount: 5
                    },
                    {
                      id: 'mock-3',
                      full_name: 'Amit Verma',
                      email: 'amit.verma@yahoo.com',
                      plan: 'pro',
                      durationText: 'Expired 1 Day Ago',
                      badgeText: 'Grace Period',
                      cardsCount: 1
                    },
                    {
                      id: 'mock-4',
                      full_name: 'Suresh Kumar',
                      email: 'suresh.kumar@gmail.com',
                      plan: 'pro',
                      durationText: 'Expiring in 10 Days',
                      badgeText: 'Active Plan',
                      cardsCount: 3
                    }
                  ]

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeSchedules.slice(0, 4).map((sched) => (
                    <div 
                      key={sched.id} 
                      className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[32px] p-5 flex flex-col justify-between h-auto shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      {/* Top Row: Welcome Header with Email, Name/Details, and Right Avatar */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-[10px] text-[var(--text-muted)] font-extrabold truncate tracking-wider leading-none">
                            {sched.email.toLowerCase()}
                          </p>
                          <h4 className="text-sm font-black text-[var(--text-primary)] truncate mt-1.5 leading-none">
                            {sched.full_name}
                          </h4>
                          <p className="text-[10px] text-[var(--text-muted)] font-bold mt-2 leading-none flex items-center gap-1">
                            <CreditCard size={11} className="shrink-0 text-[var(--text-muted)]" />
                            {sched.cardsCount} • {sched.plan === 'business' ? 'Business' : 'Individual'}
                          </p>
                        </div>

                        {/* Right side avatar */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${getAvatarColors(sched.full_name)}`}>
                          {getInitials(sched.full_name)}
                        </div>
                      </div>

                      {/* Middle Row: Duration & Status Link */}
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold">
                          {sched.durationText}
                        </span>
                        <span className={`text-[10px] font-extrabold hover:underline transition-all cursor-pointer ${
                          sched.badgeText === 'Active Plan' || sched.badgeText === 'Auto-Renew'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {sched.badgeText}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}

            <div className="flex justify-end items-center px-1 mt-1">
              <Link 
                href="/users" 
                className="text-[10px] font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 hover:underline transition-colors cursor-pointer"
              >
                view users &rarr;
              </Link>
            </div>
          </div>

        </div>

      </div>
      )}

    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, cn } from '@/lib/utils'
import { Search, Loader2, ShoppingBag, Clock, Settings, Truck, Package, ChevronDown, Copy, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export default function AdminOrdersPage() {
  const supabase = createClient()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (e: React.MouseEvent, orderNumber: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(orderNumber)
    setCopiedId(orderNumber)
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      } else {
        setOrders([])
      }
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()

    // Realtime changes listener for order list updates
    const channel = supabase
      .channel('admin-orders-list-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const statusParam = params.get('status')
      const validStatuses = ['pending_payment', 'pending_production', 'in_production', 'dispatched', 'delivered']
      if (statusParam && validStatuses.includes(statusParam)) {
        setStatusFilter(statusParam)
      }
    }
  }, [])

  // Auto-navigate to tab with matches if current tab is empty on search
  useEffect(() => {
    if (!search.trim()) return

    const query = search.toLowerCase()
    const matchesSearch = (order: any) => 
      order.order_number.toLowerCase().includes(query) ||
      order.shipping_address?.fullName?.toLowerCase().includes(query) ||
      order.contact_email?.toLowerCase().includes(query)

    const globalMatches = orders.filter(matchesSearch)
    if (globalMatches.length === 0) return

    // Check if the current tab matches any search result
    const currentTabMatches = globalMatches.filter(
      (order) => statusFilter === 'all' || order.status === statusFilter
    )

    if (currentTabMatches.length === 0) {
      const allowedTabs = ['pending_production', 'in_production', 'dispatched', 'delivered']
      const match = globalMatches.find((order) => allowedTabs.includes(order.status))
      if (match) {
        setStatusFilter(match.status)
      } else {
        setStatusFilter('all')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, orders])

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.shipping_address?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      order.contact_email?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Metric calculations
  const pendingPaymentCount = orders.filter((o) => o.status === 'pending_payment').length
  const pendingProductionCount = orders.filter((o) => o.status === 'pending_production').length
  const pendingCount = pendingPaymentCount + pendingProductionCount

  const productionCount = orders.filter((o) => o.status === 'in_production').length
  const dispatchedCount = orders.filter((o) => o.status === 'dispatched').length

  const deliveredCount = orders.filter((o) => o.status === 'delivered').length
  const totalCount = orders.length

  const deliveredPercent = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0
  const proCount = new Set(
    orders
      .filter((o) => o.plan === 'pro' || o.plan === 'business')
      .map((o) => o.account_id)
  ).size
  const totalRevenue = orders.reduce((acc, o) => acc + (o.total_inr || 0), 0)

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">Manage Orders</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Filter, search, provision, and dispatch card orders.</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {/* Skeleton Cards Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-5 flex flex-col justify-between min-h-[135px] animate-pulse">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)]" />
                    <div className="h-4 w-24 bg-[var(--bg-muted)] rounded" />
                  </div>
                  <div className="h-8 w-16 bg-[var(--bg-muted)] rounded mt-4" />
                </div>
                <div className="h-5 w-32 bg-[var(--bg-muted)] rounded mt-4" />
              </div>
            ))}
          </div>

          <div className="flex h-40 items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        </div>
      ) : (
        <>
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Pending Orders */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-5 hover:shadow-md hover:border-amber-500/30 dark:hover:border-amber-500/20 transition-all duration-300 group flex flex-col justify-between min-h-[135px]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-amber-500 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all duration-300">
                    <Clock size={16} className="group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="text-[13px] font-semibold text-[var(--text-secondary)] tracking-tight">Pending Orders</span>
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mt-4">
                  {pendingCount}
                </div>
              </div>
              <div className="text-[10.5px] font-semibold tracking-tight text-[var(--text-secondary)] mt-4 flex items-center gap-1.5 bg-[var(--bg-muted)]/40 border border-[var(--border)] px-2 py-0.5 rounded-md w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>
                  {pendingProductionCount} queue • {pendingPaymentCount} unpaid
                </span>
              </div>
            </div>

            {/* Card 2: In Production */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-5 hover:shadow-md hover:border-blue-600/30 dark:hover:border-blue-600/20 transition-all duration-300 group flex flex-col justify-between min-h-[135px]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-blue-600 group-hover:bg-blue-600/10 group-hover:border-blue-600/20 transition-all duration-300">
                    <Settings size={16} className="group-hover:scale-110 group-hover:rotate-45 transition-all duration-500" />
                  </div>
                  <span className="text-[13px] font-semibold text-[var(--text-secondary)] tracking-tight">In Production</span>
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mt-4">
                  {productionCount}
                </div>
              </div>
              <div className="text-[10.5px] font-semibold tracking-tight text-[var(--text-secondary)] mt-4 flex items-center gap-1.5 bg-[var(--bg-muted)]/40 border border-[var(--border)] px-2 py-0.5 rounded-md w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
                <span>
                  {productionCount} printing • {dispatchedCount} dispatched
                </span>
              </div>
            </div>

            {/* Card 3: Delivered Orders */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-5 hover:shadow-md hover:border-emerald-500/30 dark:hover:border-emerald-500/20 transition-all duration-300 group flex flex-col justify-between min-h-[135px]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-emerald-500 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all duration-300">
                    <Truck size={16} className="group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="text-[13px] font-semibold text-[var(--text-secondary)] tracking-tight">Delivered Orders</span>
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mt-4">
                  {deliveredCount}
                </div>
              </div>
              <div className="text-[10.5px] font-semibold tracking-tight text-[var(--text-secondary)] mt-4 flex items-center gap-1.5 bg-[var(--bg-muted)]/40 border border-[var(--border)] px-2 py-0.5 rounded-md w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  {deliveredPercent}% fulfillment rate
                </span>
              </div>
            </div>

            {/* Card 4: Total Orders */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-5 hover:shadow-md hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all duration-300 group flex flex-col justify-between min-h-[135px]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-blue-500 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all duration-300">
                    <Package size={16} className="group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="text-[13px] font-semibold text-[var(--text-secondary)] tracking-tight">Total Orders</span>
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mt-4">
                  {totalCount}
                </div>
              </div>
              <div className="text-[10.5px] font-semibold tracking-tight text-[var(--text-secondary)] mt-4 flex items-center gap-1.5 bg-[var(--bg-muted)]/40 border border-[var(--border)] px-2 py-0.5 rounded-md w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <span>
                  {proCount} Pro Customers • {formatPrice(totalRevenue)} revenue
                </span>
              </div>
            </div>
          </div>

          {orders.length === 0 ? (
            /* Empty Database State */
            <div className="flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-card p-12 text-center bg-[var(--bg-surface)] mt-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center mb-4">
                <ShoppingBag className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">No orders found</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
                There are currently no customer orders in the system database.
              </p>
            </div>
          ) : (
            /* Search/Filters & Data Table */
            <div className="space-y-4 pt-2">
              {/* Sleek horizontal status tabs */}
              <div className="flex flex-wrap border-b border-[var(--border)] gap-2 pb-px text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={cn(
                    "px-4 py-2 font-semibold border-b-2 transition-all duration-200 cursor-pointer flex items-center gap-1.5 pb-2.5 -mb-px",
                    statusFilter === 'all'
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <span>All</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    statusFilter === 'all' ? "bg-blue-600/10 text-blue-600" : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                  )}>
                    {orders.length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('pending_production')}
                  className={cn(
                    "px-4 py-2 font-semibold border-b-2 transition-all duration-200 cursor-pointer flex items-center gap-1.5 pb-2.5 -mb-px",
                    statusFilter === 'pending_production'
                      ? "border-amber-500 text-amber-500"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <span>Pending Production</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    statusFilter === 'pending_production' ? "bg-amber-500/10 text-amber-500" : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                  )}>
                    {orders.filter((o) => o.status === 'pending_production').length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('in_production')}
                  className={cn(
                    "px-4 py-2 font-semibold border-b-2 transition-all duration-200 cursor-pointer flex items-center gap-1.5 pb-2.5 -mb-px",
                    statusFilter === 'in_production'
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <span>In Production</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    statusFilter === 'in_production' ? "bg-blue-600/10 text-blue-600" : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                  )}>
                    {orders.filter((o) => o.status === 'in_production').length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('dispatched')}
                  className={cn(
                    "px-4 py-2 font-semibold border-b-2 transition-all duration-200 cursor-pointer flex items-center gap-1.5 pb-2.5 -mb-px",
                    statusFilter === 'dispatched'
                      ? "border-blue-500 text-blue-500"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <span>Dispatched</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    statusFilter === 'dispatched' ? "bg-blue-500/10 text-blue-500" : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                  )}>
                    {orders.filter((o) => o.status === 'dispatched').length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('delivered')}
                  className={cn(
                    "px-4 py-2 font-semibold border-b-2 transition-all duration-200 cursor-pointer flex items-center gap-1.5 pb-2.5 -mb-px",
                    statusFilter === 'delivered'
                      ? "border-emerald-500 text-emerald-500"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <span>Delivered</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    statusFilter === 'delivered' ? "bg-emerald-500/10 text-emerald-500" : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                  )}>
                    {orders.filter((o) => o.status === 'delivered').length}
                  </span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                {/* Search input with search icon */}
                <div className="relative flex-grow max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Search size={14} />
                  </span>
                  <Input
                    type="text"
                    placeholder="Search by order #, customer name, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 bg-[var(--bg-surface)] border-[var(--border)] text-xs h-9"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {/* Indication Legend Dropdown using shadcn DropdownMenu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="h-9 px-3 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>Plan Indications</span>
                        <ChevronDown className="h-3.5 w-3.5 text-zinc-400 opacity-60 shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-3 shadow-lg text-xs space-y-2.5 text-[var(--text-primary)]">
                      <p className="font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-1.5">About Plan Indications</p>
                      <div className="space-y-2 text-xs">
                        <div className="flex gap-2 items-start">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-blue-600/10 text-blue-600 border border-blue-600/25 mt-0.5 shrink-0">PRO</span>
                          <p className="text-[var(--text-secondary)] leading-normal">
                            Paid subscription upgrade card order (receives advanced digital feature tier).
                          </p>
                        </div>
                        <div className="flex gap-2 items-start">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-zinc-500/10 text-zinc-500 border border-zinc-500/25 mt-0.5 shrink-0">FREE</span>
                          <p className="text-[var(--text-secondary)] leading-normal">
                            Standard complimentary free tier card order (receives default landing page features).
                          </p>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Shadcn UI Table Container */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[var(--border)] bg-[var(--bg-muted)]/10 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      <TableHead className="px-6 py-3 font-semibold">Order ID</TableHead>
                      <TableHead className="px-6 py-3 font-semibold">Customer</TableHead>
                      <TableHead className="px-6 py-3 font-semibold text-center">Quantity</TableHead>
                      <TableHead className="px-6 py-3 font-semibold">Total Billed</TableHead>
                      <TableHead className="px-6 py-3 font-semibold">Payment States</TableHead>
                      <TableHead className="px-6 py-3 font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="px-6 py-8 text-center text-zinc-500 font-medium">
                          No matching orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow 
                          key={order.id} 
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="hover:bg-[var(--bg-muted)]/10 border-b border-[var(--border)] transition-colors cursor-pointer"
                        >
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-1.5 group">
                              <div className="font-mono font-semibold text-[var(--text-primary)]">
                                {order.order_number}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleCopy(e, order.order_number)}
                                className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors focus:outline-none opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shrink-0"
                                title="Copy Order ID"
                              >
                                {copiedId === order.order_number ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] mt-0.5 font-medium">
                              {(() => {
                                const date = new Date(order.created_at)
                                const day = String(date.getDate()).padStart(2, '0')
                                const month = String(date.getMonth() + 1).padStart(2, '0')
                                const year = date.getFullYear()
                                return `${day}/${month}/${year}`
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[var(--text-primary)]">{order.shipping_address?.fullName || 'N/A'}</p>
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                                order.plan === 'pro' || order.plan === 'business'
                                  ? 'bg-blue-600/10 text-blue-600 border border-blue-600/25'
                                  : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/25'
                              }`}>
                                {order.plan === 'pro' || order.plan === 'business' ? 'PRO' : 'FREE'}
                              </span>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)]">{order.contact_email}</p>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center font-bold text-[var(--text-primary)]">
                            {order.quantity || 0}
                          </TableCell>
                          <TableCell className="px-6 py-4 font-bold text-[var(--text-primary)]">
                            {formatPrice(order.total_inr)}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {order.status === 'pending_payment' ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/25">Pending</span>
                            ) : order.status === 'cancelled' ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/25">Cancelled</span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">Paid</span>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full shrink-0",
                                order.status === 'pending_payment' || order.status === 'pending_production'
                                  ? 'bg-amber-500'
                                  : order.status === 'in_production'
                                  ? 'bg-blue-600'
                                  : order.status === 'dispatched'
                                  ? 'bg-sky-500'
                                  : order.status === 'delivered'
                                  ? 'bg-emerald-500'
                                  : order.status === 'cancelled'
                                  ? 'bg-red-500'
                                  : 'bg-zinc-400'
                              )} />
                              <span className="capitalize">{order.status.replace('_', ' ')}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import { Search, Loader2 } from 'lucide-react'

const MOCK_ORDERS = [
  {
    id: 'ord-1004',
    order_number: 'ENV-2026-1004',
    contact_email: 'priya.s@uxdesign.in',
    shipping_address: { fullName: 'Priya S.' },
    total_inr: 149800,
    status: 'pending_production',
    plan_charge_inr: 19900,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-1003',
    order_number: 'ENV-2026-1003',
    contact_email: 'rahulk@gmail.com',
    shipping_address: { fullName: 'Rahul Kumar' },
    total_inr: 99900,
    status: 'in_production',
    plan_charge_inr: 0,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ord-1002',
    order_number: 'ENV-2026-1002',
    contact_email: 'vikram.anand@acmecorp.com',
    shipping_address: { fullName: 'Vikram Anand' },
    total_inr: 2198000,
    status: 'dispatched',
    plan_charge_inr: 0,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ord-1001',
    order_number: 'ENV-2026-1001',
    contact_email: 'deepika.n@freelance.org',
    shipping_address: { fullName: 'Deepika N.' },
    total_inr: 129900,
    status: 'delivered',
    plan_charge_inr: 0,
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ord-1000',
    order_number: 'ENV-2026-1000',
    contact_email: 'arjun.mehta@startup.io',
    shipping_address: { fullName: 'Arjun Mehta' },
    total_inr: 219700,
    status: 'delivered',
    plan_charge_inr: 19900,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
]

export default function AdminOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        setOrders(data)
      } else {
        setOrders(MOCK_ORDERS)
      }
    } catch {
      setOrders(MOCK_ORDERS)
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

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.shipping_address?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      order.contact_email?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">Manage Orders</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Filter, search, provision, and dispatch card orders.</p>
      </div>

      {/* Filter Options Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        
        {/* Search bar */}
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by order #, customer name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-xs focus:border-purple-600 focus:outline-none"
          />
        </div>

        {/* Status Dropdown Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-xs focus:border-purple-600 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="pending_production">Pending Production</option>
          <option value="in_production">In Production</option>
          <option value="dispatched">Dispatched</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="animate-spin text-purple-600" size={24} />
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card shadow-sm overflow-hidden py-4">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)] font-semibold uppercase bg-[var(--bg-muted)]/50">
                  <th className="px-6 py-3">Order Number</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Digital Plan</th>
                  <th className="px-6 py-3">Total Billed</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-zinc-500 font-medium">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[var(--bg-muted)]/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-[var(--text-primary)]">
                        {order.order_number}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[var(--text-primary)]">{order.shipping_address?.fullName || 'N/A'}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{order.contact_email}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold uppercase">
                        {order.plan_charge_inr > 0 ? 'PRO' : 'FREE'}
                      </td>
                      <td className="px-6 py-4 font-bold text-[var(--text-primary)]">
                        {formatPrice(order.total_inr)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          order.status === 'pending_production'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25'
                            : order.status === 'in_production'
                            ? 'bg-purple-600/10 text-purple-600 border border-purple-600/25'
                            : order.status === 'dispatched'
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/25'
                            : order.status === 'delivered'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25'
                            : 'bg-zinc-500/10 text-zinc-500'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-muted)]">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="px-3 py-1.5 rounded border border-[var(--border-purple)] text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-600/10 transition-colors"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

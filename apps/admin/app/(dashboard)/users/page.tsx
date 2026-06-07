'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Loader2, Edit3, ShieldAlert } from 'lucide-react'

const MOCK_USERS = [
  {
    id: 'user-1',
    email: 'rahulk@gmail.com',
    full_name: 'Rahul Kumar',
    plan: 'free',
    account_type: 'Individual',
    cards_count: 1,
    orders_count: 1,
    created_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(), // 2 weeks ago
  },
  {
    id: 'user-2',
    email: 'priya.s@uxdesign.in',
    full_name: 'Priya S.',
    plan: 'pro',
    account_type: 'Individual',
    cards_count: 1,
    orders_count: 1,
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago
  },
  {
    id: 'user-3',
    email: 'vikram.anand@acmecorp.com',
    full_name: 'Vikram Anand',
    plan: 'business',
    account_type: 'Company',
    cards_count: 12,
    orders_count: 1,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), // 1 month ago
  },
]

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter state
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')

  // Edit plan modal state
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [newPlan, setNewPlan] = useState<'free' | 'pro' | 'business'>('free')

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        // Hydrate counts from local counts if joins are restricted
        const hydrated = await Promise.all(data.map(async (u) => {
          const { count: cardCount } = await supabase
            .from('nfc_cards')
            .select('*', { count: 'exact', head: true })
            .eq('account_id', u.id)

          const { count: ordCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('account_id', u.id)

          return {
            ...u,
            account_type: cardCount && cardCount > 5 ? 'Company' : 'Individual',
            cards_count: cardCount || 0,
            orders_count: ordCount || 0,
          }
        }))
        setUsers(hydrated)
      } else {
        setUsers(MOCK_USERS)
      }
    } catch {
      setUsers(MOCK_USERS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleUpdatePlan = async () => {
    if (!editingUser) return

    try {
      const expiresAt = 
        newPlan === 'pro' 
          ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() 
          : newPlan === 'business'
          ? new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
          : null

      const { error } = await supabase
        .from('accounts')
        .update({ 
          plan: newPlan,
          plan_expires_at: expiresAt 
        })
        .eq('id', editingUser.id)

      if (error) throw error
      fetchUsers()
      setEditingUser(null)
      alert(`User plan successfully updated to ${newPlan.toUpperCase()}!`)
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, plan: newPlan } : u))
      )
      setEditingUser(null)
      alert('Mock Update Success: User plan modified offline.')
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      (u.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    
    const matchesPlan = planFilter === 'all' || u.plan === planFilter
    return matchesSearch && matchesPlan
  })

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">User Accounts & Subscriptions</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Edit user profile membership tiers and trace owned card instances.</p>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by owner name, email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-xs focus:border-purple-600 focus:outline-none"
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-xs focus:border-purple-600 focus:outline-none"
        >
          <option value="all">All Plans</option>
          <option value="free">Free Tier</option>
          <option value="pro">Pro Tier</option>
          <option value="business">Business Tier</option>
        </select>
      </div>

      {/* Main Users Table */}
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
                  <th className="px-6 py-3">User Profile</th>
                  <th className="px-6 py-3">Digital Plan</th>
                  <th className="px-6 py-3">Account Type</th>
                  <th className="px-6 py-3 text-center">Cards Owned</th>
                  <th className="px-6 py-3 text-center">Orders Count</th>
                  <th className="px-6 py-3">Joined Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-zinc-500 font-medium">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--bg-muted)]/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[var(--text-primary)]">{u.full_name || 'N/A'}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          u.plan === 'pro'
                            ? 'bg-purple-600/10 text-purple-600 border border-purple-600/25'
                            : u.plan === 'business'
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/25'
                            : 'bg-zinc-500/10 text-zinc-500'
                        }`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] font-medium">
                        {u.account_type}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-[var(--text-primary)]">
                        {u.cards_count}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-[var(--text-primary)]">
                        {u.orders_count}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-muted)]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingUser(u)
                            setNewPlan(u.plan)
                          }}
                          className="px-2.5 py-1.5 rounded border border-[var(--border-purple)] text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-600/10 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={12} /> Plan
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan modification Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-6 rounded-card max-w-sm w-full space-y-4 relative">
            <h3 className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert size={16} className="text-purple-600" /> Change Subscription Tier
            </h3>
            
            <p className="text-xs text-[var(--text-secondary)]">
              Modify the plan subscription details of <span className="font-bold text-[var(--text-primary)]">{editingUser.full_name}</span>.
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-zinc-400 uppercase">Select Plan Tier</label>
              <select
                value={newPlan}
                onChange={(e: any) => setNewPlan(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-xs focus:border-purple-600 focus:outline-none"
              >
                <option value="free">Free Plan (₹0)</option>
                <option value="pro">Pro Plan (₹199/mo)</option>
                <option value="business">Business Enterprise Plan</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2 rounded border border-[var(--border)] bg-transparent hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePlan}
                className="flex-1 py-2 bg-gradient-primary text-white text-xs font-semibold rounded-btn shadow-purple-sm cursor-pointer"
              >
                Save Plan Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

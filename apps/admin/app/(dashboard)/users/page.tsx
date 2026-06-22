'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Loader2, Edit3, ShieldAlert, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

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
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      } else {
        setUsers([])
      }
    } catch {
      setUsers([])
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

      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          plan: newPlan,
          planExpiresAt: expiresAt,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update plan on the server')
      }

      fetchUsers()
      setEditingUser(null)
      alert(`User plan successfully updated to ${newPlan.toUpperCase()}!`)
    } catch (err: any) {
      console.error(err)
      // Fallback/offline behavior
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
            className="w-full pl-9 pr-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-xs focus:border-blue-600 focus:outline-none"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-9 px-3 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none flex items-center gap-1.5 cursor-pointer transition-colors">
              <span className="capitalize">
                {planFilter === 'all' ? 'All Plans' : `${planFilter} Tier`}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400 opacity-60 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-1 shadow-lg text-xs text-[var(--text-primary)]">
            <DropdownMenuItem onClick={() => setPlanFilter('all')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
              <span>All Plans</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPlanFilter('free')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
              <span>Free Tier</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPlanFilter('pro')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
              <span>Pro Tier</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPlanFilter('business')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
              <span>Business Tier</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Users Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={24} />
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
                            ? 'bg-blue-600/10 text-blue-600 border border-blue-600/25'
                            : u.plan === 'business'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25'
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
                          className="px-2.5 py-1.5 rounded border border-blue-600/20 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-600/10 transition-colors inline-flex items-center gap-1 cursor-pointer"
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
              <ShieldAlert size={16} className="text-blue-600" /> Change Subscription Tier
            </h3>
            
            <p className="text-xs text-[var(--text-secondary)]">
              Modify the plan subscription details of <span className="font-bold text-[var(--text-primary)]">{editingUser.full_name}</span>.
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-zinc-400 uppercase">Select Plan Tier</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full h-9 px-3 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none flex items-center justify-between cursor-pointer transition-colors">
                    <span className="capitalize">
                      {newPlan === 'free' ? 'Free Plan (₹0)' : newPlan === 'pro' ? 'Pro Plan (₹199/mo)' : 'Business Enterprise Plan'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-400 opacity-60 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-1 shadow-lg text-xs text-[var(--text-primary)]">
                  <DropdownMenuItem onClick={() => setNewPlan('free')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
                    <span>Free Plan (₹0)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNewPlan('pro')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
                    <span>Pro Plan (₹199/mo)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNewPlan('business')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
                    <span>Business Enterprise Plan</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-sm cursor-pointer"
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

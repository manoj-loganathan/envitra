'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Search, Loader2, Link2, Eye, ShieldAlert, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export default function AdminCardsPage() {
  const supabase = createClient()
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // QR modal view
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null)

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/cards')
      if (res.ok) {
        const data = await res.json()
        const formatted = (data.cards || []).map((c: any) => ({
          ...c,
          account: c.account || { email: 'unknown@envitra.in', full_name: 'Unknown User' },
          order: c.order_item?.order || { id: '#', order_number: 'ENV-XXXX' },
          setup_complete: c.tap_count > 0,
        }))
        setCards(formatted)
      } else {
        setCards([])
      }
    } catch {
      setCards([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [])

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this card? It will block taps.')) return

    try {
      const response = await fetch('/api/cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: id, status: 'deactivated' }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status on server')
      }
      fetchCards()
    } catch {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'deactivated' } : c))
      )
    }
  }

  const handleActivate = async (id: string) => {
    try {
      const response = await fetch('/api/cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: id, status: 'active' }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status on server')
      }
      fetchCards()
    } catch {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'active' } : c))
      )
    }
  }

  const copyUrlToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('Card tap profile URL copied to clipboard!')
  }

  const filteredCards = cards.filter((c) => {
    const matchesSearch = 
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      c.account?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.account?.email?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">Manage NFC Smart Cards</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">View and deactivate active NFC profile associations.</p>
      </div>

      {/* Filter Options */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by slug, user name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-xs focus:border-blue-600 focus:outline-none"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-9 px-3 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none flex items-center gap-1.5 cursor-pointer transition-colors">
              <span className="capitalize">
                {statusFilter === 'all' ? 'All States' : statusFilter}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400 opacity-60 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-[var(--bg-surface)] border border-[var(--border)] rounded-card p-1 shadow-lg text-xs text-[var(--text-primary)]">
            <DropdownMenuItem onClick={() => setStatusFilter('all')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
              <span>All States</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('provisioned')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
              <span>Provisioned</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('active')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
              <span>Active</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('deactivated')} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-muted)] focus:text-[var(--text-primary)] rounded-md transition-colors">
              <span>Deactivated</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Stock Table */}
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
                  <th className="px-6 py-3">Slug (Card link)</th>
                  <th className="px-6 py-3">Account Owner</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Setup</th>
                  <th className="px-6 py-3">Order Number</th>
                  <th className="px-6 py-3 text-center">Taps Count</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-zinc-500 font-medium">
                      No matching cards found.
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((card) => (
                    <tr key={card.id} className="hover:bg-[var(--bg-muted)]/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        <Link href={card.card_url} target="_blank" className="hover:underline">
                          {card.slug}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[var(--text-primary)]">{card.account.full_name}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{card.account.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          card.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25'
                              : card.status === 'provisioned'
                              ? 'bg-blue-600/10 text-blue-600 border border-blue-600/25'
                              : 'bg-red-500/10 text-red-500 border border-red-500/25'
                          }`}>
                            {card.status}
                          </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">
                        {card.setup_complete ? (
                          <span className="text-emerald-500">Yes</span>
                        ) : (
                          <span className="text-zinc-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-[var(--text-secondary)]">
                        <Link href={`/orders/${card.order?.id}`} className="hover:underline">
                          {card.order?.order_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-[var(--text-primary)]">
                        {card.tap_count}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setQrModalUrl(card.qr_code_url)}
                          className="p-1.5 rounded bg-[var(--bg-muted)] border border-[var(--border)] text-zinc-500 hover:text-blue-600 inline-flex items-center cursor-pointer"
                          title="View QR Code"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => copyUrlToClipboard(card.card_url)}
                          className="p-1.5 rounded bg-[var(--bg-muted)] border border-[var(--border)] text-zinc-500 hover:text-blue-600 inline-flex items-center cursor-pointer"
                          title="Copy Profile URL"
                        >
                          <Link2 size={14} />
                        </button>
                        {card.status === 'deactivated' ? (
                          <button
                            onClick={() => handleActivate(card.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[10px] hover:bg-emerald-700 cursor-pointer"
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeactivate(card.id)}
                            className="px-2.5 py-1 rounded bg-red-500/10 border border-red-500/25 text-red-500 font-semibold text-[10px] hover:bg-red-500/20 cursor-pointer"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Code Overlay Modal */}
      {qrModalUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-6 rounded-card max-w-sm w-full space-y-4 relative text-center">
            <h3 className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider">NFC Card QR Code</h3>
            <img 
              src={qrModalUrl} 
              alt="QR Code" 
              className="w-48 h-48 mx-auto border border-zinc-200 p-2 rounded bg-white"
            />
            <p className="text-[10px] text-zinc-500 font-mono select-all truncate">{qrModalUrl}</p>
            <button
              onClick={() => setQrModalUrl(null)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-sm cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

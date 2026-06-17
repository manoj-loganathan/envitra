'use client'

import React from 'react'
import Link from 'next/link'
import { useDashboard } from '../context'
import { 
  CreditCard, User, Activity, Users, ArrowRight, ExternalLink, Contact, Link2 
} from 'lucide-react'

export function OverviewTab() {
  const { 
    cards, 
    activeCard, 
    handleSelectCard, 
    profile, 
    leads 
  } = useDashboard()

  const isAllCards = activeCard?.id === 'all'

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Cards */}
        <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm overflow-hidden group hover:shadow-md hover:border-[#3f5ce6]/40 transition-all relative text-left">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none group-hover:from-[#3f5ce6]/10 transition-all" />
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-[#3f5ce6]/10 rounded-lg group-hover:bg-[#3f5ce6]/20 transition-colors">
              <CreditCard className="w-4 h-4 text-[#3f5ce6]" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-foreground">{cards.length}</span>
          </div>
          <div className="flex gap-1.5 mb-4 mt-2 h-10 items-center">
            {cards.slice(0, 5).map((c, i) => (
              <div
                key={c.id || i}
                className="w-7 h-4.5 rounded border border-border/80 opacity-80 shrink-0"
                style={{ backgroundColor: c.profile_data?.colorHex || '#3f5ce6' }}
                title={c.slug}
              />
            ))}
            {cards.length === 0 && (
              <div className="h-1.5 w-full rounded-full bg-muted/40 border border-dashed border-border/40" />
            )}
            {cards.length > 5 && (
              <div className="text-[10px] text-muted-foreground font-bold">+{cards.length - 5}</div>
            )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-[#3f5ce6]/70 transition-colors">Active Cards</p>
        </div>

        {/* Card 2: Workspace/Active Card Slug */}
        <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm overflow-hidden group hover:shadow-md hover:border-[#3f5ce6]/40 transition-all relative text-left">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none group-hover:from-[#3f5ce6]/10 transition-all" />
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-[#3f5ce6]/10 rounded-lg group-hover:bg-[#3f5ce6]/20 transition-colors">
              <User className="w-4 h-4 text-[#3f5ce6]" />
            </div>
            <span className="text-sm font-mono font-bold text-foreground/90 truncate max-w-[120px] uppercase">
              {isAllCards ? 'All Cards' : (activeCard ? activeCard.slug : 'NONE')}
            </span>
          </div>
          <div className="flex items-center gap-3 mb-4 mt-2 h-10">
            <div className="relative w-8 h-8 shrink-0">
              {[1, 0.65, 0.35].map((s, i) => (
                <div key={i} className="absolute border-2 border-[#3f5ce6] rounded-full"
                  style={{ width: `${s * 100}%`, height: `${s * 100}%`, top: `${(1 - s) * 50}%`, left: `${(1 - s) * 50}%`, opacity: 0.3 + (1 - s) * 0.5 }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3f5ce6]" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isAllCards ? 'bg-[#3f5ce6]' : activeCard?.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                {isAllCards ? 'All Workspaces' : (activeCard?.status || 'Inactive')}
              </span>
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-[#3f5ce6]/70 transition-colors">Workspace</p>
        </div>

        {/* Card 3: Taps */}
        <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm overflow-hidden group hover:shadow-md hover:border-[#3f5ce6]/40 transition-all relative text-left">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none group-hover:from-[#3f5ce6]/10 transition-all" />
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-[#3f5ce6]/10 rounded-lg group-hover:bg-[#3f5ce6]/20 transition-colors">
              <Activity className="w-4 h-4 text-[#3f5ce6]" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-foreground">
              {isAllCards
                ? cards.reduce((sum, c) => sum + (c.tap_count || 0), 0)
                : (activeCard?.tap_count || 0)}
            </span>
          </div>
          <div className="flex items-end gap-1 h-10 mb-4 mt-2">
            {[2, 5, 3, 8, 4, 6, 3, 7, 5, 9].map((val, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm ${i === 9 ? 'bg-[#3f5ce6]' : 'bg-[#3f5ce6]/30'}`}
                style={{ height: `${val * 10}%` }}
              />
            ))}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-[#3f5ce6]/70 transition-colors">
            {isAllCards ? 'Total Scan Taps' : 'Taps This Month'}
          </p>
        </div>

        {/* Card 4: Leads */}
        <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm overflow-hidden group hover:shadow-md hover:border-emerald-500/40 transition-all relative text-left">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none group-hover:from-emerald-500/10 transition-all" />
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-foreground">{leads.length}</span>
          </div>
          <div className="space-y-1.5 mb-4 mt-2 h-10 flex flex-col justify-center">
            {[100, 70, 45, 25].map((w, i) => (
              <div key={i} className={`h-1.5 rounded-full ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-emerald-400/70' : i === 2 ? 'bg-emerald-300/50' : 'bg-emerald-200/40'
                }`} style={{ width: `${w}%` }} />
            ))}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-emerald-500/70 transition-colors">Leads Captured</p>
        </div>
      </div>

      {cards.length > 0 ? (
        isAllCards ? (
          /* All Cards Workspace View */
          <div className="space-y-6 text-left">
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Select Card Workspace</h3>
              <p className="text-xs text-muted-foreground">Click on any card below to open and manage its dynamic profile.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {cards.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCard(c)}
                  className="group relative bg-card border border-border hover:border-[#3f5ce6]/50 rounded-2xl p-6 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(63,92,230,0.1)] flex flex-col justify-between h-48 select-none"
                >
                  <div
                    className="absolute top-0 left-0 w-2 h-full rounded-l-2xl transition-colors duration-300"
                    style={{ backgroundColor: c.profile_data?.colorHex || '#3f5ce6' }}
                  />
                  <div className="pl-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{c.slug}</span>
                      <span className={`text-[8px] uppercase px-1.5 py-0.2 rounded-full font-bold tracking-wider ${c.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                        {c.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-foreground tracking-tight leading-tight truncate">
                        {c.profile_data?.name || 'New Profile'}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate">{c.profile_data?.tagline || 'No tagline set'}</p>
                    </div>
                  </div>
                  <div className="pl-3 flex justify-between items-center border-t border-border pt-4 text-[10px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Activity size={12} className="text-muted-foreground" />
                      <span className="text-foreground"><b>{c.tap_count || 0}</b> taps</span>
                    </span>
                    <span className="group-hover:text-[#3f5ce6] transition-colors font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                      Manage <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Single Selected Card View: Welcome Dashboard screen */
          <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 text-left space-y-6 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3f5ce6]/5 to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-xl space-y-3">
              <div className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#3f5ce6]/10 text-[#3f5ce6] border border-[#3f5ce6]/20">
                Workspace Dashboard
              </div>
              <h3 className="text-xl font-extrabold text-foreground tracking-tight leading-tight">
                Welcome, {profile?.full_name || 'Card Owner'}!
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You are currently managing the smart card workspace for <strong className="font-mono text-[#3f5ce6] font-bold">{activeCard?.card_nickname || activeCard?.slug}</strong>. Use the navigation sidebar or quick actions below to customize your experience.
              </p>
            </div>

            <hr className="border-border/50 my-6" />

            <div className="relative z-10 space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Quick Actions & Setup Guide</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <Link
                  href={`/dashboard/card`}
                  className="group p-5 bg-background border border-border/50 hover:border-[#3f5ce6]/40 hover:bg-[#3f5ce6]/5 rounded-xl transition-all flex items-start gap-4 cursor-pointer"
                >
                  <div className="p-2.5 bg-[#3f5ce6]/10 rounded-lg group-hover:bg-[#3f5ce6]/20 transition-colors shrink-0">
                    <CreditCard className="w-5 h-5 text-[#3f5ce6]" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-foreground group-hover:text-[#3f5ce6] transition-colors">1. Visual Customization & Status</h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">View your interactive card designs, download the QR code, or enable/disable NFC access.</p>
                  </div>
                </Link>

                <Link
                  href={`/dashboard/profiles`}
                  className="group p-5 bg-background border border-border/50 hover:border-[#3f5ce6]/40 hover:bg-[#3f5ce6]/5 rounded-xl transition-all flex items-start gap-4 cursor-pointer"
                >
                  <div className="p-2.5 bg-[#3f5ce6]/10 rounded-lg group-hover:bg-[#3f5ce6]/20 transition-colors shrink-0">
                    <User className="w-5 h-5 text-[#3f5ce6]" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-foreground group-hover:text-[#3f5ce6] transition-colors">2. Manage Digital Profiles</h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Create and manage multiple digital profiles linked to your physical card. Toggle profiles live instantly.</p>
                  </div>
                </Link>

                <Link
                  href={`/dashboard/vcard`}
                  className="group p-5 bg-background border border-border/50 hover:border-[#3f5ce6]/40 hover:bg-[#3f5ce6]/5 rounded-xl transition-all flex items-start gap-4 cursor-pointer"
                >
                  <div className="p-2.5 bg-[#3f5ce6]/10 rounded-lg group-hover:bg-[#3f5ce6]/20 transition-colors shrink-0">
                    <Contact className="w-5 h-5 text-[#3f5ce6]" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-foreground group-hover:text-[#3f5ce6] transition-colors">3. Update vCard Contact Details</h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Fill out contact numbers, email, and address info shared automatically when your card is scanned.</p>
                  </div>
                </Link>

                <Link
                  href={`/dashboard/links`}
                  className="group p-5 bg-background border border-border/50 hover:border-[#3f5ce6]/40 hover:bg-[#3f5ce6]/5 rounded-xl transition-all flex items-start gap-4 cursor-pointer"
                >
                  <div className="p-2.5 bg-[#3f5ce6]/10 rounded-lg group-hover:bg-[#3f5ce6]/20 transition-colors shrink-0">
                    <Link2 className="w-5 h-5 text-[#3f5ce6]" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-foreground group-hover:text-[#3f5ce6] transition-colors">4. Add Links & Track Clicks</h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Insert social icons, portfolio links, or UPI payment channels. Access instant click counts.</p>
                  </div>
                </Link>

              </div>
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-20 bg-card rounded-xl border border-border space-y-4 max-w-lg mx-auto p-6">
          <div className="w-12 h-12 rounded-full bg-[#3f5ce6]/10 text-[#3f5ce6] flex items-center justify-center mx-auto">
            <CreditCard size={22} />
          </div>
          <h3 className="text-base font-bold text-foreground">No NFC cards owned</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You haven't ordered any custom smart business cards or they haven't been provisioned yet. Explore our store to design your premium NFC cards.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#3f5ce6] to-indigo-600 text-white text-xs font-semibold hover:opacity-90 shadow-md"
          >
            Order Cards Now <ExternalLink size={13} />
          </Link>
        </div>
      )}
    </div>
  )
}

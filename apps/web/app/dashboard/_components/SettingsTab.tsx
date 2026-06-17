'use client'

import React, { useState, useEffect } from 'react'
import { useDashboard } from '../context'
import { createClient } from '@/lib/supabase/client'
import {
  CreditCard, User, Lock, Activity, Save, Loader2, AlertCircle, Trash2, ShieldAlert, LogOut, Laptop, Smartphone, Tablet, Globe, Clock, FileDown, Zap
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export function SettingsTab() {
  const {
    user,
    setUser,
    profile,
    setProfile,
    currentSessionId,
    setCurrentSessionId,
    loggedSessions,
    setLoggedSessions,
    sessionDisconnecting,
    setSessionDisconnecting,
    accountForm,
    setAccountForm,
    userOrders,
    setUserOrders,
    setMessage
  } = useDashboard()

  const supabase = createClient()

  // Local States
  const [savingAccount, setSavingAccount] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [renewingPlan, setRenewingPlan] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const getBrowserAndOS = (customUa?: string) => {
    const ua = customUa || (typeof window !== 'undefined' ? window.navigator.userAgent : '')
    let browser = 'Unknown Browser'
    let os = 'Unknown OS'

    if (!ua) return { browser, os }

    if (ua.indexOf('Firefox') > -1) browser = 'Mozilla Firefox'
    else if (ua.indexOf('SamsungBrowser') > -1) browser = 'Samsung Internet'
    else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera'
    else if (ua.indexOf('Trident') > -1) browser = 'Internet Explorer'
    else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) browser = 'Microsoft Edge'
    else if (ua.indexOf('Chrome') > -1) browser = 'Google Chrome'
    else if (ua.indexOf('Safari') > -1) browser = 'Apple Safari'

    if (ua.indexOf('Windows NT 10.0') > -1) os = 'Windows 10/11'
    else if (ua.indexOf('Windows NT 6.2') > -1) os = 'Windows 8'
    else if (ua.indexOf('Windows NT 6.1') > -1) os = 'Windows 7'
    else if (ua.indexOf('Macintosh') > -1) os = 'macOS'
    else if (ua.indexOf('iPhone') > -1) os = 'iOS'
    else if (ua.indexOf('iPad') > -1) os = 'iPadOS'
    else if (ua.indexOf('Android') > -1) os = 'Android'
    else if (ua.indexOf('Linux') > -1) os = 'Linux'

    return { browser, os }
  }

  const getDeviceIcon = (os: string) => {
    const osLower = os.toLowerCase()
    if (osLower.includes('ios') || osLower.includes('android')) {
      return <Smartphone className="w-4 h-4 text-muted-foreground" />
    }
    if (osLower.includes('ipad')) {
      return <Tablet className="w-4 h-4 text-muted-foreground" />
    }
    if (osLower.includes('mac') || osLower.includes('win') || osLower.includes('linux')) {
      return <Laptop className="w-4 h-4 text-muted-foreground" />
    }
    return <Globe className="w-4 h-4 text-muted-foreground" />
  }

  const syncUserSession = async (userId: string, parsedSid?: string) => {
    if (typeof window === 'undefined') return
    let activeSid = parsedSid || currentSessionId
    try {
      const res = await fetch('/api/auth/sessions')
      if (res.status === 401) {
        await supabase.auth.signOut({ scope: 'local' })
        window.location.href = '/login'
        return
      }
      if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.statusText}`)
      const data = await res.json()
      const sessions = data.sessions || []
      setLoggedSessions(sessions)
    } catch (e) {
      console.error('Failed to sync auth session:', e)
    }
  }

  // ── Form Actions ─────────────────────────────────────────────────
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingAccount(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          full_name: accountForm.fullName,
          nfc_redirect_to_dashboard: accountForm.nfcRedirectToDashboard,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile((prev: any) => ({
        ...prev,
        full_name: accountForm.fullName,
        nfc_redirect_to_dashboard: accountForm.nfcRedirectToDashboard
      }))
      setMessage({ type: 'success', text: 'Account settings updated successfully!' })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to update account settings.' })
    } finally {
      setSavingAccount(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in both password fields.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' })
      return
    }

    setSavingPassword(true)
    setMessage(null)

    try {
      const now = new Date().toISOString()
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          password_updated_at: now
        }
      })

      if (error) throw error

      setNewPassword('')
      setConfirmPassword('')
      
      setUser((prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          user_metadata: {
            ...prev.user_metadata,
            password_updated_at: now
          }
        }
      })

      setMessage({ type: 'success', text: 'Password updated successfully.' })
    } catch (err: any) {
      console.error('Error updating password:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to update password.' })
    } finally {
      setSavingPassword(false)
    }
  }

  const handleRenewPlan = async () => {
    setRenewingPlan(true)
    setMessage(null)
    try {
      const res = await fetch('/api/payment/renew-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amountInr: 19900 }) // ₹199
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to renew plan')
      }

      if (user) {
        const { data: accData } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', user.id)
          .single()

        if (accData) {
          setProfile(accData)
        }

        const { data: ordersData } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('account_id', user.id)
          .order('created_at', { ascending: false })

        if (ordersData) {
          setUserOrders(ordersData)
        }
      }

      setMessage({ type: 'success', text: `Plan renewed successfully! New invoice number is ${data.invoiceNumber}.` })
    } catch (err: any) {
      console.error('Plan renewal failed:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to renew plan. Please try again.' })
    } finally {
      setRenewingPlan(false)
    }
  }

  const isExpiringSoon = () => {
    if (!profile?.plan_expires_at) return false
    const expiryDate = new Date(profile.plan_expires_at)
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 3
  }

  const isExpired = () => {
    if (!profile?.plan_expires_at) return false
    const expiryDate = new Date(profile.plan_expires_at)
    const today = new Date()
    return expiryDate.getTime() < today.getTime()
  }

  // ── Session Security ──────────────────────────────────────────────
  const disconnectSession = async (sessionId: string) => {
    setSessionDisconnecting(sessionId)
    try {
      const res = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      if (!res.ok) {
        throw new Error('Failed to disconnect session')
      }

      if (user) {
        await syncUserSession(user.id)
      }
      setMessage({ type: 'success', text: 'Device disconnected successfully.' })
    } catch (err: any) {
      console.error('Error disconnecting session:', err)
      setMessage({ type: 'error', text: 'Failed to disconnect device. Please try again.' })
    } finally {
      setSessionDisconnecting(false)
    }
  }

  const handleSignoutAllDevices = async () => {
    setSessionDisconnecting(true)
    try {
      const res = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      })

      if (!res.ok) {
        throw new Error('Failed to sign out all devices')
      }

      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (err: any) {
      console.error('Error signing out all devices:', err)
      setMessage({ type: 'error', text: 'Failed to sign out all devices. Please try again.' })
    } finally {
      setSessionDisconnecting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fadeIn text-left pb-12">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-foreground">Account Settings</h2>
        <p className="text-xs text-muted-foreground">Manage your personal information, security preferences, active devices, and subscription billing.</p>
      </div>

      {/* 1. Personal Profile Card */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <div className="w-8 h-8 rounded-lg bg-[#3f5ce6]/10 text-[#3f5ce6] flex items-center justify-center">
            <User size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Personal Information</h3>
            <p className="text-[10px] text-muted-foreground">Update your name and view registered account email.</p>
          </div>
        </div>

        <form onSubmit={handleSaveAccount} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Registered Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground focus:outline-none cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
              <input
                type="text"
                required
                value={accountForm.fullName || ''}
                onChange={(e) => setAccountForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6]/20 focus:outline-none placeholder-muted-foreground/60 transition-colors"
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-1 sm:col-span-2 pt-2">
              <label className="flex items-start gap-2.5 text-xs font-semibold text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={accountForm.nfcRedirectToDashboard || false}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, nfcRedirectToDashboard: e.target.checked }))}
                  className="mt-0.5 rounded border-input text-[#3f5ce6] focus:ring-[#3f5ce6]/20"
                />
                <div>
                  <span>Redirect to Dashboard on NFC Tap</span>
                  <p className="text-[10px] text-muted-foreground font-normal mt-0.5 leading-relaxed">
                    When enabled, tapping or scanning your physical NFC card on a device where your Envitra account is logged in will automatically redirect you directly to your management dashboard instead of loading your public profile card.
                  </p>
                </div>
              </label>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingAccount}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              {savingAccount ? (
                <>
                  <Loader2 className="animate-spin" size={13} /> Saving...
                </>
              ) : (
                <>
                  <Save size={13} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Change Password Security Card */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3f5ce6]/10 text-[#3f5ce6] flex items-center justify-center">
              <Lock size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Password & Security</h3>
              <p className="text-[10px] text-muted-foreground">Update your account login password.</p>
            </div>
          </div>
          {user?.user_metadata?.password_updated_at && (
            <span className="text-[10px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/40 font-semibold">
              Last updated: {new Date(user.user_metadata.password_updated_at).toLocaleDateString()}
            </span>
          )}
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6]/20 focus:outline-none placeholder-muted-foreground/60 transition-colors"
                placeholder="Min 6 characters"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6]/20 focus:outline-none placeholder-muted-foreground/60 transition-colors"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="animate-spin" size={13} /> Updating...
                </>
              ) : (
                <>
                  <Lock size={13} /> Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Plan & Billing Card with Renewal Warnings and History */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <div className="w-8 h-8 rounded-lg bg-[#3f5ce6]/10 text-[#3f5ce6] flex items-center justify-center">
            <CreditCard size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Plan & Billing</h3>
            <p className="text-[10px] text-muted-foreground">Monitor subscription level, renew plans, and download transaction invoices.</p>
          </div>
        </div>

        {/* Expiry Alert Warning Banner (3 days limit) */}
        {(isExpiringSoon() || isExpired()) && (
          <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-3 text-left">
              <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-amber-500">
                  {isExpired() ? 'Subscription Expired' : 'Subscription Expiring Soon'}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                  Your billing plan is expiring on <strong>{profile?.plan_expires_at ? new Date(profile.plan_expires_at).toLocaleDateString() : 'N/A'}</strong>. Pay ₹199.00 to extend subscription for another 30 days.
                </p>
              </div>
            </div>
            <button
              onClick={handleRenewPlan}
              disabled={renewingPlan}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shrink-0 shadow-md transition-all active:scale-98 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
            >
              {renewingPlan ? (
                <>
                  <Loader2 className="animate-spin" size={13} /> Processing...
                </>
              ) : (
                <>
                  <Zap size={13} /> Renew Plan (₹199)
                </>
              )}
            </button>
          </div>
        )}

        {/* General Plan Details */}
        <div className="p-4 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground capitalize">{profile?.plan || 'Free'} Plan</p>
            {profile?.plan_expires_at ? (
              <p className="text-xs text-muted-foreground mt-1 font-semibold">
                Expires: <strong className="text-foreground">{new Date(profile.plan_expires_at).toLocaleDateString()}</strong>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">No active subscription expiration details available.</p>
            )}
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-[#3f5ce6]/10 text-[#3f5ce6] border-[#3f5ce6]/20">
            {profile?.plan || 'free'}
          </span>
        </div>

        {/* Invoice / Payments History */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={12} /> Transaction & Invoicing History
          </h4>

          {userOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground bg-muted/10 p-3 rounded-lg border border-dashed border-border/60 text-center font-semibold">
              No billing history or transaction invoices found.
            </p>
          ) : (
            <div className="border border-border/60 rounded-xl divide-y divide-border/60 overflow-hidden bg-muted/10">
              {userOrders.map((order) => {
                const isRenewal = order.order_number?.startsWith('ENV-REN-')
                return (
                  <div key={order.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">#{order.order_number}</span>
                        {isRenewal ? (
                          <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Plan Renewal
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-[#3f5ce6]/10 text-[#3f5ce6] border-[#3f5ce6]/20">
                            Card Purchase
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-2.5 gap-y-0.5 font-semibold">
                        <span>Date: {new Date(order.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Amount: {formatPrice(order.total_amount_inr)}</span>
                        <span>•</span>
                        <span className="capitalize">Status: <strong className={order.status === 'fulfilled' ? 'text-emerald-500' : 'text-amber-500'}>{order.status}</strong></span>
                      </div>
                    </div>

                    {order.invoice_url ? (
                      <a
                        href={order.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-[10px] font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileDown size={12} /> Download Invoice
                      </a>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic self-start sm:self-center">Invoice pending</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Active Device Sessions Management */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3f5ce6]/10 text-[#3f5ce6] flex items-center justify-center">
              <Activity size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Active Sessions & Device Security</h3>
              <p className="text-[10px] text-muted-foreground">Manage active logins. Subscriptions are restricted to <strong>maximum 2 active devices</strong>.</p>
            </div>
          </div>
          <button
            onClick={handleSignoutAllDevices}
            disabled={!!sessionDisconnecting}
            className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            {sessionDisconnecting === true ? 'Signing Out...' : 'Sign Out All Devices'}
          </button>
        </div>

        <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden bg-muted/10">
          {loggedSessions.map((session) => {
            const isCurrent = session.id === currentSessionId
            const { browser, os } = getBrowserAndOS(session.user_agent)
            return (
              <div 
                key={session.id} 
                className={`p-4 flex items-center justify-between gap-4 text-xs transition-all ${
                  isCurrent 
                    ? 'bg-[#3f5ce6]/5 border-l-4 border-l-[#3f5ce6]' 
                    : 'hover:bg-muted/5'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    {getDeviceIcon(os)}
                    <span>{os}</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span>
                      {browser}
                      {isCurrent && (
                        <span className="text-[#3f5ce6] font-bold text-[10px] ml-2 bg-[#3f5ce6]/10 px-1.5 py-0.5 rounded border border-[#3f5ce6]/20">
                          Current Device
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    Last active: {session.updated_at ? new Date(session.updated_at).toLocaleString() : new Date(session.created_at).toLocaleString()}
                  </p>
                </div>

                {!isCurrent ? (
                  <button
                    onClick={() => disconnectSession(session.id)}
                    disabled={!!sessionDisconnecting}
                    className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {sessionDisconnecting === session.id ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Active Now
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useDashboard } from '../context'
import { createClient } from '@/lib/supabase/client'
import {
  CreditCard, User, Lock, Activity, Save, Loader2, AlertCircle, Trash2, ShieldAlert, LogOut, Laptop, Smartphone, Tablet, Globe, Clock, FileDown, Zap
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'

export function SettingsTab() {
  const {
    user,
    setUser,
    profile,
    setProfile,
    cards,
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

  const hasChanges =
    (accountForm.fullName || '') !== (profile?.full_name || '') ||
    accountForm.nfcRedirectToDashboard !== !!profile?.nfc_redirect_to_dashboard ||
    accountForm.agreedToTerms !== !!profile?.agreed_to_terms

  // Local States
  const [savingAccount, setSavingAccount] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [renewingPlan, setRenewingPlan] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')


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
          agreed_to_terms: accountForm.agreedToTerms,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile((prev: any) => ({
        ...prev,
        full_name: accountForm.fullName,
        nfc_redirect_to_dashboard: accountForm.nfcRedirectToDashboard,
        agreed_to_terms: accountForm.agreedToTerms
      }))
      setMessage({ type: 'success', text: 'Account settings updated successfully!' })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to update account settings.' })
    } finally {
      setSavingAccount(false)
    }
  }

  const handleInitiatePasswordReset = async () => {
    setSavingPassword(true)
    setMessage(null)
    try {
      await supabase.auth.signOut()
      window.location.href = '/forgot-password'
    } catch (err: any) {
      console.error('Error during password reset redirect:', err)
      setMessage({ type: 'error', text: 'Failed to redirect to password reset.' })
      setSavingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      await supabase.auth.signOut()
      window.location.href = '/register'
    } catch (err: any) {
      console.error('Error deleting account:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to delete account.' })
      setDeletingAccount(false)
      setDeleteModalOpen(false)
      setConfirmEmail('')
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

  const handleUploadAccountAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    setMessage(null)
    try {
      // 1. Delete old avatar if it exists
      if (profile?.avatar_url) {
        try {
          const urlParts = profile.avatar_url.split('/')
          const oldFileName = urlParts[urlParts.length - 1]
          await supabase.storage
            .from('profile-avatars')
            .remove([oldFileName])
        } catch (delErr) {
          console.error('Failed to clean up old avatar:', delErr)
        }
      }

      // 2. Upload new file
      const fileExt = file.name.split('.').pop()
      const fileName = `acc-avatar-${user.id}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(fileName)

      // 3. Update database
      const { error: dbError } = await supabase
        .from('accounts')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (dbError) throw dbError

      // 4. Update local profile state
      setProfile((prev: any) => ({
        ...prev,
        avatar_url: publicUrl
      }))
      
      setMessage({ type: 'success', text: 'Profile avatar uploaded successfully!' })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to upload profile avatar.' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDeleteAccountAvatar = async () => {
    if (!user) return
    setUploadingAvatar(true)
    setMessage(null)
    try {
      // 1. Delete file from storage
      if (profile?.avatar_url) {
        const urlParts = profile.avatar_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        await supabase.storage
          .from('profile-avatars')
          .remove([fileName])
      }

      // 2. Update database
      const { error: dbError } = await supabase
        .from('accounts')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (dbError) throw dbError

      // 3. Update local state
      setProfile((prev: any) => ({
        ...prev,
        avatar_url: null
      }))

      setMessage({ type: 'success', text: 'Profile avatar removed successfully!' })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to remove profile avatar.' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U'

  return (
    <div className="max-w-5xl space-y-10 animate-fadeIn text-left pb-16">
      
      {/* ─── Profile Header Layout with Banner (Matches Image) ─── */}
      <div className="bg-background border border-border/40 rounded-2xl overflow-hidden shadow-xs">
        {/* Gradient Cover Photo */}
        <div className="h-28 sm:h-36 w-full bg-gradient-to-r from-amber-100/40 via-orange-100/40 to-indigo-100/30 relative border-b border-border/20">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3f5ce6_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>
        
        {/* Avatar, Bio and verified badge */}
        <div className="px-6 pb-6 text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-6 sm:-mt-8 mb-6 relative z-10">
            {/* Avatar Circle Container */}
            <div className="relative group/avatar shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-background bg-zinc-800 flex items-center justify-center shadow-sm overflow-hidden select-none pointer-events-auto">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl sm:text-2xl font-black text-white">{initials}</span>
              )}
              
              {/* Upload Hover Overlay */}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center gap-1 cursor-pointer transition-opacity text-white text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider select-none">
                {uploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                <span>{uploadingAvatar ? '...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadAccountAvatar}
                  disabled={uploadingAvatar}
                />
              </label>
              

            </div>

            <div className="text-center sm:text-left space-y-1 pb-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <h2 className="text-lg sm:text-xl font-bold text-foreground leading-none">{profile?.full_name || 'Account User'}</h2>
                <span className="w-3.5 h-3.5 rounded-full bg-[#3f5ce6] text-white flex items-center justify-center text-[7.5px] font-bold">✓</span>
              </div>
              <p className="text-xs text-muted-foreground/85 leading-normal mt-1">{user?.email}</p>
            </div>
          </div>

          {/* Stats Callouts Row with vertical lines (Matches Image) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 py-5 border-t border-border/10 text-center md:text-left">
            <div className="space-y-1">
              <span className="block text-lg font-black text-foreground capitalize">{profile?.plan || 'Free'}</span>
              <span className="block text-[9.5px] text-muted-foreground font-black uppercase tracking-wider">Subscription Level</span>
            </div>
            <div className="space-y-1 border-l border-border/10 pl-0 md:pl-6">
              <span className="block text-lg font-black text-foreground">
                {isExpired() ? 'Expired' : 'Active'}
              </span>
              <span className="block text-[9.5px] text-muted-foreground font-black uppercase tracking-wider">Plan Status</span>
            </div>
            <div className="space-y-1 border-l border-border/10 pl-0 md:pl-6 text-center md:text-left">
              <span className="block text-lg font-black text-foreground">
                {userOrders?.length || 0}
              </span>
              <span className="block text-[9.5px] text-muted-foreground font-black uppercase tracking-wider">Orders Placed</span>
            </div>
            <div className="space-y-1 border-l border-border/10 pl-0 md:pl-6 text-center md:text-left">
              <span className="block text-lg font-black text-foreground">
                {cards?.length || 0}
              </span>
              <span className="block text-[9.5px] text-muted-foreground font-black uppercase tracking-wider">Cards Owned</span>
            </div>
            <div className="space-y-1 border-l border-border/10 pl-0 md:pl-6 text-center md:text-left">
              <span className="block text-lg font-black text-foreground">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </span>
              <span className="block text-[9.5px] text-muted-foreground font-black uppercase tracking-wider">Joined Date</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Row 1: Personal Info & Security (Side-by-Side, Equal Height) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        
        {/* Personal Info Card */}
        <div className="bg-background border border-border/40 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="border-b border-border/10 pb-2 mb-5">
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Personal Information</h3>
              </div>

              <form onSubmit={handleSaveAccount} className="space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-black text-muted-foreground uppercase tracking-wider">Registered Email</label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-xs text-muted-foreground focus:outline-none cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-black text-muted-foreground uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        required
                        value={accountForm.fullName || ''}
                        onChange={(e) => setAccountForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6]/10 focus:outline-none transition-colors"
                        placeholder="Full name"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="nfc-redirect"
                        checked={accountForm.nfcRedirectToDashboard || false}
                        onCheckedChange={(checked: boolean | 'indeterminate') => setAccountForm(prev => ({ ...prev, nfcRedirectToDashboard: !!checked }))}
                        className="mt-0.5"
                      />
                      <label htmlFor="nfc-redirect" className="min-w-0 text-xs text-foreground cursor-pointer select-none">
                        <span className="block text-xs font-bold">Redirect to Dashboard on NFC Tap</span>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-relaxed">
                          Redirects you straight to the card workspace dashboard when scanning your live card on a logged-in device.
                        </p>
                      </label>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="agreed-terms"
                        checked={accountForm.agreedToTerms || false}
                        onCheckedChange={(checked: boolean | 'indeterminate') => setAccountForm(prev => ({ ...prev, agreedToTerms: !!checked }))}
                        className="mt-0.5"
                      />
                      <label htmlFor="agreed-terms" className="min-w-0 text-xs text-foreground cursor-pointer select-none">
                        <span className="block text-xs font-bold">Terms & Conditions Agreement</span>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-relaxed">
                          Indicates that the account has agreed to the service terms, privacy policy, and client rules.
                        </p>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/5">
                  <button
                    type="submit"
                    disabled={savingAccount || !hasChanges}
                    className="w-full inline-flex justify-center items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-[11px] font-black transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#3f5ce6]"
                  >
                    {savingAccount ? (
                      <>
                        <Loader2 className="animate-spin" size={12} /> Saving...
                      </>
                    ) : (
                      <>
                        <Save size={12} /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Account & Session Security Card */}
        <div className="bg-background border border-border/40 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-border/10 pb-2">
              <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Account & Session Security</h3>
            </div>

            {/* Password section */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border/40 bg-muted/10 space-y-4">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  For your security, changing your password requires logging out and verifying your identity with a one-time passcode (OTP) sent to your registered email.
                </p>
                <button
                  onClick={handleInitiatePasswordReset}
                  disabled={savingPassword}
                  className="w-full inline-flex justify-center items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-[11px] font-black cursor-pointer shadow-xs transition-all active:scale-98 disabled:opacity-50"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="animate-spin" size={12} /> Redirecting...
                    </>
                  ) : (
                    <>
                      <Lock size={12} /> Reset Password via OTP
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Active Sessions list */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-border/10 pb-2">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Active Device Sessions</h4>
                <button
                  onClick={handleSignoutAllDevices}
                  disabled={!!sessionDisconnecting}
                  className="px-2 py-1 text-[9.5px] font-bold text-red-500 hover:text-white hover:bg-red-500 rounded-lg border border-red-500/10 hover:border-red-500 transition-all cursor-pointer disabled:opacity-50"
                >
                  {sessionDisconnecting === true ? 'Signing Out...' : 'Sign Out All'}
                </button>
              </div>

              <div className="space-y-2">
                {loggedSessions.map((session) => {
                  const isCurrent = session.id === currentSessionId
                  const { browser, os } = getBrowserAndOS(session.user_agent)
                  return (
                    <div
                      key={session.id}
                      className="p-3 rounded-xl border border-border/30 bg-muted/5 hover:bg-muted/15 transition-all flex items-center justify-between gap-4 text-xs animate-fadeIn"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Device Icon Container */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/40 border border-border/20 text-muted-foreground shrink-0">
                          {getDeviceIcon(os)}
                        </div>

                        {/* Session Details */}
                        <div className="min-w-0 text-left">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span className="font-bold text-foreground truncate">{os}</span>
                            <span className="text-muted-foreground/30 font-normal select-none">•</span>
                            <span className="text-muted-foreground/75 font-semibold truncate">{browser}</span>
                            {isCurrent && (
                              <span className="text-[#3f5ce6] font-black text-[7.5px] uppercase tracking-wider bg-[#3f5ce6]/10 px-1.5 py-0.5 rounded border border-[#3f5ce6]/20">
                                current
                              </span>
                            )}
                          </div>
                          <p className="text-[9.5px] text-muted-foreground font-medium mt-0.5">
                            Active: {session.updated_at ? new Date(session.updated_at).toLocaleDateString() : new Date(session.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0">
                        {!isCurrent ? (
                          <button
                            onClick={() => disconnectSession(session.id)}
                            disabled={!!sessionDisconnecting}
                            className="px-2.5 py-1 text-[9.5px] font-bold text-red-500 hover:text-white hover:bg-red-500 rounded-lg border border-red-500/10 hover:border-red-500 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {sessionDisconnecting === session.id ? '...' : 'Disconnect'}
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Row 2: Subscription & Upcoming Renewal (Full Width Single Row) ─── */}
      <div className="bg-background border border-border/40 rounded-2xl p-6 shadow-xs mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left section: Icon + Plan Status */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 flex items-center justify-center text-[#3f5ce6] shrink-0">
              <Zap size={18} className="fill-[#3f5ce6]/10" />
            </div>
            <div className="text-left">
              <span className="block text-[10px] text-muted-foreground font-black uppercase tracking-wider">Active Subscription</span>
              <span className="block text-sm font-black text-foreground capitalize">
                {profile?.plan || 'Free'} Plan
              </span>
            </div>
          </div>

          {/* Middle section: Price & Next billing date side-by-side */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-left">
            <div>
              <span className="block text-[9px] text-muted-foreground font-black uppercase tracking-wider">Tier Rate</span>
              <span className="block font-bold text-foreground mt-0.5">₹199.00 / month</span>
            </div>
            <div>
              <span className="block text-[9px] text-muted-foreground font-black uppercase tracking-wider">Next Invoice Date</span>
              <span className="block font-bold text-foreground mt-0.5">
                {profile?.plan_expires_at ? new Date(profile.plan_expires_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Right section: Make Payment button */}
          <div className="shrink-0 flex items-center gap-4">
            <button
              onClick={handleRenewPlan}
              disabled={renewingPlan}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-[11px] font-black cursor-pointer shadow-xs transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {renewingPlan ? (
                <>
                  <Loader2 className="animate-spin" size={12} /> Processing...
                </>
              ) : (
                <>
                  <CreditCard size={12} /> Make Payment
                </>
              )}
            </button>
          </div>
        </div>

        {/* Warning alerts inside if expired/expiring soon */}
        {(isExpiringSoon() || isExpired()) && (
          <div className="mt-4 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-3 text-xs animate-fadeIn">
            <div className="space-y-0.5 text-left">
              <p className="font-black text-amber-500 uppercase tracking-wider text-[10px]">
                {isExpired() ? 'Subscription Expired' : 'Subscription Expiring Soon'}
              </p>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Your plan has expired or is about to expire. Click **Make Payment** above to extend your plan for another 30 days.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Row 3: Danger Zone (Delete Account) ─── */}
      <div className="bg-red-500/[0.02] border border-red-500/20 rounded-2xl p-6 shadow-xs mt-8 text-left animate-fadeIn">
        <div className="border-b border-red-500/10 pb-2 mb-5">
          <h3 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldAlert size={14} /> Danger Zone
          </h3>
        </div>

        <div className="space-y-5">
          <div className="space-y-3.5">
            <h4 className="text-sm font-bold text-foreground">Delete Account</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Once you delete your account, there is no going back. All of your data will be permanently wiped from our databases. Please make sure you understand the consequences:
            </p>
            <ul className="list-disc pl-4 text-[10px] text-muted-foreground/85 space-y-2 leading-relaxed">
              <li>
                <strong>Public Profiles</strong>: Your public landing pages, biography, and verified badge details will be deleted permanently.
              </li>
              <li>
                <strong>NFC Smart Cards</strong>: All registered cards, custom settings, and tap analytics will be unlinked and deactivated.
              </li>
              <li>
                <strong>Billing & Orders</strong>: Your transaction history, renewal schedules, and billing historical records will be wiped out.
              </li>
              <li>
                <strong>vCard Details</strong>: Your downloadable contact profile file (.vcf details) will be cleared.
              </li>
              <li>
                <strong>Product Catalog</strong>: All custom catalog products, images, and showcases will be deleted.
              </li>
              <li>
                <strong>Leads & Submissions</strong>: All collected client leads, contact data, and active lead forms will be permanently destroyed.
              </li>
              <li>
                <strong>Feeds & Social Links</strong>: All news feeds, posts, reactions, and linked platforms will be deleted.
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-red-500/10 flex justify-end">
            <button
              onClick={() => {
                setConfirmEmail('')
                setDeleteModalOpen(true)
              }}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-black cursor-pointer transition-all active:scale-98"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* ─── Shadcn-Style Centered Dialog for Delete Account Confirmation ─── */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-xs animate-fadeIn" 
            onClick={() => !deletingAccount && setDeleteModalOpen(false)} 
          />

          {/* Dialog Panel Content */}
          <div className="relative grid w-full max-w-md gap-4 border border-border/80 bg-background p-6 shadow-xl rounded-2xl animate-scaleUp z-10 text-left">
            {/* Close Button */}
            <button
              onClick={() => !deletingAccount && setDeleteModalOpen(false)}
              className="absolute right-4 top-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              disabled={deletingAccount}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-muted-foreground">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </button>

            {/* Header */}
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 className="text-base font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 text-red-500">
                <ShieldAlert size={16} /> Delete Account Permanently?
              </h2>
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                This action is irreversible. It will immediately terminate your subscription, disable all smart cards, delete all leads, and permanently erase everything associated with this account.
              </p>
            </div>

            {/* Verification Form */}
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                  Type your email <span className="text-foreground select-all lowercase font-bold">{user?.email}</span> to confirm:
                </label>
                <input
                  type="email"
                  required
                  disabled={deletingAccount}
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="Enter your email ID"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground focus:border-red-500 focus:ring-1 focus:ring-red-500/10 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0 pt-2 border-t border-border/5">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deletingAccount}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-[11px] font-bold cursor-pointer transition-all active:scale-98 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount || confirmEmail !== user?.email}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-black cursor-pointer transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="animate-spin" size={12} /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={12} /> Yes, Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

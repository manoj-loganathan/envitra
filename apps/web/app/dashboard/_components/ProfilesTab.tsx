'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboard } from '../context'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, Sparkles, User, Check, Camera, Upload, Loader2, Trash2, Link2, Users, Package, Zap, Save, Activity, Download 
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'

export function ProfilesTab() {
  const router = useRouter()
  const supabase = createClient()
  const { 
    activeCard, 
    cardProfiles, 
    setCardProfiles, 
    activeProfile, 
    setActiveProfile, 
    vcardDataMap, 
    setVcardDataMap, 
    profile, 
    setMessage, 
    setMessageType,
    user 
  } = useDashboard()

  const isAllCards = activeCard?.id === 'all'

  // Local Modal/Form states
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<any | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)

  const [profileForm, setProfileForm] = useState({
    profileName: '',
    displayName: '',
    title: '',
    bio: '',
    status: 'active' as 'active' | 'inactive' | 'draft',
    isActive: false,
    primaryProfile: false,
    avatarUrl: '',
    bgImageUrl: ''
  })

  const [initialProfileForm, setInitialProfileForm] = useState<any>(null)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)

  const isFormChanged = () => {
    if (!initialProfileForm) return false
    return (
      profileForm.profileName !== initialProfileForm.profileName ||
      profileForm.displayName !== initialProfileForm.displayName ||
      profileForm.title !== initialProfileForm.title ||
      profileForm.bio !== initialProfileForm.bio ||
      profileForm.status !== initialProfileForm.status ||
      profileForm.isActive !== initialProfileForm.isActive ||
      profileForm.primaryProfile !== initialProfileForm.primaryProfile ||
      profileForm.avatarUrl !== initialProfileForm.avatarUrl ||
      profileForm.bgImageUrl !== initialProfileForm.bgImageUrl
    )
  }

  const handleOpenCreateProfile = () => {
    const isPro = profile?.plan === 'pro' || profile?.plan === 'business'
    const limit = isPro ? 5 : 1
    if (cardProfiles.length >= limit) {
      setMessageType('error')
      setMessage(
        isPro
          ? 'Pro plan allows up to 5 profiles per card. Delete a profile first to add a new one.'
          : 'Free plan allows 1 profile. Upgrade to Pro to add up to 5 profiles!'
      )
      return
    }
    setShowCancelConfirm(false)
    setEditingProfile(null)
    const initialForm = {
      profileName: '',
      displayName: profile?.full_name || '',
      title: '',
      bio: '',
      status: 'active' as const,
      isActive: false,
      primaryProfile: cardProfiles.length === 0,
      avatarUrl: '',
      bgImageUrl: ''
    }
    setProfileForm(initialForm)
    setInitialProfileForm(initialForm)
    setShowProfileModal(true)
  }

  const handleOpenEditProfile = (p: any) => {
    setShowCancelConfirm(false)
    setEditingProfile(p)
    const initialForm = {
      profileName: p.profile_name || '',
      displayName: p.display_name || '',
      title: p.title || '',
      bio: p.bio || '',
      status: p.status || 'draft',
      isActive: p.is_active || false,
      primaryProfile: p.primary_profile || false,
      avatarUrl: p.avatar_url || '',
      bgImageUrl: p.bg_image_url || ''
    }
    setProfileForm(initialForm)
    setInitialProfileForm(initialForm)
    setShowProfileModal(true)
  }

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `${fileName}`

      const { error } = await supabase.storage
        .from('profile-avatars')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(filePath)

      setProfileForm(prev => ({ ...prev, avatarUrl: publicUrl }))
      setMessageType('success')
      setMessage('Avatar image uploaded successfully!')
    } catch (err: any) {
      console.error(err)
      setMessageType('error')
      setMessage(err.message || 'Failed to upload avatar image.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingBg(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `${fileName}`

      const { error } = await supabase.storage
        .from('profile-backgrounds')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('profile-backgrounds')
        .getPublicUrl(filePath)

      setProfileForm(prev => ({ ...prev, bgImageUrl: publicUrl }))
      setMessageType('success')
      setMessage('Background image uploaded successfully!')
    } catch (err: any) {
      console.error(err)
      setMessageType('error')
      setMessage(err.message || 'Failed to upload background image.')
    } finally {
      setUploadingBg(false)
    }
  }

  const handleSaveProfile = async (e: React.SyntheticEvent, formOverride?: typeof profileForm) => {
    if (e) e.preventDefault()
    if (!activeCard || isAllCards || !user) return
    setSavingProfile(true)
    setMessage(null)

    const targetForm = formOverride || profileForm

    try {
      if (editingProfile) {
        const { error } = await supabase
          .from('card_profiles')
          .update({
            profile_name: targetForm.profileName,
            display_name: targetForm.displayName,
            title: targetForm.title || null,
            bio: targetForm.bio || null,
            status: targetForm.status,
            is_active: targetForm.isActive,
            primary_profile: targetForm.primaryProfile,
            avatar_url: targetForm.avatarUrl || null,
            bg_image_url: targetForm.bgImageUrl || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProfile.id)

        if (error) throw error
        setMessageType('success')
        setMessage('Profile updated successfully!')
      } else {
        const { data, error } = await supabase
          .from('card_profiles')
          .insert({
            card_id: activeCard.id,
            account_id: user.id,
            profile_name: targetForm.profileName,
            display_name: targetForm.displayName,
            title: targetForm.title || null,
            bio: targetForm.bio || null,
            status: targetForm.status,
            is_active: targetForm.isActive,
            primary_profile: targetForm.primaryProfile,
            avatar_url: targetForm.avatarUrl || null,
            bg_image_url: targetForm.bgImageUrl || null
          })
          .select('*')
          .single()

        if (error) throw error

        if (data) {
          await supabase.from('vcard_details').insert({ profile_id: data.id })

          setVcardDataMap((prev: Record<string, any>) => ({
            ...prev,
            [data.id]: {
              profile_id: data.id,
              first_name: '',
              last_name: '',
              phones: [],
              emails: [],
              custom_fields: []
            }
          }))
        }
        setMessageType('success')
        setMessage('New profile created successfully!')
      }

      const { data: updatedList, error: listError } = await supabase
        .from('card_profiles')
        .select('*')
        .eq('card_id', activeCard.id)
        .order('sort_order', { ascending: true })

      if (!listError && updatedList) {
        const isPro = profile?.plan === 'pro' || profile?.plan === 'business'
        let currentList = [...updatedList]

        if (!isPro && updatedList.length > 0) {
          const primary = updatedList.find((p: any) => p.primary_profile) || updatedList[0]
          const activeProfiles = updatedList.filter((p: any) => p.is_active)
          const needsSync = activeProfiles.length !== 1 || activeProfiles[0].id !== primary.id

          if (needsSync) {
            await supabase.from('card_profiles').update({ is_active: false }).eq('card_id', activeCard.id)
            await supabase.from('card_profiles').update({ is_active: true }).eq('id', primary.id)
            const { data: resynced } = await supabase
              .from('card_profiles')
              .select('*')
              .eq('card_id', activeCard.id)
              .order('sort_order', { ascending: true })
            if (resynced) currentList = resynced
          }
        }

        setCardProfiles(currentList)
        const live = currentList.find((p: any) => p.is_active) || currentList[0] || null
        setActiveProfile(live)
      }

      setShowProfileModal(false)
    } catch (err: any) {
      console.error(err)
      setMessageType('error')
      setMessage(err.message || 'Failed to save profile details.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSetProfileLive = async (profileId: string) => {
    if (!activeCard || isAllCards) return
    setMessage(null)

    try {
      const { error } = await supabase
        .from('card_profiles')
        .update({ is_active: true })
        .eq('id', profileId)

      if (error) throw error

      const { data: updatedList } = await supabase
        .from('card_profiles')
        .select('*')
        .eq('card_id', activeCard.id)
        .order('sort_order', { ascending: true })

      if (updatedList) {
        setCardProfiles(updatedList)
        const live = updatedList.find((p: any) => p.is_active) || null
        setActiveProfile(live)
        setMessageType('success')
        setMessage('Profile is now active / live!')
      }
    } catch (err: any) {
      console.error(err)
      setMessageType('error')
      setMessage(err.message || 'Failed to set profile live.')
    }
  }

  const handleSetProfilePrimary = async (profileId: string) => {
    if (!activeCard || isAllCards) return
    setMessage(null)
    try {
      const { error } = await supabase
        .from('card_profiles')
        .update({ primary_profile: true })
        .eq('id', profileId)

      if (error) throw error

      const { data: updatedList } = await supabase
        .from('card_profiles')
        .select('*')
        .eq('card_id', activeCard.id)
        .order('sort_order', { ascending: true })

      if (updatedList) {
        setCardProfiles(updatedList)
        const live = updatedList.find((p: any) => p.is_active) || updatedList[0] || null
        setActiveProfile(live)
      }
      setMessageType('success')
      setMessage('Primary profile set successfully!')
    } catch (err: any) {
      console.error(err)
      setMessageType('error')
      setMessage(err.message || 'Failed to set primary profile.')
    }
  }

  const handleDownloadVCard = (vc: any, p: any) => {
    if (!vc) return
    const firstName = vc.first_name || ''
    const lastName = vc.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim() || p.display_name || p.profile_name

    const orgValue = vc.organization || vc.department
      ? `ORG:${vc.organization || ''}${vc.department ? `;${vc.department}` : ''}`
      : ''

    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${lastName};${firstName};;;`,
      `FN:${fullName}`,
      orgValue,
      vc.job_title ? `TITLE:${vc.job_title}` : '',
      vc.website ? `URL;TYPE=WORK:${vc.website}` : '',
      vc.notes ? `NOTE:${vc.notes.replace(/\n/g, '\\n')}` : '',
    ]

    if (vc.phones && vc.phones.length > 0) {
      vc.phones.forEach((phone: any) => {
        if (phone.number) {
          vcardLines.push(`TEL;TYPE=${(phone.label || 'CELL').toUpperCase()}:${phone.number}`)
        }
      })
    }

    if (vc.emails && vc.emails.length > 0) {
      vc.emails.forEach((email: any) => {
        if (email.email) {
          vcardLines.push(`EMAIL;TYPE=${(email.label || 'WORK').toUpperCase()}:${email.email}`)
        }
      })
    }

    if (vc.street || vc.city || vc.state || vc.postal_code) {
      vcardLines.push(`ADR;TYPE=WORK:;;${vc.street || ''};${vc.city || ''};${vc.state || ''};${vc.postal_code || ''};${vc.country || 'India'}`)
    }

    if (vc.urls && vc.urls.length > 0) {
      vc.urls.forEach((u: any) => {
        if (u.url) {
          vcardLines.push(`URL;TYPE=${(u.label || 'CUSTOM').toUpperCase()}:${u.url}`)
        }
      })
    }

    if (vc.socials && vc.socials.length > 0) {
      vc.socials.forEach((s: any) => {
        if (s.url) {
          vcardLines.push(`X-SOCIALPROFILE;TYPE=${(s.platform || 'OTHER').toUpperCase()}:${s.url}`)
        }
      })
    }

    if (vc.custom_fields && vc.custom_fields.length > 0) {
      vc.custom_fields.forEach((field: any) => {
        if (field.key && field.value) {
          vcardLines.push(`X-${field.key.replace(/\s+/g, '-').toUpperCase()}:${field.value}`)
        }
      })
    }

    vcardLines.push('END:VCARD')
    const vcardString = vcardLines.filter(Boolean).join('\n')

    const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fullName.replace(/\s+/g, '_')}_contact.vcf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDeleteProfile = async (p: any) => {
    if (!activeCard || isAllCards) return

    if (p.primary_profile && cardProfiles.length > 1) {
      setMessageType('error')
      setMessage('You cannot delete the primary profile while other profiles exist. Please set another profile as primary first.')
      return
    }

    if (!confirm(`Are you sure you want to delete profile "${p.profile_name}"? This will permanently remove all linked social links, products, feeds, and contact info.`)) {
      return
    }

    setMessage(null)
    try {
      const { error } = await supabase
        .from('card_profiles')
        .delete()
        .eq('id', p.id)

      if (error) throw error

      setMessageType('success')
      setMessage('Profile deleted successfully.')

      const { data: updatedList } = await supabase
        .from('card_profiles')
        .select('*')
        .eq('card_id', activeCard.id)
        .order('sort_order', { ascending: true })

      if (updatedList) {
        const isPro = profile?.plan === 'pro' || profile?.plan === 'business'
        let currentList = [...updatedList]

        if (updatedList.length > 0) {
          const primary = updatedList.find((x: any) => x.primary_profile) || updatedList[0]
          const activeProfiles = updatedList.filter((x: any) => x.is_active)
          const needsSync = activeProfiles.length === 0 || (!isPro && (activeProfiles.length !== 1 || activeProfiles[0].id !== primary.id))

          if (needsSync) {
            await supabase.from('card_profiles').update({ is_active: false }).eq('card_id', activeCard.id)
            await supabase.from('card_profiles').update({ is_active: true }).eq('id', primary.id)
            const { data: resynced } = await supabase
              .from('card_profiles')
              .select('*')
              .eq('card_id', activeCard.id)
              .order('sort_order', { ascending: true })
            if (resynced) currentList = resynced
          }
        }

        setCardProfiles(currentList)
        const live = currentList.find((x: any) => x.is_active) || currentList[0] || null
        setActiveProfile(live)

        setVcardDataMap((prev: Record<string, any>) => {
          const updated = { ...prev }
          delete updated[p.id]
          return updated
        })
      }
    } catch (err: any) {
      console.error(err)
      setMessageType('error')
      setMessage(err.message || 'Failed to delete profile.')
    }
  }

  if (isAllCards) return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 flex items-center justify-center">
        <User size={28} className="text-[#3f5ce6]" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground">Select a Card Workspace</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
          Profiles are per-card. Select a specific card from the workspace dropdown in the header to manage its digital profiles.
        </p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      <div className="flex justify-between items-center">
        <div className="hidden sm:block">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">NFC Profile Manager</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Card: <span className="font-semibold text-foreground">{activeCard?.slug}</span> · Create and configure multiple digital profiles. The designated active profile is loaded automatically when your NFC card is tapped or scanned.
          </p>
        </div>
        <button
          onClick={handleOpenCreateProfile}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold cursor-pointer shadow-md transition-all active:scale-98"
        >
          <Plus size={14} /> Add Profile
        </button>
      </div>

      {/* Plan limit banner */}
      {!(profile?.plan === 'pro' || profile?.plan === 'business') && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs">
          <Sparkles className="size-4 text-amber-500 shrink-0" />
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            Free plan: 1 profile per card. <strong>Pro</strong> allows 5 profiles. <button onClick={() => {}} className="underline cursor-pointer font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">Upgrade now</button>
          </span>
        </div>
      )}

      {/* Profile list */}
      {cardProfiles.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#3f5ce6]/10 flex items-center justify-center mx-auto">
            <User size={20} className="text-[#3f5ce6]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">No profiles yet</h4>
            <p className="text-xs text-muted-foreground mt-1">Create your first profile to start sharing with your card.</p>
          </div>
          <button
            onClick={handleOpenCreateProfile}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#3f5ce6] text-white text-xs font-semibold hover:bg-[#3050d8] active:scale-98 transition-all"
          >
            <Plus size={13} /> Create First Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
          {cardProfiles.map((p: any) => (
            <div
              key={p.id}
              className={`group bg-card border rounded-3xl transition-all cursor-pointer hover:shadow-xl relative overflow-hidden flex flex-col justify-between ${
                p.is_active ? 'border-emerald-500/40 shadow-emerald-500/5' : 'border-border hover:border-[#3f5ce6]/30'
              }`}
              onClick={() => {
                setActiveProfile(p);
                handleOpenEditProfile(p);
              }}
            >
              <div className="px-4 pt-4 w-full shrink-0">
                <div className={`relative w-full h-32 overflow-hidden rounded-[20px] ${p.bg_image_url ? 'bg-gradient-to-br from-sky-200 via-sky-100 to-white' : 'bg-muted'}`}>
                  {p.bg_image_url ? (
                    <img src={p.bg_image_url} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#3f5ce6]/10 flex items-center justify-center px-6 text-center select-none text-xl font-black text-[#3f5ce6]">
                      {p.profile_name}
                    </div>
                  )}

                  <div className="absolute top-3 right-3 z-20">
                    {p.primary_profile ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#3f5ce6] to-[#506df0] text-white text-[10px] font-bold shadow-lg shadow-[#3f5ce6]/25 select-none border border-white/10 flex items-center">
                        <Check size={11} className="stroke-[3.5] mr-1" /> Primary
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetProfilePrimary(p.id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-950/60 hover:bg-zinc-950/80 backdrop-blur-md text-zinc-100 hover:text-white border border-white/10 hover:border-white/20 shadow-md text-[10px] font-bold cursor-pointer transition-all active:scale-95 duration-200"
                      >
                        Set Primary +
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 px-5 pb-5 relative flex flex-col justify-between">
                <div className="flex justify-between items-start shrink-0">
                  <div className="relative -mt-10 shrink-0 z-10">
                    <div className="w-20 h-20 rounded-full border-4 border-card bg-muted shadow-sm overflow-hidden flex items-center justify-center">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.profile_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#3f5ce6]/10 flex items-center justify-center text-xl font-black text-[#3f5ce6]">
                          {p.profile_name?.[0]?.toUpperCase() || 'P'}
                        </div>
                      )}
                    </div>
                    {p.is_active ? (
                      <span className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-emerald-500 border-2 border-card rounded-full flex items-center justify-center shadow-sm" title="Profile is Live">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping absolute" />
                        <span className="w-1.5 h-1.5 bg-white rounded-full" />
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetProfileLive(p.id);
                        }}
                        className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-zinc-400 hover:bg-emerald-400 border-2 border-card rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors"
                        title="Set Live (Activate)"
                      >
                        <span className="w-1 h-1 bg-white rounded-full" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-extrabold text-foreground truncate">{p.display_name || p.profile_name}</h4>
                      <p className="text-[11px] text-muted-foreground leading-normal mt-0.5 line-clamp-2 min-h-[32px]">{p.title || 'No tagline set'}</p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm select-none">
                        <div className="w-5 h-5 rounded-full bg-[#3f5ce6] flex items-center justify-center text-[10px] font-black text-white shrink-0">
                          {p.profile_name?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <span className="text-xs font-bold text-zinc-800 dark:text-muted-foreground pr-0.5 truncate max-w-[90px] sm:max-w-[120px]" title={p.profile_name}>
                          {p.profile_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {p.bio && (
                    <p className="text-[11px] text-muted-foreground/75 dark:text-zinc-400/75 leading-relaxed mt-2.5 line-clamp-3">
                      {p.bio}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  {(() => {
                    const vc = vcardDataMap[p.id];
                    const hasVcard = vc && (
                      vc.first_name?.trim() ||
                      vc.last_name?.trim() ||
                      (vc.phones && vc.phones.length > 0) ||
                      (vc.emails && vc.emails.length > 0)
                    );

                    if (hasVcard) {
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadVCard(vc, p);
                          }}
                          className="w-full py-2 px-3 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 text-[11px] font-bold text-foreground flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                        >
                          <Download size={12} /> Save Contact
                        </button>
                      );
                    } else {
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push('/dashboard/vcard');
                          }}
                          className="w-full py-2 px-3 rounded-xl border border-dashed border-[#3f5ce6]/30 bg-[#3f5ce6]/5 hover:bg-[#3f5ce6]/10 text-[11px] font-bold text-[#3f5ce6] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                        >
                          <Plus size={12} /> Add vCard Details
                        </button>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Card Bottom / Quick Add Footer */}
              <div className="border-t border-border grid grid-cols-4 divide-x divide-border bg-muted/10 dark:bg-zinc-800/10 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveProfile(p);
                    router.push('/dashboard/links');
                  }}
                  className="py-3 flex flex-col items-center justify-center gap-1 hover:bg-muted/50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                  title="Add Social & Payment Links"
                >
                  <span className="text-muted-foreground group-hover:text-[#3f5ce6] transition-colors">
                    <Link2 size={15} />
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground">Links</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveProfile(p);
                    router.push('/dashboard/leads');
                  }}
                  className="py-3 flex flex-col items-center justify-center gap-1 hover:bg-muted/50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                  title="Manage Captured Leads"
                >
                  <span className="text-muted-foreground group-hover:text-[#3f5ce6] transition-colors">
                    <Users size={15} />
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground">Leads</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveProfile(p);
                    router.push('/dashboard/products');
                  }}
                  className="py-3 flex flex-col items-center justify-center gap-1 hover:bg-muted/50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                  title="Add Showcase Products"
                >
                  <span className="text-muted-foreground group-hover:text-[#3f5ce6] transition-colors">
                    <Package size={15} />
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground">Products</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveProfile(p);
                    router.push('/dashboard/feeds');
                  }}
                  className="py-3 flex flex-col items-center justify-center gap-1 hover:bg-muted/50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                  title="Add Feeds"
                >
                  <span className="text-muted-foreground group-hover:text-[#3f5ce6] transition-colors">
                    <Zap size={15} />
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground">Feeds</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      <Sheet open={showProfileModal} onOpenChange={(open: boolean) => {
        if (!open) {
          if (isFormChanged()) {
            setShowCancelConfirm(true)
          } else {
            setShowProfileModal(false)
          }
        } else {
          setShowProfileModal(true)
        }
      }}>
        <SheetContent className="!w-full sm:!max-w-2xl lg:!max-w-xl bg-background dark:bg-[#18181b] border-l border-border dark:border-zinc-800 p-0 flex flex-col h-full overflow-hidden text-left" showCloseButton={false}>
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-[#3f5ce6] to-indigo-600 shrink-0" />

          <form onSubmit={handleSaveProfile} className="flex flex-col h-full overflow-hidden">
            <SheetHeader className="pt-0.5 px-6 pb-3 border-b border-border dark:border-zinc-800/80 shrink-0">
              <div className="space-y-1">
                <SheetTitle className="text-lg font-bold text-foreground dark:text-white">
                  {editingProfile ? 'Modify Profile Details' : 'Create Smart Card Profile'}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed font-medium">
                  {editingProfile
                    ? 'Update your profile information and configure dynamic access.'
                    : 'Add another digital profile to your physical card for custom targets.'}
                </SheetDescription>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleUploadAvatar}
                accept="image/*"
                className="hidden"
              />
              <input
                type="file"
                ref={bgInputRef}
                onChange={handleUploadBg}
                accept="image/*"
                className="hidden"
              />

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider block">Profile Assets</label>
                <div className="relative mb-14 mt-1">
                  {profileForm.bgImageUrl ? (
                    <div className="relative w-full h-36 rounded-xl border border-border dark:border-zinc-800 bg-muted dark:bg-zinc-900 overflow-hidden flex items-center justify-center group">
                      <img src={profileForm.bgImageUrl} alt="Background" className="w-full h-full object-cover" />
                      <div
                        onClick={() => bgInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-white text-xs font-semibold select-none z-10"
                      >
                        <Camera size={16} className="text-zinc-300 animate-pulse" />
                        <span>Change Cover Photo</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => bgInputRef.current?.click()}
                      className="relative w-full h-36 rounded-xl border-2 border-dashed border-border dark:border-zinc-800 bg-muted/20 dark:bg-zinc-950/10 hover:bg-muted/40 dark:hover:bg-zinc-950/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group"
                    >
                      {uploadingBg ? (
                        <Loader2 className="w-6 h-6 animate-spin text-[#3f5ce6]" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-muted-foreground dark:text-zinc-500 group-hover:text-foreground dark:group-hover:text-zinc-400 transition-colors mb-0.5" />
                          <span className="text-xs font-semibold text-foreground dark:text-zinc-300 group-hover:text-primary dark:group-hover:text-white transition-colors">Drop or browse files</span>
                          <span className="text-[10px] text-muted-foreground dark:text-zinc-500">Maximum 5 MB file size</span>
                        </>
                      )}
                    </button>
                  )}

                  <div className="absolute left-6 -bottom-10 z-10 group/avatar rounded-2xl">
                    <div className="relative w-20 h-20 rounded-2xl bg-muted dark:bg-[#18181b] overflow-hidden flex items-center justify-center transition-colors">
                      {uploadingAvatar ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#3f5ce6]" />
                      ) : profileForm.avatarUrl ? (
                        <>
                          <img src={profileForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          <div
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer text-white text-[9px] font-bold select-none text-center px-1 z-10"
                          >
                            <Camera size={13} className="text-zinc-300" />
                            <span>Change Avatar</span>
                          </div>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute inset-0 border-2 border-dashed border-border dark:border-zinc-800 bg-muted/20 dark:bg-zinc-950/10 hover:bg-muted/40 dark:hover:bg-zinc-950/20 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer group/avatar-empty rounded-2xl"
                        >
                          <Upload size={14} className="text-muted-foreground dark:text-zinc-500 group-hover/avatar-empty:text-foreground dark:group-hover/avatar-empty:text-zinc-400 transition-colors" />
                          <span className="text-[9px] font-bold text-foreground dark:text-zinc-300 group-hover/avatar-empty:text-primary dark:group-hover/avatar-empty:text-white transition-colors">Avatar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {(profileForm.bgImageUrl || profileForm.avatarUrl) && (
                    <div className="absolute -bottom-10 right-1 flex items-center gap-2 z-20">
                      {profileForm.avatarUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setProfileForm(prev => ({ ...prev, avatarUrl: '' }))
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-background/80 dark:bg-zinc-950/80 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 hover:text-red-600 border border-border dark:border-zinc-800 text-[10px] font-bold transition-all cursor-pointer active:scale-95 shadow-md select-none"
                        >
                          Remove Avatar
                        </button>
                      )}
                      {profileForm.bgImageUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setProfileForm(prev => ({ ...prev, bgImageUrl: '' }))
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-background/80 dark:bg-zinc-950/80 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 hover:text-red-600 border border-border dark:border-zinc-800 text-[10px] font-bold transition-all cursor-pointer active:scale-95 shadow-md select-none"
                        >
                          Remove Cover
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider block">Profile Label (Internal)</label>
                <input
                  type="text"
                  required
                  value={profileForm.profileName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, profileName: e.target.value }))}
                  placeholder="e.g., Personal Matte Card, Work Profile"
                  className="w-full bg-background dark:bg-zinc-900 border border-border dark:border-zinc-800 focus:border-[#3f5ce6] focus:outline-none rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground dark:text-white transition-all placeholder-muted-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider block">Full Name (Display)</label>
                <input
                  type="text"
                  required
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="e.g., Manoj Kumar"
                  className="w-full bg-background dark:bg-zinc-900 border border-border dark:border-zinc-800 focus:border-[#3f5ce6] focus:outline-none rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground dark:text-white transition-all placeholder-muted-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider block">Job Title / Tagline</label>
                <input
                  type="text"
                  value={profileForm.title}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Senior Software Architect"
                  className="w-full bg-background dark:bg-zinc-900 border border-border dark:border-zinc-800 focus:border-[#3f5ce6] focus:outline-none rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground dark:text-white transition-all placeholder-muted-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider block">Bio / Summary Description</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Brief bio to show when this profile is active..."
                  rows={3}
                  className="w-full bg-background dark:bg-zinc-900 border border-border dark:border-zinc-800 focus:border-[#3f5ce6] focus:outline-none rounded-xl px-3 py-2 text-xs font-semibold text-foreground dark:text-white transition-all resize-none placeholder-muted-foreground"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider block">Profile Status</label>
                <div className="flex rounded-xl p-1 bg-muted/40 dark:bg-zinc-950/40 border border-border dark:border-zinc-800/80 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm(prev => ({
                        ...prev,
                        status: 'active',
                        isActive: true
                      }));
                    }}
                    className={`flex-grow py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      profileForm.status === 'active'
                        ? 'bg-purple-600 text-white shadow-sm border border-purple-600'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-zinc-800/20'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm(prev => ({
                        ...prev,
                        status: 'inactive',
                        isActive: false
                      }));
                    }}
                    className={`flex-grow py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      profileForm.status === 'inactive'
                        ? 'bg-purple-600 text-white shadow-sm border border-purple-600'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-zinc-800/20'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-500/10 dark:border-emerald-500/20 bg-emerald-500/5 cursor-pointer select-none transition-all hover:bg-emerald-500/10">
                  <Checkbox
                    id="set-live"
                    checked={profileForm.isActive}
                    onCheckedChange={(checked) => {
                      const isChecked = !!checked;
                      setProfileForm(prev => ({
                        ...prev,
                        isActive: isChecked,
                        status: isChecked ? 'active' : (prev.status === 'active' ? 'inactive' : prev.status)
                      }));
                    }}
                  />
                  <div className="text-left space-y-0.5">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                      <Activity size={11} className="animate-pulse" /> Set Live Immediately
                    </span>
                    <p className="text-[10px] text-muted-foreground dark:text-zinc-400 font-medium leading-relaxed">
                      Instantly links this profile to your physical card taps, deactivating other profiles.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-amber-500/10 dark:border-amber-500/20 bg-amber-500/5 cursor-pointer select-none transition-all hover:bg-amber-500/10">
                  <Checkbox
                    id="set-primary"
                    checked={profileForm.primaryProfile}
                    disabled={editingProfile?.primary_profile && cardProfiles.length > 1}
                    onCheckedChange={(checked) => setProfileForm(prev => ({ ...prev, primaryProfile: !!checked }))}
                  />
                  <div className="text-left space-y-0.5">
                    <span className="text-xs font-black text-amber-500 flex items-center gap-1">
                      <Sparkles size={11} /> Set as Primary Profile
                    </span>
                    <p className="text-[10px] text-muted-foreground dark:text-zinc-400 font-medium leading-relaxed">
                      If your Pro subscription expires, this profile will remain the only active profile.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row sm:space-x-2 justify-end">
              {showCancelConfirm ? (
                <div className="flex flex-col gap-3 w-full text-left">
                  <span className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">You have unsaved changes. What would you like to do?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCancelConfirm(false)
                        setShowProfileModal(false)
                      }}
                      className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                    >
                      Discard Changes
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        setShowCancelConfirm(false)
                        const updatedForm = { ...profileForm, status: 'draft' as const, isActive: false }
                        setProfileForm(updatedForm)
                        await handleSaveProfile(e, updatedForm)
                      }}
                      className="flex-1 py-2 rounded-xl bg-secondary dark:bg-zinc-800 hover:bg-secondary/80 dark:hover:bg-zinc-700 text-secondary-foreground dark:text-white text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-4 py-2 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/50 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                    >
                      Resume
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 w-full">
                  {editingProfile && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm("Are you sure you want to delete this profile?")) {
                          setShowProfileModal(false)
                          await handleDeleteProfile(editingProfile)
                        }
                      }}
                      className="py-2 px-3.5 rounded-xl border border-red-500/35 bg-red-500/5 hover:bg-red-550/10 dark:hover:bg-red-500/15 text-red-500 dark:text-red-400 font-semibold text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                      title="Delete Profile"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (isFormChanged()) {
                        setShowCancelConfirm(true)
                      } else {
                        setShowProfileModal(false)
                      }
                    }}
                    className="flex-grow py-2 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/40 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex-grow py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={13} />
                        {editingProfile ? 'Save Changes' : 'Create Profile'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

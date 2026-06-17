'use client'

import React, { useState, useEffect } from 'react'
import { useDashboard } from '../context'
import { createClient } from '@/lib/supabase/client'
import { 
  AlertCircle, Loader2, User, Briefcase, Phone, Plus, ChevronDown, Check, Trash2, X, Mail, Globe, ExternalLink, Share2, MapPin, FileText, Save 
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"

export function VCardTab() {
  const supabase = createClient()
  const { 
    activeCard, 
    activeProfile, 
    vcardDataMap, 
    setVcardDataMap,
    setMessage,
    setMessageType
  } = useDashboard()

  const isAllCards = activeCard?.id === 'all'

  // vCard Form State
  const [vcardForm, setVcardForm] = useState({
    firstName: '',
    lastName: '',
    organization: '',
    jobTitle: '',
    department: '',
    website: '',
    phones: [] as Array<{ label: string; number: string; is_primary: boolean }>,
    emails: [] as Array<{ label: string; email: string; is_primary: boolean }>,
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    urls: [] as Array<{ label: string; url: string }>,
    socials: [] as Array<{ platform: string; username: string; url: string }>,
    notes: '',
    customFields: [] as Array<{ key: string; value: string }>,
  })
  
  const [savingVCard, setSavingVCard] = useState(false)
  const [loadingVCard, setLoadingVCard] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ type: 'phone' | 'email' | 'url' | 'social'; index: number } | null>(null)

  // Fetch vCard details when active card or active profile changes
  useEffect(() => {
    if (isAllCards || !activeCard?.id) return

    const fetchVCardDetails = async () => {
      setLoadingVCard(true)
      try {
        let targetProfileId = activeProfile?.id
        if (!targetProfileId) {
          const { data: profiles } = await supabase
            .from('card_profiles')
            .select('id')
            .eq('card_id', activeCard.id)
            .order('sort_order', { ascending: true })

          if (profiles && profiles.length > 0) {
            targetProfileId = profiles[0].id
          }
        }

        if (!targetProfileId) {
          setVcardForm({
            firstName: '',
            lastName: '',
            organization: '',
            jobTitle: '',
            department: '',
            website: '',
            phones: [],
            emails: [],
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India',
            urls: [],
            socials: [],
            notes: '',
            customFields: [],
          })
          return
        }

        const { data: vcardData, error } = await supabase
          .from('vcard_details')
          .select('*')
          .eq('profile_id', targetProfileId)
          .maybeSingle()

        if (!error && vcardData) {
          setVcardForm({
            firstName: vcardData.first_name || '',
            lastName: vcardData.last_name || '',
            organization: vcardData.organization || '',
            jobTitle: vcardData.job_title || '',
            department: vcardData.department || '',
            website: vcardData.website || '',
            phones: vcardData.phones || [],
            emails: vcardData.emails || [],
            street: vcardData.street || '',
            city: vcardData.city || '',
            state: vcardData.state || '',
            postalCode: vcardData.postal_code || '',
            country: vcardData.country || 'India',
            urls: vcardData.urls || [],
            socials: vcardData.socials || [],
            notes: vcardData.notes || '',
            customFields: vcardData.custom_fields || [],
          })
        } else {
          setVcardForm({
            firstName: '',
            lastName: '',
            organization: '',
            jobTitle: '',
            department: '',
            website: '',
            phones: [],
            emails: [],
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India',
            urls: [],
            socials: [],
            notes: '',
            customFields: [],
          })
        }
      } catch (err) {
        console.error('Failed to load vCard details:', err)
      } finally {
        setLoadingVCard(false)
      }
    }

    fetchVCardDetails()
  }, [activeCard?.id, activeProfile?.id])

  const handleAddPhone = () => {
    setVcardForm(prev => ({
      ...prev,
      phones: [...prev.phones, { label: 'Mobile', number: '', is_primary: prev.phones.length === 0 }]
    }))
  }

  const handleRemovePhone = (index: number) => {
    setVcardForm(prev => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== index)
    }))
  }

  const handlePhoneChange = (index: number, field: string, value: any) => {
    setVcardForm(prev => ({
      ...prev,
      phones: prev.phones.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }))
  }

  const handleAddEmail = () => {
    setVcardForm(prev => ({
      ...prev,
      emails: [...prev.emails, { label: 'Work', email: '', is_primary: prev.emails.length === 0 }]
    }))
  }

  const handleRemoveEmail = (index: number) => {
    setVcardForm(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index)
    }))
  }

  const handleEmailChange = (index: number, field: string, value: any) => {
    setVcardForm(prev => ({
      ...prev,
      emails: prev.emails.map((e, i) => i === index ? { ...e, [field]: value } : e)
    }))
  }

  const handleAddCustomField = () => {
    setVcardForm(prev => ({
      ...prev,
      customFields: [...prev.customFields, { key: '', value: '' }]
    }))
  }

  const handleRemoveCustomField = (index: number) => {
    setVcardForm(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
    }))
  }

  const handleCustomFieldChange = (index: number, field: string, value: string) => {
    setVcardForm(prev => ({
      ...prev,
      customFields: prev.customFields.map((c, i) => i === index ? { ...c, [field]: value } : c)
    }))
  }

  const handleAddUrl = () => {
    setVcardForm(prev => ({
      ...prev,
      urls: [...prev.urls, { label: 'Website', url: '' }]
    }))
  }

  const handleRemoveUrl = (index: number) => {
    setVcardForm(prev => ({
      ...prev,
      urls: prev.urls.filter((_, i) => i !== index)
    }))
  }

  const handleUrlChange = (index: number, field: string, value: string) => {
    setVcardForm(prev => ({
      ...prev,
      urls: prev.urls.map((u, i) => i === index ? { ...u, [field]: value } : u)
    }))
  }

  const handleAddSocial = () => {
    setVcardForm(prev => ({
      ...prev,
      socials: [...prev.socials, { platform: 'LinkedIn', username: '', url: '' }]
    }))
  }

  const handleRemoveSocial = (index: number) => {
    setVcardForm(prev => ({
      ...prev,
      socials: prev.socials.filter((_, i) => i !== index)
    }))
  }

  const handleSocialChange = (index: number, field: string, value: string) => {
    setVcardForm(prev => ({
      ...prev,
      socials: prev.socials.map((s, i) => {
        if (i === index) {
          const updated = { ...s, [field]: value }
          if (field === 'username' || field === 'platform') {
            const platform = field === 'platform' ? value : s.platform
            const username = field === 'username' ? value : s.username
            if (username) {
              if (platform === 'LinkedIn') updated.url = `https://linkedin.com/in/${username}`
              else if (platform === 'Instagram') updated.url = `https://instagram.com/${username}`
              else if (platform === 'Twitter' || platform === 'X') updated.url = `https://x.com/${username}`
              else if (platform === 'Facebook') updated.url = `https://facebook.com/${username}`
              else if (platform === 'YouTube') updated.url = `https://youtube.com/@${username}`
              else if (platform === 'TikTok') updated.url = `https://tiktok.com/@${username}`
              else if (platform === 'WhatsApp') updated.url = `https://wa.me/${username.replace(/[^\d+]/g, '')}`
            }
          }
          return updated
        }
        return s
      })
    }))
  }

  const saveVCard = async (vcardData: typeof vcardForm) => {
    setSavingVCard(true)
    setMessage(null)
    try {
      const { data: profiles } = await supabase
        .from('card_profiles')
        .select('id')
        .eq('card_id', activeCard.id)

      if (!profiles || profiles.length === 0) {
        throw new Error('Please create at least one profile first.')
      }

      for (const prof of profiles) {
        const { error } = await supabase
          .from('vcard_details')
          .upsert({
            profile_id: prof.id,
            first_name: vcardData.firstName,
            last_name: vcardData.lastName,
            organization: vcardData.organization,
            job_title: vcardData.jobTitle,
            department: vcardData.department,
            website: vcardData.website,
            phones: vcardData.phones,
            emails: vcardData.emails,
            street: vcardData.street,
            city: vcardData.city,
            state: vcardData.state,
            postal_code: vcardData.postalCode,
            country: vcardData.country,
            urls: vcardData.urls,
            socials: vcardData.socials,
            notes: vcardData.notes,
            custom_fields: vcardData.customFields,
          }, {
            onConflict: 'profile_id'
          })

        if (error) throw error
      }

      // Update local vcardDataMap
      const updatedMap = { ...vcardDataMap }
      for (const prof of profiles) {
        updatedMap[prof.id] = {
          profile_id: prof.id,
          first_name: vcardData.firstName,
          last_name: vcardData.lastName,
          organization: vcardData.organization,
          job_title: vcardData.jobTitle,
          department: vcardData.department,
          website: vcardData.website,
          phones: vcardData.phones,
          emails: vcardData.emails,
          street: vcardData.street,
          city: vcardData.city,
          state: vcardData.state,
          postal_code: vcardData.postalCode,
          country: vcardData.country,
          urls: vcardData.urls,
          socials: vcardData.socials,
          notes: vcardData.notes,
          custom_fields: vcardData.customFields
        }
      }
      setVcardDataMap(updatedMap)

      setMessageType('success')
      setMessage('vCard details updated for all profiles.')
    } catch (err: any) {
      console.error(err)
      setMessageType('error')
      setMessage(err.message || 'Failed to save vCard details.')
    } finally {
      setSavingVCard(false)
    }
  }

  // Auto-save phones or emails to Supabase when primary changes
  const savePrimaryToSupabase = async (field: 'phones' | 'emails', updatedArr: any[]) => {
    try {
      const { data: profiles } = await supabase
        .from('card_profiles')
        .select('id')
        .eq('card_id', activeCard.id)
      if (!profiles || profiles.length === 0) return
      for (const prof of profiles) {
        await supabase
          .from('vcard_details')
          .upsert({ profile_id: prof.id, [field]: updatedArr }, { onConflict: 'profile_id' })
      }
    } catch (err) {
      console.error('Failed to auto-save primary:', err)
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
          vCard details are per-card. Select a specific card from the workspace dropdown in the header to manage contact details.
        </p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fadeIn text-left max-w-6xl">
      {/* Header */}
      <div className="hidden sm:block">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">vCard Contact Details</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure contact info shared when this card is tapped.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 p-4 rounded-xl text-xs flex items-start gap-2.5">
        <AlertCircle size={16} className="text-[#3f5ce6] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-foreground">Common details for all card profiles</p>
          <p className="text-muted-foreground leading-relaxed">
            vCard contact details are shared universally across all profiles of this card. Saving updates here will automatically write these details to all associated profiles.
          </p>
        </div>
      </div>

      {loadingVCard ? (
        <div className="bg-card border border-border/50 rounded-2xl p-8 flex justify-center items-center py-16">
          <Loader2 className="animate-spin text-[#3f5ce6]" size={24} />
          <span className="text-xs text-muted-foreground ml-2">Loading vCard details...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Editor */}
          <div className="lg:col-span-7 bg-card border border-border/50 rounded-2xl p-6 sm:p-8 space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); saveVCard(vcardForm); }} className="space-y-6">

              {/* Name section */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><User size={13} strokeWidth={2} />Personal Info</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">First Name</label>
                    <input
                      type="text"
                      required
                      value={vcardForm.firstName}
                      onChange={(e) => setVcardForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                      placeholder="Rahul"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Last Name</label>
                    <input
                      type="text"
                      required
                      value={vcardForm.lastName}
                      onChange={(e) => setVcardForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                      placeholder="Kumar"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-border/50" />

              {/* Work details */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><Briefcase size={13} strokeWidth={2} />Professional Info</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground">Company / Org</label>
                    <input
                      type="text"
                      value={vcardForm.organization}
                      onChange={(e) => setVcardForm(prev => ({ ...prev, organization: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                      placeholder="Envitra Technologies"
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground">Department</label>
                    <input
                      type="text"
                      value={vcardForm.department}
                      onChange={(e) => setVcardForm(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                      placeholder="Engineering"
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground">Job Title</label>
                    <input
                      type="text"
                      value={vcardForm.jobTitle}
                      onChange={(e) => setVcardForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                      placeholder="Product Designer"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-border/50" />

              {/* Phones array */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><Phone size={13} strokeWidth={2} />Phone Numbers</h4>
                  <button
                    type="button"
                    onClick={handleAddPhone}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 text-[#3f5ce6] hover:bg-[#3f5ce6]/20 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Plus size={12} /> Add Phone
                  </button>
                </div>

                {vcardForm.phones.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No phone numbers added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {vcardForm.phones.map((phone, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="w-full sm:w-28 inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground hover:border-[#3f5ce6]/60 focus:outline-none focus:border-[#3f5ce6] transition-colors cursor-pointer shrink-0"
                            >
                              {phone.label}
                              <ChevronDown size={11} className="text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="min-w-[100px]">
                            {['Mobile', 'Work', 'Home', 'Main', 'Fax'].map(opt => (
                              <DropdownMenuItem
                                key={opt}
                                onClick={() => handlePhoneChange(index, 'label', opt)}
                                className={phone.label === opt ? 'text-[#3f5ce6] font-semibold' : ''}
                              >
                                {phone.label === opt && <Check size={12} className="mr-1.5" />}
                                {opt}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <input
                          type="text"
                          required
                          value={phone.number}
                          onChange={(e) => handlePhoneChange(index, 'number', e.target.value)}
                          className="flex-grow w-full px-3 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:border-[#3f5ce6]"
                          placeholder="+91 98765 43210"
                        />
                        <div className="flex items-center gap-2 w-full sm:w-auto pt-1 sm:pt-0 shrink-0">
                          {pendingDelete?.type === 'phone' && pendingDelete.index === index ? (
                            <>
                              <button
                                type="button"
                                onClick={() => { handleRemovePhone(index); setPendingDelete(null) }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDelete(null)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors cursor-pointer"
                              >
                                <X size={12} /> Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <label className="flex items-center gap-1.5 text-xs text-muted-foreground select-none cursor-pointer">
                                <Checkbox
                                  id={`phone-primary-${index}`}
                                  checked={phone.is_primary}
                                  onCheckedChange={() => {
                                    const updatedPhones = vcardForm.phones.map((p, i) => ({
                                      ...p,
                                      is_primary: i === index
                                    }))
                                    setVcardForm(prev => ({ ...prev, phones: updatedPhones }))
                                    savePrimaryToSupabase('phones', updatedPhones)
                                  }}
                                  className="data-[state=checked]:bg-[#3f5ce6] data-[state=checked]:border-[#3f5ce6]"
                                />
                                Primary
                              </label>
                              <button
                                type="button"
                                onClick={() => setPendingDelete({ type: 'phone', index })}
                                className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors ml-auto sm:ml-0 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-border/50" />

              {/* Emails array */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><Mail size={13} strokeWidth={2} />Email Addresses</h4>
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 text-[#3f5ce6] hover:bg-[#3f5ce6]/20 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Plus size={12} /> Add Email
                  </button>
                </div>

                {vcardForm.emails.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No email addresses added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {vcardForm.emails.map((email, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="w-full sm:w-28 inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground hover:border-[#3f5ce6]/60 focus:outline-none focus:border-[#3f5ce6] transition-colors cursor-pointer shrink-0"
                            >
                              {email.label}
                              <ChevronDown size={11} className="text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="min-w-[100px]">
                            {['Work', 'Personal', 'Other'].map(opt => (
                              <DropdownMenuItem
                                key={opt}
                                onClick={() => handleEmailChange(index, 'label', opt)}
                                className={email.label === opt ? 'text-[#3f5ce6] font-semibold' : ''}
                              >
                                {email.label === opt && <Check size={12} className="mr-1.5" />}
                                {opt}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <input
                          type="email"
                          required
                          value={email.email}
                          onChange={(e) => handleEmailChange(index, 'email', e.target.value)}
                          className="flex-grow w-full px-3 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:border-[#3f5ce6]"
                          placeholder="rahul@company.com"
                        />
                        <div className="flex items-center gap-2 w-full sm:w-auto pt-1 sm:pt-0 shrink-0">
                          {pendingDelete?.type === 'email' && pendingDelete.index === index ? (
                            <>
                              <button
                                type="button"
                                onClick={() => { handleRemoveEmail(index); setPendingDelete(null) }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDelete(null)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors cursor-pointer"
                              >
                                <X size={12} /> Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <label className="flex items-center gap-1.5 text-xs text-muted-foreground select-none cursor-pointer">
                                <Checkbox
                                  id={`email-primary-${index}`}
                                  checked={email.is_primary}
                                  onCheckedChange={() => {
                                    const updatedEmails = vcardForm.emails.map((em, i) => ({
                                      ...em,
                                      is_primary: i === index
                                    }))
                                    setVcardForm(prev => ({ ...prev, emails: updatedEmails }))
                                    savePrimaryToSupabase('emails', updatedEmails)
                                  }}
                                  className="data-[state=checked]:bg-[#3f5ce6] data-[state=checked]:border-[#3f5ce6]"
                                />
                                Primary
                              </label>
                              <button
                                type="button"
                                onClick={() => setPendingDelete({ type: 'email', index })}
                                className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors ml-auto sm:ml-0 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-border/50" />

              {/* Custom Website URLs array */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><Globe size={13} strokeWidth={2} />Website Links</h4>
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 text-[#3f5ce6] hover:bg-[#3f5ce6]/20 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Plus size={12} /> Add Website
                  </button>
                </div>

                {vcardForm.urls.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No custom websites added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {vcardForm.urls.map((urlItem, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="w-24 sm:w-28 inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground hover:border-[#3f5ce6]/60 focus:outline-none focus:border-[#3f5ce6] transition-colors cursor-pointer shrink-0"
                            >
                              {urlItem.label}
                              <ChevronDown size={11} className="text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="min-w-[100px]">
                            {['Website', 'Portfolio', 'Blog', 'Company', 'Work', 'Other'].map(opt => (
                              <DropdownMenuItem
                                key={opt}
                                onClick={() => handleUrlChange(index, 'label', opt)}
                                className={urlItem.label === opt ? 'text-[#3f5ce6] font-semibold' : ''}
                              >
                                {urlItem.label === opt && <Check size={12} className="mr-1.5" />}
                                {opt}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <input
                          type="url"
                          required
                          value={urlItem.url}
                          onChange={(e) => handleUrlChange(index, 'url', e.target.value)}
                          className="flex-grow px-3 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:border-[#3f5ce6]"
                          placeholder="https://mywebsite.com"
                        />
                        {pendingDelete?.type === 'url' && pendingDelete.index === index ? (
                          <>
                            <button
                              type="button"
                              onClick={() => { handleRemoveUrl(index); setPendingDelete(null) }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(null)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                            >
                              <X size={12} /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {urlItem.url && (
                              <a
                                href={urlItem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded hover:bg-[#3f5ce6]/10 text-[#3f5ce6] transition-colors cursor-pointer shrink-0"
                                title={urlItem.url}
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setPendingDelete({ type: 'url', index })}
                              className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-border/50" />

              {/* Social Profile links array */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><Share2 size={13} strokeWidth={2} />Social Profiles</h4>
                  <button
                    type="button"
                    onClick={handleAddSocial}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 text-[#3f5ce6] hover:bg-[#3f5ce6]/20 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Plus size={12} /> Add Social
                  </button>
                </div>

                {vcardForm.socials.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No social profile links added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {vcardForm.socials.map((social, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="w-24 sm:w-28 inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground hover:border-[#3f5ce6]/60 focus:outline-none focus:border-[#3f5ce6] transition-colors cursor-pointer shrink-0"
                            >
                              {social.platform === 'X' ? 'Twitter/X' : social.platform}
                              <ChevronDown size={11} className="text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="min-w-[110px]">
                            {[['LinkedIn', 'LinkedIn'], ['Instagram', 'Instagram'], ['X', 'Twitter / X'], ['Facebook', 'Facebook'], ['YouTube', 'YouTube'], ['TikTok', 'TikTok'], ['WhatsApp', 'WhatsApp']].map(([val, label]) => (
                              <DropdownMenuItem
                                key={val}
                                onClick={() => handleSocialChange(index, 'platform', val)}
                                className={social.platform === val ? 'text-[#3f5ce6] font-semibold' : ''}
                              >
                                {social.platform === val && <Check size={12} className="mr-1.5" />}
                                {label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <input
                          type="text"
                          required
                          value={social.username}
                          onChange={(e) => handleSocialChange(index, 'username', e.target.value)}
                          className="flex-grow px-3 py-1.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] min-w-0"
                          placeholder={
                            social.platform === 'WhatsApp' ? 'Phone number (e.g. +919876543210)' : 'Username / handle'
                          }
                        />
                        {pendingDelete?.type === 'social' && pendingDelete.index === index ? (
                          <>
                            <button
                              type="button"
                              onClick={() => { handleRemoveSocial(index); setPendingDelete(null) }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(null)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                            >
                              <X size={12} /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {social.url && (
                              <a
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded hover:bg-[#3f5ce6]/10 text-[#3f5ce6] transition-colors cursor-pointer shrink-0"
                                title={social.url}
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setPendingDelete({ type: 'social', index })}
                              className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-border/50" />

              {/* Location details */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><MapPin size={13} strokeWidth={2} />Postal Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Street Address</label>
                    <input
                      type="text"
                      value={vcardForm.street}
                      onChange={(e) => setVcardForm(prev => ({ ...prev, street: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                      placeholder="82, OMR Road, Karapakkam"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">City</label>
                    <input
                      type="text"
                      value={vcardForm.city}
                      onChange={(e) => setVcardForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                      placeholder="Chennai"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">State / Region</label>
                    <input
                      type="text"
                      value={vcardForm.state}
                      onChange={(e) => setVcardForm(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                      placeholder="Tamil Nadu"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Postal Code</label>
                      <input
                        type="text"
                        value={vcardForm.postalCode}
                        onChange={(e) => setVcardForm(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                        placeholder="600097"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Country</label>
                      <input
                        type="text"
                        value={vcardForm.country}
                        onChange={(e) => setVcardForm(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors"
                        placeholder="India"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-border/50" />

              {/* Notes section */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#3f5ce6] uppercase tracking-wider select-none"><FileText size={13} strokeWidth={2} />Notes</h4>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Contact Notes</label>
                  <textarea
                    value={vcardForm.notes}
                    onChange={(e) => setVcardForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:border-[#3f5ce6] focus:outline-none transition-colors min-h-[140px] leading-normal resize-y"
                    placeholder="Add brief details or notes to share with this contact..."
                  />
                </div>
              </div>

              {/* Save Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingVCard}
                  className="w-full flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
                >
                  {savingVCard ? (
                    <>
                      <Loader2 className="animate-spin text-white" size={13} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={13} />
                      Save vCard Details
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Right Column: Visual Device Mockup Preview */}
          <div className="lg:col-span-5 relative select-none">
            <div className="sticky top-6">
              <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-4 select-none">Live Visual Preview</h4>

              {/* Realistic iPhone Wrapper */}
              <div className="relative mx-auto w-[310px] h-[610px] select-none">
                {/* Left buttons (Volume Up/Down) */}
                <div className="absolute left-[-4px] top-[110px] w-[4px] h-[36px] bg-zinc-700 dark:bg-zinc-800 rounded-l-md z-0" />
                <div className="absolute left-[-4px] top-[156px] w-[4px] h-[36px] bg-zinc-700 dark:bg-zinc-800 rounded-l-md z-0" />

                {/* Right button (Power) */}
                <div className="absolute right-[-4px] top-[130px] w-[4px] h-[60px] bg-zinc-700 dark:bg-zinc-800 rounded-r-md z-0" />

                {/* Outer Titanium band */}
                <div className="w-full h-full rounded-[50px] p-[3px] bg-gradient-to-b from-zinc-700 to-zinc-900 dark:from-zinc-800 dark:to-zinc-950 border border-zinc-700/50 shadow-2xl relative flex items-center justify-center z-10">

                  {/* Bezel */}
                  <div className="w-full h-full rounded-[47px] bg-black p-[8px] relative flex flex-col overflow-hidden">

                    {/* Screen Viewport */}
                    <div className="w-full h-full rounded-[39px] bg-zinc-950/95 flex flex-col overflow-hidden relative border border-zinc-900">

                      {/* Dynamic Island */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-[22px] rounded-full bg-black z-50 flex items-center justify-between px-3.5 pointer-events-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#151518]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/90 shadow-[0_0_4px_rgba(16,185,129,0.8)] animate-pulse" />
                      </div>

                      {/* Status Bar */}
                      <div className="h-8 px-6 pt-2 flex items-center justify-between text-[9px] font-bold text-white z-40 shrink-0 pointer-events-none select-none">
                        <span>9:41</span>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-2.5 h-2 text-white fill-current shrink-0" viewBox="0 0 100 100">
                            <rect x="0" y="70" width="14" height="30" rx="3" />
                            <rect x="22" y="50" width="14" height="50" rx="3" />
                            <rect x="44" y="30" width="14" height="70" rx="3" />
                            <rect x="66" y="10" width="14" height="90" rx="3" />
                          </svg>
                          <svg className="w-2.5 h-2 text-white fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                            <path d="M12 20h.01M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 14 0M1.5 9.5a15 15 0 0 1 21 0" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="w-4.5 h-2 rounded-[2.5px] border border-zinc-100/80 p-[0.5px] flex items-center shrink-0">
                            <div className="w-full h-full bg-zinc-100 rounded-[1px]" />
                          </div>
                        </div>
                      </div>

                      {/* Scrollable iOS Contact Page */}
                      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-1.5 space-y-4 scrollbar-none flex flex-col relative">

                        {/* Profile Header */}
                        <div className="flex flex-col items-center text-center shrink-0">
                          <div className="w-18 h-18 rounded-full bg-gradient-to-br from-[#3f5ce6] to-[#506df0] p-[2px] shadow-md select-none relative animate-fadeIn mt-2">
                            <div className="w-full h-full rounded-full border border-zinc-950 bg-zinc-900 overflow-hidden flex items-center justify-center">
                              {activeProfile?.avatar_url ? (
                                <img src={activeProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-[#3f5ce6]/10 flex items-center justify-center text-xl font-black text-[#3f5ce6]">
                                  {vcardForm.firstName?.[0]?.toUpperCase() || activeProfile?.profile_name?.[0]?.toUpperCase() || 'P'}
                                </div>
                              )}
                            </div>
                          </div>

                          <h4 className="text-sm font-extrabold text-white mt-2 truncate w-full max-w-[200px]">
                            {vcardForm.firstName || vcardForm.lastName
                              ? `${vcardForm.firstName} ${vcardForm.lastName}`.trim()
                              : activeProfile?.display_name || activeProfile?.profile_name || 'Rahul Kumar'}
                          </h4>

                          {(vcardForm.jobTitle || vcardForm.organization) ? (
                            <p className="text-[9.5px] text-zinc-400 font-semibold mt-0.5 leading-normal truncate w-full max-w-[200px]">
                              {vcardForm.jobTitle} {vcardForm.organization ? `@ ${vcardForm.organization}` : ''}
                            </p>
                          ) : (
                            <p className="text-[9.5px] text-zinc-400 font-semibold mt-0.5 leading-normal">
                              Product Designer @ Envitra
                            </p>
                          )}
                          {vcardForm.department && (
                            <span className="mt-1 px-2 py-0.5 rounded-full bg-[#3f5ce6]/10 border border-[#3f5ce6]/25 text-[#3f5ce6] text-[6.5px] font-black tracking-wider uppercase">
                              {vcardForm.department}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-4 py-2 shrink-0">
                          {[
                            { icon: '📞', label: 'call' },
                            { icon: '✉️', label: 'mail' },
                            { icon: '💬', label: 'text' },
                            { icon: '🌐', label: 'web' },
                          ].map((btn) => (
                            <div key={btn.label} className="flex flex-col items-center gap-1">
                              <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-base shadow-inner">
                                {btn.icon}
                              </div>
                              <span className="text-[7px] text-zinc-400 font-semibold uppercase tracking-wide">{btn.label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Contact Info Cards */}
                        <div className="space-y-2 shrink-0">

                          {/* Phone */}
                          {vcardForm.phones && vcardForm.phones.filter(p => p.number).length > 0 && (
                            <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                              {vcardForm.phones.filter(p => p.number).map((p, i) => (
                                <div key={i} className={`px-3 py-2.5 flex items-center justify-between ${i > 0 ? 'border-t border-zinc-800' : ''}`}>
                                  <div>
                                    <p className="text-[8px] text-zinc-500 font-semibold uppercase">{p.label || 'mobile'}</p>
                                    <p className="text-[10px] text-[#4ade80] font-semibold mt-0.5">{p.number}</p>
                                  </div>
                                  <div className="w-6 h-6 rounded-full bg-[#4ade80]/10 flex items-center justify-center text-[10px]">📞</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Email */}
                          {vcardForm.emails && vcardForm.emails.filter(e => e.email).length > 0 && (
                            <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                              {vcardForm.emails.filter(e => e.email).map((e, i) => (
                                <div key={i} className={`px-3 py-2.5 flex items-center justify-between gap-2 ${i > 0 ? 'border-t border-zinc-800' : ''}`}>
                                  <div className="flex-1 min-w-0 pr-2">
                                    <p className="text-[8px] text-zinc-500 font-semibold uppercase">{e.label || 'email'}</p>
                                    <p className="text-[9px] text-[#3f5ce6] font-semibold mt-0.5 truncate">{e.email}</p>
                                  </div>
                                  <div className="w-6 h-6 rounded-full bg-[#3f5ce6]/10 flex items-center justify-center text-[10px] shrink-0">✉️</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Address */}
                          {(vcardForm.street || vcardForm.city || vcardForm.country) && (
                            <div className="bg-zinc-900 rounded-xl px-3 py-2.5 border border-zinc-800 flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-[8px] text-zinc-500 font-semibold uppercase">address</p>
                                <p className="text-[9px] text-white font-medium mt-0.5 leading-relaxed">
                                  {[vcardForm.street, vcardForm.city, vcardForm.state, vcardForm.country].filter(Boolean).join(', ')}
                                </p>
                              </div>
                              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] shrink-0 mt-0.5">📍</div>
                            </div>
                          )}

                          {/* Website */}
                          {vcardForm.urls && vcardForm.urls.filter(u => u.url).length > 0 && (
                            <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                              {vcardForm.urls.filter(u => u.url).map((u, i) => (
                                <div key={i} className={`px-3 py-2.5 flex items-center justify-between gap-2 ${i > 0 ? 'border-t border-zinc-800' : ''}`}>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[8px] text-zinc-500 font-semibold uppercase tracking-wide">{u.label || 'website'}</p>
                                    <p className="text-[9px] text-[#3f5ce6] font-medium mt-0.5 truncate">{u.url}</p>
                                  </div>
                                  <div className="shrink-0 text-zinc-500">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
                                    </svg>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Socials */}
                          {vcardForm.socials && vcardForm.socials.filter(s => s.username).length > 0 && (
                            <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                              {vcardForm.socials.filter(s => s.username).map((s, i) => {
                                const displayText = s.url || s.username
                                const PlatformSvg = () => {
                                  const cls = "w-5 h-5"
                                  const common = { fill: "none" as const, stroke: "currentColor" as const, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24", className: cls }
                                  switch (s.platform) {
                                    case 'WhatsApp': return (
                                      <svg {...common}>
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                      </svg>
                                    )
                                    case 'Instagram': return (
                                      <svg {...common}>
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                        <circle cx="12" cy="12" r="4" />
                                        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                                      </svg>
                                    )
                                    case 'LinkedIn': return (
                                      <svg {...common}>
                                        <rect x="2" y="2" width="20" height="20" rx="3" />
                                        <line x1="7" y1="10" x2="7" y2="17" />
                                        <line x1="7" y1="7" x2="7" y2="7.5" strokeWidth={2.5} />
                                        <path d="M11 17v-4a2 2 0 0 1 4 0v4M11 10v7" />
                                      </svg>
                                    )
                                    case 'X': return (
                                      <svg {...common}>
                                        <path d="M18 6L6 18M6 6l12 12" />
                                      </svg>
                                    )
                                    case 'Facebook': return (
                                      <svg {...common}>
                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                                      </svg>
                                    )
                                    case 'YouTube': return (
                                      <svg {...common}>
                                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45a2.78 2.78 0 0 0-1.95 1.97A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                                        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
                                      </svg>
                                    )
                                    case 'TikTok': return (
                                      <svg {...common}>
                                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                      </svg>
                                    )
                                    default: return (
                                      <svg {...common}>
                                        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
                                      </svg>
                                    )
                                  }
                                }
                                return (
                                  <div key={i} className={`px-3 py-2.5 flex items-center justify-between gap-2 ${i > 0 ? 'border-t border-zinc-800' : ''}`}>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[8px] text-zinc-500 font-semibold uppercase tracking-wide">{s.platform || 'social'}</p>
                                      <p className="text-[9px] text-white font-medium mt-0.5 truncate">{displayText}</p>
                                    </div>
                                    <div className="shrink-0 text-zinc-500">
                                      <PlatformSvg />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Notes */}
                          {vcardForm.notes && (
                            <div className="bg-zinc-900 rounded-xl px-3 py-2.5 border border-zinc-800">
                              <p className="text-[8px] text-zinc-500 font-semibold uppercase mb-1">notes</p>
                              <p className="text-[9px] text-zinc-300 leading-relaxed line-clamp-3">{vcardForm.notes}</p>
                            </div>
                          )}

                          {/* Placeholder hint when empty */}
                          {!vcardForm.phones?.some(p => p.number) && !vcardForm.emails?.some(e => e.email) && !vcardForm.street && !vcardForm.urls?.some(u => u.url) && (
                            <div className="text-center py-4 text-zinc-600">
                              <p className="text-[8px] font-semibold">Fill in the form to see<br />your contact card here</p>
                            </div>
                          )}

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useDashboard } from '../context'
import { createClient } from '@/lib/supabase/client'
import {
  Lock, Sparkles, Plus, FileDown, Users, FileText, Search, Layers, Tag,
  ChevronDown, Loader2, Mail, Phone, ExternalLink, Clock, Trash2, X,
  ChevronRight, SlidersHorizontal, Save, Edit, Check, ChevronUp, GripVertical,
  Heading1, AlignLeft, Hash, Globe, Calendar as CalendarIcon, RadioTower,
  ListChecks, Paperclip, PenLine, Camera, AlertCircle, Type, Laptop, Smartphone, Tablet, Star
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Helper to parse a YYYY-MM-DD string as a local Date object safely across all timezones
const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return undefined
  const parts = dateStr.split('-')
  if (parts.length !== 3) return undefined
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  return new Date(year, month, day)
}

// Helper to get a case-insensitive value from lead.data
const getLeadDataValue = (data: any, fieldId: string) => {
  if (!data || !fieldId) return undefined
  if (data[fieldId] !== undefined) return data[fieldId]
  if (data[fieldId.toLowerCase()] !== undefined) return data[fieldId.toLowerCase()]
  if (data[fieldId.toUpperCase()] !== undefined) return data[fieldId.toUpperCase()]
  return undefined
}

// Helper to extract primary lead details: Name, Email, and Phone
const getLeadPrimaryDetails = (lead: any, leadForms: any[]) => {
  const form = leadForms.find((f: any) => f.id === lead.form_id)
  const fields = form?.fields || []

  let name = ''
  let email = ''
  let phone = ''
  let nameFieldId = ''
  let emailFieldId = ''
  let phoneFieldId = ''

  // 1. Try resolving using field type definitions
  const nameField = fields.find((f: any) => f.type === 'text' && f.label.toLowerCase().includes('name'))
  const emailField = fields.find((f: any) => f.type === 'email')
  const phoneField = fields.find((f: any) => f.type === 'phone')

  if (nameField) {
    name = getLeadDataValue(lead.data, nameField.id) || ''
    nameFieldId = nameField.id
  }
  if (emailField) {
    email = getLeadDataValue(lead.data, emailField.id) || ''
    emailFieldId = emailField.id
  }
  if (phoneField) {
    phone = getLeadDataValue(lead.data, phoneField.id) || ''
    phoneFieldId = phoneField.id
  }

  // 2. Fallback to checking label contents (if type matching failed or returned empty)
  if (!name) {
    const fallbackNameField = fields.find((f: any) => f.type === 'text')
    if (fallbackNameField) {
      name = getLeadDataValue(lead.data, fallbackNameField.id) || ''
      nameFieldId = fallbackNameField.id
    }
  }

  // 3. Scan entries as a generic fallback (covers cases where field schema isn't present)
  if (!name || !email || !phone) {
    Object.entries(lead.data || {}).forEach(([key, val]) => {
      const valStr = typeof val === 'object' ? (val as any).name || JSON.stringify(val) : String(val)
      const k = key.toLowerCase()
      if (!name && (k.includes('name') || k === 'name')) {
        name = valStr
      } else if (!email && k.includes('email')) {
        email = valStr
      } else if (!phone && (k.includes('phone') || k.includes('mobile') || k.includes('contact'))) {
        phone = valStr
      }
    })
  }

  // 4. Final fallback to fill Name from first raw key-value pair if still empty
  if (!name) {
    const entries = Object.entries(lead.data || {})
    if (entries.length > 0) {
      name = String(entries[0][1])
    } else {
      name = 'Unknown Lead'
    }
  }

  return { name, email, phone, nameFieldId, emailFieldId, phoneFieldId }
}

// Helper to extract up to 4 other details to show in the 4-grid layout
const getLeadOtherFields = (lead: any, leadForms: any[], primaryDetails: any) => {
  const form = leadForms.find((f: any) => f.id === lead.form_id)
  const fields = form?.fields || []
  const results: { label: string; value: string; type?: string; id?: string }[] = []

  const primaryIds = [primaryDetails.nameFieldId, primaryDetails.emailFieldId, primaryDetails.phoneFieldId]
    .filter(Boolean)
    .map(id => id.toLowerCase())

  const primaryLabels = ['name', 'email', 'phone', 'telephone', 'mobile', 'contact']

  if (fields.length > 0) {
    // Filter out display-only blocks (headings/paragraphs) and primary fields
    const otherFields = fields.filter((f: any) => {
      if (['heading', 'paragraph'].includes(f.type)) return false

      const labelLower = f.label.toLowerCase()
      const isPrimaryLabel = primaryLabels.some(pl => labelLower.includes(pl))
      const isPrimaryId = primaryIds.includes(f.id.toLowerCase())

      if (isPrimaryLabel || isPrimaryId) return false
      return true
    })

    otherFields.forEach((field: any) => {
      const val = getLeadDataValue(lead.data, field.id)
      if (val !== undefined && val !== null) {
        const displayVal = typeof val === 'object' ? (val.name || JSON.stringify(val)) : String(val)
        results.push({ label: field.label, value: displayVal, type: field.type, id: field.id })
      }
    })
  } else {
    // Fallback if no fields are defined: scan raw lead.data entries
    const primaryValues = [primaryDetails.name, primaryDetails.email, primaryDetails.phone].filter(Boolean)
    Object.entries(lead.data || {}).forEach(([key, val]) => {
      const valStr = typeof val === 'object' ? (val as any).name || JSON.stringify(val) : String(val)
      const isPrimaryVal = primaryValues.includes(valStr)
      const k = key.toLowerCase()
      const isPrimaryLabel = primaryLabels.some(pl => k.includes(pl))

      if (!isPrimaryVal && !isPrimaryLabel) {
        results.push({ label: key, value: valStr, type: 'text', id: key })
      }
    })
  }

  return results
}

// Helper to get a stable styled avatar color background class based on lead name
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
    'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
    'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
    'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
    'bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900',
    'bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900',
    'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900',
    'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900',
    'bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900',
  ]
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  return colors[sum % colors.length]
}

export function LeadsTab() {
  const {
    user,
    profile,
    activeCard,
    activeProfile,
    cardProfiles,
    leads,
    setLeads,
    leadsLoading,
    leadForms,
    setLeadForms,
    leadFormsLoading,
    allAccountLeadForms,
    setAllAccountLeadForms,
    profileProducts,
    setUpgradeModalOpen,
    setUpgradeModalFeature,
    setMessage,
    fetchLeads,
    fetchLeadForms
  } = useDashboard()

  const supabase = createClient()
  const isAllCards = activeCard?.id === 'all'

  // Sub-tabs inside Leads Tab: 'crm' or 'forms'
  const [leadsSubTab, setLeadsSubTab] = useState<'crm' | 'forms'>('crm')

  // Search and Filters
  const [leadsSearch, setLeadsSearch] = useState('')
  const [leadsFilterFormId, setLeadsFilterFormId] = useState<string>('all')
  const [leadsFilterProductId, setLeadsFilterProductId] = useState<string>('all')

  // Sheets and Modals States
  const [leadSheet, setLeadSheet] = useState<{ open: boolean; mode: 'add' | 'edit' | 'view'; lead: any | null }>({
    open: false,
    mode: 'view',
    lead: null
  })
  const [leadModalSelectedFormId, setLeadModalSelectedFormId] = useState<string | null>(null)
  const [leadModalCustomData, setLeadModalCustomData] = useState<Record<string, any>>({})
  const [leadFormState, setLeadFormState] = useState<{ status: string }>({ status: 'new' })
  const [leadSaving, setLeadSaving] = useState(false)
  const [leadSignedUrls, setLeadSignedUrls] = useState<Record<string, string>>({})
  const [openDatePickerFieldId, setOpenDatePickerFieldId] = useState<string | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [leadPendingDelete, setLeadPendingDelete] = useState<string | null>(null)

  // Form Builder States
  const [formBuilderOpen, setFormBuilderOpen] = useState(false)
  const [editingFormId, setEditingFormId] = useState<string | null>(null)
  const [formBuilderDraft, setFormBuilderDraft] = useState<any>({
    form_name: '',
    title: 'Get in Touch',
    subtitle: 'Fill out the form below to connect.',
    button_label: 'Submit',
    is_active: false,
    fields: [],
    product_ids: []
  })
  const [formBuilderSaving, setFormBuilderSaving] = useState(false)
  const [fieldTypePickerOpen, setFieldTypePickerOpen] = useState(false)
  const [formPendingDelete, setFormPendingDelete] = useState<string | null>(null)

  // Duplication States
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicatingForm, setDuplicatingForm] = useState<any>(null)
  const [duplicateTargetProfileId, setDuplicateTargetProfileId] = useState<string>('')
  const [duplicateFormName, setDuplicateFormName] = useState('')
  const [duplicateConflict, setDuplicateConflict] = useState(false)
  const [duplicateCheckingConflict, setDuplicateCheckingConflict] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  // Duplicate from others
  const [duplicateLeadFormFromOthersDialogOpen, setDuplicateLeadFormFromOthersDialogOpen] = useState(false)
  const [selectedSourceLeadFormProfileId, setSelectedSourceLeadFormProfileId] = useState<string>('')
  const [selectedSourceLeadFormId, setSelectedSourceLeadFormId] = useState<string>('')
  const [duplicateLeadFormFromOthersName, setDuplicateLeadFormFromOthersName] = useState('')
  const [duplicateLeadFormFromOthersConflict, setDuplicateLeadFormFromOthersConflict] = useState(false)
  const [duplicateLeadFormFromOthersCheckingConflict, setDuplicateLeadFormFromOthersCheckingConflict] = useState(false)
  const [duplicatingLeadFormFromOthersProgress, setDuplicatingLeadFormFromOthersProgress] = useState(false)

  // Load signed URLs for files in viewing sheet
  useEffect(() => {
    if (!leadSheet.open || !leadSheet.lead || !leadSheet.lead.data) {
      setLeadSignedUrls({})
      return
    }

    const loadSignedUrls = async () => {
      const urls: Record<string, string> = {}
      const dataEntries = Object.entries(leadSheet.lead.data)

      for (const [key, val] of dataEntries) {
        if (typeof val === 'string' && val.includes('/lead-attachments/')) {
          const bucketMarker = '/lead-attachments/'
          const index = val.indexOf(bucketMarker)
          if (index !== -1) {
            const rawPath = val.substring(index + bucketMarker.length)
            const path = decodeURIComponent(rawPath)
            try {
              const { data, error } = await supabase.storage
                .from('lead-attachments')
                .createSignedUrl(path, 86400) // 24 hours
              if (!error && data?.signedUrl) {
                urls[key] = data.signedUrl
              }
            } catch (err) {
              console.error('Failed to generate signed URL for path:', path, err)
            }
          }
        }
      }
      setLeadSignedUrls(urls)
    }

    loadSignedUrls()
  }, [leadSheet.open, leadSheet.lead])

  // Filter leads locally
  const filteredLeads = leads.filter(lead => {
    const query = leadsSearch.toLowerCase()
    const dataString = Object.entries(lead.data || {})
      .map(([k, v]) => `${k} ${typeof v === 'object' && v ? ((v as any).name || JSON.stringify(v)) : String(v ?? '')}`)
      .join(' ')
      .toLowerCase()
    const matchesSearch = !query || dataString.includes(query) || (lead.form_name || '').toLowerCase().includes(query)
    const matchesForm = leadsFilterFormId === 'all' || lead.form_id === leadsFilterFormId
    const matchesProduct = leadsFilterProductId === 'all' || lead.product_id === leadsFilterProductId
    return matchesSearch && matchesForm && matchesProduct
  })

  // Export leads to CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Form', 'Status', 'Submitted Data']
    const rows = filteredLeads.map(l => {
      const dataStr = Object.entries(l.data || {})
        .map(([k, v]) => {
          const valStr = typeof v === 'object' && v ? ((v as any).name || JSON.stringify(v)) : String(v ?? '')
          return `${k}: ${valStr}`
        })
        .join(' | ')
      return [
        l.submitted_at ? new Date(l.submitted_at).toLocaleString() : '',
        l.form_name || '',
        l.status || '',
        dataStr
      ]
    })
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `envitra_leads_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Database Mutations for Leads
  const saveLead = async () => {
    if (!activeProfile?.id || !user?.id) return
    setLeadSaving(true)
    try {
      const selectedForm = leadForms.find((f: any) => f.id === leadModalSelectedFormId)
      let formId = selectedForm?.id || null
      let formName = selectedForm?.form_name || 'Manual CRM Entry'
      const fields = selectedForm?.fields || []

      const deleteStorageFileByUrl = async (url: string) => {
        try {
          if (typeof url === 'string' && url.includes('/public/lead-attachments/')) {
            const parts = url.split('/public/lead-attachments/')
            if (parts.length === 2 && parts[1]) {
              const path = decodeURIComponent(parts[1])
              const { error } = await supabase.storage.from('lead-attachments').remove([path])
              if (error) {
                console.error('Supabase storage delete error:', error)
              }
            }
          }
        } catch (deleteErr) {
          console.error('Failed to delete old file from bucket:', url, deleteErr)
        }
      }

      const finalData = { ...leadModalCustomData }
      for (const field of fields) {
        if (field.type === 'file' || field.type === 'image') {
          const originalUrl = leadSheet.lead?.data?.[field.id]
          const currentVal = finalData[field.id]
          const isReplaced = currentVal && currentVal.file
          const isRemoved = !currentVal

          if (originalUrl && (isReplaced || isRemoved)) {
            await deleteStorageFileByUrl(originalUrl)
          }

          if (isReplaced) {
            const file = currentVal.file
            const fileExt = file.name.split('.').pop()
            const filePath = `manual/${activeProfile.id}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('lead-attachments')
              .upload(filePath, file)
            if (uploadErr) throw uploadErr

            const { data: publicUrlData } = supabase.storage
              .from('lead-attachments')
              .getPublicUrl(uploadData.path)

            finalData[field.id] = publicUrlData.publicUrl
          }
        }

        if (field.type === 'signature') {
          const originalUrl = leadSheet.lead?.data?.[field.id]
          const currentVal = finalData[field.id]
          const isReplaced = currentVal && currentVal.startsWith?.('data:')
          const isRemoved = !currentVal

          if (originalUrl && (isReplaced || isRemoved)) {
            await deleteStorageFileByUrl(originalUrl)
          }

          if (isReplaced) {
            const base64Data = currentVal
            const response = await fetch(base64Data)
            const blob = await response.blob()
            const file = new File([blob], 'signature.png', { type: 'image/png' })

            const filePath = `manual/${activeProfile.id}/${Date.now()}_sig_${Math.random().toString(36).substring(2, 7)}.png`
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('lead-attachments')
              .upload(filePath, file)
            if (uploadErr) throw uploadErr

            const { data: publicUrlData } = supabase.storage
              .from('lead-attachments')
              .getPublicUrl(uploadData.path)

            finalData[field.id] = publicUrlData.publicUrl
          }
        }
      }

      if (leadSheet.mode === 'add') {
        const { error } = await supabase
          .from('lead_submissions')
          .insert({
            form_id: formId,
            form_name: formName,
            profile_id: activeProfile.id,
            account_id: user.id,
            status: leadFormState.status,
            data: finalData
          })
        if (error) throw error
        setMessage({ type: 'success', text: 'Lead added successfully!' })
      } else {
        const { error } = await supabase
          .from('lead_submissions')
          .update({
            status: leadFormState.status,
            data: finalData
          })
          .eq('id', leadSheet.lead.id)
        if (error) throw error
        setMessage({ type: 'success', text: 'Lead updated successfully!' })
      }
      setLeadSheet({ open: false, mode: 'view', lead: null })
      fetchLeads(activeProfile.id)
    } catch (err: any) {
      console.error('Failed to save lead:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to save lead.' })
    } finally {
      setLeadSaving(false)
    }
  }

  const deleteLeadSubmission = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('lead_submissions')
        .delete()
        .eq('id', leadId)
      if (error) throw error
      setLeads(prev => prev.filter(l => l.id !== leadId))
      setLeadPendingDelete(null)
      setMessage({ type: 'success', text: 'Lead deleted successfully!' })
    } catch (err: any) {
      console.error('Failed to delete lead:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to delete lead.' })
    }
  }

  const handleUpdateLeadStatus = async (leadId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('lead_submissions')
        .update({ status })
        .eq('id', leadId)
      if (error) throw error
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l))
      setMessage({ type: 'success', text: 'Lead status updated!' })
    } catch (err: any) {
      console.error('Failed to update lead status:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to update status.' })
    }
  }

  const handleAttachFile = (fieldId: string, file: File) => {
    setLeadModalCustomData(p => ({
      ...p,
      [fieldId]: { file, name: file.name }
    }))
  }

  const openAddLead = async () => {
    let currentForms = [...leadForms]
    if (currentForms.length === 0 && activeProfile?.id && user?.id) {
      setLeadSaving(true)
      try {
        const { data: newForm, error: formErr } = await supabase
          .from('lead_forms')
          .insert({
            profile_id: activeProfile.id,
            account_id: user.id,
            form_name: 'Lead Form',
            title: 'Get in Touch',
            subtitle: 'Fill out the form below to connect.',
            button_label: 'Submit',
            is_active: true,
            fields: []
          })
          .select()
          .single()
        if (!formErr && newForm) {
          currentForms = [newForm]
          setLeadForms(currentForms)
        }
      } catch (err) {
        console.error('Error creating default form:', err)
      } finally {
        setLeadSaving(false)
      }
    }

    setLeadFormState({ status: 'new' })
    setLeadModalSelectedFormId(null)
    setLeadModalCustomData({})
    setLeadSheet({ open: true, mode: 'add', lead: null })
  }

  // Form Builder Actions
  const openFormBuilder = (form?: any) => {
    if (form) {
      setEditingFormId(form.id)
      setFormBuilderDraft({
        form_name: form.form_name || 'Lead Form',
        title: form.title || 'Get in Touch',
        subtitle: form.subtitle || '',
        button_label: form.button_label || 'Submit',
        is_active: form.is_active || false,
        fields: form.fields || [],
        product_ids: form.product_ids || [],
      })
    } else {
      setEditingFormId(null)
      setFormBuilderDraft({
        form_name: '',
        title: 'Get in Touch',
        subtitle: 'Fill out the form below to connect.',
        button_label: 'Submit',
        is_active: false,
        fields: [
          {
            id: Math.random().toString(36).substring(2, 11),
            type: 'text',
            label: 'Name',
            placeholder: 'Enter your name...',
            required: true,
          },
          {
            id: Math.random().toString(36).substring(2, 11),
            type: 'email',
            label: 'Email',
            placeholder: 'Enter your email...',
            required: true,
          },
          {
            id: Math.random().toString(36).substring(2, 11),
            type: 'phone',
            label: 'Phone Number',
            placeholder: 'Enter your phone number...',
            required: true,
          }
        ],
        product_ids: [],
      })
    }
    setFormBuilderOpen(true)
  }

  const saveFormBuilder = async () => {
    if (!activeProfile?.id || !user?.id) return
    setFormBuilderSaving(true)
    try {
      if (editingFormId) {
        const { data, error } = await supabase
          .from('lead_forms')
          .update({
            form_name: formBuilderDraft.form_name,
            title: formBuilderDraft.title,
            subtitle: formBuilderDraft.subtitle,
            button_label: formBuilderDraft.button_label,
            fields: formBuilderDraft.fields,
            product_ids: formBuilderDraft.product_ids || [],
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFormId)
          .select()
          .single()
        if (error) throw error
        setLeadForms(prev => prev.map(f => f.id === editingFormId ? data : f))
        setMessage({ type: 'success', text: 'Form saved successfully!' })
      } else {
        const { data, error } = await supabase
          .from('lead_forms')
          .insert({
            profile_id: activeProfile.id,
            account_id: user.id,
            form_name: formBuilderDraft.form_name,
            title: formBuilderDraft.title,
            subtitle: formBuilderDraft.subtitle,
            button_label: formBuilderDraft.button_label,
            is_active: false,
            fields: formBuilderDraft.fields,
            product_ids: formBuilderDraft.product_ids || [],
          })
          .select()
          .single()
        if (error) throw error
        setLeadForms(prev => [data, ...prev])
        setMessage({ type: 'success', text: 'New form created! Activate it to show on your card.' })
      }
      setFormBuilderOpen(false)
    } catch (err: any) {
      console.error('Failed to save form:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to save form.' })
    } finally {
      setFormBuilderSaving(false)
    }
  }

  const activateForm = async (formId: string) => {
    if (!activeProfile?.id) return
    try {
      const { error } = await supabase.rpc('activate_lead_form', {
        p_form_id: formId,
        p_profile_id: activeProfile.id
      })
      if (error) {
        await supabase.from('lead_forms').update({ is_active: false }).eq('profile_id', activeProfile.id)
        await supabase.from('lead_forms').update({ is_active: true }).eq('id', formId)
      }
      setLeadForms(prev => prev.map(f => ({ ...f, is_active: f.id === formId })))
      setMessage({ type: 'success', text: 'Form activated! It will now appear on your card page.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to activate form.' })
    }
  }

  const deactivateForm = async (formId: string) => {
    try {
      const { error } = await supabase
        .from('lead_forms')
        .update({ is_active: false })
        .eq('id', formId)
      if (error) throw error
      setLeadForms(prev => prev.map(f => f.id === formId ? { ...f, is_active: false } : f))
      setMessage({ type: 'success', text: 'Form deactivated successfully!' })
    } catch (err: any) {
      console.error('Failed to deactivate form:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to deactivate form.' })
    }
  }

  const deleteForm = async (formId: string) => {
    try {
      const { error } = await supabase.from('lead_forms').delete().eq('id', formId)
      if (error) throw error
      setLeadForms(prev => prev.filter(f => f.id !== formId))
      setFormPendingDelete(null)
      setMessage({ type: 'success', text: 'Form deleted. Existing leads are preserved.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete form.' })
    }
  }

  // Field manipulation helpers for form builder
  const addField = (type: string) => {
    const newField: any = {
      id: Math.random().toString(36).substring(2, 11),
      type,
      label: type === 'heading' ? 'Section Heading'
        : type === 'paragraph' ? 'Helper text here'
          : type === 'signature' ? 'Signature'
            : type.charAt(0).toUpperCase() + type.slice(1),
      placeholder: ['text', 'email', 'phone', 'number', 'url', 'textarea'].includes(type) ? `Enter ${type}...` : '',
      required: false,
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : [],
      content: ['heading', 'paragraph'].includes(type) ? '' : undefined,
      accept: type === 'image' ? 'image/*' : type === 'file' ? '*/*' : undefined,
      multiple: false,
    }
    setFormBuilderDraft((p: any) => ({ ...p, fields: [...p.fields, newField] }))
    setFieldTypePickerOpen(false)
  }

  const updateField = (fieldId: string, updates: any) => {
    setFormBuilderDraft((p: any) => ({
      ...p,
      fields: p.fields.map((f: any) => f.id === fieldId ? { ...f, ...updates } : f)
    }))
  }

  const removeField = (fieldId: string) => {
    setFormBuilderDraft((p: any) => ({
      ...p,
      fields: p.fields.filter((f: any) => f.id !== fieldId)
    }))
  }

  const moveField = (idx: number, dir: 'up' | 'down') => {
    setFormBuilderDraft((p: any) => {
      const fields = [...p.fields]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      if (swap < 0 || swap >= fields.length) return p
      ;[fields[idx], fields[swap]] = [fields[swap], fields[idx]]
      return { ...p, fields }
    })
  }

  // Lead Form Duplication to another profile
  const checkDuplicateConflict = async (name: string, targetProfileId: string, fields: any[]) => {
    if (!targetProfileId) return
    setDuplicateCheckingConflict(true)
    try {
      const { data, error } = await supabase
        .from('lead_forms')
        .select('*')
        .eq('profile_id', targetProfileId)
      if (error) throw error
      if (data) {
        const conflict = data.some((f: any) =>
          f.form_name.trim().toLowerCase() === name.trim().toLowerCase() &&
          JSON.stringify(f.fields) === JSON.stringify(fields)
        )
        setDuplicateConflict(conflict)
      }
    } catch (err) {
      console.error('Failed to check conflict:', err)
    } finally {
      setDuplicateCheckingConflict(false)
    }
  }

  const openDuplicateDialog = (form: any) => {
    setDuplicatingForm(form)
    const targetId = cardProfiles.filter((p: any) => p.id !== activeProfile?.id)[0]?.id || ''
    setDuplicateTargetProfileId(targetId)
    setDuplicateFormName(form.form_name)
    setDuplicateConflict(false)
    setDuplicateDialogOpen(true)
    if (targetId) {
      checkDuplicateConflict(form.form_name, targetId, form.fields)
    }
  }

  const confirmDuplicateForm = async () => {
    if (!duplicatingForm || !duplicateTargetProfileId || !user?.id) return
    setDuplicating(true)
    try {
      const targetProfile = cardProfiles.find((p: any) => p.id === duplicateTargetProfileId)
      const { data, error } = await supabase
        .from('lead_forms')
        .insert({
          profile_id: duplicateTargetProfileId,
          account_id: user.id,
          form_name: duplicateFormName,
          title: duplicatingForm.title,
          subtitle: duplicatingForm.subtitle,
          button_label: duplicatingForm.button_label,
          is_active: false,
          fields: duplicatingForm.fields,
          product_ids: duplicatingForm.product_ids || [],
          duplicated_from_id: duplicatingForm.id,
        })
        .select()
        .single()
      if (error) throw error
      setDuplicateDialogOpen(false)
      setMessage({ type: 'success', text: `Form duplicated to "${targetProfile?.profile_name || 'profile'}" successfully!` })
      fetchAllAccountLeadForms()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to duplicate form.' })
    } finally {
      setDuplicating(false)
    }
  }

  // Duplicate from other profiles
  const checkDuplicateLeadFormFromOthersConflict = async (name: string, targetProfileId: string) => {
    if (!name.trim()) return
    setDuplicateLeadFormFromOthersCheckingConflict(true)
    try {
      const { data, error } = await supabase
        .from('lead_forms')
        .select('id, form_name')
        .eq('profile_id', targetProfileId)
      if (!error && data) {
        const conflict = data.some((f: any) => f.form_name.toLowerCase().trim() === name.toLowerCase().trim())
        setDuplicateLeadFormFromOthersConflict(conflict)
      }
    } catch (err) {
      console.error('Failed to check lead form duplication conflict:', err)
    } finally {
      setDuplicateLeadFormFromOthersCheckingConflict(false)
    }
  }

  const confirmDuplicateLeadFormFromOthers = async () => {
    if (!selectedSourceLeadFormId || !activeProfile?.id || !user?.id) return
    setDuplicatingLeadFormFromOthersProgress(true)
    try {
      const sourceForm = allAccountLeadForms.find(f => f.id === selectedSourceLeadFormId)
      if (!sourceForm) throw new Error('Source form not found.')

      const { data, error } = await supabase
        .from('lead_forms')
        .insert({
          profile_id: activeProfile.id,
          account_id: user.id,
          form_name: duplicateLeadFormFromOthersName.trim(),
          title: sourceForm.title,
          subtitle: sourceForm.subtitle,
          button_label: sourceForm.button_label,
          is_active: false,
          fields: sourceForm.fields,
          product_ids: [],
          duplicated_from_id: sourceForm.id
        })
        .select()
        .single()
      if (error) throw error

      setDuplicateLeadFormFromOthersDialogOpen(false)
      fetchLeadForms(activeProfile.id)
      fetchAllAccountLeadForms()
      setMessage({ type: 'success', text: `Lead form duplicated successfully!` })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to duplicate lead form.' })
    } finally {
      setDuplicatingLeadFormFromOthersProgress(false)
    }
  }

  const openDuplicateLeadFormFromOthersDialog = () => {
    const sourceProfiles = cardProfiles.filter(profile =>
      allAccountLeadForms.some(f => f.profile_id === profile.id) && profile.id !== activeProfile?.id
    );
    const firstProfileId = sourceProfiles[0]?.id || ''
    setSelectedSourceLeadFormProfileId(firstProfileId)

    if (firstProfileId) {
      const firstForm = allAccountLeadForms.find(f => f.profile_id === firstProfileId)
      if (firstForm) {
        setSelectedSourceLeadFormId(firstForm.id)
        setDuplicateLeadFormFromOthersName(firstForm.form_name || '')
        if (activeProfile?.id) {
          checkDuplicateLeadFormFromOthersConflict(firstForm.form_name, activeProfile.id)
        }
      } else {
        setSelectedSourceLeadFormId('')
        setDuplicateLeadFormFromOthersName('')
        setDuplicateLeadFormFromOthersConflict(false)
      }
    } else {
      setSelectedSourceLeadFormId('')
      setDuplicateLeadFormFromOthersName('')
      setDuplicateLeadFormFromOthersConflict(false)
    }
    setDuplicateLeadFormFromOthersDialogOpen(true)
  }

  const fetchAllAccountLeadForms = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_forms')
        .select('*')
        .eq('account_id', user.id)
      if (!error && data) {
        setAllAccountLeadForms(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Star rendering helper
  const renderStars = (rating: number | string | null | undefined) => {
    const ratingVal = rating ? Math.round(parseFloat(rating.toString())) : 0
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= ratingVal
          return (
            <Star
              key={starIndex}
              size={11}
              className={isFilled ? 'fill-amber-500 text-amber-500' : 'text-zinc-300 dark:text-zinc-700'}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {!(profile?.plan === 'pro' || profile?.plan === 'business') ? (
        /* PRO gate */
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Lock size={28} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Leads — Pro Feature</h3>
            <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
              Capture leads from your card page, build custom forms, manage your pipeline with CRM status, and export to CSV. Upgrade to Pro to unlock.
            </p>
          </div>
          <button
            onClick={() => {
              setUpgradeModalFeature('Leads and Custom Forms')
              setUpgradeModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Sparkles size={14} /> Upgrade to Pro
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="hidden sm:block">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Leads & Custom Capture Forms</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Active Profile: <span className="font-semibold text-foreground">{activeProfile?.profile_name}</span> · Manage submissions from {leadForms.length} custom lead capture form{leadForms.length !== 1 ? 's' : ''} containing {leads.length} total lead{leads.length !== 1 ? 's' : ''}.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {leadsSubTab === 'crm' && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={handleExportCSV} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer">
                          <FileDown size={13} /> Export CSV
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Export leads to CSV</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={openAddLead} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold transition-all shadow-md cursor-pointer">
                          <Plus size={13} /> Add Lead
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Add a lead manually</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              {leadsSubTab === 'forms' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => openFormBuilder()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold transition-all shadow-md cursor-pointer">
                        <Plus size={13} /> New Form
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Create a new lead form</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Sub-tab bar */}
          <div className="flex gap-1 p-1 bg-muted/50 dark:bg-zinc-900/50 rounded-xl border border-border w-fit">
            {([
              { key: 'crm', label: 'CRM Leads', icon: <Users size={13} /> },
              { key: 'forms', label: 'Forms', icon: <FileText size={13} /> },
            ] as const).map(st => (
              <button
                key={st.key}
                onClick={() => setLeadsSubTab(st.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${leadsSubTab === st.key
                    ? 'bg-background dark:bg-zinc-800 text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {st.icon} {st.label}
              </button>
            ))}
          </div>

          {/* ─── SUB-TAB: CRM Leads ─── */}
          {leadsSubTab === 'crm' && (
            <div className="space-y-5">
              {/* Stats strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Leads', value: filteredLeads.length, color: 'text-foreground', bg: 'bg-[#3f5ce6]/8' },
                  { label: 'New', value: filteredLeads.filter((l: any) => l.status === 'new').length, color: 'text-[#3f5ce6]', bg: 'bg-[#3f5ce6]/8' },
                  { label: 'Converted', value: filteredLeads.filter((l: any) => l.status === 'converted').length, color: 'text-emerald-500', bg: 'bg-emerald-500/8' },
                  { label: 'Lost', value: filteredLeads.filter((l: any) => l.status === 'lost').length, color: 'text-red-400', bg: 'bg-red-500/8' },
                ].map((s) => (
                  <div key={s.label} className={`bg-card border border-border rounded-xl p-4 text-center`}>
                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card flex-1">
                  <Search size={14} className="text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by name, email, company..."
                    value={leadsSearch}
                    onChange={(e) => setLeadsSearch(e.target.value)}
                    className="w-full bg-transparent text-xs text-foreground focus:outline-none placeholder-muted-foreground/60"
                  />
                  {leadsSearch && <button onClick={() => setLeadsSearch('')}><X size={13} className="text-muted-foreground" /></button>}
                </div>
                {/* Form filter */}
                {leadForms.length > 1 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card min-w-[160px] text-xs text-foreground hover:bg-muted transition-colors cursor-pointer select-none text-left">
                        <Layers size={13} className="text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate">
                          {leadsFilterFormId === 'all'
                            ? 'All Forms'
                            : (leadForms.find(f => f.id === leadsFilterFormId)?.form_name || 'Form')}
                        </span>
                        <ChevronDown size={12} className="text-muted-foreground shrink-0 ml-auto" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[160px] z-[100]">
                      <DropdownMenuItem onClick={() => setLeadsFilterFormId('all')} className="text-xs cursor-pointer">
                        All Forms
                      </DropdownMenuItem>
                      {leadForms.map((f: any) => (
                        <DropdownMenuItem key={f.id} onClick={() => setLeadsFilterFormId(f.id)} className="text-xs cursor-pointer">
                          {f.form_name || 'Form'}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {/* Product filter */}
                {profileProducts.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card min-w-[160px] text-xs text-foreground hover:bg-muted transition-colors cursor-pointer select-none text-left">
                        <Tag size={13} className="text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate">
                          {leadsFilterProductId === 'all'
                            ? 'All Products'
                            : (profileProducts.find(p => p.id === leadsFilterProductId)?.name || 'Product')}
                        </span>
                        <ChevronDown size={12} className="text-muted-foreground shrink-0 ml-auto" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[160px] z-[100]">
                      <DropdownMenuItem onClick={() => setLeadsFilterProductId('all')} className="text-xs cursor-pointer">
                        All Products
                      </DropdownMenuItem>
                      {profileProducts.map((p: any) => (
                        <DropdownMenuItem key={p.id} onClick={() => setLeadsFilterProductId(p.id)} className="text-xs cursor-pointer">
                          {p.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* CRM Table */}
              {leadsLoading ? (
                <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" /><span className="text-xs">Loading leads…</span>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-border rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-[#3f5ce6]/10 border border-[#3f5ce6]/20 flex items-center justify-center">
                    <Users size={24} className="text-[#3f5ce6]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">No leads yet</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                      {leads.length > 0 ? 'No leads match your current filters.' : 'Activate a form on your card page to start capturing leads.'}
                    </p>
                  </div>
                  {leads.length === 0 && (
                    <button onClick={() => setLeadsSubTab('forms')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold shadow-md transition-all cursor-pointer">
                      <FileText size={13} /> Manage Forms
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                  {filteredLeads.map((lead) => {
                    const primaryDetails = getLeadPrimaryDetails(lead, leadForms)
                    const { name, email, phone } = primaryDetails
                    const avatarBg = getAvatarColor(name)
                    const initials = name
                      ? name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                      : 'L'

                    return (
                      <div
                        key={lead.id}
                        onClick={() => setLeadSheet({ open: true, mode: 'view', lead })}
                        className="bg-card border border-border dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-[#3f5ce6] dark:hover:border-[#3f5ce6] hover:shadow-md hover:shadow-[#3f5ce6]/5 transition-all flex flex-col justify-between cursor-pointer"
                      >
                        {/* Top header row */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black border select-none shrink-0 ${avatarBg}`}>
                              {initials}
                            </div>
                            {/* Primary details */}
                            <div className="min-w-0 space-y-1">
                              <h4 className="font-bold text-sm text-foreground truncate max-w-[160px] sm:max-w-[200px]">
                                {name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-muted-foreground">
                                {email && (
                                  <span className="flex items-center gap-1">
                                    <Mail size={10} className="shrink-0" />
                                    <span className="truncate max-w-[120px]">{email}</span>
                                  </span>
                                )}
                                {email && phone && <span className="text-muted-foreground/30">•</span>}
                                {phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone size={10} className="shrink-0" />
                                    <span>{phone}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action buttons top right */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {email && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={`mailto:${email}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-8 h-8 rounded-full border border-border dark:border-zinc-800 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                    >
                                      <Mail size={13} />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">Email Lead</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {phone && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={`tel:${phone}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-8 h-8 rounded-full border border-border dark:border-zinc-800 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                    >
                                      <Phone size={13} />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">Call Lead</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>

                        {/* Segmented interactive status bar */}
                        <div className="flex border border-border dark:border-zinc-800 bg-muted/30 dark:bg-zinc-900/30 rounded-xl p-0.5 w-full text-[10px] font-bold select-none overflow-x-auto scrollbar-none gap-0.5">
                          {[
                            { value: 'new', label: 'New', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
                            { value: 'contacted', label: 'Contacted', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' },
                            { value: 'following_up', label: 'Following Up', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' },
                            { value: 'converted', label: 'Converted', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
                            { value: 'lost', label: 'Lost', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' },
                            { value: 'spam', label: 'Spam', color: 'bg-zinc-500/10 text-zinc-650 dark:text-zinc-400 border border-zinc-500/20' }
                          ].map((opt) => {
                            const isActive = lead.status === opt.value
                            return (
                              <button
                                key={opt.value}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUpdateLeadStatus(lead.id, opt.value)
                                }}
                                className={`flex-1 text-center py-1.5 px-2 rounded-lg transition-all cursor-pointer font-bold whitespace-nowrap ${isActive
                                    ? opt.color
                                    : 'text-muted-foreground hover:text-foreground bg-transparent border border-transparent hover:bg-muted/40'
                                  }`}
                              >
                                {isActive ? `✓ ${opt.label}` : opt.label}
                              </button>
                            )
                          })}
                        </div>

                        {/* Footer Meta Row */}
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 border-t border-border/20 pt-2 shrink-0">
                          <span className="flex items-center gap-1">
                            <Clock size={9} />
                            {lead.submitted_at
                              ? new Date(lead.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </span>
                          {lead.form_name && (
                            <span className="flex items-center gap-1 truncate max-w-[160px]">
                              <Layers size={9} />
                              {lead.form_name}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Unified Lead Sheet (View, Edit, Add) */}
          <Sheet open={leadSheet.open} onOpenChange={(open: boolean) => !open && setLeadSheet(prev => ({ ...prev, open: false }))}>
            <SheetContent className="!w-full sm:!max-w-2xl lg:!max-w-xl bg-background dark:bg-[#18181b] border-l border-border dark:border-zinc-800 p-0 flex flex-col h-full overflow-hidden text-left" showCloseButton={false}>
              <SheetTitle className="sr-only">Lead Sheet</SheetTitle>
              <SheetDescription className="sr-only">CRM Lead details and forms creator.</SheetDescription>

              {/* Accent line */}
              <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-[#3f5ce6] to-indigo-600 shrink-0" />

              {(() => {
                if (!leadSheet.open) return null

                // CASE 1: Add Lead mode - Form template not selected yet
                if (leadSheet.mode === 'add' && leadModalSelectedFormId === null) {
                  return (
                    <>
                      {/* Header */}
                      <SheetHeader className="flex flex-row items-center justify-between px-6 py-2 shrink-0 border-b border-border dark:border-zinc-800 space-y-0 text-left">
                        <div>
                          <SheetTitle className="font-black text-sm text-foreground">Select Lead Form</SheetTitle>
                          <SheetDescription className="text-[11px] text-muted-foreground mt-0.5">Choose a form template to create this manual lead under.</SheetDescription>
                        </div>
                      </SheetHeader>

                      {/* Body */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                        <p className="text-xs text-muted-foreground">Select the form template you want to add this lead under:</p>
                        <div className="space-y-2">
                          {leadForms.map((form: any) => (
                            <button
                              key={form.id}
                              onClick={() => setLeadModalSelectedFormId(form.id)}
                              className={`w-full p-4 text-left border rounded-xl hover:bg-muted/30 transition-all flex items-center justify-between group cursor-pointer ${form.is_active
                                  ? 'border-emerald-500/40 bg-emerald-500/[0.01] hover:border-emerald-500/60'
                                  : 'border-border hover:border-[#3f5ce6]/60'
                                }`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-foreground group-hover:text-[#3f5ce6] transition-colors">{form.form_name}</span>
                                  {form.is_active && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[8px] font-bold text-emerald-600 dark:text-emerald-400">
                                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> ACTIVE
                                    </span>
                                  )}
                                </div>
                                {form.title && <div className="text-[10px] text-muted-foreground mt-0.5">{form.title}</div>}
                              </div>
                              <ChevronRight size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Footer */}
                      <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row justify-end">
                        <button onClick={() => setLeadSheet(prev => ({ ...prev, open: false }))} className="px-4 py-2 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/40 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98">
                          Close
                        </button>
                      </SheetFooter>
                    </>
                  )
                }

                // Find the selected form template
                const activeFormId = leadSheet.mode === 'edit' ? leadSheet.lead?.form_id : leadModalSelectedFormId
                const selectedForm = leadForms.find((f: any) => f.id === activeFormId)
                const fields = selectedForm?.fields || []
                const isFormInvalid = fields.some((field: any) => field.required && !leadModalCustomData[field.id])

                // CASE 2: Add or Edit Lead mode (Form inputs screen)
                if (leadSheet.mode === 'add' || leadSheet.mode === 'edit') {
                  const title = leadSheet.mode === 'add' ? 'Add CRM Lead' : 'Edit CRM Lead'
                  const subtitle = `Form: ${selectedForm?.form_name || 'CRM Form'}`

                  return (
                    <>
                      {/* Header */}
                      <SheetHeader className="flex flex-row items-center justify-between px-6 py-2 shrink-0 border-b border-border dark:border-zinc-800 space-y-0 text-left">
                        <div>
                          <SheetTitle className="font-black text-sm text-foreground">{title}</SheetTitle>
                          <SheetDescription className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</SheetDescription>
                        </div>
                      </SheetHeader>

                      {/* Content Area (Scrollable Inputs) */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                        {/* Lead Status Selection */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider block">Lead Status</label>
                          <div className="flex border border-border dark:border-zinc-800 bg-muted/30 dark:bg-zinc-900/30 rounded-xl p-0.5 w-full text-[10px] font-bold select-none overflow-x-auto scrollbar-none gap-0.5">
                            {[
                              { value: 'new', label: 'New', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
                              { value: 'contacted', label: 'Contacted', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' },
                              { value: 'following_up', label: 'Following Up', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' },
                              { value: 'converted', label: 'Converted', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
                              { value: 'lost', label: 'Lost', color: 'bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/20' },
                              { value: 'spam', label: 'Spam', color: 'bg-zinc-500/10 text-zinc-650 dark:text-zinc-400 border border-zinc-500/20' }
                            ].map((opt) => {
                              const isActive = leadFormState.status === opt.value
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setLeadFormState(p => ({ ...p, status: opt.value }))}
                                  className={`flex-grow text-center py-2 px-1.5 rounded-lg transition-all cursor-pointer font-bold whitespace-nowrap text-[9px] ${isActive
                                      ? opt.color
                                      : 'text-muted-foreground hover:text-foreground bg-transparent border border-transparent hover:bg-muted/40'
                                    }`}
                                >
                                  {isActive ? `✓ ${opt.label}` : opt.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Form fields rendering dynamically */}
                        {fields.map((field: any) => {
                          const isRequired = field.required
                          return (
                            <div key={field.id} className="space-y-1.5 text-left">
                              <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">
                                {field.label} {isRequired && <span className="text-red-500 dark:text-red-400 font-bold">*</span>}
                              </label>

                              {(field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'url') && (
                                <input
                                  type={field.type === 'phone' ? 'tel' : field.type}
                                  value={leadModalCustomData[field.id] || ''}
                                  onChange={e => setLeadModalCustomData(p => ({ ...p, [field.id]: e.target.value }))}
                                  placeholder={field.placeholder || `Enter ${field.label}...`}
                                  className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                                  required={isRequired}
                                />
                              )}

                              {field.type === 'textarea' && (
                                <textarea
                                  value={leadModalCustomData[field.id] || ''}
                                  onChange={e => setLeadModalCustomData(p => ({ ...p, [field.id]: e.target.value }))}
                                  placeholder={field.placeholder || `Enter ${field.label}...`}
                                  rows={3}
                                  className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all resize-none"
                                  required={isRequired}
                                />
                              )}

                              {field.type === 'select' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground hover:bg-muted/50 transition-all cursor-pointer text-left font-semibold">
                                      <span className="truncate">
                                        {leadModalCustomData[field.id] || field.placeholder || 'Select option...'}
                                      </span>
                                      <ChevronDown size={14} className="text-muted-foreground ml-auto shrink-0" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-[340px] max-h-[200px] overflow-y-auto z-[200]">
                                    {(field.options || []).map((opt: string) => (
                                      <DropdownMenuItem
                                        key={opt}
                                        onClick={() => setLeadModalCustomData(p => ({ ...p, [field.id]: opt }))}
                                        className="text-xs cursor-pointer font-semibold"
                                      >
                                        {opt}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}

                              {field.type === 'radio' && (
                                <div className="space-y-2 pt-1">
                                  {(field.options || []).map((opt: string) => (
                                    <label key={opt} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-foreground/85 dark:text-zinc-350">
                                      <input
                                        type="radio"
                                        name={`sheet-radio-${field.id}`}
                                        checked={leadModalCustomData[field.id] === opt}
                                        onChange={() => setLeadModalCustomData(p => ({ ...p, [field.id]: opt }))}
                                        className="accent-[#3f5ce6]"
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              )}

                              {field.type === 'checkbox' && (
                                <div className="space-y-2 pt-1">
                                  {(field.options || []).map((opt: string) => {
                                    const checkedList = leadModalCustomData[field.id] || []
                                    const isChecked = checkedList.includes(opt)
                                    return (
                                      <label key={opt} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-foreground/85 dark:text-zinc-350 select-none">
                                        <Checkbox
                                          checked={isChecked}
                                          onCheckedChange={(checked) => {
                                            let newList = [...checkedList]
                                            if (checked) newList.push(opt)
                                            else newList = newList.filter(o => o !== opt)
                                            setLeadModalCustomData(p => ({ ...p, [field.id]: newList }))
                                          }}
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    )
                                  })}
                                  {(field.options || []).length === 0 && (
                                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-foreground/85 dark:text-zinc-350 select-none">
                                      <Checkbox
                                        checked={!!leadModalCustomData[field.id]}
                                        onCheckedChange={(checked) => setLeadModalCustomData(p => ({ ...p, [field.id]: !!checked }))}
                                      />
                                      <span>Confirm / Toggle</span>
                                    </label>
                                  )}
                                </div>
                              )}

                              {(field.type === 'file' || field.type === 'image') && (
                                <div className="space-y-2">
                                  {(() => {
                                    const attachment = leadModalCustomData[field.id]
                                    const isUploaded = typeof attachment === 'string' && attachment.startsWith('http')
                                    const isLocal = attachment && attachment.file

                                    return (
                                      <div className="group bg-white dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800/80 p-2.5 flex items-center justify-between gap-3 shadow-xs">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="w-8 h-8 rounded-lg bg-[#3f5ce6]/10 flex items-center justify-center text-[#3f5ce6] shrink-0">
                                            {field.type === 'image' ? <Camera size={15} /> : <Paperclip size={15} />}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold truncate">
                                              {isUploaded ? 'Uploaded Document' : isLocal ? attachment.name : `Select ${field.type}...`}
                                            </p>
                                            {isUploaded && (
                                              <a href={leadSignedUrls[field.id] || attachment} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-[#3f5ce6] hover:underline flex items-center gap-0.5 truncate">
                                                View Attachment <ExternalLink size={8} />
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          {(isUploaded || isLocal) ? (
                                            <button
                                              type="button"
                                              onClick={() => setLeadModalCustomData(p => {
                                                const updated = { ...p }
                                                delete updated[field.id]
                                                return updated
                                              })}
                                              className="p-1 rounded-lg border border-red-200/50 hover:bg-red-500/10 text-red-500 transition-all cursor-pointer"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          ) : (
                                            <label className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground dark:text-white text-[10px] font-bold transition-all cursor-pointer select-none">
                                              Browse
                                              <input
                                                type="file"
                                                className="hidden"
                                                accept={field.type === 'image' ? 'image/*' : '*'}
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0]
                                                  if (file) handleAttachFile(field.id, file)
                                                }}
                                              />
                                            </label>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })()}
                                </div>
                              )}

                              {field.type === 'signature' && (
                                <div className="space-y-2">
                                  {leadModalCustomData[field.id] ? (
                                    <div className="border border-border dark:border-zinc-800 rounded-xl p-3 bg-white dark:bg-zinc-950/60 flex items-center justify-between gap-3">
                                      <img src={leadSignedUrls[field.id] || leadModalCustomData[field.id]} alt="Signature" className="h-12 object-contain bg-white rounded-md p-1" />
                                      <button
                                        type="button"
                                        onClick={() => setLeadModalCustomData(p => {
                                          const updated = { ...p }
                                          delete updated[field.id]
                                          return updated
                                        })}
                                        className="p-1.5 rounded-lg border border-red-200/50 hover:bg-red-500/10 text-red-500 transition-all cursor-pointer"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="border border-border dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                                      <div className="bg-muted/40 dark:bg-zinc-900/40 px-3 py-1.5 border-b border-border dark:border-zinc-800 flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase select-none">
                                        <span>Draw Signature Below</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const canvas = document.getElementById(`sig-canvas-${field.id}`) as HTMLCanvasElement
                                            if (canvas) {
                                              const ctx = canvas.getContext('2d')
                                              ctx?.clearRect(0, 0, canvas.width, canvas.height)
                                            }
                                          }}
                                          className="text-[9px] text-zinc-500 hover:text-foreground transition-colors cursor-pointer"
                                        >
                                          Clear
                                        </button>
                                      </div>
                                      <canvas
                                        id={`sig-canvas-${field.id}`}
                                        width={400}
                                        height={120}
                                        className="w-full bg-white dark:bg-zinc-950 h-28 cursor-crosshair touch-none block"
                                        onMouseDown={(e) => {
                                          const canvas = e.currentTarget
                                          const ctx = canvas.getContext('2d')
                                          if (!ctx) return
                                          ctx.strokeStyle = '#3f5ce6'
                                          ctx.lineWidth = 2
                                          ctx.lineCap = 'round'
                                          const rect = canvas.getBoundingClientRect()
                                          ctx.beginPath()
                                          ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
                                          canvas.dataset.drawing = 'true'
                                        }}
                                        onMouseMove={(e) => {
                                          const canvas = e.currentTarget
                                          if (canvas.dataset.drawing !== 'true') return
                                          const ctx = canvas.getContext('2d')
                                          if (!ctx) return
                                          const rect = canvas.getBoundingClientRect()
                                          ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
                                          ctx.stroke()
                                        }}
                                        onMouseUp={(e) => {
                                          const canvas = e.currentTarget
                                          canvas.dataset.drawing = 'false'
                                          const dataUrl = canvas.toDataURL()
                                          setLeadModalCustomData(p => ({ ...p, [field.id]: dataUrl }))
                                        }}
                                        onMouseLeave={(e) => {
                                          const canvas = e.currentTarget
                                          if (canvas.dataset.drawing === 'true') {
                                            canvas.dataset.drawing = 'false'
                                            const dataUrl = canvas.toDataURL()
                                            setLeadModalCustomData(p => ({ ...p, [field.id]: dataUrl }))
                                          }
                                        }}
                                        onTouchStart={(e) => {
                                          const canvas = e.currentTarget
                                          const ctx = canvas.getContext('2d')
                                          if (!ctx) return
                                          ctx.strokeStyle = '#3f5ce6'
                                          ctx.lineWidth = 2
                                          ctx.lineCap = 'round'
                                          const rect = canvas.getBoundingClientRect()
                                          const touch = e.touches[0]
                                          ctx.beginPath()
                                          ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top)
                                          canvas.dataset.drawing = 'true'
                                        }}
                                        onTouchMove={(e) => {
                                          const canvas = e.currentTarget
                                          if (canvas.dataset.drawing !== 'true') return
                                          const ctx = canvas.getContext('2d')
                                          if (!ctx) return
                                          const rect = canvas.getBoundingClientRect()
                                          const touch = e.touches[0]
                                          ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
                                          ctx.stroke()
                                        }}
                                        onTouchEnd={(e) => {
                                          const canvas = e.currentTarget
                                          canvas.dataset.drawing = 'false'
                                          const dataUrl = canvas.toDataURL()
                                          setLeadModalCustomData(p => ({ ...p, [field.id]: dataUrl }))
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              {field.type === 'date' && (
                                <div className="space-y-1 text-left">
                                  {(() => {
                                    const dateVal = parseLocalDate(leadModalCustomData[field.id])
                                    return (
                                      <Popover
                                        open={openDatePickerFieldId === field.id}
                                        onOpenChange={(open) => setOpenDatePickerFieldId(open ? field.id : null)}
                                      >
                                        <PopoverTrigger asChild>
                                          <button
                                            type="button"
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground hover:bg-muted/50 transition-all cursor-pointer text-left font-semibold ${!leadModalCustomData[field.id] ? 'text-muted-foreground/60' : ''}`}
                                          >
                                            <span className="truncate">
                                              {dateVal ? format(dateVal, 'dd MMM yyyy') : field.placeholder || 'Select Date...'}
                                            </span>
                                            <CalendarIcon size={14} className="text-muted-foreground ml-auto shrink-0" />
                                          </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 z-[210]" align="start">
                                          <CalendarComponent
                                            mode="single"
                                            selected={dateVal}
                                            onSelect={(date: any) => {
                                              if (date) {
                                                const pad = (num: number) => (num < 10 ? '0' : '') + num
                                                const formatted = date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
                                                setLeadModalCustomData((prev: any) => ({ ...prev, [field.id]: formatted }))
                                                setOpenDatePickerFieldId(null)
                                              }
                                            }}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    )
                                  })()}
                                </div>
                              )}

                              {field.type === 'number' && (
                                <input
                                  type="number"
                                  value={leadModalCustomData[field.id] || ''}
                                  onChange={e => setLeadModalCustomData(p => ({ ...p, [field.id]: e.target.value }))}
                                  placeholder={field.placeholder || `Enter ${field.label}...`}
                                  className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                                  required={isRequired}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Footer */}
                      <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row gap-3 justify-end items-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (leadSheet.mode === 'edit') {
                              setLeadSheet(prev => ({ ...prev, mode: 'view' }))
                            } else {
                              setLeadModalSelectedFormId(null)
                            }
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/40 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
                        >
                          {leadSheet.mode === 'edit' ? 'Cancel' : '← Back'}
                        </button>
                        <button
                          type="button"
                          onClick={saveLead}
                          disabled={leadSaving || isFormInvalid}
                          className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold shadow-lg shadow-[#3f5ce6]/25 transition-all cursor-pointer active:scale-98 disabled:opacity-60 flex items-center justify-center gap-1.5"
                        >
                          {leadSaving ? (
                            <><Loader2 size={13} className="animate-spin" /> Saving…</>
                          ) : leadSheet.mode === 'add' ? (
                            <><Plus size={13} /> Add Lead</>
                          ) : (
                            <><Save size={13} /> Save Changes</>
                          )}
                        </button>
                      </SheetFooter>
                    </>
                  )
                }

                // CASE 3: View Lead mode (Details screen)
                const primaryDetails = getLeadPrimaryDetails(leadSheet.lead, leadForms)
                const { name, email, phone } = primaryDetails
                const otherFields = getLeadOtherFields(leadSheet.lead, leadForms, primaryDetails)
                const avatarBg = getAvatarColor(name)
                const initials = name
                  ? name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                  : 'L'

                return (
                  <>
                    {/* Header */}
                    <SheetHeader className="flex flex-row items-center justify-between px-6 py-2 shrink-0 border-b border-border dark:border-zinc-800 space-y-0 text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border select-none shrink-0 ${avatarBg}`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <SheetTitle className="font-black text-sm text-foreground truncate">{name || 'Lead Details'}</SheetTitle>
                          <SheetDescription className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {leadSheet.lead.form_name || 'Manual CRM Entry'} · View details, update status, and manage lead.
                          </SheetDescription>
                        </div>
                      </div>
                    </SheetHeader>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                      {/* Contact Information */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-widest block">Contact Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {email && (
                            <div className="p-3 border border-border dark:border-zinc-800 rounded-xl bg-card dark:bg-zinc-900/10 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[9px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">Email Address</p>
                                <p className="text-xs font-semibold text-foreground dark:text-white truncate mt-0.5">{email}</p>
                              </div>
                              <a
                                href={`mailto:${email}`}
                                className="w-7 h-7 rounded-lg border border-border dark:border-zinc-800 bg-muted/20 hover:bg-muted dark:hover:bg-zinc-800 flex items-center justify-center text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white shrink-0 transition-colors"
                              >
                                <Mail size={12} />
                              </a>
                            </div>
                          )}
                          {phone && (
                            <div className="p-3 border border-border dark:border-zinc-800 rounded-xl bg-card dark:bg-zinc-900/10 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[9px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">Phone Number</p>
                                <p className="text-xs font-semibold text-foreground dark:text-white truncate mt-0.5">{phone}</p>
                              </div>
                              <a
                                href={`tel:${phone}`}
                                className="w-7 h-7 rounded-lg border border-border dark:border-zinc-800 bg-muted/20 hover:bg-muted dark:hover:bg-zinc-800 flex items-center justify-center text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white shrink-0 transition-colors"
                              >
                                <Phone size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Status Selector inside Sheet */}
                      <div className="space-y-3 border-t border-border dark:border-zinc-800 pt-5">
                        <h4 className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-widest block">Lead Status</h4>
                        <div className="flex border border-border dark:border-zinc-800 bg-muted/30 dark:bg-zinc-900/30 rounded-xl p-0.5 w-full text-[10px] font-bold select-none overflow-x-auto scrollbar-none gap-0.5">
                          {[
                            { value: 'new', label: 'New', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
                            { value: 'contacted', label: 'Contacted', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' },
                            { value: 'following_up', label: 'Following Up', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' },
                            { value: 'converted', label: 'Converted', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
                            { value: 'lost', label: 'Lost', color: 'bg-red-500/10 text-red-650 dark:text-red-450 border border-red-500/20' },
                            { value: 'spam', label: 'Spam', color: 'bg-zinc-500/10 text-zinc-650 dark:text-zinc-400 border border-zinc-500/20' }
                          ].map((opt) => {
                            const isActive = leadSheet.lead.status === opt.value
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={async () => {
                                  await handleUpdateLeadStatus(leadSheet.lead.id, opt.value)
                                  setLeadSheet((p: any) => p ? { ...p, lead: { ...p.lead, status: opt.value } } : null)
                                }}
                                className={`flex-grow text-center py-2 px-1.5 rounded-lg transition-all cursor-pointer font-bold whitespace-nowrap text-[9px] ${isActive
                                    ? opt.color
                                    : 'text-muted-foreground hover:text-foreground bg-transparent border border-transparent hover:bg-muted/40'
                                  }`}
                              >
                                {isActive ? `✓ ${opt.label}` : opt.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Custom Fields Details Section */}
                      <div className="space-y-3 border-t border-border dark:border-zinc-800 pt-5">
                        <h4 className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-widest block">Submitted Data</h4>
                        {otherFields.length === 0 ? (
                          <p className="text-xs italic text-muted-foreground/60 text-left">No additional custom fields were submitted.</p>
                        ) : (
                          <div className="space-y-3">
                            {otherFields.map((field, idx) => {
                              const valStr = (field.id && leadSignedUrls[field.id]) || (typeof field.value === 'string' ? field.value : '')
                              const isHttp = valStr.startsWith('http://') || valStr.startsWith('https://')

                              const isImageField = field.type === 'image' || field.type === 'signature'
                              const isFileField = field.type === 'file'

                              const isHttpImageFallback = !field.type && isHttp && (
                                valStr.toLowerCase().includes('.png') ||
                                valStr.toLowerCase().includes('.jpg') ||
                                valStr.toLowerCase().includes('.jpeg') ||
                                valStr.toLowerCase().includes('.gif') ||
                                valStr.toLowerCase().includes('.webp') ||
                                valStr.toLowerCase().includes('sig')
                              )

                              return (
                                <div key={idx} className="p-3 border border-border/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/10 rounded-xl space-y-1.5 text-left">
                                  <div className="text-[9px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">{field.label}</div>

                                  {isImageField || isHttpImageFallback ? (
                                    <div className="pt-1">
                                      <a href={valStr} target="_blank" rel="noopener noreferrer" className="inline-block relative rounded-lg border border-border dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 p-1 group">
                                        <img src={valStr} alt={field.label} className="max-h-32 object-contain rounded-md" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                          <ExternalLink size={14} className="text-white" />
                                        </div>
                                      </a>
                                    </div>
                                  ) : isFileField ? (
                                    <div className="pt-1">
                                      <a
                                        href={valStr}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3f5ce6]/30 bg-[#3f5ce6]/5 hover:bg-[#3f5ce6]/10 text-xs font-semibold text-[#3f5ce6] transition-all hover:underline select-none cursor-pointer"
                                      >
                                        <FileText size={12} /> Open File
                                      </a>
                                    </div>
                                  ) : isHttp ? (
                                    <div className="pt-1 flex items-center gap-1.5">
                                      <a href={valStr} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#3f5ce6] hover:underline flex items-center gap-1 truncate max-w-sm">
                                        {valStr}
                                        <ExternalLink size={10} className="shrink-0" />
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="text-xs font-semibold text-foreground dark:text-zinc-100 whitespace-pre-line break-words pt-0.5">
                                      {field.value}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sticky Footer */}
                    <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row sm:space-x-2 justify-end text-left items-center animate-fadeIn">
                      <div className="text-[10px] text-muted-foreground/60 flex-1 truncate pr-3">
                        <span className="flex items-center gap-1 truncate">
                          <Clock size={10} />
                          Submitted {leadSheet.lead.submitted_at
                            ? new Date(leadSheet.lead.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </span>
                      </div>
                      <div className="flex gap-2 shrink-0 items-center">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1.5 shrink-0 bg-red-500/5 dark:bg-red-500/10 border border-red-500/25 p-1 rounded-xl transition-all">
                            <span className="text-[10px] font-bold text-red-500 dark:text-red-400 px-2 select-none">Confirm delete?</span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteLeadSubmission(leadSheet.lead.id)
                                setLeadSheet(prev => ({ ...prev, open: false }))
                                setIsConfirmingDelete(false)
                              }}
                              className="py-1 px-2.5 rounded-lg bg-red-650 text-white font-bold text-[10px] cursor-pointer hover:bg-red-700 transition-colors active:scale-95 shrink-0"
                            >
                              Yes, Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsConfirmingDelete(false)}
                              className="py-1 px-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground font-bold text-[10px] cursor-pointer transition-colors active:scale-95 shrink-0"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsConfirmingDelete(true)}
                            className="py-2 px-3.5 rounded-xl border border-red-500/35 bg-red-500/5 hover:bg-red-500/10 dark:hover:bg-red-500/15 text-red-500 dark:text-red-400 font-semibold text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setLeadFormState({ status: leadSheet.lead.status || 'new' })
                            setLeadModalSelectedFormId(leadSheet.lead.form_id || null)
                            setLeadModalCustomData(leadSheet.lead.data || {})
                            setLeadSheet(prev => ({ ...prev, mode: 'edit' }))
                          }}
                          className="py-2 px-3.5 rounded-xl border border-border dark:border-zinc-800 bg-card hover:bg-muted text-foreground dark:text-white text-xs font-semibold cursor-pointer transition-all active:scale-98 flex items-center gap-1.5 shrink-0"
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeadSheet(prev => ({ ...prev, open: false }))}
                          className="py-2 px-3.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold transition-all cursor-pointer active:scale-98 flex items-center gap-1.5 shrink-0"
                        >
                          Close
                        </button>
                      </div>
                    </SheetFooter>
                  </>
                )
              })()}
            </SheetContent>
          </Sheet>

          {/* ─── SUB-TAB: Forms ─── */}
          {leadsSubTab === 'forms' && (
            <div className="space-y-4">
              {leadFormsLoading ? (
                <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" /><span className="text-xs">Loading forms…</span>
                </div>
              ) : leadForms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-border rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FileText size={24} className="text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">No forms yet</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                      Create your first lead form to start capturing enquiries from your card page.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                    <button onClick={() => openFormBuilder()} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-semibold shadow-md transition-all cursor-pointer">
                      <Plus size={13} /> Create First Form
                    </button>
                    {(() => {
                      const otherForms = allAccountLeadForms.filter(f => f.profile_id !== activeProfile?.id)
                      return otherForms.length > 0 && (
                        <button
                          onClick={openDuplicateLeadFormFromOthersDialog}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-semibold transition-all shadow-sm cursor-pointer bg-card"
                        >
                          <Layers size={13} /> Duplicate from Another Profile
                        </button>
                      )
                    })()}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {leadForms.map((form: any) => {
                    const subCount = leads.filter((l: any) => l.form_id === form.id).length
                    const fieldCount = (form.fields || []).length
                    const totalFields = fieldCount
                    return (
                      <div key={form.id} className={`bg-card border rounded-xl p-4 transition-all ${form.is_active ? 'border-emerald-500/40 shadow-sm shadow-emerald-500/10' : 'border-border'}`}>
                        <div className="flex items-start gap-4">
                          {/* Left: icon + status */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${form.is_active ? 'bg-emerald-500/15' : 'bg-muted'}`}>
                            <FileText size={18} className={form.is_active ? 'text-emerald-500' : 'text-muted-foreground'} />
                          </div>
                          {/* Middle: info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-foreground truncate">{form.form_name || 'Lead Form'}</span>
                              {form.is_active ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[10px] font-bold text-emerald-500">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ACTIVE
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] font-bold text-muted-foreground">DRAFT</span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{form.title || 'Untitled Form'}</p>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                <SlidersHorizontal size={9} /> {totalFields} field{totalFields !== 1 ? 's' : ''}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                <Users size={9} /> {subCount} submission{subCount !== 1 ? 's' : ''}
                              </span>
                              {(form.product_ids || []).length > 0 && (
                                <span className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                                  <Tag size={9} /> {(form.product_ids || []).length} product{(form.product_ids || []).length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Right: actions */}
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                            {form.is_active ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => deactivateForm(form.id)}
                                      className="px-3 py-1.5 rounded-lg bg-zinc-500/10 border border-zinc-500/25 text-zinc-650 dark:text-zinc-400 text-[11px] font-bold hover:bg-zinc-500/20 transition-all cursor-pointer"
                                    >
                                      Deactivate
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">Deactivate this form</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => activateForm(form.id)}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
                                    >
                                      Activate
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">Activate this form</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button onClick={() => openFormBuilder(form)} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-[#3f5ce6] hover:bg-[#3f5ce6]/10 flex items-center justify-center transition-colors cursor-pointer">
                                    <Edit size={14} />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">Edit Form</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <button
                                      onClick={() => openDuplicateDialog(form)}
                                      disabled={cardProfiles.filter((p: any) => p.id !== activeProfile?.id).length === 0}
                                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <Layers size={14} />
                                    </button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  {cardProfiles.filter((p: any) => p.id !== activeProfile?.id).length === 0 ? 'Need another profile to duplicate to' : 'Duplicate to another profile'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {formPendingDelete === form.id ? (
                              <div className="flex items-center gap-1 animate-fadeIn">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button onClick={() => deleteForm(form.id)} className="h-8 w-8 rounded-lg bg-red-500 text-white hover:bg-red-650 flex items-center justify-center cursor-pointer animate-scaleUp">
                                        <Trash2 size={13} />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">Confirm Delete</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button onClick={() => setFormPendingDelete(null)} className="h-8 w-8 rounded-lg bg-muted text-foreground hover:bg-muted/80 flex items-center justify-center cursor-pointer">
                                        <X size={13} />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">Cancel</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => setFormPendingDelete(form.id)}
                                      className="h-8 w-8 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">Delete Form</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-[11px] text-center text-muted-foreground/50 py-1">Only one form can be active at a time · Leads are tracked per form independently</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══ FORM BUILDER SHEET ═══════════════════════════════════ */}
      <Sheet open={formBuilderOpen} onOpenChange={(open: boolean) => { if (!open) setFormBuilderOpen(false) }}>
        <SheetContent className="!w-full sm:!max-w-4xl lg:!max-w-5xl bg-background dark:bg-[#18181b] border-l border-border dark:border-zinc-800 p-0 flex flex-col h-full overflow-hidden text-left" showCloseButton={false}>
          {/* Accent line */}
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-[#3f5ce6] to-indigo-600 shrink-0" />

          {/* Header */}
          <SheetHeader className="flex flex-row items-center justify-between px-6 py-2 shrink-0 border-b border-border dark:border-zinc-800 space-y-0 text-left">
            <div>
              <SheetTitle className="font-black text-sm text-foreground">{editingFormId ? 'Edit Form' : 'New Form'}</SheetTitle>
              <SheetDescription className="text-[11px] text-muted-foreground mt-0.5">Build fields, link products, configure your form.</SheetDescription>
            </div>
          </SheetHeader>

          {/* Split Builder & Preview Body */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Left Column: Form Controls (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 border-b md:border-b-0 md:border-r border-border dark:border-zinc-800 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
              {/* Form identity */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Form Identity</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Form Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={formBuilderDraft.form_name}
                      onChange={e => setFormBuilderDraft((p: any) => ({ ...p, form_name: e.target.value }))}
                      placeholder="e.g. Product Enquiry"
                      className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Button Label</label>
                    <input
                      type="text"
                      value={formBuilderDraft.button_label}
                      onChange={e => setFormBuilderDraft((p: any) => ({ ...p, button_label: e.target.value }))}
                      placeholder="Submit"
                      className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Heading (shown on card page)</label>
                  <input
                    type="text"
                    value={formBuilderDraft.title}
                    onChange={e => setFormBuilderDraft((p: any) => ({ ...p, title: e.target.value }))}
                    placeholder="Get in Touch"
                    className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Sub-heading</label>
                  <input
                    type="text"
                    value={formBuilderDraft.subtitle}
                    onChange={e => setFormBuilderDraft((p: any) => ({ ...p, subtitle: e.target.value }))}
                    placeholder="Fill out the form below to connect."
                    className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                  />
                </div>
              </div>

              {/* Product linking */}
              {profileProducts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Link to Products</h4>
                  <div className="space-y-2">
                    {profileProducts.map((prod: any) => {
                      const isLinked = (formBuilderDraft.product_ids || []).includes(prod.id)
                      return (
                        <label key={prod.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-[#3f5ce6]/30 cursor-pointer transition-colors select-none">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isLinked ? 'bg-[#3f5ce6] border-[#3f5ce6]' : 'border-border bg-background'}`}
                            onClick={() => setFormBuilderDraft((p: any) => ({
                              ...p,
                              product_ids: isLinked
                                ? (p.product_ids || []).filter((id: string) => id !== prod.id)
                                : [...(p.product_ids || []), prod.id]
                            }))}
                          >
                            {isLinked && <Check size={10} className="text-white" />}
                          </div>
                          <span className="text-xs font-semibold text-foreground">{prod.name}</span>
                          {prod.price_inr && <span className="text-[10px] text-muted-foreground ml-auto">₹{(prod.price_inr / 100).toLocaleString('en-IN')}</span>}
                        </label>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">Leads from this form will be linked to the selected products for product-specific filtering.</p>
                </div>
              )}

              {/* Custom fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Custom Fields ({formBuilderDraft.fields.length})</h4>
                  <div className="relative">
                    <button
                      onClick={() => setFieldTypePickerOpen(p => !p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3f5ce6]/10 border border-[#3f5ce6]/25 text-[#3f5ce6] text-[11px] font-bold hover:bg-[#3f5ce6]/20 transition-all cursor-pointer select-none"
                    >
                      <Plus size={12} /> Add Field
                    </button>
                    {fieldTypePickerOpen && (
                      <div className="absolute right-0 top-full mt-2 z-50 bg-popover border border-border dark:border-zinc-800 rounded-2xl shadow-2xl p-3 w-72 animate-fadeIn">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2 px-1">Choose Field Type</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { type: 'text', label: 'Text', icon: <Type size={14} /> },
                            { type: 'email', label: 'Email', icon: <Mail size={14} /> },
                            { type: 'phone', label: 'Phone', icon: <Phone size={14} /> },
                            { type: 'textarea', label: 'Textarea', icon: <AlignLeft size={14} /> },
                            { type: 'number', label: 'Number', icon: <Hash size={14} /> },
                            { type: 'url', label: 'URL', icon: <Globe size={14} /> },
                            { type: 'date', label: 'Date', icon: <CalendarIcon size={14} /> },
                            { type: 'select', label: 'Dropdown', icon: <ChevronDown size={14} /> },
                            { type: 'radio', label: 'Radio', icon: <RadioTower size={14} /> },
                            { type: 'checkbox', label: 'Checkbox', icon: <ListChecks size={14} /> },
                            { type: 'file', label: 'File', icon: <Paperclip size={14} /> },
                            { type: 'image', label: 'Image', icon: <Camera size={14} /> },
                            { type: 'signature', label: 'Signature', icon: <PenLine size={14} /> },
                            { type: 'heading', label: 'Heading', icon: <Heading1 size={14} /> },
                          ].map(({ type, label, icon }) => (
                            <button
                              key={type}
                              onClick={() => addField(type)}
                              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-card hover:border-[#3f5ce6]/40 hover:bg-[#3f5ce6]/5 text-muted-foreground hover:text-[#3f5ce6] transition-all cursor-pointer"
                            >
                              {icon}
                              <span className="text-[9px] font-bold">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Field list */}
                {formBuilderDraft.fields.length === 0 ? (
                  <div className="border border-dashed border-border rounded-xl py-8 text-center text-muted-foreground/50">
                    <SlidersHorizontal size={20} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-semibold">No custom fields yet</p>
                    <p className="text-[10px] mt-0.5">Click "Add Field" to start building your form</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formBuilderDraft.fields.map((field: any, idx: number) => (
                      <div key={field.id} className="bg-card border border-border rounded-xl overflow-hidden">
                        {/* Field header */}
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30 dark:bg-zinc-900/30 border-b border-border select-none">
                          <GripVertical size={13} className="text-muted-foreground/40 shrink-0" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex-1">{field.type}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => moveField(idx, 'up')} disabled={idx === 0} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed">
                              <ChevronUp size={12} />
                            </button>
                            <button onClick={() => moveField(idx, 'down')} disabled={idx === formBuilderDraft.fields.length - 1} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed">
                              <ChevronDown size={12} />
                            </button>
                            <button onClick={() => removeField(field.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 cursor-pointer">
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                        {/* Field editor */}
                        <div className="p-3 space-y-2">
                          {field.type === 'heading' || field.type === 'paragraph' ? (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{field.type === 'heading' ? 'Heading Text' : 'Paragraph Text'}</label>
                              <input
                                type="text"
                                value={field.content || field.label}
                                onChange={e => updateField(field.id, { label: e.target.value, content: e.target.value })}
                                placeholder={field.type === 'heading' ? 'Section heading...' : 'Helper text...'}
                                className="w-full px-3 py-2 rounded-lg border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs focus:outline-none focus:border-[#3f5ce6] transition-all"
                              />
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Label</label>
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={e => updateField(field.id, { label: e.target.value })}
                                  placeholder="Field label"
                                  className="w-full px-3 py-2 rounded-lg border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs focus:outline-none focus:border-[#3f5ce6] transition-all"
                                />
                              </div>
                              {['text', 'email', 'phone', 'number', 'url', 'textarea', 'date'].includes(field.type) && (
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Placeholder</label>
                                  <input
                                    type="text"
                                    value={field.placeholder || ''}
                                    onChange={e => updateField(field.id, { placeholder: e.target.value })}
                                    placeholder="Hint text..."
                                    className="w-full px-3 py-2 rounded-lg border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs focus:outline-none focus:border-[#3f5ce6] transition-all"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Options for select/radio/checkbox */}
                          {['select', 'radio', 'checkbox'].includes(field.type) && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Options</label>
                              <div className="space-y-1.5">
                                {(field.options || []).map((opt: string, oIdx: number) => (
                                  <div key={oIdx} className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={e => {
                                        const newOpts = [...(field.options || [])]
                                        newOpts[oIdx] = e.target.value
                                        updateField(field.id, { options: newOpts })
                                      }}
                                      placeholder={`Option ${oIdx + 1}`}
                                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs focus:outline-none focus:border-[#3f5ce6] transition-all"
                                    />
                                    <button
                                      onClick={() => {
                                        const newOpts = (field.options || []).filter((_: string, i: number) => i !== oIdx)
                                        updateField(field.id, { options: newOpts })
                                      }}
                                      className="p-1 rounded text-muted-foreground hover:text-red-450 cursor-pointer"
                                    >
                                      <X size={11} />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => updateField(field.id, { options: [...(field.options || []), `Option ${(field.options || []).length + 1}`] })}
                                  className="text-[10px] font-bold text-[#3f5ce6] hover:underline cursor-pointer select-none"
                                >
                                  + Add Option
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Required toggle */}
                          {!['heading', 'paragraph', 'signature'].includes(field.type) && (
                            <div className="flex items-center justify-between pt-1 select-none">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Required</span>
                              <button
                                type="button"
                                onClick={() => updateField(field.id, { required: !field.required })}
                                className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-colors ${field.required ? 'bg-[#3f5ce6]' : 'bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700'}`}
                              >
                                <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${field.required ? 'left-[14px]' : 'left-0.5'}`} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Preview */}
            <div className="w-full md:w-[340px] lg:w-[380px] shrink-0 bg-muted/20 dark:bg-zinc-900/10 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 flex flex-col justify-start">
              <div className="sticky top-0 space-y-4">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Live Preview</h4>

                {/* Public Mock Lead Form Container */}
                <div className="bg-background dark:bg-zinc-950 border border-border dark:border-zinc-900 rounded-2xl p-5 shadow-lg space-y-4 text-left">
                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{formBuilderDraft.title || 'Get in Touch'}</h3>
                    {formBuilderDraft.subtitle && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{formBuilderDraft.subtitle}</p>
                    )}
                  </div>

                  {/* Product links mock */}
                  {(formBuilderDraft.product_ids || []).length > 0 && (
                    <div className="space-y-1.5 border-t border-border dark:border-zinc-900 pt-3">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Product Enquiry for:</label>
                      <div className="flex flex-wrap gap-1.5">
                        {formBuilderDraft.product_ids.map((prodId: string) => {
                          const prod = profileProducts.find((p: any) => p.id === prodId)
                          if (!prod) return null
                          return (
                            <span key={prodId} className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-500 flex items-center gap-1">
                              <Tag size={8} /> {prod.name}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Custom fields mock */}
                  <div className="space-y-3.5 pt-1">
                    {formBuilderDraft.fields.length === 0 ? (
                      <p className="text-[10px] italic text-muted-foreground/45 text-center py-4">Add custom fields to preview form inputs</p>
                    ) : (
                      formBuilderDraft.fields.map((field: any) => {
                        if (field.type === 'heading') {
                          return (
                            <h4 key={field.id} className="text-xs font-bold text-foreground pt-1 border-b border-border/40 pb-1">{field.label}</h4>
                          )
                        }
                        if (field.type === 'paragraph') {
                          return (
                            <p key={field.id} className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-line">{field.label}</p>
                          )
                        }
                        if (field.type === 'textarea') {
                          return (
                            <div key={field.id} className="space-y-1.5">
                              <label className="text-[10px] font-semibold text-foreground/85 block">
                                {field.label} {field.required && <span className="text-red-400">*</span>}
                              </label>
                              <textarea
                                rows={2}
                                disabled
                                placeholder={field.placeholder || 'Type here...'}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/10 text-[11px] focus:outline-none resize-none cursor-not-allowed opacity-80"
                              />
                            </div>
                          )
                        }
                        if (field.type === 'select') {
                          return (
                            <div key={field.id} className="space-y-1.5">
                              <label className="text-[10px] font-semibold text-foreground/85 block">
                                {field.label} {field.required && <span className="text-red-400">*</span>}
                              </label>
                              <select
                                disabled
                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/10 text-[11px] cursor-not-allowed opacity-80"
                              >
                                <option>{field.placeholder || 'Select option...'}</option>
                                {(field.options || []).map((o: string) => (
                                  <option key={o}>{o}</option>
                                ))}
                              </select>
                            </div>
                          )
                        }
                        if (field.type === 'radio') {
                          return (
                            <div key={field.id} className="space-y-1.5">
                              <label className="text-[10px] font-semibold text-foreground/85 block">
                                {field.label} {field.required && <span className="text-red-400">*</span>}
                              </label>
                              <div className="flex flex-wrap gap-2.5">
                                {(field.options || []).map((o: string) => (
                                  <label key={o} className="flex items-center gap-1.5 text-[10px] text-foreground/70 cursor-not-allowed select-none">
                                    <input type="radio" disabled className="w-3 h-3 text-[#3f5ce6]" />
                                    <span>{o}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )
                        }
                        if (field.type === 'checkbox') {
                          const options = field.options || []
                          if (options.length > 0) {
                            return (
                              <div key={field.id} className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-foreground/85 block">
                                  {field.label} {field.required && <span className="text-red-400">*</span>}
                                </label>
                                <div className="flex flex-wrap gap-2.5">
                                  {options.map((o: string) => (
                                    <label key={o} className="flex items-center gap-1.5 text-[10px] text-foreground/70 cursor-not-allowed select-none">
                                      <input type="checkbox" disabled className="w-3 h-3 text-[#3f5ce6] rounded" />
                                      <span>{o}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )
                          } else {
                            return (
                              <div key={field.id} className="flex items-center justify-between pt-1 select-none">
                                <label className="text-[10px] font-semibold text-foreground/85">
                                  {field.label} {field.required && <span className="text-red-400">*</span>}
                                </label>
                                <input type="checkbox" disabled className="w-3.5 h-3.5 rounded text-[#3f5ce6] cursor-not-allowed opacity-80" />
                              </div>
                            )
                          }
                        }
                        if (field.type === 'file' || field.type === 'image') {
                          return (
                            <div key={field.id} className="space-y-1.5">
                              <label className="text-[10px] font-semibold text-foreground/85 block">
                                {field.label} {field.required && <span className="text-red-400">*</span>}
                              </label>
                              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 bg-muted/5 flex items-center justify-between gap-2 cursor-not-allowed">
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                  {field.type === 'image' ? 'Upload Image File...' : 'Upload File Attachment...'}
                                </span>
                                <span className="text-[9px] bg-muted px-2 py-0.5 rounded border border-border font-bold uppercase tracking-wider text-muted-foreground select-none">Browse</span>
                              </div>
                            </div>
                          )
                        }
                        if (field.type === 'signature') {
                          return (
                            <div key={field.id} className="space-y-1.5">
                              <label className="text-[10px] font-semibold text-foreground/85 block">
                                {field.label}
                              </label>
                              <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg text-center py-4 text-[10px] text-muted-foreground/60 select-none font-bold uppercase tracking-wider">
                                Signature Pad Area
                              </div>
                            </div>
                          )
                        }
                        if (field.type === 'date') {
                          return (
                            <div key={field.id} className="space-y-1.5">
                              <label className="text-[10px] font-semibold text-foreground/85 block">
                                {field.label} {field.required && <span className="text-red-400">*</span>}
                              </label>
                              <div className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-border bg-muted/10 text-[11px] cursor-not-allowed opacity-80">
                                <span className="text-muted-foreground">{field.placeholder || 'Select Date...'}</span>
                                <CalendarIcon size={12} className="text-muted-foreground" />
                              </div>
                            </div>
                          )
                        }
                        return (
                          <div key={field.id} className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-foreground/85 block">
                              {field.label} {field.required && <span className="text-red-400">*</span>}
                            </label>
                            <input
                              type={field.type}
                              disabled
                              placeholder={field.placeholder || `Enter ${field.label}...`}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/10 text-[11px] cursor-not-allowed opacity-80"
                            />
                          </div>
                        )
                      })
                    )}
                    <button type="button" disabled className="w-full py-2 bg-[#3f5ce6]/80 text-white font-bold text-xs rounded-xl cursor-not-allowed mt-2 shadow-xs">
                      {formBuilderDraft.button_label || 'Submit'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <SheetFooter className="p-6 border-t border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-950/40 shrink-0 mt-auto flex-row gap-3 justify-end items-center animate-fadeIn">
            <button
              onClick={() => setFormBuilderOpen(false)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-border dark:border-zinc-800 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-zinc-800/40 text-xs font-semibold cursor-pointer text-center transition-all active:scale-98"
            >
              Cancel
            </button>
            <button
              onClick={saveFormBuilder}
              disabled={formBuilderSaving || !formBuilderDraft.form_name?.trim()}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-[#3f5ce6] hover:bg-[#3050d8] text-white text-xs font-bold shadow-lg shadow-[#3f5ce6]/25 transition-all cursor-pointer active:scale-98 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {formBuilderSaving ? (
                <><Loader2 size={13} className="animate-spin" /> Saving…</>
              ) : (
                <><Save size={13} /> Save Form</>
              )}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ═══ FORM DUPLICATE DIALOG ═══════════════════════════════════ */}
      {duplicateDialogOpen && duplicatingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-background dark:bg-[#18181b] border border-border dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scaleUp text-left">
            <div className="p-5 border-b border-border dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Duplicate Form</h3>
              <button onClick={() => setDuplicateDialogOpen(false)} className="text-zinc-400 hover:text-foreground transition-colors cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Copy form details to another profile. Submissions will not be copied over. The duplicated form will be archived (draft status) on the target profile.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Target Profile</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left">
                      <span className="truncate">
                        {cardProfiles.find((p: any) => p.id === duplicateTargetProfileId)?.profile_name || 'Select target profile'}
                      </span>
                      <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[340px] z-[150]">
                    {cardProfiles.filter((p: any) => p.id !== activeProfile?.id).map((p: any) => (
                      <DropdownMenuItem
                        key={p.id}
                        onClick={() => {
                          setDuplicateTargetProfileId(p.id)
                          checkDuplicateConflict(duplicateFormName, p.id, duplicatingForm.fields)
                        }}
                        className="text-xs cursor-pointer animate-fadeIn"
                      >
                        {p.profile_name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Form Name in Target Profile</label>
                <input
                  type="text"
                  value={duplicateFormName}
                  onChange={e => {
                    const newName = e.target.value
                    setDuplicateFormName(newName)
                    checkDuplicateConflict(newName, duplicateTargetProfileId, duplicatingForm.fields)
                  }}
                  placeholder="Form name"
                  className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all"
                />
              </div>

              {duplicateCheckingConflict ? (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground animate-pulse py-1">
                  <Loader2 size={11} className="animate-spin" /> Checking target duplicates...
                </div>
              ) : duplicateConflict ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 space-y-1 animate-fadeIn">
                  <div className="font-bold flex items-center gap-1">
                    <AlertCircle size={12} /> Form Already Present
                  </div>
                  <p className="leading-relaxed">
                    A form with this name and field layout already exists in that target profile. Duplicating will create a duplicate form.
                  </p>
                </div>
              ) : null}
            </div>
            <div className="p-5 border-t border-border dark:border-zinc-800 flex gap-3">
              <button onClick={() => setDuplicateDialogOpen(false)} className="flex-1 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">Cancel</button>
              <button
                onClick={confirmDuplicateForm}
                disabled={duplicating || !duplicateTargetProfileId || !duplicateFormName.trim()}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-white ${duplicateConflict ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#3f5ce6] hover:bg-[#3050d8]'}`}
              >
                {duplicating ? (
                  <><Loader2 size={12} className="animate-spin" /> Duplicating…</>
                ) : duplicateConflict ? (
                  <><AlertCircle size={12} /> Duplicate Anyway</>
                ) : (
                  <><Layers size={12} /> Duplicate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ LEAD FORM DUPLICATE FROM OTHERS DIALOG ═══════════════════ */}
      {duplicateLeadFormFromOthersDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-background dark:bg-[#18181b] border border-border dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scaleUp text-left">
            <div className="p-5 border-b border-border dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Duplicate From Another Profile</h3>
              <button onClick={() => setDuplicateLeadFormFromOthersDialogOpen(false)} className="text-zinc-400 hover:text-foreground transition-colors cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select a lead capture form from another profile to duplicate it to your current active profile.
              </p>

              {/* Dropdown: Source Profile */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Source Profile</label>
                {(() => {
                  const sourceProfiles = cardProfiles.filter(profile =>
                    allAccountLeadForms.some(f => f.profile_id === profile.id) && profile.id !== activeProfile?.id
                  );
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left">
                          <span className="truncate">
                            {sourceProfiles.find((p: any) => p.id === selectedSourceLeadFormProfileId)?.profile_name || 'Select source profile'}
                          </span>
                          <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[340px] z-[150]">
                        {sourceProfiles.map((p: any) => (
                          <DropdownMenuItem
                            key={p.id}
                            onClick={() => {
                              setSelectedSourceLeadFormProfileId(p.id)
                              const firstForm = allAccountLeadForms.find(f => f.profile_id === p.id)
                              if (firstForm) {
                                setSelectedSourceLeadFormId(firstForm.id)
                                setDuplicateLeadFormFromOthersName(firstForm.form_name || '')
                                if (activeProfile?.id) {
                                  checkDuplicateLeadFormFromOthersConflict(firstForm.form_name, activeProfile.id)
                                }
                              } else {
                                setSelectedSourceLeadFormId('')
                                setDuplicateLeadFormFromOthersName('')
                                setDuplicateLeadFormFromOthersConflict(false)
                              }
                            }}
                            className="text-xs cursor-pointer"
                          >
                            {p.profile_name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                })()}
              </div>

              {/* Dropdown: Form */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Select Form to Copy</label>
                {(() => {
                  const sourceForms = allAccountLeadForms.filter(f => f.profile_id === selectedSourceLeadFormProfileId)
                  const selectedForm = sourceForms.find(f => f.id === selectedSourceLeadFormId)
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button disabled={!selectedSourceLeadFormProfileId} className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] cursor-pointer transition-all text-left disabled:opacity-50">
                          <span className="truncate">
                            {selectedForm ? selectedForm.form_name : 'Select form'}
                          </span>
                          <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-auto" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[340px] z-[150]">
                        {sourceForms.map((form: any) => (
                          <DropdownMenuItem
                            key={form.id}
                            onClick={() => {
                              setSelectedSourceLeadFormId(form.id)
                              setDuplicateLeadFormFromOthersName(form.form_name || '')
                              if (activeProfile?.id) {
                                checkDuplicateLeadFormFromOthersConflict(form.form_name, activeProfile.id)
                              }
                            }}
                            className="text-xs cursor-pointer font-semibold"
                          >
                            <div className="flex flex-col text-left gap-0.5">
                              <span className="font-bold text-xs">{form.form_name}</span>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[300px]">{form.title || '(No title)'}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                })()}
              </div>

              {/* Form name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Form Name in Current Profile</label>
                <input
                  type="text"
                  disabled={!selectedSourceLeadFormId}
                  value={duplicateLeadFormFromOthersName}
                  onChange={e => {
                    const newName = e.target.value
                    setDuplicateLeadFormFromOthersName(newName)
                    if (activeProfile?.id) {
                      checkDuplicateLeadFormFromOthersConflict(newName, activeProfile.id)
                    }
                  }}
                  placeholder="Form name"
                  className="w-full px-3 py-2 rounded-xl border border-input dark:border-zinc-800 bg-background dark:bg-zinc-900/40 text-xs text-foreground focus:outline-none focus:border-[#3f5ce6] focus:ring-1 focus:ring-[#3f5ce6] transition-all disabled:opacity-50"
                />
              </div>

              {duplicateLeadFormFromOthersCheckingConflict ? (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground animate-pulse py-1">
                  <Loader2 size={11} className="animate-spin" /> Checking target duplicates...
                </div>
              ) : duplicateLeadFormFromOthersConflict ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 space-y-1 animate-fadeIn">
                  <div className="font-bold flex items-center gap-1">
                    <AlertCircle size={12} /> Form Already Present
                  </div>
                  <p className="leading-relaxed">
                    A form with this name already exists in your current active profile.
                  </p>
                </div>
              ) : null}
            </div>
            <div className="p-5 border-t border-border dark:border-zinc-800 flex gap-3">
              <button onClick={() => setDuplicateLeadFormFromOthersDialogOpen(false)} className="flex-1 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">Cancel</button>
              <button
                onClick={confirmDuplicateLeadFormFromOthers}
                disabled={duplicatingLeadFormFromOthersProgress || !selectedSourceLeadFormId || !duplicateLeadFormFromOthersName.trim() || duplicateLeadFormFromOthersConflict}
                className="flex-grow py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-white bg-[#3f5ce6] hover:bg-[#3050d8] disabled:opacity-50"
              >
                {duplicatingLeadFormFromOthersProgress ? (
                  <><Loader2 size={12} className="animate-spin" /> Duplicating…</>
                ) : (
                  <><Layers size={12} /> Duplicate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { createContext, useContext, Dispatch, SetStateAction } from 'react'

export interface DashboardContextType {
  user: any
  setUser: Dispatch<SetStateAction<any>>
  profile: any // account row
  setProfile: Dispatch<SetStateAction<any>>
  cards: any[]
  setCards: Dispatch<SetStateAction<any[]>>
  activeCard: any
  setActiveCard: Dispatch<SetStateAction<any>>
  handleSelectCard: (c: any) => Promise<void>
  activeProfile: any
  setActiveProfile: Dispatch<SetStateAction<any>>
  cardProfiles: any[]
  setCardProfiles: Dispatch<SetStateAction<any[]>>
  vcardDataMap: Record<string, any>
  setVcardDataMap: Dispatch<SetStateAction<Record<string, any>>>
  userOrders: any[]
  setUserOrders: Dispatch<SetStateAction<any[]>>
  lastActivity: string | null
  setLastActivity: Dispatch<SetStateAction<string | null>>
  
  loading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
  message: string | null
  setMessage: (msg: { type: 'success' | 'error'; text: string } | string | null) => void
  messageType: 'success' | 'error'
  setMessageType: Dispatch<SetStateAction<'success' | 'error'>>

  // Data fetching functions
  fetchProfileProducts: (pId: string, silent?: boolean) => Promise<void>
  fetchProfileFeeds: (pId: string, silent?: boolean) => Promise<void>
  fetchProfileLinks: (pId: string, silent?: boolean) => Promise<void>
  fetchLeadForms: (pId: string, silent?: boolean) => Promise<void>
  fetchLeads: (pId: string, silent?: boolean) => Promise<void>

  // Products state shared between tab and details drawer/dialogs
  profileProducts: any[]
  setProfileProducts: Dispatch<SetStateAction<any[]>>
  profileProductsLoading: boolean
  setProfileProductsLoading: Dispatch<SetStateAction<boolean>>
  allAccountProducts: any[]
  setAllAccountProducts: Dispatch<SetStateAction<any[]>>
  allAccountProductsLoading: boolean
  setAllAccountProductsLoading: Dispatch<SetStateAction<boolean>>

  // Feeds state
  profileFeeds: any[]
  setProfileFeeds: Dispatch<SetStateAction<any[]>>
  profileFeedsLoading: boolean
  setProfileFeedsLoading: Dispatch<SetStateAction<boolean>>
  allAccountFeeds: any[]
  setAllAccountFeeds: Dispatch<SetStateAction<any[]>>
  allAccountFeedsLoading: boolean
  setAllAccountFeedsLoading: Dispatch<SetStateAction<boolean>>

  // Links state
  profileLinks: any[]
  setProfileLinks: Dispatch<SetStateAction<any[]>>
  profileLinksLoading: boolean
  setProfileLinksLoading: Dispatch<SetStateAction<boolean>>
  allAccountLinks: any[]
  setAllAccountLinks: Dispatch<SetStateAction<any[]>>
  allAccountLinksLoading: boolean
  setAllAccountLinksLoading: Dispatch<SetStateAction<boolean>>

  // Leads state
  leads: any[]
  setLeads: Dispatch<SetStateAction<any[]>>
  leadsLoading: boolean
  setLeadsLoading: Dispatch<SetStateAction<boolean>>
  leadForms: any[]
  setLeadForms: Dispatch<SetStateAction<any[]>>
  leadFormsLoading: boolean
  setLeadFormsLoading: Dispatch<SetStateAction<boolean>>
  allAccountLeadForms: any[]
  setAllAccountLeadForms: Dispatch<SetStateAction<any[]>>
  allAccountLeadFormsLoading: boolean
  setAllAccountLeadFormsLoading: Dispatch<SetStateAction<boolean>>

  // Account forms state
  accountForm: { fullName: string; nfcRedirectToDashboard: boolean; agreedToTerms: boolean }
  setAccountForm: Dispatch<SetStateAction<{ fullName: string; nfcRedirectToDashboard: boolean; agreedToTerms: boolean }>>
  currentSessionId: string
  setCurrentSessionId: Dispatch<SetStateAction<string>>
  loggedSessions: any[]
  setLoggedSessions: Dispatch<SetStateAction<any[]>>
  sessionDisconnecting: any
  setSessionDisconnecting: Dispatch<SetStateAction<any>>

  // Upgrade Modal control
  upgradeModalOpen: boolean
  setUpgradeModalOpen: Dispatch<SetStateAction<boolean>>
  upgradeModalFeature: string
  setUpgradeModalFeature: Dispatch<SetStateAction<string>>

  // Trigger global data refresh
  refreshAllData: () => Promise<void>
}

export const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

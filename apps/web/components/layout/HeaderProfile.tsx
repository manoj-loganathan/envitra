"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { LogOut, Settings, Sun, Moon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function HeaderProfile() {
  const { theme, setTheme } = useTheme()
  const supabase = createClient()

  const [user, setUser] = React.useState<any>(null)
  const [profile, setProfile] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadSessionAndProfile = async () => {
      setLoading(true)
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          setUser(authUser)
          const { data } = await supabase
            .from('accounts')
            .select('full_name')
            .eq('id', authUser.id)
            .single()
          setProfile(data)
        }
      } catch (err) {
        console.error("Error loading header details:", err)
      } finally {
        setLoading(false)
      }
    }

    loadSessionAndProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        const { data } = await supabase
          .from('accounts')
          .select('full_name')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const getInitials = () => {
    const displayName = profile?.full_name || user?.email || 'U';
    const parts = displayName.trim().split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return displayName.slice(0, 2).toUpperCase()
  }

  return (
    <div className="flex items-center gap-4">
      {/* Authenticated indicator */}
      <div className="flex items-center gap-3 text-right">
        <div className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </div>
        <div className="flex flex-col text-left text-xs leading-tight hidden sm:flex select-none">
          <span className="font-bold tracking-tight text-foreground">Authenticated</span>
          <span className="truncate text-[10px] text-muted-foreground font-semibold">
            Admin Session Secure
          </span>
        </div>
      </div>

      <div className="h-6 w-px bg-border" />

      {/* User profile avatar dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-muted border border-border overflow-hidden transition-transform active:scale-95 focus:outline-none hover:border-foreground/30 shadow-sm cursor-pointer">
            {loading ? (
              <div className="h-full w-full animate-pulse bg-muted" />
            ) : (
              <span className="text-xs font-bold text-foreground">
                {getInitials()}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl shadow-lg border border-border bg-popover text-popover-foreground z-[120]">
          <DropdownMenuLabel className="font-normal p-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none text-foreground truncate">
                {profile?.full_name || "Workspace User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {user?.email || ""}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border" />
          
          <DropdownMenuItem asChild className="cursor-pointer gap-2 font-semibold hover:bg-muted focus:bg-muted rounded-md text-foreground">
            <Link href="/dashboard?tab=settings">
              <Settings className="w-4 h-4 text-muted-foreground" />
              Settings
            </Link>
          </DropdownMenuItem>

          {/* Theme Toggle option */}
          <DropdownMenuItem
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="cursor-pointer gap-2 font-semibold hover:bg-muted focus:bg-muted rounded-md text-foreground"
          >
            {theme === "light" ? (
              <>
                <Moon className="w-4 h-4 text-muted-foreground" />
                Dark Mode
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-muted-foreground" />
                Light Mode
              </>
            ) }
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border" />
          
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 font-semibold cursor-pointer gap-2 rounded-md"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

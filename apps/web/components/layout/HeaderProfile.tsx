"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { LogOut, Sun, Moon, Home, CreditCard, ShoppingBag } from "lucide-react"
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
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const loadSessionAndProfile = async () => {
      setLoading(true)
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          setUser(authUser)
          const { data } = await supabase
            .from('accounts')
            .select('full_name, avatar_url')
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
          .select('full_name, avatar_url')
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
      {/* User profile avatar dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-muted border border-border overflow-hidden transition-transform active:scale-95 focus:outline-none hover:border-foreground/30 shadow-sm cursor-pointer">
            {loading ? (
              <div className="h-full w-full animate-pulse bg-muted" />
            ) : profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-foreground">
                {getInitials()}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl shadow-lg border border-border bg-popover text-popover-foreground z-[120]">
          {/* User info */}
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

          {/* Navigate to Home */}
          <DropdownMenuItem asChild className="cursor-pointer gap-2 font-semibold hover:bg-muted focus:bg-muted rounded-md text-foreground">
            <Link href="/">
              <Home className="w-4 h-4 text-muted-foreground" />
              Home
            </Link>
          </DropdownMenuItem>

          {/* Navigate to Plans section on landing page */}
          <DropdownMenuItem asChild className="cursor-pointer gap-2 font-semibold hover:bg-muted focus:bg-muted rounded-md text-foreground">
            <Link href="/#pricing">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              Plans
            </Link>
          </DropdownMenuItem>

          {/* Navigate to Shop */}
          <DropdownMenuItem asChild className="cursor-pointer gap-2 font-semibold hover:bg-muted focus:bg-muted rounded-md text-foreground">
            <Link href="/shop">
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              Shop
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border" />

          {/* Theme Toggle */}
          <DropdownMenuItem
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="cursor-pointer gap-2 font-semibold hover:bg-muted focus:bg-muted rounded-md text-foreground"
          >
            {!mounted || theme !== "light" ? (
              <>
                <Sun className="w-4 h-4 text-muted-foreground" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-muted-foreground" />
                Dark Mode
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border" />

          {/* Sign Out */}
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

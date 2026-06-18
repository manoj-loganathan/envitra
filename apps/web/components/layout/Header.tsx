'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, Menu, X, User } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { createClient } from '@/lib/supabase/client'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  // Zustand store properties
  const [itemCount, setItemCount] = useState(0)
  const storeItemCount = useCartStore((state) => state.getItemCount())
  
  const supabase = createClient()

  // Must be after all hooks — no early return before hooks
  const shouldHideHeader = pathname && (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/u/') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password'
  )

  useEffect(() => {
    setItemCount(storeItemCount)
  }, [storeItemCount])

  // If in recovery/password-reset mode but navigated away, force sign out cleanly
  useEffect(() => {
    const handleRecoveryBypass = async () => {
      if (pathname !== '/forgot-password' && typeof window !== 'undefined' && localStorage.getItem('envitra_recovery_mode') === 'true') {
        localStorage.removeItem('envitra_recovery_mode')
        try {
          await supabase.auth.signOut()
        } catch (err) {
          console.error('Sign out on bypass error:', err)
        }
        setUser(null)
        setProfile(null)
      }
    }
    handleRecoveryBypass()
  }, [pathname, supabase])

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      if (session?.user) {
        const { data } = await supabase
          .from('accounts')
          .select('full_name')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      }
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        const { data } = await supabase
          .from('accounts')
          .select('full_name')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    }
    setDropdownOpen(false)
    window.location.href = '/'
  }

  const navLinks = [
    { name: 'Home', href: '#hero' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Who It\'s For', href: '#who-its-for' },
    { name: 'Eco Impact', href: '#eco-impact' },
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
  ]

  const handleNavClick = (href: string) => {
    setIsOpen(false)
    if (href.startsWith('#')) {
      if (pathname === '/') {
        // Smooth scroll to the section on the current page
        const element = document.getElementById(href.replace('#', ''))
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      } else {
        // Navigate to home with hash anchor
        router.push('/' + href)
      }
    }
  }

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }
  if (shouldHideHeader) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--bg-surface)]/80 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>

        {/* Center Navigation Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isSectionLink = link.href.startsWith('#')
            return (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.href)}
                className="text-[14px] font-medium text-[var(--text-secondary)] hover:text-purple-600 transition-colors cursor-pointer relative py-1"
              >
                {link.name}
              </button>
            )
          })}
        </nav>

        {/* Right Section Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/shop"
            className="text-[14px] font-medium text-[var(--text-secondary)] hover:text-purple-600 transition-colors"
          >
            Shop
          </Link>
          
          <ThemeToggle />

          <Link href="/cart" className="relative p-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-purple)] text-[var(--text-secondary)] hover:text-purple-600 transition-all duration-200">
            <ShoppingCart size={16} />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-primary text-[10px] font-bold text-white shadow-purple-sm animate-fade-in">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-white shadow-purple-sm hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                {getInitials()}
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-card border border-[var(--border)] bg-[var(--bg-surface)] py-1 shadow-lg z-20">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-purple-600"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-purple-600"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Order History
                    </Link>
                    <hr className="border-[var(--border)] my-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left block px-4 py-2 text-sm text-red-500 hover:bg-[var(--bg-muted)]"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-btn font-medium text-xs border border-[var(--border-purple)] text-purple-600 hover:text-purple-700 bg-transparent hover:bg-purple-600/10 transition-all duration-200"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <Link href="/cart" className="relative p-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
            <ShoppingCart size={16} />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-primary text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-btn border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {isOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavClick(link.href)}
              className="block w-full text-left py-2 text-[15px] font-medium text-[var(--text-secondary)] hover:text-purple-600"
            >
              {link.name}
            </button>
          ))}
          <Link
            href="/shop"
            className="block py-2 text-[15px] font-medium text-[var(--text-secondary)] hover:text-purple-600"
            onClick={() => setIsOpen(false)}
          >
            Shop
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="block py-2 text-[15px] font-medium text-[var(--text-secondary)] hover:text-purple-600"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/orders"
                className="block py-2 text-[15px] font-medium text-[var(--text-secondary)] hover:text-purple-600"
                onClick={() => setIsOpen(false)}
              >
                Order History
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-left py-2 text-[15px] font-medium text-red-500"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="block text-center py-2.5 rounded-btn font-medium text-[14px] border border-[var(--border-purple)] text-purple-600 hover:text-purple-700 bg-transparent hover:bg-purple-600/10"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  )
}

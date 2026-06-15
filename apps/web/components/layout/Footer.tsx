'use client'

import Link from 'next/link'
import { Logo } from './Logo'
import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()

  if (pathname && (pathname.startsWith('/dashboard') || pathname.startsWith('/u/'))) {
    return null
  }

  return (
    <footer className="bg-[var(--bg-page)] text-[var(--text-primary)] border-t border-[var(--border)] transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Column 1 - Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-block text-[var(--text-primary)]">
              <Logo />
            </Link>
            <p className="text-sm text-[var(--text-secondary)] max-w-xs">
              Your identity. One tap away. Envitra smart NFC cards keep you connected instantly.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-[var(--text-muted)] hover:text-purple-500 transition-colors" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </Link>
              <Link href="#" className="text-[var(--text-muted)] hover:text-purple-500 transition-colors" aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </Link>
              <Link href="#" className="text-[var(--text-muted)] hover:text-purple-500 transition-colors" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Column 2 - Links */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-2">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Product</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/#how-it-works" className="text-sm text-[var(--text-secondary)] hover:text-purple-500 transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="text-sm text-[var(--text-secondary)] hover:text-purple-500 transition-colors">
                    Shop Cards
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className="text-sm text-[var(--text-secondary)] hover:text-purple-500 transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/#eco-impact" className="text-sm text-[var(--text-secondary)] hover:text-purple-500 transition-colors">
                    Eco Impact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Support & Legal</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="#" className="text-sm text-[var(--text-secondary)] hover:text-purple-500 transition-colors">
                    Help Centre
                  </Link>
                </li>
                <li>
                  <Link href="mailto:support@envitra.in" className="text-sm text-[var(--text-secondary)] hover:text-purple-500 transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-[var(--text-secondary)] hover:text-purple-500 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-[var(--text-secondary)] hover:text-purple-500 transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom copyright details */}
        <div className="mt-12 border-t border-[var(--border)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p>© 2026 Envitra Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex gap-4 items-center">
            <span>Made in India 🇮🇳</span>
            <span>•</span>
            <span>GST: 29AABCE1234F1Z5</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

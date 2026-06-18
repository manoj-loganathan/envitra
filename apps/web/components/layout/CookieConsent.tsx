'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie } from 'lucide-react'
import Link from 'next/link'

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const pathname = usePathname()

  // Don't show on public client profile pages
  const isProfilePage = pathname?.startsWith('/u/')

  useEffect(() => {
    if (isProfilePage) return
    // Check if user has already made a choice
    const consent = localStorage.getItem('envitra_cookie_consent')
    if (!consent) {
      // Show consent popup after a short delay (1.5 seconds)
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isProfilePage])

  // Never render on profile pages
  if (isProfilePage) return null


  const handleAccept = () => {
    localStorage.setItem('envitra_cookie_consent', 'accepted')
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('envitra_cookie_consent', 'rejected')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.98 }}
          animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
          exit={{ opacity: 0, y: 30, x: '-50%', scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 w-[calc(100%-2rem)] max-w-5xl z-[9999] bg-[#0c0c0e]/95 backdrop-blur-lg border border-zinc-800/80 rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-left"
        >
          {/* Left Side: Icon & Copy */}
          <div className="flex items-start md:items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-[#0d1430] flex items-center justify-center border border-[#22337d]/80 text-[#3f5ce6] shrink-0">
              <Cookie size={22} className="stroke-[2]" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-white tracking-tight font-poppins">
                We respect your privacy
              </h3>
              <p className="text-[12px] md:text-[13px] text-zinc-400 font-medium leading-relaxed font-sans">
                We use cookies to enhance your browsing experience, analyze site traffic, and serve targeted advertisements. By clicking "Accept All", you consent to our use of cookies. Read our{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3f5ce6] font-semibold hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0">
            <button
              onClick={handleDecline}
              className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl border border-zinc-800 text-white font-semibold text-xs md:text-[13px] bg-zinc-900/40 hover:bg-zinc-800/80 transition-all cursor-pointer focus:outline-none font-poppins active:scale-[0.98]"
            >
              Decline All
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 md:flex-initial px-6 py-2.5 rounded-xl bg-[#3f5ce6] hover:bg-[#304bc0] text-white font-semibold text-xs md:text-[13px] transition-all cursor-pointer shadow-md shadow-[#3f5ce6]/10 active:scale-[0.98] focus:outline-none font-poppins"
            >
              Accept All
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

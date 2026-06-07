import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Envitra Admin — Control Panel',
  description: 'Super administrator management dashboard for Envitra NFC smart cards.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${outfit.variable}`} suppressHydrationWarning>
      <body className="bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-200 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}

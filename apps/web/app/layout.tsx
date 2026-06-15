import type { Metadata } from 'next'
import { Outfit, Poppins } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const outfit = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
})

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'Envitra — Your identity. One tap away.',
  description: 'Envitra NFC smart cards replace paper business cards with a smart, tap-to-share digital profile. Now shipping across India.',
  metadataBase: new URL('https://envitra.in'),
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-200 antialiased flex flex-col justify-between">
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

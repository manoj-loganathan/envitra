import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'

export function CTASection() {
  return (
    <section className="bg-[var(--bg-page)] text-[var(--text-primary)] py-24 relative overflow-hidden transition-colors duration-200">
      
      {/* Decorative background glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(48,80,216,0.08) 0%, transparent 70%)'
        }}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
          Ready to make every connection count?
        </h2>

        <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-lg mx-auto">
          Join 2,000+ professionals who have discarded paper business cards and upgraded to Envitra.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-btn font-medium text-white text-sm bg-gradient-primary hover:bg-gradient-primary-hover shadow-purple-md hover:shadow-purple-lg transition-all duration-200"
          >
            Get your card <ArrowRight size={16} />
          </Link>
          <Link
            href="mailto:sales@envitra.in"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-btn font-medium text-sm border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-muted)] transition-all duration-200"
          >
            Talk to sales <Mail size={14} />
          </Link>
        </div>

      </div>
    </section>
  )
}

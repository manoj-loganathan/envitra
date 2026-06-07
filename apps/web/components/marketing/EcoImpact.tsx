'use client'

import { Leaf, Trees, Globe, Trash2, CreditCard, Package } from 'lucide-react'

export function EcoImpact() {
  return (
    <section 
      id="eco-impact" 
      className="py-16 sm:py-20 text-white overflow-hidden relative border-y border-emerald-950/30"
      style={{
        backgroundImage: "url('/eco-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >

      {/* Black overlay above the image */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Header area */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              The card that doesn't cost the earth
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
              Traditional business cards are printed, handed out, and thrown away — billions of them, every year. Workflow NFC cards are built to last. One card, one profile, infinite shares. When you choose our Eco Bamboo card, it's made from renewable bamboo and ships in 100% recycled packaging.
            </p>
          </div>

          {/* Grid of 6 features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
            
            {/* Global scale */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Globe size={18} className="shrink-0" />
                <span className="text-sm font-semibold uppercase tracking-wider">global</span>
              </div>
              <h3 className="text-xl font-semibold text-white">88 billion</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Paper business cards printed every year globally
              </p>
            </div>

            {/* Waste */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Trash2 size={18} className="shrink-0" />
                <span className="text-sm font-semibold uppercase tracking-wider">waste</span>
              </div>
              <h3 className="text-xl font-semibold text-white">88%</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Discarded within a week of being handed out
              </p>
            </div>

            {/* Reusable */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CreditCard size={18} className="shrink-0" />
                <span className="text-sm font-semibold uppercase tracking-wider">reusable</span>
              </div>
              <h3 className="text-xl font-semibold text-white">1 Card</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Replaces hundreds of paper cards over its lifetime
              </p>
            </div>

            {/* Bamboo card */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Leaf size={18} className="shrink-0" />
                <span className="text-sm font-semibold uppercase tracking-wider">eco</span>
              </div>
              <h3 className="text-xl font-semibold text-white">Bamboo option</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Made from sustainably harvested bamboo — fully biodegradable
              </p>
            </div>

            {/* Carbon card */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Trees size={18} className="shrink-0" />
                <span className="text-sm font-semibold uppercase tracking-wider">park</span>
              </div>
              <h3 className="text-xl font-semibold text-white">Carbon offset</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Every Metal card order includes a tree planted via GreenJams
              </p>
            </div>

            {/* Recycled Packaging */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Package size={18} className="shrink-0" />
                <span className="text-sm font-semibold uppercase tracking-wider">shipping</span>
              </div>
              <h3 className="text-xl font-semibold text-white">Recycled packaging</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Shipped in 100% recycled, compostable mailers to minimize waste
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}

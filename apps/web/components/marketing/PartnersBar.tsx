'use client'

export function PartnersBar() {
  const partners = [

    'YC Alumni',
    'IIM Bangalore',
    'Nasscom',
    'TechSparks',
    'ProductHunt',
    'StartupIndia',
    'FICCI',
    'CII',
    'Startup India',
    'Google for Startups',
  ]

  // Duplicate list for seamless infinite loop
  const marqueeItems = [...partners, ...partners]

  return (
    <section
      className="w-full pt-26 pb-13 px-56 overflow-hidden"
      style={{
        background: 'var(--bg-page)',
      }}
    >
      <div
        className="relative flex overflow-hidden"
        style={{
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
          maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
        }}
      >
        <div className="flex animate-marquee whitespace-nowrap gap-16 items-center">
          {marqueeItems.map((partner, i) => (
            <span
              key={i}
              className="text-sm font-bold tracking-widest uppercase shrink-0 cursor-default transition-colors duration-300"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              {partner}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 28s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}

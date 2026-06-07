export function SocialProofBar() {
  const avatarInitials = ['AK', 'RS', 'PM', 'VN', 'SK']

  return (
    <section
      className="w-full py-6"
      style={{
        background: 'var(--bg-muted)',
        // borderTop: '1px solid var(--border)',
        // borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">

          {/* Left: Trusted people */}
          <div className="flex flex-col sm:flex-row items-center gap-3 select-none">
            <div className="flex -space-x-2.5">
              {avatarInitials.map((initials, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-purple-300 shadow-md bg-gradient-to-br from-purple-900 to-zinc-800"
                  style={{ borderColor: 'var(--bg-surface)' }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Trusted by 2,000+ professionals
              </p>
              <p className="text-[11px] text-purple-500 font-medium">★ ★ ★ ★ ★ &nbsp;4.9 / 5 Rating</p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-10 shrink-0" style={{ background: 'var(--border)' }} />

          {/* Right: Stats */}
          <div className="flex items-center gap-8 sm:gap-12">
            <div className="text-center space-y-0.5">
              <p className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                95%+
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold leading-tight" style={{ color: 'var(--text-muted)' }}>
                NFC-ready devices<br />in India
              </p>
            </div>

            <div className="w-px h-8 shrink-0" style={{ background: 'var(--border)' }} />

            <div className="text-center space-y-0.5">
              <p className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                &lt;10s
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold leading-tight" style={{ color: 'var(--text-muted)' }}>
                Handshake to<br />pipeline
              </p>
            </div>

            <div className="w-px h-8 shrink-0" style={{ background: 'var(--border)' }} />

            <div className="text-center space-y-0.5">
              <p className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                1,000+
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold leading-tight" style={{ color: 'var(--text-muted)' }}>
                Cards<br />Delivered
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

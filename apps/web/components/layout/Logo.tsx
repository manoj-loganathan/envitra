import Image from 'next/image'

interface LogoProps {
  forceWhite?: boolean
}

export function Logo({ forceWhite }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo.png"
        alt="Envitra logo"
        width={28}
        height={28}
        className="object-contain shrink-0"
        priority
      />
      <span
        className={`text-[17px] font-semibold tracking-[-0.04em] lowercase ${
          forceWhite ? 'text-white' : 'text-foreground'
        }`}
      >
        envitra
      </span>
    </div>
  )
}

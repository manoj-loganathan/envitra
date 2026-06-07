import Image from 'next/image'

export function Logo() {
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
      <span className="text-[17px] font-semibold tracking-[-0.04em] text-foreground lowercase">
        envitra
      </span>
    </div>
  )
}

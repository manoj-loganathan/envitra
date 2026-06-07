import { HeroSection } from '@/components/marketing/HeroSection'
import { PartnersBar } from '@/components/marketing/PartnersBar'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { WhoItIsFor } from '@/components/marketing/WhoItIsFor'
import { EcoImpact } from '@/components/marketing/EcoImpact'
import { Features } from '@/components/marketing/Features'
import { Pricing } from '@/components/marketing/Pricing'
import { FAQ } from '@/components/marketing/FAQ'
import { Testimonials } from '@/components/marketing/Testimonials'
import { CTASection } from '@/components/marketing/CTASection'

export default function Home() {
  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <HeroSection />
      <PartnersBar />
      <HowItWorks />
      <WhoItIsFor />
      <EcoImpact />
      <Features />
      <Pricing />
      <FAQ />
      <Testimonials />
      <CTASection />
    </div>
  )
}

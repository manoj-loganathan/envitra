import type { Metadata } from 'next'
import {
  LegalLayout,
  LegalSection,
  LegalCallout,
  LegalContactCard,
  type LegalSection as LSType,
} from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Terms of Service — Envitra',
  description:
    'Read the full Terms of Service for Envitra Technologies Pvt. Ltd. Understand your rights, responsibilities, and our policies when using the Envitra NFC smart card platform.',
}

const sections: LSType[] = [
  { id: 's1',  title: '1. Acceptance of Terms' },
  { id: 's2',  title: '2. Description of Service' },
  { id: 's3',  title: '3. Eligibility' },
  { id: 's4',  title: '4. Account Registration' },
  { id: 's5',  title: '5. Subscription & Payment' },
  { id: 's6',  title: '6. Acceptable Use' },
  { id: 's7',  title: '7. NFC Cards & Physical Goods' },
  { id: 's8',  title: '8. User-Generated Content' },
  { id: 's9',  title: '9. Third-Party Services' },
  { id: 's10', title: '10. Intellectual Property' },
  { id: 's11', title: '11. Data Ownership' },
  { id: 's12', title: '12. Service Availability' },
  { id: 's13', title: '13. Limitation of Liability' },
  { id: 's14', title: '14. Indemnification' },
  { id: 's15', title: '15. Termination' },
  { id: 's16', title: '16. Governing Law & Jurisdiction' },
  { id: 's17', title: '17. Changes to Terms' },
  { id: 's18', title: '18. Contact Us' },
]

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Everything you need to know about your rights and responsibilities when using the Envitra platform. Please read carefully before using our service."
      lastUpdated="June 2026"
      sections={sections}
    >
      {/* ─── Section 1 ─────────────────────────────────────────── */}
      <LegalSection id="s1" number="01" title="Acceptance of Terms">
        <p>
          By accessing or using the Envitra platform — including our website at{' '}
          <strong className="text-[var(--text-primary)]">envitra.in</strong>, dashboard, mobile interfaces, or any NFC-linked digital profile — you (&quot;User&quot;, &quot;you&quot;) agree to be bound by these Terms of Service (&quot;Terms&quot;) and all policies incorporated by reference, including our{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#3f5ce6] font-semibold hover:underline">Privacy Policy</a>.
        </p>
        <p className="mt-4">
          These Terms constitute a legally binding agreement between you and{' '}
          <strong className="text-[var(--text-primary)]">Envitra Technologies Pvt. Ltd.</strong>{' '}
          (&quot;Envitra&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), a company incorporated under the Companies Act 2013 in India. If you do not agree to these Terms, you must immediately stop using the Service.
        </p>
        <LegalCallout type="important" label="Important">
          By completing registration, placing an order, or tapping an Envitra NFC card, you confirm that you have read, understood, and accepted these Terms.
        </LegalCallout>
      </LegalSection>

      {/* ─── Section 2 ─────────────────────────────────────────── */}
      <LegalSection id="s2" number="02" title="Description of Service">
        <p>
          Envitra provides a software-as-a-service (&quot;SaaS&quot;) platform that enables individuals and businesses to create and manage digital identity profiles accessible via NFC-enabled smart cards, QR codes, and sharable links. The Service includes:
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2 marker:text-[var(--text-muted)]">
          <li>A personalised digital profile (name, title, contact details, links, and media)</li>
          <li>NFC smart card manufacturing, personalisation, and fulfilment across India</li>
          <li>A web dashboard to manage profiles, analytics, and order history</li>
          <li>Lead capture and analytics (tap counts, unique visitor tracking)</li>
          <li>Integration with third-party platforms via public APIs</li>
          <li>Virtual business card (vCard) generation and download</li>
        </ul>
        <p className="mt-4">
          Envitra reserves the right to modify, add, or discontinue any feature of the Service at any time with reasonable notice.
        </p>
      </LegalSection>

      {/* ─── Section 3 ─────────────────────────────────────────── */}
      <LegalSection id="s3" number="03" title="Eligibility">
        <p>
          To use the Envitra Service, you must:
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2 marker:text-[var(--text-muted)]">
          <li>Be at least <strong className="text-[var(--text-primary)]">18 years of age</strong></li>
          <li>Have the legal capacity to enter into a binding contract under the Indian Contract Act 1872</li>
          <li>Not be barred from receiving the Service under applicable Indian or international law</li>
          <li>Provide accurate and truthful registration information</li>
        </ul>
        <p className="mt-4">
          If you are registering on behalf of a company or organisation, you represent and warrant that you have authority to bind that entity to these Terms.
        </p>
      </LegalSection>

      {/* ─── Section 4 ─────────────────────────────────────────── */}
      <LegalSection id="s4" number="04" title="Account Registration">
        <p>
          To access the full features of the Envitra platform, you must create an account with a valid email address and password. You agree to:
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2 marker:text-[var(--text-muted)]">
          <li>Provide accurate, current, and complete information during registration</li>
          <li>Maintain and promptly update your account information</li>
          <li>Keep your login credentials confidential and not share them with others</li>
          <li>Accept responsibility for all activities that occur under your account</li>
          <li>Notify Envitra immediately at{' '}
            <a href="mailto:support@envitra.in" className="text-[#3f5ce6] hover:underline">support@envitra.in</a>{' '}
            of any suspected unauthorised access or security breach</li>
        </ul>
        <LegalCallout type="warning" label="Note">
          Envitra is not liable for any loss or damage arising from your failure to maintain the security of your account credentials.
        </LegalCallout>
        <p className="mt-4">
          We reserve the right to refuse registration or terminate accounts at our discretion, particularly in cases of misrepresentation or policy violations.
        </p>
      </LegalSection>

      {/* ─── Section 5 ─────────────────────────────────────────── */}
      <LegalSection id="s5" number="05" title="Subscription & Payment">
        <ol className="list-decimal pl-6 space-y-5 marker:text-[var(--text-muted)] marker:font-mono marker:text-sm">
          <li className="pl-1">
            <strong className="text-[var(--text-primary)]">Pricing.</strong>{' '}
            Envitra operates on both a one-time purchase and subscription basis. Pricing for NFC cards and optional plans is displayed at{' '}
            <a href="https://envitra.in" className="text-[#3f5ce6] hover:underline">envitra.in</a>. Prices are subject to change with 30 days&apos; notice to existing subscribers.
          </li>
          <li className="pl-1">
            <strong className="text-[var(--text-primary)]">Payment Processing.</strong>{' '}
            All payments are processed securely through Razorpay, an RBI-authorised payment aggregator. By making a purchase, you also agree to{' '}
            <a href="https://razorpay.com/terms/" target="_blank" rel="noopener noreferrer" className="text-[#3f5ce6] hover:underline">Razorpay&apos;s Terms of Service</a>.
          </li>
          <li className="pl-1">
            <strong className="text-[var(--text-primary)]">Taxes.</strong>{' '}
            All prices are exclusive of applicable Goods and Services Tax (GST). GST will be charged at the applicable rate as per Indian tax law and displayed at checkout.
          </li>
          <li className="pl-1">
            <strong className="text-[var(--text-primary)]">Refund Policy.</strong>{' '}
            Refunds for digital services are provided only within{' '}
            <strong className="text-[var(--text-primary)]">7 days</strong> of purchase if the profile has not been substantially configured or used. NFC cards that have already been shipped or personalised are{' '}
            <strong className="text-[var(--text-primary)]">non-refundable</strong>, unless defective on arrival.
          </li>
          <li className="pl-1">
            <strong className="text-[var(--text-primary)]">Defective Products.</strong>{' '}
            If your NFC card is defective or damaged in transit, contact us within 48 hours of delivery with photographic evidence. We will arrange a free replacement at no additional cost.
          </li>
          <li className="pl-1">
            <strong className="text-[var(--text-primary)]">Failed Payments.</strong>{' '}
            In the event of a payment failure, your order will be held and not dispatched until payment is confirmed. Envitra is not responsible for delays caused by payment failures.
          </li>
        </ol>
      </LegalSection>

      {/* ─── Section 6 ─────────────────────────────────────────── */}
      <LegalSection id="s6" number="06" title="Acceptable Use">
        <p className="mb-4">You agree <strong className="text-[var(--text-primary)]">NOT</strong> to use the Envitra platform to:</p>
        <ul className="list-disc pl-6 space-y-3 marker:text-[var(--text-muted)] mb-6">
          <li>Share false, misleading, defamatory, or fraudulent identity or contact information</li>
          <li>Impersonate any person, business, or entity</li>
          <li>Distribute spam, unsolicited communications, or phishing content through your digital profile links</li>
          <li>Upload or share content that is obscene, hateful, sexually explicit, or violates the rights of third parties</li>
          <li>Collect or harvest personal data of third parties without lawful basis in violation of the Digital Personal Data Protection (DPDP) Act 2023 or Information Technology Act 2000</li>
          <li>Engage in competitive intelligence, scraping, or reverse-engineering any part of the platform</li>
          <li>Resell, sublicense, or commercially exploit Envitra services without express written permission</li>
          <li>Upload malicious code, viruses, or any software intended to harm Envitra or its users</li>
          <li>Use the service in any way that violates applicable Indian law including but not limited to the IT Act 2000, DPDP Act 2023, Consumer Protection Act 2019, or Indian Penal Code</li>
        </ul>
        <LegalCallout type="important" label="Enforcement">
          Violation of these acceptable use policies may result in immediate suspension or permanent termination of your account without refund, and may be reported to appropriate law enforcement authorities.
        </LegalCallout>
      </LegalSection>

      {/* ─── Section 7 ─────────────────────────────────────────── */}
      <LegalSection id="s7" number="07" title="NFC Cards & Physical Goods">
        <ol className="list-decimal pl-6 space-y-5 marker:text-[var(--text-muted)] marker:font-mono marker:text-sm">
          <li className="pl-1">
            <strong className="text-[var(--text-primary)]">Ownership.</strong>{' '}
            Unless otherwise stated at the time of purchase, NFC smart cards purchased from Envitra are owned by you outright upon delivery and full payment.
          </li>
          <li className="pl-1">
            <strong className="text-[var(--text-primary)]">Personalisation.</strong>{' '}
            Cards are manufactured with your submitted design and contact details. Please ensure all details are correct before confirming your order. Envitra is not responsible for errors in user-submitted artwork or information.
          </li>
          <li className="pl-1">
            <strong className="text-[var(--text-primary)]">Shipping & Delivery.</strong>{' '}
            We ship across India using trusted courier partners. Estimated delivery times are 5–10 business days after production (approx. 3–7 working days). Delivery timelines are estimates and may vary due to courier delays, remote locations, or force majeure events.
          </li>
          <li className="pl-1">
            <strong className="text-[var(--text-primary)]">NFC Compatibility.</strong>{' '}
            Envitra NFC cards are compatible with NFC-enabled Android and iOS (iPhone 7 and later) smartphones. Envitra does not warrant that cards will function on all devices, operating systems, or third-party NFC readers. A QR code fallback is always printed on every card.
          </li>
          <li className="pl-1">
            <strong className="text-[var(--text-primary)]">Lost or Damaged Cards.</strong>{' '}
            If your card is lost or physically damaged after delivery, a replacement can be ordered at the then-current card price. Defective cards (manufacturing defects) will be replaced free of charge.
          </li>
          <li className="pl-1">
            <strong className="text-[var(--text-primary)]">Profile Continuity.</strong>{' '}
            Your digital profile (accessible via NFC tap or QR scan) remains active as long as your Envitra account is active. If you deactivate or delete your account, your profile URL will become inaccessible and your card will no longer function.
          </li>
        </ol>
      </LegalSection>

      {/* ─── Section 8 ─────────────────────────────────────────── */}
      <LegalSection id="s8" number="08" title="User-Generated Content">
        <p>
          The Envitra platform allows you to submit, upload, and display content including profile photos, company logos, contact details, links, and biographical information (&quot;User Content&quot;). By uploading User Content, you:
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2 marker:text-[var(--text-muted)]">
          <li>
            Grant Envitra a <strong className="text-[var(--text-primary)]">non-exclusive, royalty-free, worldwide licence</strong> to store, process, display, and distribute your User Content solely for the purpose of providing the Service.
          </li>
          <li>Represent that you own or have obtained all necessary rights and permissions to use and share the content.</li>
          <li>Confirm the content does not infringe any copyright, trademark, privacy, or other third-party rights.</li>
          <li>Accept that Envitra may remove any User Content that violates these Terms or applicable law without prior notice.</li>
        </ul>
        <p className="mt-4">
          You retain full ownership of your User Content. Envitra will never sell your personal profile content to third parties.
        </p>
      </LegalSection>

      {/* ─── Section 9 ─────────────────────────────────────────── */}
      <LegalSection id="s9" number="09" title="Third-Party Services">
        <p>
          The Envitra platform integrates with or links to third-party services to deliver certain features. Current integrations include:
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2 marker:text-[var(--text-muted)]">
          <li><strong className="text-[var(--text-primary)]">Razorpay</strong> — Payment processing</li>
          <li><strong className="text-[var(--text-primary)]">Supabase</strong> — Backend infrastructure, authentication, and database hosting</li>
          <li><strong className="text-[var(--text-primary)]">Courier Partners</strong> (Shiprocket, DTDC, Delhivery) — Fulfilment and delivery</li>
        </ul>
        <p className="mt-4">
          Your use of these third-party services is subject to their respective terms and privacy policies. Envitra is not responsible for the performance, availability, or data practices of any third-party service. We are not liable for disruptions caused by third-party service outages or policy changes.
        </p>
        <LegalCallout type="info" label="Note">
          Links on your digital profile to external websites are entirely your responsibility. Envitra does not endorse or control the content of any third-party websites linked from your profile.
        </LegalCallout>
      </LegalSection>

      {/* ─── Section 10 ──────────────────────────────────────────── */}
      <LegalSection id="s10" number="10" title="Intellectual Property">
        <p>
          All intellectual property rights in the Envitra platform — including software, algorithms, visual design, trademarks, brand assets, and documentation — are owned by{' '}
          <strong className="text-[var(--text-primary)]">Envitra Technologies Pvt. Ltd.</strong>{' '}
          or its licensors and are protected under Indian and international intellectual property law.
        </p>
        <p className="mt-4">
          You are granted a limited, non-exclusive, non-transferable, revocable licence to access and use the Service during your active account period for personal or internal business purposes only. You may not:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-2 marker:text-[var(--text-muted)]">
          <li>Copy, modify, or create derivative works of the platform or its source code</li>
          <li>Use Envitra's trademarks, logos, or brand assets without prior written consent</li>
          <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
          <li>Remove or obscure any proprietary notices in the Service</li>
        </ul>
        <p className="mt-4">
          The name <strong className="text-[var(--text-primary)]">&quot;Envitra&quot;</strong> and associated logos are trademarks of Envitra Technologies Pvt. Ltd. All rights reserved.
        </p>
      </LegalSection>

      {/* ─── Section 11 ──────────────────────────────────────────── */}
      <LegalSection id="s11" number="11" title="Data Ownership">
        <p>
          You own the personal data and content you provide to Envitra. Envitra acts as a{' '}
          <strong className="text-[var(--text-primary)]">data fiduciary</strong> as defined under the Digital Personal Data Protection (DPDP) Act 2023 with respect to your profile information.
        </p>
        <p className="mt-4">
          You may access, correct, or request deletion of your personal data at any time through your account dashboard or by contacting{' '}
          <a href="mailto:support@envitra.in" className="text-[#3f5ce6] hover:underline">support@envitra.in</a>. Refer to our{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#3f5ce6] hover:underline">Privacy Policy</a>{' '}
          for full details on how we collect, use, and protect your data.
        </p>
        <LegalCallout type="info" label="Data Portability">
          You may request an export of your profile data at any time by contacting our support team. We will fulfil such requests within 30 days.
        </LegalCallout>
      </LegalSection>

      {/* ─── Section 12 ──────────────────────────────────────────── */}
      <LegalSection id="s12" number="12" title="Service Availability">
        <p>
          Envitra aims to maintain high availability of its digital platform. However, we do not guarantee uninterrupted, error-free service. Downtime may occur due to:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-2 marker:text-[var(--text-muted)]">
          <li>Scheduled maintenance (notified 24 hours in advance via email where possible)</li>
          <li>Unplanned infrastructure issues or third-party provider outages</li>
          <li>Force majeure events including natural disasters, government actions, or cyberattacks</li>
        </ul>
        <p className="mt-4">
          Envitra shall not be held liable for any losses arising from service unavailability, including inaccessible NFC profile pages during downtime. We will make commercially reasonable efforts to restore service as quickly as possible.
        </p>
      </LegalSection>

      {/* ─── Section 13 ──────────────────────────────────────────── */}
      <LegalSection id="s13" number="13" title="Limitation of Liability">
        <p className="mb-6">
          To the maximum extent permitted by applicable law, Envitra&apos;s total aggregate liability to you for any claim arising out of or relating to these Terms or the Service shall not exceed the{' '}
          <strong className="text-[var(--text-primary)]">amount you paid to Envitra in the 3 months preceding the event giving rise to the claim</strong>.
        </p>
        <p className="font-semibold text-[var(--text-primary)] mb-4">Envitra is not liable for:</p>
        <ul className="list-disc pl-6 space-y-3 marker:text-[var(--text-muted)] bg-[var(--bg-muted)] p-6 rounded-2xl border border-[var(--border)]">
          <li>Any indirect, incidental, consequential, punitive, or special damages of any kind</li>
          <li>Loss of profits, revenue, business opportunities, or data</li>
          <li>Damages arising from reliance on profile information displayed by users</li>
          <li>Courier delays, lost shipments, or customs holds outside our control</li>
          <li>Third-party service failures (Razorpay, Supabase, courier partners)</li>
          <li>Unauthorised access to your account resulting from your failure to secure credentials</li>
          <li>Incompatibility of NFC cards with specific devices or operating systems</li>
        </ul>
        <p className="mt-4 text-sm">
          Nothing in these Terms limits liability for death, personal injury, fraud, or any other matter that cannot be excluded under applicable Indian law.
        </p>
      </LegalSection>

      {/* ─── Section 14 ──────────────────────────────────────────── */}
      <LegalSection id="s14" number="14" title="Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless Envitra Technologies Pvt. Ltd., its directors, officers, employees, contractors, and agents from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising from:
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2 marker:text-[var(--text-muted)]">
          <li>Your use or misuse of the Service</li>
          <li>Your violation of these Terms or any applicable law</li>
          <li>Content submitted through your account that infringes third-party rights</li>
          <li>Any false or misleading information in your digital profile</li>
          <li>Your violation of any third-party rights including intellectual property or privacy rights</li>
        </ul>
      </LegalSection>

      {/* ─── Section 15 ──────────────────────────────────────────── */}
      <LegalSection id="s15" number="15" title="Termination">
        <p>
          <strong className="text-[var(--text-primary)]">By You:</strong> You may terminate your account at any time by deleting it from your account settings or by writing to{' '}
          <a href="mailto:support@envitra.in" className="text-[#3f5ce6] hover:underline">support@envitra.in</a>. No refunds are provided for any unused portion after termination.
        </p>
        <p className="mt-4">
          <strong className="text-[var(--text-primary)]">By Envitra:</strong> We reserve the right to suspend or permanently terminate your account at any time with or without notice if we determine, in our sole discretion, that you have violated these Terms, engaged in fraudulent activity, or pose a risk to other users or the platform.
        </p>
        <p className="mt-4">
          <strong className="text-[var(--text-primary)]">Effect of Termination:</strong> Upon termination:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2 marker:text-[var(--text-muted)]">
          <li>Your profile URL will become inaccessible and your NFC card will stop functioning</li>
          <li>Your personal data will be retained for <strong className="text-[var(--text-primary)]">30 days</strong> to allow for account recovery, after which it will be permanently deleted</li>
          <li>Provisions of these Terms that by their nature should survive (Intellectual Property, Limitation of Liability, Governing Law) will continue to apply</li>
        </ul>
      </LegalSection>

      {/* ─── Section 16 ──────────────────────────────────────────── */}
      <LegalSection id="s16" number="16" title="Governing Law & Jurisdiction">
        <p>
          These Terms of Service are governed by and construed in accordance with the laws of the{' '}
          <strong className="text-[var(--text-primary)]">Republic of India</strong>, without regard to its conflict of law provisions.
        </p>
        <p className="mt-4">
          Any dispute, controversy, or claim arising out of or in connection with these Terms, or the breach, termination, or invalidity thereof, shall be subject to the{' '}
          <strong className="text-[var(--text-primary)]">exclusive jurisdiction of the courts located in Chennai, Tamil Nadu, India</strong>.
        </p>
        <LegalCallout type="info" label="Dispute Resolution">
          Before initiating any formal legal proceedings, we encourage you to contact our support team at{' '}
          <a href="mailto:support@envitra.in" className="text-[#3f5ce6] hover:underline">support@envitra.in</a>{' '}
          to resolve the matter amicably. We aim to respond to all complaints within 5 business days.
        </LegalCallout>
      </LegalSection>

      {/* ─── Section 17 ──────────────────────────────────────────── */}
      <LegalSection id="s17" number="17" title="Changes to Terms">
        <p>
          Envitra reserves the right to update or modify these Terms at any time. When we make material changes, we will:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-2 marker:text-[var(--text-muted)]">
          <li>Post the updated Terms on this page with a revised &quot;Last Updated&quot; date</li>
          <li>Send an email notification to your registered email address at least{' '}
            <strong className="text-[var(--text-primary)]">14 days before</strong> the changes take effect</li>
          <li>Display a notice within your dashboard for a period of 14 days</li>
        </ul>
        <p className="mt-4">
          Your continued use of the Service after the effective date of any changes constitutes your acceptance of the updated Terms. If you do not agree with the changes, you must stop using the Service and may request account deletion.
        </p>
      </LegalSection>

      {/* ─── Section 18 ──────────────────────────────────────────── */}
      <LegalSection id="s18" number="18" title="Contact Us">
        <p className="mb-6">
          For any questions, concerns, or requests related to these Terms of Service, please contact us:
        </p>
        <div className="space-y-4">
          <LegalContactCard
            title="General & Legal Inquiries"
            email="support@envitra.in"
            extra="We aim to respond within 2–5 business days."
          />
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm text-[var(--text-secondary)] space-y-1">
            <p className="font-semibold text-[var(--text-primary)] font-poppins mb-2">Registered Office</p>
            <p>Envitra Technologies Pvt. Ltd.</p>
            <p>India</p>
            <p className="mt-2 text-[var(--text-muted)]">CIN: Available on request</p>
          </div>
        </div>
      </LegalSection>
    </LegalLayout>
  )
}

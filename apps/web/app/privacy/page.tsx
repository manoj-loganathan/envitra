import type { Metadata } from 'next'
import {
  LegalLayout,
  LegalSection,
  LegalCallout,
  LegalContactCard,
  type LegalSection as LSType,
} from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy — Envitra',
  description:
    'Read the Privacy Policy of Envitra Technologies Pvt. Ltd. Learn how we collect, use, store, and protect your personal data in compliance with the DPDP Act 2023 and IT Act 2000.',
}

const sections: LSType[] = [
  { id: 's1',  title: '1. Information We Collect' },
  { id: 's2',  title: '2. How We Use Your Information' },
  { id: 's3',  title: '3. Legal Basis for Processing' },
  { id: 's4',  title: '4. Data Sharing & Third Parties' },
  { id: 's5',  title: '5. NFC Card & Tap Data' },
  { id: 's6',  title: '6. Cookies & Tracking' },
  { id: 's7',  title: '7. Data Retention' },
  { id: 's8',  title: '8. Data Security' },
  { id: 's9',  title: '9. Your Rights' },
  { id: 's10', title: '10. Children\'s Privacy' },
  { id: 's11', title: '11. Cross-Border Transfers' },
  { id: 's12', title: '12. Changes to This Policy' },
  { id: 's13', title: '13. Contact & Grievance Officer' },
]

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="We believe privacy is a right, not a feature. This policy explains exactly how Envitra collects, uses, and protects your personal information — written in plain language."
      lastUpdated="June 2026"
      sections={sections}
    >
      {/* ─── Section 1 ─────────────────────────────────────────── */}
      <LegalSection id="s1" number="01" title="Information We Collect">
        <p>
          When you use the Envitra platform, we collect different categories of personal data depending on how you interact with us:
        </p>

        <h3 className="text-base font-semibold text-[var(--text-primary)] mt-6 mb-3 font-poppins">
          A. Information You Provide Directly
        </h3>
        <ul className="list-disc pl-6 space-y-2 marker:text-[var(--text-muted)]">
          <li><strong className="text-[var(--text-primary)]">Account data:</strong> Name, email address, password (hashed), phone number</li>
          <li><strong className="text-[var(--text-primary)]">Profile data:</strong> Job title, company name, bio, profile photo, social media links, website URLs</li>
          <li><strong className="text-[var(--text-primary)]">Order data:</strong> Shipping address, card design preferences, order history</li>
          <li><strong className="text-[var(--text-primary)]">Payment data:</strong> Transaction identifiers (we do not store raw card numbers — all payment data is handled by Razorpay)</li>
          <li><strong className="text-[var(--text-primary)]">Communications:</strong> Support messages, feedback, or emails you send us</li>
        </ul>

        <h3 className="text-base font-semibold text-[var(--text-primary)] mt-6 mb-3 font-poppins">
          B. Information Collected Automatically
        </h3>
        <ul className="list-disc pl-6 space-y-2 marker:text-[var(--text-muted)]">
          <li><strong className="text-[var(--text-primary)]">Device & browser data:</strong> IP address, browser type, operating system, device type</li>
          <li><strong className="text-[var(--text-primary)]">Usage analytics:</strong> Pages visited, time on site, dashboard interactions</li>
          <li><strong className="text-[var(--text-primary)]">NFC / QR tap data:</strong> Timestamp, approximate location (city-level), device type of the person tapping your card (see Section 5)</li>
          <li><strong className="text-[var(--text-primary)]">Cookies & local storage:</strong> Session tokens, preference settings, consent flags (see Section 6)</li>
        </ul>

        <h3 className="text-base font-semibold text-[var(--text-primary)] mt-6 mb-3 font-poppins">
          C. Information from Third Parties
        </h3>
        <ul className="list-disc pl-6 space-y-2 marker:text-[var(--text-muted)]">
          <li><strong className="text-[var(--text-primary)]">Courier partners:</strong> Delivery status and recipient confirmation shared by our logistics partners for order fulfilment</li>
        </ul>
      </LegalSection>

      {/* ─── Section 2 ─────────────────────────────────────────── */}
      <LegalSection id="s2" number="02" title="How We Use Your Information">
        <p>We use the data we collect for the following purposes:</p>
        <ul className="list-disc pl-6 mt-4 space-y-3 marker:text-[var(--text-muted)]">
          <li><strong className="text-[var(--text-primary)]">Service delivery:</strong> Creating and maintaining your digital profile, fulfilling NFC card orders, and enabling NFC/QR tap functionality</li>
          <li><strong className="text-[var(--text-primary)]">Account management:</strong> Authentication, security, password recovery, and session management</li>
          <li><strong className="text-[var(--text-primary)]">Analytics &amp; insights:</strong> Providing you with tap count statistics, visitor demographics, and profile performance data via your dashboard</li>
          <li><strong className="text-[var(--text-primary)]">Order fulfilment:</strong> Processing payments, dispatching cards, and providing delivery updates</li>
          <li><strong className="text-[var(--text-primary)]">Communication:</strong> Sending order confirmations, shipping updates, product announcements, and support responses</li>
          <li><strong className="text-[var(--text-primary)]">Legal compliance:</strong> Meeting our obligations under Indian law including GST compliance and responding to lawful requests from authorities</li>
          <li><strong className="text-[var(--text-primary)]">Product improvement:</strong> Analysing aggregate usage patterns to improve platform features and user experience (using anonymised data only)</li>
          <li><strong className="text-[var(--text-primary)]">Fraud prevention:</strong> Detecting and preventing fraudulent orders, account takeovers, and abuse of our platform</li>
        </ul>
        <LegalCallout type="info" label="No Selling of Data">
          Envitra does not sell, rent, or trade your personal data to any third party for their own marketing purposes. Full stop.
        </LegalCallout>
      </LegalSection>

      {/* ─── Section 3 ─────────────────────────────────────────── */}
      <LegalSection id="s3" number="03" title="Legal Basis for Processing">
        <p>
          Envitra processes your personal data in compliance with the{' '}
          <strong className="text-[var(--text-primary)]">Digital Personal Data Protection (DPDP) Act 2023</strong>{' '}
          and the{' '}
          <strong className="text-[var(--text-primary)]">Information Technology Act 2000</strong>{' '}
          and its rules. Our legal bases for processing are:
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-3 marker:text-[var(--text-muted)]">
          <li>
            <strong className="text-[var(--text-primary)]">Consent:</strong>{' '}
            For optional features such as marketing communications and cookies. You may withdraw consent at any time.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Contractual necessity:</strong>{' '}
            To fulfil your order for NFC cards and deliver the core digital profile service you registered for.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Legal obligation:</strong>{' '}
            To comply with applicable Indian laws including GST filing, fraud prevention, and responding to lawful government requests.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Legitimate interests:</strong>{' '}
            For platform security, fraud detection, and aggregate analytics — where our interests do not override your rights.
          </li>
        </ul>
      </LegalSection>

      {/* ─── Section 4 ─────────────────────────────────────────── */}
      <LegalSection id="s4" number="04" title="Data Sharing & Third Parties">
        <p>
          We share your personal data with a limited set of trusted third parties only as necessary to operate our service:
        </p>
        <div className="mt-4 space-y-4">
          {[
            {
              name: 'Razorpay',
              purpose: 'Payment processing — they receive your transaction data to process payments.',
              link: 'https://razorpay.com/privacy/',
            },
            {
              name: 'Supabase',
              purpose: 'Backend infrastructure — our database, file storage, and authentication are hosted on Supabase (AWS ap-south-1 region).',
              link: 'https://supabase.com/privacy',
            },
            {
              name: 'Courier Partners',
              purpose: 'Order fulfilment — your name, phone, and shipping address are shared with our courier partners (Shiprocket/Delhivery) for delivery.',
              link: null,
            },
          ].map((partner) => (
            <div key={partner.name} className="flex gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
              <div className="w-2 h-2 rounded-full bg-[#3f5ce6] shrink-0 mt-2.5" />
              <div>
                <p className="text-[var(--text-primary)] font-semibold text-sm font-poppins">{partner.name}</p>
                <p className="text-[var(--text-secondary)] text-sm mt-0.5">{partner.purpose}</p>
                {partner.link && (
                  <a href={partner.link} target="_blank" rel="noopener noreferrer" className="text-[#3f5ce6] text-xs hover:underline mt-1 inline-block">
                    Privacy Policy →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5">
          We may also disclose your information where required by law — for example, in response to a court order, summons, or lawful request from a government authority in India.
        </p>
      </LegalSection>

      {/* ─── Section 5 ─────────────────────────────────────────── */}
      <LegalSection id="s5" number="05" title="NFC Card & Tap Data">
        <p>
          When someone taps your Envitra NFC card or scans your QR code to view your profile, we automatically collect limited technical data to power your analytics dashboard:
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2 marker:text-[var(--text-muted)]">
          <li>Timestamp of the tap/scan</li>
          <li>Device type and operating system (e.g., &quot;Android&quot;, &quot;iPhone&quot;)</li>
          <li>Approximate city-level location derived from IP address (not GPS — precise location is never collected)</li>
          <li>Referral source (NFC tap vs. QR scan vs. direct link)</li>
        </ul>
        <LegalCallout type="important" label="No Personal Data of Tappers">
          We do not collect the name, email, phone number, or any personally identifying information of people who tap your NFC card or scan your QR code — unless they choose to interact with a contact form you have set up on your profile.
        </LegalCallout>
        <p className="mt-4">
          Tap analytics are accessible only to the cardholder (you) through your dashboard and are not shared with any third parties.
        </p>
      </LegalSection>

      {/* ─── Section 6 ─────────────────────────────────────────── */}
      <LegalSection id="s6" number="06" title="Cookies & Tracking">
        <p>
          Envitra uses cookies and similar tracking technologies on our website and dashboard for the following purposes:
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 pr-4 text-[var(--text-primary)] font-semibold font-poppins">Type</th>
                <th className="text-left py-3 pr-4 text-[var(--text-primary)] font-semibold font-poppins">Purpose</th>
                <th className="text-left py-3 text-[var(--text-primary)] font-semibold font-poppins">Consent Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr>
                <td className="py-3 pr-4 text-[var(--text-secondary)] font-medium">Essential</td>
                <td className="py-3 pr-4 text-[var(--text-muted)]">Authentication session tokens, security, CSRF protection</td>
                <td className="py-3 text-emerald-500 font-medium">No (required)</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-[var(--text-secondary)] font-medium">Functional</td>
                <td className="py-3 pr-4 text-[var(--text-muted)]">Remembering your theme preference (dark/light mode)</td>
                <td className="py-3 text-emerald-500 font-medium">No</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-[var(--text-secondary)] font-medium">Analytics</td>
                <td className="py-3 pr-4 text-[var(--text-muted)]">Aggregate page view and feature usage statistics (anonymised)</td>
                <td className="py-3 text-amber-500 font-medium">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          You can manage your cookie preferences at any time by clicking &quot;Decline All&quot; in the cookie consent banner or by clearing your browser cookies. Note that disabling essential cookies will affect your ability to log in and use the platform.
        </p>
      </LegalSection>

      {/* ─── Section 7 ─────────────────────────────────────────── */}
      <LegalSection id="s7" number="07" title="Data Retention">
        <p>We retain your personal data for different periods depending on the type of data and the purpose for which it was collected:</p>
        <ul className="list-disc pl-6 mt-4 space-y-3 marker:text-[var(--text-muted)]">
          <li>
            <strong className="text-[var(--text-primary)]">Account data:</strong>{' '}
            Retained for as long as your account is active, plus 30 days after deletion for recovery purposes.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Order & transaction records:</strong>{' '}
            Retained for 7 years as required under the Companies Act 2013 and GST regulations.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Tap analytics data:</strong>{' '}
            Retained for 24 months from the date of collection, after which it is aggregated and anonymised.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Support communications:</strong>{' '}
            Retained for 2 years after the resolution of the support request.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Marketing consent records:</strong>{' '}
            Retained until you withdraw consent or delete your account.
          </li>
        </ul>
        <p className="mt-4">
          Upon expiry of the applicable retention period, data is securely deleted or irreversibly anonymised.
        </p>
      </LegalSection>

      {/* ─── Section 8 ─────────────────────────────────────────── */}
      <LegalSection id="s8" number="08" title="Data Security">
        <p>
          Envitra implements industry-standard security measures to protect your personal data from unauthorised access, disclosure, alteration, or destruction:
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2 marker:text-[var(--text-muted)]">
          <li><strong className="text-[var(--text-primary)]">Encryption in transit:</strong> All data transmitted between your browser and our servers is encrypted using TLS 1.2+ (HTTPS)</li>
          <li><strong className="text-[var(--text-primary)]">Encryption at rest:</strong> Sensitive data is encrypted at rest in our database infrastructure</li>
          <li><strong className="text-[var(--text-primary)]">Password security:</strong> Passwords are hashed using bcrypt and are never stored in plaintext</li>
          <li><strong className="text-[var(--text-primary)]">Access controls:</strong> Strict role-based access controls limit employee access to personal data</li>
          <li><strong className="text-[var(--text-primary)]">Supabase Row-Level Security:</strong> Database access is restricted at the row level — you can only access your own data</li>
          <li><strong className="text-[var(--text-primary)]">Regular security reviews:</strong> We conduct periodic security assessments of our infrastructure</li>
        </ul>
        <LegalCallout type="warning" label="No Guarantee">
          While we take extensive precautions, no method of electronic storage or transmission is 100% secure. In the unlikely event of a data breach affecting your personal data, we will notify you within 72 hours as required by applicable Indian law.
        </LegalCallout>
      </LegalSection>

      {/* ─── Section 9 ─────────────────────────────────────────── */}
      <LegalSection id="s9" number="09" title="Your Rights">
        <p>
          Under the Digital Personal Data Protection (DPDP) Act 2023 and other applicable Indian law, you have the following rights with respect to your personal data:
        </p>
        <div className="mt-4 space-y-4">
          {[
            { right: 'Right to Access', desc: 'Request a copy of all personal data we hold about you.' },
            { right: 'Right to Correction', desc: 'Request correction of inaccurate or incomplete personal data.' },
            { right: 'Right to Erasure', desc: 'Request deletion of your personal data, subject to legal retention requirements.' },
            { right: 'Right to Data Portability', desc: 'Request your profile data in a machine-readable format (CSV or JSON).' },
            { right: 'Right to Withdraw Consent', desc: 'Withdraw your consent for optional processing (e.g. marketing emails) at any time.' },
            { right: 'Right to Raise Grievances', desc: 'File a complaint with our Grievance Officer (see Section 13) or with the Data Protection Board of India once operational.' },
          ].map(({ right, desc }) => (
            <div key={right} className="flex gap-4 items-start p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
              <div className="mt-1 w-6 h-6 rounded-full bg-[var(--bg-purple-tint)] border border-[var(--border-purple)] flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-[#3f5ce6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-[var(--text-primary)] font-semibold text-sm font-poppins">{right}</p>
                <p className="text-[var(--text-secondary)] text-sm mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5">
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:support@envitra.in" className="text-[#3f5ce6] hover:underline">support@envitra.in</a>. We will respond within{' '}
          <strong className="text-[var(--text-primary)]">30 days</strong> of receiving your request.
        </p>
      </LegalSection>

      {/* ─── Section 10 ──────────────────────────────────────────── */}
      <LegalSection id="s10" number="10" title="Children's Privacy">
        <p>
          The Envitra Service is intended for use by individuals who are at least{' '}
          <strong className="text-[var(--text-primary)]">18 years of age</strong>. We do not knowingly collect, store, or process personal data of children under 18.
        </p>
        <p className="mt-4">
          If you believe that a child under 18 has provided personal data to Envitra without parental consent, please contact us immediately at{' '}
          <a href="mailto:support@envitra.in" className="text-[#3f5ce6] hover:underline">support@envitra.in</a>{' '}
          and we will promptly investigate and delete the relevant data.
        </p>
      </LegalSection>

      {/* ─── Section 11 ──────────────────────────────────────────── */}
      <LegalSection id="s11" number="11" title="Cross-Border Data Transfers">
        <p>
          Envitra&apos;s primary infrastructure is hosted in India (Supabase on AWS ap-south-1, Mumbai). Some of our third-party service providers may process data outside of India (for example, Razorpay&apos;s global infrastructure).
        </p>
        <p className="mt-4">
          When your data is transferred outside India, we ensure adequate safeguards are in place through:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-2 marker:text-[var(--text-muted)]">
          <li>Contractual data processing agreements with all sub-processors</li>
          <li>Use of providers who comply with applicable international data protection standards</li>
          <li>Limiting cross-border transfers to the minimum necessary for service delivery</li>
        </ul>
        <p className="mt-4">
          As the DPDP Act 2023 notification framework for cross-border transfers is finalised by the Government of India, we will update our practices accordingly to ensure ongoing compliance.
        </p>
      </LegalSection>

      {/* ─── Section 12 ──────────────────────────────────────────── */}
      <LegalSection id="s12" number="12" title="Changes to This Policy">
        <p>
          We may update this Privacy Policy periodically to reflect changes in our data practices or applicable law. When we make significant changes, we will:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-2 marker:text-[var(--text-muted)]">
          <li>Update the &quot;Last Updated&quot; date at the top of this page</li>
          <li>Send an email notification to your registered email address</li>
          <li>Display a prominent notice on our website and dashboard</li>
        </ul>
        <p className="mt-4">
          We encourage you to review this Privacy Policy periodically. Your continued use of the Service after the effective date of changes constitutes your acknowledgement of the updated policy.
        </p>
      </LegalSection>

      {/* ─── Section 13 ──────────────────────────────────────────── */}
      <LegalSection id="s13" number="13" title="Contact & Grievance Officer">
        <p className="mb-6">
          In accordance with the{' '}
          <strong className="text-[var(--text-primary)]">Information Technology Act 2000</strong>{' '}
          and its rules, and the{' '}
          <strong className="text-[var(--text-primary)]">Digital Personal Data Protection Act 2023</strong>,{' '}
          Envitra has appointed a Grievance Officer to address complaints and queries related to the processing of your personal data.
        </p>
        <div className="space-y-4">
          <LegalContactCard
            title="Grievance Officer / Data Protection Contact"
            email="support@envitra.in"
            extra="Envitra Technologies Pvt. Ltd., India — Response within 5 business days"
          />
          <LegalContactCard
            title="General Support"
            email="support@envitra.in"
            extra="For account issues, order queries, and general questions. Response within 2–3 business days."
          />
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm text-[var(--text-secondary)]">
            <p className="font-semibold text-[var(--text-primary)] font-poppins mb-2">Registered Office</p>
            <p>Envitra Technologies Pvt. Ltd.</p>
            <p>India</p>
            <p className="mt-3 text-[var(--text-muted)] text-xs">
              You also have the right to lodge a complaint with the{' '}
              <strong className="text-[var(--text-secondary)]">Data Protection Board of India</strong>{' '}
              once it becomes operational under the DPDP Act 2023, if you believe your data rights have been violated.
            </p>
          </div>
        </div>
      </LegalSection>
    </LegalLayout>
  )
}

import { motion } from 'framer-motion';
import { colors, typography } from '../styles/tokens';
import AnimatedSection from '../components/ui/AnimatedSection';
import SectionLabel from '../components/ui/SectionLabel';

const sections = [
  {
    number: '01',
    label: 'Services',
    heading: 'What Your Company provides',
    content: [
      {
        subtitle: 'Scope of Service',
        text: 'Your Company provides residential and commercial cleaning services in Your City, ST, and surrounding communities. The specific tasks included in each clean are outlined at the time of booking and may vary by service type (Standard, Luxe Clean, Move-In/Out, Business Services).',
      },
      {
        subtitle: 'Service Standards',
        text: 'We are committed to delivering a consistent, high-quality clean on every visit. Our team arrives with all necessary supplies and equipment. If you have specific requirements or preferences, please communicate these at the time of booking or prior to your appointment.',
      },
      {
        subtitle: 'Out-of-Scope Work',
        text: 'Your Company cleaners are not responsible for tasks outside the agreed scope, including but not limited to: exterior cleaning, biohazard removal, pest control, laundry, or organization services unless explicitly included in your booking.',
      },
    ],
  },
  {
    number: '02',
    label: 'Booking & Scheduling',
    heading: 'How bookings work',
    content: [
      {
        subtitle: 'Booking Confirmation',
        text: 'A booking is confirmed once you receive a written confirmation (email or SMS) from Your Company. Prices and scope confirmed at booking are binding for that appointment.',
      },
      {
        subtitle: 'Access to Your Property',
        text: 'You are responsible for providing safe access to your property at the scheduled time. If our team is unable to access your home, the appointment may be treated as a late cancellation and a fee may apply.',
      },
      {
        subtitle: 'Rescheduling',
        text: 'You may reschedule your appointment at no charge with at least 48 hours\' notice. Rescheduling requests made within 48 hours of the appointment are subject to availability and may incur a rescheduling fee.',
      },
    ],
  },
  {
    number: '03',
    label: 'Cancellation Policy',
    heading: 'Cancellations and no-shows',
    content: [
      {
        subtitle: '24-Hour Notice Required',
        text: 'Cancellations must be made at least 24 hours before your scheduled appointment. Cancellations made with less than 24 hours\' notice will incur a cancellation fee of 50% of the scheduled service price.',
      },
      {
        subtitle: 'No-Shows',
        text: 'If our team arrives and is unable to access your property without prior notice, the full service fee will be charged.',
      },
      {
        subtitle: 'Recurring Bookings',
        text: 'For recurring service agreements, the cancellation policy applies to each individual appointment. Termination of a recurring arrangement requires 7 days\' written notice.',
      },
      {
        subtitle: 'Your Company Cancellations',
        text: 'In the rare event that Your Company must cancel or reschedule your appointment, we will provide as much notice as possible and work with you to find a suitable alternative time at no additional cost to you.',
      },
    ],
  },
  {
    number: '04',
    label: 'Pricing & Payment',
    heading: 'Fees and payment terms',
    content: [
      {
        subtitle: 'Pricing',
        text: 'Service prices are quoted at the time of booking based on the service type, home size, and any add-ons selected. All prices are in Canadian dollars and include applicable taxes.',
      },
      {
        subtitle: 'Payment',
        text: 'Payment is collected at the time of booking via our secure online checkout, powered by Stripe. We accept major credit and debit cards. We do not accept cash or cheques.',
      },
      {
        subtitle: 'Promo Codes & Discounts',
        text: 'Promotional codes are valid for a single use unless otherwise stated, cannot be combined with other offers, and must be applied at the time of booking. No retroactive discounts will be applied.',
      },
      {
        subtitle: 'Price Changes',
        text: 'Your Company reserves the right to adjust pricing at any time. Price changes will not affect already-confirmed bookings.',
      },
    ],
  },
  {
    number: '05',
    label: 'Satisfaction Guarantee',
    heading: 'Our commitment to you',
    content: [
      {
        subtitle: 'Re-Clean Policy',
        text: 'If you are not satisfied with your clean, contact us within 24 hours of your appointment and we will return to address any missed areas at no additional charge. This re-clean guarantee applies once per booking.',
      },
      {
        subtitle: 'Limitations',
        text: 'The satisfaction guarantee does not apply to: dissatisfaction arising from pre-existing conditions, scope items not included in the original booking, or damage not caused by our team.',
      },
      {
        subtitle: 'Refunds',
        text: 'Refunds are issued at Your Company\'s discretion and only where a re-clean is not feasible. If a refund is warranted, it will be processed to your original payment method within 5–10 business days.',
      },
    ],
  },
  {
    number: '06',
    label: 'Liability',
    heading: 'Damages and liability',
    content: [
      {
        subtitle: 'Property Damage',
        text: 'Our team takes great care in your home. In the unlikely event that damage occurs during a cleaning, please notify us within 24 hours with photos. We will investigate and, where our team is at fault, we will arrange repair or reasonable compensation.',
      },
      {
        subtitle: 'Limitation of Liability',
        text: 'Your Company\'s total liability for any claim is limited to the amount paid for the specific service during which the issue arose. We are not liable for indirect, consequential, or incidental damages.',
      },
      {
        subtitle: 'Pre-Existing Conditions',
        text: 'Your Company is not responsible for damage to items that are fragile, improperly assembled, or in pre-existing states of disrepair. Please inform us of any fragile or high-value items prior to your appointment.',
      },
      {
        subtitle: 'Insurance',
        text: 'Your Company carries general liability insurance. Certificates of insurance are available upon request.',
      },
    ],
  },
  {
    number: '07',
    label: 'Governing Law',
    heading: 'Legal & contact',
    content: [
      {
        subtitle: 'Jurisdiction',
        text: 'These Terms of Service are governed by the laws of the Province of ST and the applicable laws of Canada. Any disputes will be resolved in Your City, ST.',
      },
      {
        subtitle: 'Updates to These Terms',
        text: 'Your Company reserves the right to update these Terms of Service at any time. Updated terms will be posted on this page with a revised effective date. Continued use of our services constitutes acceptance.',
      },
      {
        subtitle: 'Contact',
        text: 'Questions about these terms? Contact us at hello@example.com or write to Your Company, Your City, ST, Canada.',
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <div>
      {/* Hero */}
      <section
        style={{
          minHeight: '40vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: colors.deepSage,
          padding: '120px 24px 60px',
        }}
      >
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              ...typography.sectionLabel,
              color: `${colors.cream}80`,
              marginBottom: '16px',
            }}
          >
            Legal
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ ...typography.h1, color: colors.cream }}
          >
            Terms of Service
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              ...typography.body,
              color: `${colors.cream}cc`,
              maxWidth: '500px',
              margin: '16px auto 0',
              fontSize: '16px',
            }}
          >
            Effective date: May 1, 2025. By booking a service with Your Company, you agree to the following terms.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section style={{ background: colors.white, padding: '96px 24px' }}>
        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '72px',
          }}
        >
          {sections.map((section, idx) => (
            <AnimatedSection key={section.number} delay={idx * 0.05}>
              <SectionLabel number={section.number} text={section.label} />
              <h2
                style={{
                  ...typography.h2,
                  color: colors.charcoal,
                  marginBottom: '32px',
                  fontSize: 'clamp(22px, 2.5vw, 30px)',
                }}
              >
                {section.heading}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {section.content.map((item) => (
                  <div key={item.subtitle}>
                    <h3
                      style={{
                        ...typography.button,
                        fontSize: '13px',
                        color: colors.charcoal,
                        marginBottom: '8px',
                      }}
                    >
                      {item.subtitle}
                    </h3>
                    <p
                      style={{
                        ...typography.body,
                        color: colors.warmGray,
                        fontSize: '17px',
                        lineHeight: 1.7,
                      }}
                    >
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>
    </div>
  );
}

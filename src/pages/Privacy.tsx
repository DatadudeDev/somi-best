import { motion } from 'framer-motion';
import { colors, typography } from '../styles/tokens';
import AnimatedSection from '../components/ui/AnimatedSection';
import SectionLabel from '../components/ui/SectionLabel';

const sections = [
  {
    number: '01',
    label: 'Information We Collect',
    heading: 'What we collect and why',
    content: [
      {
        subtitle: 'Booking & Account Information',
        text: 'When you book a cleaning service, we collect your name, email address, phone number, and service address. This information is required to schedule, confirm, and carry out your cleaning.',
      },
      {
        subtitle: 'Payment Information',
        text: 'Payments are processed securely through Stripe. We never store your full credit card number. Stripe retains payment details in accordance with their own Privacy Policy and PCI-DSS compliance standards.',
      },
      {
        subtitle: 'Communication Data',
        text: 'When you contact us via our website forms, email, or phone, we retain that correspondence to respond to your inquiry and improve our service.',
      },
      {
        subtitle: 'Usage Data',
        text: 'We collect basic analytics data (pages visited, session duration, referral source) to understand how people use our website. This data is aggregated and not linked to individual identities.',
      },
    ],
  },
  {
    number: '02',
    label: 'How We Use Your Information',
    heading: 'What your data is used for',
    content: [
      {
        subtitle: 'Service Delivery',
        text: 'We use your contact and address information to schedule cleanings, dispatch our team, and communicate updates, reminders, and confirmations about your service.',
      },
      {
        subtitle: 'Payments & Billing',
        text: 'Your payment information is used solely to process transactions for services rendered. We do not use your payment data for any other purpose.',
      },
      {
        subtitle: 'Service Improvement',
        text: 'We may use anonymized feedback and usage data to improve our services, pricing, and website experience.',
      },
      {
        subtitle: 'Marketing Communications',
        text: 'With your permission, we may send you occasional emails about promotions, seasonal offers, or service updates. You can unsubscribe at any time by clicking the link in any email.',
      },
    ],
  },
  {
    number: '03',
    label: 'Data Retention',
    heading: 'How long we keep your data',
    content: [
      {
        subtitle: 'Active Customers',
        text: 'We retain your personal information for as long as you are an active customer and for a reasonable period thereafter, to accommodate service follow-up, invoicing, and dispute resolution.',
      },
      {
        subtitle: 'Deletion Requests',
        text: 'You may request deletion of your personal data at any time by emailing hello@example.com. We will action your request within 30 days, except where we are required by law to retain certain records.',
      },
      {
        subtitle: 'Service Records',
        text: 'Booking and transaction records may be retained for up to 7 years for accounting and tax compliance purposes, as required under Canadian law.',
      },
    ],
  },
  {
    number: '04',
    label: 'Cookies & Tracking',
    heading: 'Cookies and similar technologies',
    content: [
      {
        subtitle: 'Essential Cookies',
        text: 'Our website uses essential cookies to maintain your session and enable core functionality such as the booking flow. These cannot be disabled without impairing the site.',
      },
      {
        subtitle: 'Analytics Cookies',
        text: 'We use analytics cookies to understand aggregate traffic patterns. These cookies do not identify you personally. You can opt out by using your browser\'s Do Not Track setting or a privacy extension.',
      },
      {
        subtitle: 'No Third-Party Advertising',
        text: 'We do not use advertising trackers, remarketing pixels, or sell your data to third parties for advertising purposes.',
      },
    ],
  },
  {
    number: '05',
    label: 'Your Rights',
    heading: 'Your privacy rights',
    content: [
      {
        subtitle: 'Access & Portability',
        text: 'You have the right to request a copy of the personal information we hold about you. We will provide this in a readable format within 30 days of your request.',
      },
      {
        subtitle: 'Correction',
        text: 'If any information we hold is inaccurate, you have the right to request a correction. Simply email us at hello@example.com.',
      },
      {
        subtitle: 'Withdrawal of Consent',
        text: 'Where we process your data based on consent (e.g., marketing emails), you may withdraw that consent at any time without affecting the lawfulness of prior processing.',
      },
      {
        subtitle: 'PIPEDA Compliance',
        text: 'Your Company operates in Your City, ST, Canada, and complies with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy legislation.',
      },
    ],
  },
  {
    number: '06',
    label: 'Contact & Questions',
    heading: 'Questions about privacy',
    content: [
      {
        subtitle: 'Reach Us',
        text: 'If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your personal information, please contact us at hello@example.com or by mail at Your Company, Your City, ST.',
      },
      {
        subtitle: 'Policy Updates',
        text: 'We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will post the updated policy on this page with a revised effective date. Continued use of our services after such changes constitutes acceptance of the updated policy.',
      },
    ],
  },
];

export default function PrivacyPage() {
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
            Privacy Policy
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
            Effective date: May 1, 2025. We are committed to protecting your privacy and handling your personal information with care.
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

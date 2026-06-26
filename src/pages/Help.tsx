import { useState } from 'react';
import { Link } from 'react-router-dom';
import { site } from '../config/site';
import { useSEO } from '../lib/useSEO';
import { colors, fonts } from '../styles/tokens';
import AnimatedSection from '../components/ui/AnimatedSection';

interface FAQItem {
  q: string;
  a: string;
}

const FAQ_SECTIONS: { title: string; items: FAQItem[] }[] = [
  {
    title: 'Booking & Scheduling',
    items: [
      {
        q: 'How do I book a recovery session?',
        a: `Book online at ${site.domain.replace('https://', '')}/book in under 2 minutes. Select your protocol, athlete tier, and preferred time — we'll confirm via text.`,
      },
      {
        q: 'Can I set up recurring recovery programs?',
        a: 'Yes. Weekly and bi-weekly programs with discounted rates — ideal for in-season athletes or heavy training blocks. Set it up during booking or contact us.',
      },
      {
        q: 'How far in advance do I need to book?',
        a: 'We recommend booking 24–48 hours ahead. Same-day slots open when available — check real-time availability on our booking page.',
      },
      {
        q: 'Can I request a specific therapist?',
        a: 'For recurring clients we assign a dedicated recovery specialist. Tell us your preference and we\'ll match you with the right therapist.',
      },
    ],
  },
  {
    title: 'Pricing & Payment',
    items: [
      {
        q: 'How is pricing calculated?',
        a: 'Pricing is based on your protocol (Foundation, Performance, Extended, or Ultimate) and athlete tier. You see the exact price before you confirm — no surprises.',
      },
      {
        q: 'Do you offer program discounts?',
        a: 'Yes — recurring weekly and bi-weekly programs receive discounted rates. Team and corporate packages are quoted separately.',
      },
      {
        q: 'When am I charged?',
        a: 'Payment is processed at booking confirmation. We accept all major credit cards via Stripe.',
      },
      {
        q: 'What\'s your cancellation policy?',
        a: 'Cancel or reschedule free up to 12 hours before your session. Late cancellations may incur a $35 fee.',
      },
    ],
  },
  {
    title: 'The Session',
    items: [
      {
        q: 'What\'s included in a Foundation session?',
        a: '45 minutes of targeted soft-tissue work, mobility protocol, and a recovery assessment. See our Protocols section for the full breakdown.',
      },
      {
        q: 'What\'s the difference between Performance, Extended, and Ultimate?',
        a: 'Performance adds percussion, compression therapy, and sport-specific focus over Foundation. Extended is a 90-minute session with deeper bodywork coverage. Ultimate is our flagship 120-minute full-body protocol with a personalized take-home recovery plan.',
      },
      {
        q: 'Do I need to be an athlete?',
        a: 'No — but we train like you are one. Whether you\'re a weekend warrior, competitive athlete, or recovering from injury, our protocols are built for active bodies.',
      },
      {
        q: 'What should I wear?',
        a: 'Athletic wear — shorts or leggings and a top you can move in. We provide everything else.',
      },
    ],
  },
  {
    title: 'Account & Support',
    items: [
      {
        q: 'How do I reschedule or cancel?',
        a: `Contact us at least 12 hours before your session. Email ${site.contact.emailPublic} or call ${site.contact.phone}.`,
      },
      {
        q: 'How do I update my contact info?',
        a: 'Send us a message through our contact page or reply to your confirmation email.',
      },
      {
        q: 'Where can I find my receipt?',
        a: 'Receipts are emailed after each session. Need a copy? Contact us and we\'ll resend it.',
      },
    ],
  },
];

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            background: open === i ? colors.white : 'transparent',
            borderRadius: 8,
            border: `1px solid ${open === i ? colors.stone : 'transparent'}`,
            transition: 'all 0.2s',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%', textAlign: 'left', padding: '16px 20px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: 600, color: colors.charcoal }}>
              {item.q}
            </span>
            <span style={{
              flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
              background: open === i ? colors.sageGreen : colors.stone,
              color: open === i ? colors.white : colors.charcoal,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, transition: 'all 0.2s',
              transform: open === i ? 'rotate(45deg)' : 'none',
            }}>
              +
            </span>
          </button>
          {open === i && (
            <div style={{ padding: '0 20px 18px', fontFamily: fonts.body, fontSize: 15, color: colors.warmGray, lineHeight: 1.7 }}>
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function HelpPage() {
  useSEO({
    title: `Help & Support — ${site.name}`,
    description: 'Answers about booking recovery sessions, protocols, pricing, and what to expect at BEST Therapeutics.',
    canonical: `${site.domain}/help`,
  });

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{
        background: colors.deepSage,
        padding: '80px 24px 64px',
        textAlign: 'center',
      }}>
        <AnimatedSection>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{
              display: 'inline-block', fontSize: 11, fontFamily: fonts.body,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: colors.sageLight, marginBottom: 16,
              background: colors.sageLight + '20', padding: '4px 14px', borderRadius: 99,
            }}>
              Support
            </div>
            <h1 style={{
              fontFamily: fonts.display, fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 700, color: colors.cream, margin: '0 0 16px',
            }}>
              How can we<br />help you recover?
            </h1>
            <p style={{
              fontFamily: fonts.body, fontSize: 17, color: colors.sageLight,
              lineHeight: 1.7, margin: 0,
            }}>
              Find answers about protocols, pricing, and what to expect — or reach out and we'll respond fast.
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* ── Quick Actions ── */}
      <section style={{ background: colors.white, padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { emoji: '⚡', title: 'Book Recovery', desc: 'Schedule online in 2 minutes', href: '/book' },
            { emoji: '✉️', title: 'Contact Us', desc: 'Send us a message', href: '/contact' },
            { emoji: '💪', title: 'View Protocols', desc: 'Foundation to Ultimate', href: '/#services' },
          ].map(item => (
            <Link
              key={item.href}
              to={item.href}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                padding: '24px 20px', borderRadius: 12,
                border: `1.5px solid ${colors.stone}`,
                background: colors.cream,
                textDecoration: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = colors.sageGreen;
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,184,0,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = colors.stone;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: 28, marginBottom: 10 }}>{item.emoji}</span>
              <span style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: 15, color: colors.charcoal, marginBottom: 4 }}>
                {item.title}
              </span>
              <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.warmGray }}>
                {item.desc}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FAQ Sections ── */}
      <section style={{ background: colors.cream, padding: '64px 24px 80px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <AnimatedSection>
            <h2 style={{
              fontFamily: fonts.display, fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 700, color: colors.charcoal, textAlign: 'center', marginBottom: 48,
            }}>
              Frequently Asked Questions
            </h2>
          </AnimatedSection>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {FAQ_SECTIONS.map(section => (
              <AnimatedSection key={section.title}>
                <div>
                  <h3 style={{
                    fontFamily: fonts.body, fontSize: 12, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: colors.sageGreen, marginBottom: 16,
                  }}>
                    {section.title}
                  </h3>
                  <FAQAccordion items={section.items} />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Still need help CTA ── */}
      <section style={{ background: colors.white, padding: '64px 24px', textAlign: 'center' }}>
        <AnimatedSection>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <h2 style={{ fontFamily: fonts.display, fontSize: 28, fontWeight: 700, color: colors.charcoal, marginBottom: 12 }}>
              Still have questions?
            </h2>
            <p style={{ fontFamily: fonts.body, fontSize: 16, color: colors.warmGray, lineHeight: 1.7, marginBottom: 28 }}>
              We're a performance-focused recovery team — every message gets a real response, fast.
            </p>
            <Link
              to="/contact"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', background: colors.sageGreen,
                color: colors.white, borderRadius: 8,
                fontFamily: fonts.body, fontSize: 15, fontWeight: 600,
                textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = colors.sageHover)}
              onMouseLeave={e => (e.currentTarget.style.background = colors.sageGreen)}
            >
              Get in Touch
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}

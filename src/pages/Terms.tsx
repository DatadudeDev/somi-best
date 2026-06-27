import { motion } from 'framer-motion';
import { buildTermsSections, getLegalContext } from '../lib/legal-content';
import { colors, typography } from '../styles/tokens';
import AnimatedSection from '../components/ui/AnimatedSection';
import SectionLabel from '../components/ui/SectionLabel';

export default function TermsPage() {
  const { biz, effective } = getLegalContext();
  const sections = buildTermsSections();

  return (
    <div>
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
              maxWidth: '520px',
              margin: '16px auto 0',
              fontSize: '16px',
            }}
          >
            Effective {effective}. By booking or using services from {biz}, you agree to these terms.
          </motion.p>
        </div>
      </section>

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

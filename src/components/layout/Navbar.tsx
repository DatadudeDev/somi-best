/**
 * src/components/layout/Navbar.tsx — BEST Therapeutics
 */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { site } from '../../config/site';
import {
  homeSectionTo,
  navHomeSectionLinkActive,
  scrollToHomeSection,
  type HomeSectionId,
} from '../../lib/home-services-nav';
import { colors, fonts, typography, images } from '../../styles/tokens';
import Button from '../ui/Button';

const navLinks: { label: string; section: HomeSectionId }[] = [
  { label: site.nav.services, section: 'services' },
  { label: site.nav.testimonials, section: 'testimonials' },
  { label: site.nav.products, section: 'products' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu on route change.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMobileOpen(false), [location]);

  const handleSectionNav = (section: HomeSectionId) => {
    setMobileOpen(false);
    if (location.pathname === '/' && location.hash === `#${section}`) {
      scrollToHomeSection(section);
    }
  };

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${colors.stone}`,
        }}
      >
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img
              src={images.logo}
              alt={`${site.name} — ${site.logoSub}`}
              style={{ height: '36px', width: 'auto' }}
            />
          </Link>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
          className="desktop-nav"
          >
            {navLinks.map(link => (
              <Link
                key={link.section}
                to={homeSectionTo(link.section)}
                onClick={() => handleSectionNav(link.section)}
                style={{
                  ...typography.sectionLabel,
                  fontSize: '12px',
                  color: colors.creamText,
                  opacity: navHomeSectionLinkActive(link.section, location) ? 1 : 0.65,
                  transition: 'opacity 0.2s ease',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
            <Button variant="primary" size="compact" href="/book?pkg=Signature&size=s1">
              {site.nav.bookCta}
            </Button>
          </div>

          <button
            className="mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <div style={{ width: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  style={{
                    height: '2px',
                    backgroundColor: colors.sageGreen,
                    borderRadius: '1px',
                    transformOrigin: 'center',
                  }}
                  animate={mobileOpen ? (
                    i === 0 ? { rotate: 45, y: 5 } :
                    i === 1 ? { opacity: 0 } :
                    { rotate: -45, y: -5 }
                  ) : { rotate: 0, y: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99,
              background: colors.richBlack,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '32px',
              paddingTop: '54px',
            }}
          >
            {navLinks.map(link => (
              <Link
                key={link.section}
                to={homeSectionTo(link.section)}
                onClick={() => handleSectionNav(link.section)}
                style={{
                  fontFamily: fonts.display,
                  fontSize: '28px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: colors.creamText,
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
            <Button href="/book?pkg=Signature&size=s1" size="large">{site.nav.bookCta}</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </>
  );
}

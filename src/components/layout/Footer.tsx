/**
 * Footer — SCAFFOLDING: grid layout, link columns, legal row.
 * PLACEHOLDER (reskin): logo, tagline, contact info, social URLs, copyright name.
 *
 * List-based stacks keep vertical rhythm identical for every row. CSS, link
 * data, logo sizing, and social icons live in sibling modules (footer-styles,
 * footer-data, footer-icons); this file is the layout only.
 */
import { Link } from 'react-router-dom';
import { site } from '../../config/site';
import { colors, images } from '../../styles/tokens';
import { QUICK_LINKS } from './footer-data';
import { FOOTER_CSS } from './footer-styles';
import { InstagramIcon, FacebookIcon, TikTokIcon } from './footer-icons';

export default function Footer() {
  return (
    <footer
      className="scf"
      style={{
        background: colors.richBlack,
        color: colors.creamText,
      }}
    >
      <style>{FOOTER_CSS}</style>

      <div className="scf-inner container">
        <div className="scf-main">
          <div className="scf-brand">
            <div className="scf-lockup">
              <img
                src={images.logo}
                alt={`${site.name} — ${site.logoSub}`}
                style={{ height: '42px', width: 'auto' }}
              />
            </div>
            <p className="scf-tagline">
              {site.footer.tagline}
            </p>
          </div>

          <div className="scf-nav">
            <nav className="scf-col" aria-label="Quick links">
              <h4 className="scf-title">Quick Links</h4>
              <ul className="scf-list">
                {QUICK_LINKS.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="scf-line">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav className="scf-col" aria-label="Contact">
              <h4 className="scf-title">Contact</h4>
              <ul className="scf-list">
                <li>
                  <a
                    className="scf-line scf-maps-link"
                    href={site.location.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {site.location.label}
                  </a>
                </li>
                <li>
                  <a className="scf-line" href={`mailto:${site.contact.emailPublic}`}>
                    {site.contact.emailPublic}
                  </a>
                </li>
                <li>
                  <a className="scf-line scf-tel" href={`tel:${site.contact.phoneTel}`}>
                    {site.contact.phone}
                  </a>
                </li>
                <li>
                  <div className="scf-icons">
                    <a
                      href={site.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                    >
                      <InstagramIcon />
                    </a>
                    <a
                      href={site.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                    >
                      <FacebookIcon />
                    </a>
                    <a
                      href={site.social.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok"
                    >
                      <TikTokIcon />
                    </a>
                  </div>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="scf-legal-row">
          <p className="scf-copy">
            © {new Date().getFullYear()} {site.legal.companyLegalName}. All rights reserved.
          </p>
          <div className="scf-legal-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

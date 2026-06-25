import { Link, useLocation } from 'react-router-dom';
import { useSEO } from '../lib/useSEO';
import { colors, fonts } from '../styles/tokens';

export default function NotFound() {
  useSEO({ title: 'Page Not Found — Your Company', description: 'The page you were looking for does not exist.', canonical: 'https://example.com/404' });
  const { pathname } = useLocation();

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: colors.cream,
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: 96,
        fontFamily: fonts.display,
        fontWeight: 700,
        color: colors.sageGreen,
        lineHeight: 1,
        marginBottom: 8,
        letterSpacing: '-4px',
      }}>
        404
      </div>

      <h1 style={{
        fontFamily: fonts.display,
        fontSize: 28,
        fontWeight: 600,
        color: colors.charcoal,
        margin: '16px 0 8px',
      }}>
        This page doesn't exist
      </h1>

      <p style={{
        fontFamily: fonts.body,
        fontSize: 16,
        color: colors.warmGray,
        maxWidth: 380,
        lineHeight: 1.6,
        margin: '0 0 36px',
      }}>
        The page <code style={{
          fontFamily: 'monospace',
          background: colors.stone,
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 14,
          color: colors.charcoal,
        }}>{pathname}</code> couldn't be found.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            background: colors.sageGreen,
            color: colors.white,
            borderRadius: 8,
            fontFamily: fonts.body,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = colors.sageHover)}
          onMouseLeave={e => (e.currentTarget.style.background = colors.sageGreen)}
        >
          Back to Home
        </Link>

        <Link
          to="/book"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            background: 'transparent',
            color: colors.sageGreen,
            border: `2px solid ${colors.sageGreen}`,
            borderRadius: 8,
            fontFamily: fonts.body,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Book a Clean
        </Link>
      </div>

      <p style={{ marginTop: 48, fontSize: 13, color: colors.warmGray, fontFamily: fonts.body }}>
        Need help?{' '}
        <Link to="/help" style={{ color: colors.sageGreen, textDecoration: 'none', fontWeight: 600 }}>
          Visit our support page
        </Link>
        {' '}or{' '}
        <Link to="/contact" style={{ color: colors.sageGreen, textDecoration: 'none', fontWeight: 600 }}>
          contact us
        </Link>
        .
      </p>
    </div>
  );
}

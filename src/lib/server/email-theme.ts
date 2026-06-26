/**
 * Email theme — mirrors src/styles/tokens.ts colors for inline HTML emails.
 * Email clients do not support CSS variables; values are duplicated here intentionally.
 */
export const emailTheme = {
  bgOuter: '#000000',
  bgCard: '#0d0d0d',
  bgElevated: '#161616',
  border: '#2A2A2A',
  textPrimary: '#F2F2F2',
  textMuted: '#9A9A9A',
  heading: '#FFFFFF',
  accent: '#FFB800',
  accentOn: '#000000',
  cardShadow: '0 0 18px rgba(255,184,0,0.10),0 0 36px rgba(255,184,0,0.05)',
  fontBody: "'Barlow',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
  fontDisplay: "'Barlow Condensed','Arial Narrow',sans-serif",
} as const;

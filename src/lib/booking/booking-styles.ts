/**
 * Stripe appearance + inline styles for BEST dark checkout surfaces.
 */
import { colors, fonts } from '../../styles/tokens';

export const STRIPE_APPEARANCE = {
  theme: 'flat' as const,
  variables: {
    colorPrimary: colors.sageGreen,
    colorBackground: colors.white,
    colorText: colors.charcoal,
    colorDanger: '#df1b41',
    fontFamily: fonts.body,
    borderRadius: '6px',
  },
  rules: {
    '.Input': { border: `1px solid ${colors.stone}`, padding: '14px 16px' },
    '.Input:focus': { borderColor: colors.sageGreen, boxShadow: `0 0 0 1px ${colors.sageGreen}` },
  },
};

export const navBtn: React.CSSProperties = {
  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: colors.white, border: `1px solid ${colors.stone}`, borderRadius: '4px',
  cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '16px', color: colors.charcoal,
};
export const emptyCell: React.CSSProperties = {
  aspectRatio: '1', background: '#0a0a0a', borderRadius: '4px', border: `1px solid ${colors.stone}`, opacity: 0.4,
};
export const inputStyle: React.CSSProperties = {
  padding: '14px 16px', fontFamily: fonts.body, fontSize: '15px',
  border: `1px solid ${colors.stone}`, borderRadius: '6px', background: colors.white,
  color: colors.charcoal, outline: 'none', width: '100%', boxSizing: 'border-box' as const,
};
export const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', lineHeight: 1.5,
};
export const inlineQtyBtn: React.CSSProperties = {
  width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: `1px solid ${colors.stone}`, borderRadius: '3px',
  cursor: 'pointer', fontSize: '13px', color: colors.charcoal, fontFamily: 'sans-serif',
  lineHeight: 1, padding: 0, flexShrink: 0,
};
export const fieldError: React.CSSProperties = {
  fontFamily: fonts.body, fontSize: '12px', color: '#df1b41',
  marginTop: '5px', paddingLeft: '2px',
};

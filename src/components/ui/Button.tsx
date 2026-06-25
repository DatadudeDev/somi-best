import { motion } from 'framer-motion';
import type { ElementType } from 'react';
import { colors, typography, transitions } from '../../styles/tokens';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'outlineCream';
  size?: 'default' | 'large' | 'compact';
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
  disabled?: boolean;
}

const variantStyles = {
  primary: {
    background: colors.sageGreen,
    color: colors.cream,
    border: 'none',
    hoverBg: colors.sageHover,
  },
  secondary: {
    background: colors.cream,
    color: colors.sageGreen,
    border: `1px solid ${colors.stone}`,
    hoverBg: colors.stone,
  },
  outline: {
    background: 'transparent',
    color: colors.sageGreen,
    border: `1px solid ${colors.sageGreen}`,
    hoverBg: colors.sageGreen,
    hoverColor: colors.cream,
  },
  outlineCream: {
    background: 'transparent',
    color: colors.cream,
    border: `1px solid ${colors.cream}`,
    hoverBg: colors.cream,
    hoverColor: colors.sageGreen,
  },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'default',
  onClick,
  href,
  type = 'button',
  fullWidth = false,
  disabled = false,
}: ButtonProps) {
  const v = variantStyles[variant];
  const padding =
    size === 'large' ? '18px 40px' :
    size === 'compact' ? '11px 24px' :
    '14px 32px';
  const fontSize = size === 'large' ? '15px' : size === 'compact' ? '13px' : '14px';

  const style: React.CSSProperties = {
    ...typography.button,
    fontSize,
    padding,
    background: v.background,
    color: v.color,
    border: v.border,
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: fullWidth ? '100%' : 'auto',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };

  const Component = (href ? motion.a : motion.button) as ElementType;
  const hoverColor = (v as { hoverColor?: string }).hoverColor || v.color;
  const props = href
    ? { href, style, whileHover: { scale: 1.02, backgroundColor: v.hoverBg, color: hoverColor }, transition: transitions.button }
    : { type, onClick, disabled, style, whileHover: disabled ? {} : { scale: 1.02, backgroundColor: v.hoverBg, color: hoverColor }, transition: transitions.button };

  return <Component {...props}>{children}</Component>;
}

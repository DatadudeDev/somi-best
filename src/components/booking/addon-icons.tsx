/**
 * Recovery add-on SVG icons for BEST Therapeutics checkout.
 */
import type { ReactNode } from 'react';
import { colors } from '../../styles/tokens';

export const ADDON_ICON_SIZE = 12;
export const ADDON_ICON_PADDING = 0;
export const ADDON_CARD_GAP = 7;

const iconProps = {
  width: ADDON_ICON_SIZE,
  height: ADDON_ICON_SIZE,
  fill: 'none' as const,
  stroke: colors.sageGreen,
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const ADDON_ICONS: Record<string, ReactNode> = {
  fridge: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <path d="M14 14.76V3.5a2 2 0 00-4 0v11.26a4 4 0 104 0z" />
      <line x1="10" y1="9" x2="10" y2="2" />
    </svg>
  ),
  oven: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  windows: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M10 6v2l-2 12h8l-2-12V6" />
    </svg>
  ),
  laundry: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  linen: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  pet: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  walls: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  organizing: (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <path d="M10.5 20.5l-7-7a5 5 0 017-7l7 7a5 5 0 01-7 7z" />
      <line x1="8" y1="8" x2="16" y2="16" />
    </svg>
  ),
};

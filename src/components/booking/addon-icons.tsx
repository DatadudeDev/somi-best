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
  'mobility-ball': (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <circle cx="12" cy="12" r="6" />
      <path d="M12 6v12M6 12h12" />
    </svg>
  ),
  'twin-mobility-ball': (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <circle cx="8" cy="12" r="4" />
      <circle cx="16" cy="12" r="4" />
      <path d="M12 8v8" />
    </svg>
  ),
  'foam-roller': (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <rect x="4" y="9" width="16" height="6" rx="3" />
      <ellipse cx="7" cy="12" rx="1.5" ry="3" />
      <ellipse cx="17" cy="12" rx="1.5" ry="3" />
    </svg>
  ),
  'power-bottle': (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <rect x="9" y="3" width="6" height="3" rx="1" />
      <path d="M8 6h8v14a2 2 0 01-2 2h-4a2 2 0 01-2-2V6z" />
      <line x1="10" y1="11" x2="14" y2="11" />
    </svg>
  ),
  'trainer-bands': (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <path d="M4 10c4-2 8-2 12 0s8 2 12 0" />
      <path d="M4 14c4 2 8 2 12 0s8-2 12 0" />
      <path d="M4 18c4 2 8 2 12 0s8-2 12 0" />
    </svg>
  ),
  'personalized-protocol': (
    <svg viewBox="0 0 24 24" {...iconProps}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  ),
};

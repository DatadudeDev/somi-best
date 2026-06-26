/**
 * Service descriptions and metadata for BEST Therapeutics booking flow.
 */
import { HOME_SERVICE_TIERS, type Pkg } from '../../data/pricing';

export const SERVICE_DESC: Record<string, string> = {
  Essential:
    'Foundation protocol — 45 minutes of targeted soft-tissue work, mobility, and a recovery assessment. Built for athletes who need consistent maintenance between heavy training blocks.',
  Signature:
    'Performance protocol — adds percussion and compression therapy with sport-specific recovery focus. Ideal for in-season athletes managing high training volume.',
  Premier:
    'Extended protocol — 90 minutes of deeper bodywork with expanded coverage and fascial release. Our most popular tier for athletes who want thorough recovery without the full Ultimate session.',
  Ultimate:
    'Ultimate protocol — our flagship 120-minute session with comprehensive full-body work and a personalized take-home recovery plan. For peak demand periods, post-competition reset, or when your body needs maximum attention.',
};

export const SERVICE_INCLUDES: Record<string, string[]> = {
  Essential: HOME_SERVICE_TIERS[0].features,
  Signature: HOME_SERVICE_TIERS[1].features,
  Premier: HOME_SERVICE_TIERS[2].features,
  Ultimate: HOME_SERVICE_TIERS[3].features,
};

export const ADDONS_INCLUDED_IN: Record<string, string[]> = {
  Essential: [],
  Signature: [],
  Premier: [],
  Ultimate: [],
};

export const PKGS: readonly Pkg[] = ['Essential', 'Signature', 'Premier', 'Ultimate'] as const;

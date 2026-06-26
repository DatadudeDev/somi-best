/**
 * Service descriptions and metadata for the booking flow.
 */
import { SERVICE_TIERS, type Pkg } from '../../data/pricing';

export const SERVICE_DESC: Record<Pkg, string> = {
  Tier1:
    'Foundation protocol — 45 minutes of targeted soft-tissue work, mobility, and a recovery assessment. Built for athletes who need consistent maintenance between heavy training blocks.',
  Tier2:
    'Performance protocol — adds percussion and compression therapy with sport-specific recovery focus. Ideal for in-season athletes managing high training volume.',
  Tier3:
    'Extended protocol — 90 minutes of deeper bodywork with expanded coverage and fascial release. Our most popular tier for athletes who want thorough recovery without the full Ultimate session.',
  Tier4:
    'Ultimate protocol — our flagship 120-minute session with comprehensive full-body work and a personalized take-home recovery plan. For peak demand periods, post-competition reset, or when your body needs maximum attention.',
};

export const SERVICE_INCLUDES: Record<Pkg, string[]> = {
  Tier1: SERVICE_TIERS[0].features,
  Tier2: SERVICE_TIERS[1].features,
  Tier3: SERVICE_TIERS[2].features,
  Tier4: SERVICE_TIERS[3].features,
};

export const ADDONS_INCLUDED_IN: Record<Pkg, string[]> = {
  Tier1: [],
  Tier2: [],
  Tier3: [],
  Tier4: [],
};

export const PKGS: readonly Pkg[] = ['Tier1', 'Tier2', 'Tier3', 'Tier4'] as const;

/**
 * Service descriptions and metadata for BEST Therapeutics booking flow.
 */
import { HOME_SERVICE_TIERS, type Pkg } from '../../data/pricing';

export const SERVICE_DESC: Record<string, string> = {
  Essential:
    'Foundation protocol — 45 minutes of targeted soft-tissue work, mobility, and a recovery assessment. Built for athletes who need consistent maintenance between heavy training blocks.',
  Signature:
    'Performance protocol — adds percussion and compression therapy with sport-specific recovery focus. Our most popular tier for in-season athletes managing high training volume.',
  Deep:
    'Elite Recovery — full 90-minute deep protocol with cryo boost and a take-home plan. For peak demand periods, post-competition recovery, or when your body needs maximum reset.',
};

export const SERVICE_INCLUDES: Record<string, string[]> = {
  Essential: HOME_SERVICE_TIERS[0].features,
  Signature: HOME_SERVICE_TIERS[1].features,
  Deep: HOME_SERVICE_TIERS[2].features,
};

export const ADDONS_INCLUDED_IN: Record<string, string[]> = {
  Essential: [],
  Signature: ['windows', 'linen'],
  Deep: ['windows', 'linen', 'oven', 'fridge', 'walls'],
};

export const PKGS: readonly Pkg[] = ['Essential', 'Signature', 'Deep'] as const;

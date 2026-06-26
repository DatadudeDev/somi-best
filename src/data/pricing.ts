// BEST Therapeutics — recovery protocol pricing

export type Frequency = 'one-time' | 'monthly' | 'biweekly' | 'weekly';

export interface AddOn {
  id: string;
  label: string;
  price: number;
  unit?: string;
  description: string;
}

export const addOns: AddOn[] = [
  {
    id: 'fridge',
    label: 'Cryo Boost',
    price: 35,
    description:
      'Localized cold therapy for inflamed muscle groups — reduces swelling and speeds recovery after heavy training. Ideal for shoulders, knees, and hot spots that need extra attention post-workout.',
  },
  {
    id: 'oven',
    label: 'Normatec Compression',
    price: 45,
    description:
      '30-minute dynamic air compression that boosts circulation and flushes metabolic waste from tired legs. Mimics active recovery without loading sore muscles — great after leg day or long endurance sessions.',
  },
  {
    id: 'windows',
    label: 'CBD Topical Treatment',
    price: 25,
    description:
      'Professional CBD balm massaged into tight areas for targeted muscle and joint relief. Non-psychoactive formula absorbs quickly so you can return to training the same day.',
  },
  {
    id: 'laundry',
    label: 'Percussion Therapy',
    price: 30,
    description:
      'Deep-tissue percussion to break up adhesions and increase blood flow in dense muscle tissue. Your therapist targets the zones that need it most based on your session goals.',
  },
  {
    id: 'linen',
    label: 'Kinesiology Taping',
    price: 15,
    unit: 'unit',
    description:
      'Athletic tape applied per body zone to support joints and offload stressed tissue during recovery. Priced per area — application included, tape typically lasts 3–5 days.',
  },
  {
    id: 'pet',
    label: 'Mobility Assessment',
    price: 40,
    description:
      'Movement screen identifying restrictions, imbalances, and compensation patterns that limit performance. Includes a corrective protocol tailored to your sport and current training load.',
  },
  {
    id: 'walls',
    label: 'Cupping Therapy',
    price: 20,
    unit: 'unit',
    description:
      'Myofascial cupping per zone to decompress tight fascia and improve range of motion in stubborn areas. Static or sliding techniques based on what your body needs that day.',
  },
  {
    id: 'organizing',
    label: 'Recovery Nutrition',
    price: 55,
    unit: 'unit',
    description:
      'Electrolytes, amino acids, and hydration support to replenish what hard sessions deplete. Take-home pack sized for the 24–48 hours after your visit — priced per pack.',
  },
];

export const frequencyDiscounts: Record<Frequency, { label: string; discount: number; description: string }> = {
  'one-time': { label: 'Single Session', discount: 0, description: 'One-time visit' },
  'monthly': { label: 'Monthly', discount: 0, description: 'Standard rate' },
  'biweekly': { label: 'Bi-weekly', discount: 0.10, description: 'Save 10%' },
  'weekly': { label: 'Weekly', discount: 0.15, description: 'Save 15%' },
};

export type Pkg = 'Essential' | 'Signature' | 'Deep';
export type SizeKey = 's1' | 's2' | 's3' | 's4';

export const PKG_DISPLAY_NAME: Record<Pkg, string> = {
  Essential: 'Foundation',
  Signature: 'Performance',
  Deep: 'Elite Recovery',
};

export interface HomeServiceTier {
  pkg: Pkg;
  name: string;
  price: number;
  minutes: number;
  popular?: boolean;
  features: string[];
}

export const HOME_SERVICE_TIERS: HomeServiceTier[] = [
  {
    pkg: 'Essential',
    name: 'Foundation',
    price: 1,
    minutes: 45,
    features: [
      'Targeted soft-tissue work',
      'Mobility & stretch protocol',
      'Recovery assessment & plan',
    ],
  },
  {
    pkg: 'Signature',
    name: 'Performance',
    price: 129,
    minutes: 60,
    popular: true,
    features: [
      'Everything in Foundation',
      'Percussion & compression therapy',
      'Sport-specific recovery focus',
    ],
  },
  {
    pkg: 'Deep',
    name: 'Elite Recovery',
    price: 179,
    minutes: 90,
    features: [
      'Everything in Performance',
      'Full-body deep tissue protocol',
      'Cryo boost + take-home plan',
    ],
  },
];

export function formatServiceMinutes(minutes: number): string {
  return `${minutes} min session`;
}

export function serviceBookPath(pkg: Pkg, size: SizeKey = 's1'): string {
  return `/book?pkg=${encodeURIComponent(pkg)}&size=${encodeURIComponent(size)}`;
}

export const SIZE_LABELS: Record<SizeKey, string> = {
  s1: 'Individual',
  s2: 'Athlete',
  s3: 'Competitor',
  s4: 'Pro / Team',
};

export const PRICES: Record<Pkg, Record<SizeKey, number>> = {
  Essential: { s1: 1, s2: 104, s3: 129, s4: 181 },
  Signature: { s1: 129, s2: 161, s3: 209, s4: 274 },
  Deep:      { s1: 179, s2: 292, s3: 360, s4: 445 },
};

export const DURATIONS: Record<Pkg, Record<SizeKey, number>> = {
  Essential: { s1: 0.75, s2: 1.125, s3: 1.6875, s4: 1.875 },
  Signature: { s1: 1, s2: 1.333, s3: 1.667, s4: 2 },
  Deep:      { s1: 1.5, s2: 2.25, s3: 3, s4: 3 },
};

export interface HostTier {
  id: string;
  name: string;
  price: number;
  icon: string;
  recommended?: boolean;
  features: string[];
}

function hostTurnoverRowFromResidential(pkg: Pkg): Record<SizeKey, number> {
  const row = PRICES[pkg];
  const r = (n: number) => Math.round(n * 0.9);
  return { s1: r(row.s1), s2: r(row.s2), s3: r(row.s3), s4: r(row.s4) };
}

export const HOST_TURNOVER_PRICES: Record<string, Record<SizeKey, number>> = {
  essentials: hostTurnoverRowFromResidential('Essential'),
  premium:    hostTurnoverRowFromResidential('Signature'),
  luxe:       hostTurnoverRowFromResidential('Deep'),
};

export function hostTurnoverPrice(tierId: string, size: SizeKey): number {
  const row = HOST_TURNOVER_PRICES[tierId];
  if (row) return row[size];
  return hostTiers.find(t => t.id === tierId)?.price ?? 0;
}

export const hostTiers: HostTier[] = [
  {
    id: 'essentials',
    name: 'Team Essentials',
    price: HOST_TURNOVER_PRICES.essentials.s2,
    icon: '⚡',
    features: [
      'Post-game recovery sessions',
      'On-site compression therapy',
      'Basic injury prevention protocol',
      'Monthly performance report',
    ],
  },
  {
    id: 'premium',
    name: 'Team Performance',
    price: HOST_TURNOVER_PRICES.premium.s2,
    icon: '🔥',
    recommended: true,
    features: [
      'Everything in Team Essentials',
      'Dedicated recovery therapist',
      'Custom sport-specific protocols',
      'Priority scheduling',
    ],
  },
  {
    id: 'luxe',
    name: 'Elite Program',
    price: HOST_TURNOVER_PRICES.luxe.s2,
    icon: '💎',
    features: [
      'Everything in Team Performance',
      'Full-season recovery management',
      'Travel & event-day coverage',
      'Performance analytics dashboard',
    ],
  },
];

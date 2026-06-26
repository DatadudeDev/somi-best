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
    id: 'mobility-ball',
    label: 'Mobility Ball',
    price: 30,
    description:
      'Professional-grade dense rubber ball for precise trigger-point release and fascial decompression. Targets stubborn knots in feet, hips, and shoulders — the same tool our therapists reach for to restore tissue glide between sessions.',
  },
  {
    id: 'twin-mobility-ball',
    label: 'Twin Mobility Ball',
    price: 40,
    description:
      'Two mobility balls joined on a flexible core for balanced, two-sided rolling along the spine, calves, and IT bands. Keeps pressure even on both sides so you can work deep tissue without fighting for balance.',
  },
  {
    id: 'foam-roller',
    label: 'Foam Roller',
    price: 40,
    description:
      'High-density foam roller built for broad myofascial release across your back, glutes, and quads. Breaks up adhesive fascia and helps muscle fibers settle back into natural alignment after heavy training.',
  },
  {
    id: 'power-bottle',
    label: 'Power Bottle',
    price: 25,
    description:
      'Insulated shaker bottle with a built-in supplement compartment and stainless steel mixing ball. One grab-and-go vessel for pre- and post-session nutrition — dishwasher safe for daily use.',
  },
  {
    id: 'trainer-bands',
    label: 'Trainer Bands',
    price: 50,
    description:
      'A set of three premium resistance bands — light, medium, and heavy — for activation, mobility, and at-home rehab. Ideal for glute work, shoulder stability, and hinge patterns between BEST visits.',
  },
  {
    id: 'personalized-protocol',
    label: 'Personalized Protocol',
    price: 20,
    description:
      'A six-week take-home recovery plan built from your session — daily mobility, release, and activation work you run on your own schedule. Your therapist notes which tools fit your protocol, so pairing with a foam roller or trainer bands is straightforward when you need them.',
  },
];

export const frequencyDiscounts: Record<Frequency, { label: string; discount: number; description: string }> = {
  'one-time': { label: 'Single Session', discount: 0, description: 'One-time visit' },
  'monthly': { label: 'Monthly', discount: 0, description: 'Standard rate' },
  'biweekly': { label: 'Bi-weekly', discount: 0.10, description: 'Save 10%' },
  'weekly': { label: 'Weekly', discount: 0.15, description: 'Save 15%' },
};

export type Pkg = 'Essential' | 'Signature' | 'Premier' | 'Ultimate';
export type SizeKey = 's1' | 's2' | 's3' | 's4';

export const PKG_DISPLAY_NAME: Record<Pkg, string> = {
  Essential: 'Foundation',
  Signature: 'Performance',
  Premier: 'Extended',
  Ultimate: 'Ultimate',
};

export interface HomeServiceTier {
  pkg: Pkg;
  name: string;
  price: number;
  minutes: number;
  popular?: boolean;
  bestValue?: boolean;
  features: string[];
}

export const HOME_SERVICE_TIERS: HomeServiceTier[] = [
  {
    pkg: 'Essential',
    name: 'Foundation',
    price: 79,    minutes: 45,
    bestValue: true,
    features: [
      'Targeted soft-tissue work',
      'Mobility & stretch protocol',
      'Recovery assessment & plan',
    ],
  },
  {
    pkg: 'Signature',
    name: 'Performance',
    price: 119,
    minutes: 60,
    features: [
      'Everything in Foundation',
      'Percussion & compression therapy',
      'Sport-specific recovery focus',
    ],
  },
  {
    pkg: 'Premier',
    name: 'Extended',
    price: 159,
    minutes: 90,
    popular: true,
    features: [
      'Everything in Performance',
      'Extended bodywork coverage',
      'Deeper fascial release focus',
    ],
  },
  {
    pkg: 'Ultimate',
    name: 'Ultimate',
    price: 209,
    minutes: 120,
    features: [
      'Everything in Extended',
      'Full-body comprehensive protocol',
      'Personalized take-home recovery plan',
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

const flatPrice = (price: number): Record<SizeKey, number> => ({
  s1: price,
  s2: price,
  s3: price,
  s4: price,
});

const flatDuration = (hours: number): Record<SizeKey, number> => ({
  s1: hours,
  s2: hours,
  s3: hours,
  s4: hours,
});

export const PRICES: Record<Pkg, Record<SizeKey, number>> = {
  Essential: flatPrice(79),
  Signature: flatPrice(119),
  Premier: flatPrice(159),
  Ultimate: flatPrice(209),
};
export const DURATIONS: Record<Pkg, Record<SizeKey, number>> = {
  Essential: flatDuration(0.75),
  Signature: flatDuration(1),
  Premier: flatDuration(1.5),
  Ultimate: flatDuration(2),
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
  premium: hostTurnoverRowFromResidential('Signature'),
  extended: hostTurnoverRowFromResidential('Premier'),
  ultimate: hostTurnoverRowFromResidential('Ultimate'),
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
    id: 'extended',
    name: 'Team Extended',
    price: HOST_TURNOVER_PRICES.extended.s2,
    icon: '🎯',
    features: [
      'Everything in Team Performance',
      'Extended session blocks for roster recovery',
      'Multi-athlete scheduling coordination',
      'Seasonal load management',
    ],
  },
  {
    id: 'ultimate',
    name: 'Ultimate Program',
    price: HOST_TURNOVER_PRICES.ultimate.s2,
    icon: '💎',
    features: [
      'Everything in Team Extended',
      'Full-season recovery management',
      'Travel & event-day coverage',
      'Performance analytics dashboard',
    ],
  },
];

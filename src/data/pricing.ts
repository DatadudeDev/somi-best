// BEST Therapeutics — recovery protocol pricing (generalized tier keys, BEST display names)



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



/** URL / API package keys — map to tier1–tier4 service keys via `.toLowerCase()`. */

export type Pkg = 'Tier1' | 'Tier2' | 'Tier3' | 'Tier4';

export type SizeKey = 's1' | 's2' | 's3' | 's4';



/** Client-facing display names (reskin per tenant). */

export const PKG_DISPLAY_NAME: Record<Pkg, string> = {

  Tier1: 'Foundation',

  Tier2: 'Performance',

  Tier3: 'Extended',

  Tier4: 'Ultimate',

};



export interface ServiceTier {

  pkg: Pkg;

  name: string;

  price: number;

  minutes: number;

  popular?: boolean;

  bestValue?: boolean;

  features: string[];

}



export const SERVICE_TIERS: ServiceTier[] = [

  {

    pkg: 'Tier1',

    name: 'Foundation',

    price: 79,

    minutes: 45,

    bestValue: true,

    features: [

      'Targeted soft-tissue work',

      'Mobility & stretch protocol',

      'Recovery assessment & plan',

    ],

  },

  {

    pkg: 'Tier2',

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

    pkg: 'Tier3',

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

    pkg: 'Tier4',

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

  Tier1: flatPrice(79),

  Tier2: flatPrice(119),

  Tier3: flatPrice(159),

  Tier4: flatPrice(209),

};

export const DURATIONS: Record<Pkg, Record<SizeKey, number>> = {

  Tier1: flatDuration(0.75),

  Tier2: flatDuration(1),

  Tier3: flatDuration(1.5),

  Tier4: flatDuration(2),

};



export interface BusinessTier {

  id: string;

  name: string;

  price: number;

  icon: string;

  recommended?: boolean;

  features: string[];

}



function businessRowFromIndividual(pkg: Pkg): Record<SizeKey, number> {

  const row = PRICES[pkg];

  const r = (n: number) => Math.round(n * 0.9);

  return { s1: r(row.s1), s2: r(row.s2), s3: r(row.s3), s4: r(row.s4) };

}



/** Business / team pricing matrix (10% off individual rates, rounded). */

export const BUSINESS_TIER_PRICES: Record<string, Record<SizeKey, number>> = {

  business_t1: businessRowFromIndividual('Tier1'),

  business_t2: businessRowFromIndividual('Tier2'),

  business_t3: businessRowFromIndividual('Tier3'),

  business_t4: businessRowFromIndividual('Tier4'),

};



export function businessTierPrice(tierId: string, size: SizeKey): number {

  const row = BUSINESS_TIER_PRICES[tierId];

  if (row) return row[size];

  return businessTiers.find(t => t.id === tierId)?.price ?? 0;

}



export const businessTiers: BusinessTier[] = [

  {

    id: 'business_t1',

    name: 'Team Essentials',

    price: BUSINESS_TIER_PRICES.business_t1.s2,

    icon: '⚡',

    features: [

      'Post-game recovery sessions',

      'On-site compression therapy',

      'Basic injury prevention protocol',

      'Monthly performance report',

    ],

  },

  {

    id: 'business_t2',

    name: 'Team Performance',

    price: BUSINESS_TIER_PRICES.business_t2.s2,

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

    id: 'business_t3',

    name: 'Team Extended',

    price: BUSINESS_TIER_PRICES.business_t3.s2,

    icon: '🎯',

    features: [

      'Everything in Team Performance',

      'Extended session blocks for roster recovery',

      'Multi-athlete scheduling coordination',

      'Seasonal load management',

    ],

  },

  {

    id: 'business_t4',

    name: 'Ultimate Program',

    price: BUSINESS_TIER_PRICES.business_t4.s2,

    icon: '💎',

    features: [

      'Everything in Team Extended',

      'Full-season recovery management',

      'Travel & event-day coverage',

      'Performance analytics dashboard',

    ],

  },

];



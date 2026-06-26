/**
 * Site configuration — BEST Therapeutics
 * Better Every Second — active recovery & performance wellness.
 */

export const site = {
  name: 'BEST Therapeutics',
  nameShort: 'BEST',
  logoSub: 'Better Every Second Therapeutics',
  tagline: 'Active recovery. Every second counts.',
  subtagline: 'Precision therapy for athletes who refuse to slow down.',

  domain: 'https://besttherapeutics.com',

  contact: {
    email: 'hello@treytherapy.com',
    emailPublic: 'hello@treytherapy.com',
    phone: '+1 403-399-9154',
    phoneTel: '+14033999154',
  },

  location: {
    city: 'Calgary',
    region: 'AB',
    country: 'CA',
    geo: { lat: 51.0447, lng: -114.0719 },
    /** Google Place ID — used for Maps directions + business profile link */
    placeId: 'ChIJE2UmPeB7cVMRIuvzfkwQuyg',
    label: 'Calgary, Canada',
    /** Directions from the user's current location (Google Maps) */
    directionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination_place_id=ChIJE2UmPeB7cVMRIuvzfkwQuyg',
  },

  social: {
    instagram: 'https://www.instagram.com/treybestyycrmt',
    facebook: 'https://www.facebook.com/treybest',
    tiktok: 'https://www.tiktok.com/@better.every.second',
  },

  googleProfileUrl:
    'https://www.google.com/maps/place/?q=place_id:ChIJE2UmPeB7cVMRIuvzfkwQuyg',

  services: {
    sectionLabel: 'Recovery Protocols',
    headline: 'Pick your protocol.',
    subheadline: 'Three tiers. One mission — get you back to peak output faster.',
    bedroomLabel: 'Session tier',
    bentoTabs: {
      residential: 'Individual Recovery',
      custom: 'Custom Protocols',
      business: 'Team & Corporate',
    },
    headlinePrefix: 'Choose the protocol built for your ',
    swappable: {
      residential: 'body',
      custom: 'goals',
      business: 'program',
    },
  },

  nav: {
    services: 'Protocols',
    testimonials: 'Results',
    products: 'Performance',
    bookCta: 'Book Session',
  },

  hero: {
    headline: 'Recover harder. Perform longer.',
    subheadline:
      'Elite active recovery therapy — compression, percussion, mobility, and precision bodywork engineered for athletes who treat every second like it matters.',
    primaryCta: 'Book Recovery',
    secondaryCta: 'Get in Touch',
  },

  testimonials: {
    sectionLabel: 'Athlete Results',
    headline: 'They don\'t slow down. Neither do we.',
    fallback: [
      {
        name: 'Marcus T.',
        neighborhood: 'CrossFit Athlete',
        service: 'Performance Protocol',
        quote:
          'BEST cut my recovery window in half. I\'m back under the bar faster and moving better than I have in years. This isn\'t spa day — it\'s performance infrastructure.',
      },
      {
        name: 'Sarah K.',
        neighborhood: 'Marathon Runner',
        service: 'Elite Recovery',
        quote:
          'After my last ultra, BEST had me race-ready in 72 hours. The team knows anatomy, knows athletics, and doesn\'t waste a single minute of your session.',
      },
      {
        name: 'Derek W.',
        neighborhood: 'Collegiate Strength Coach',
        service: 'Foundation Protocol',
        quote:
          'I send every athlete in my program here. Consistent results, zero fluff. BEST is the recovery edge our roster needed.',
      },
    ],
  },

  productSection: {
    label: 'Performance Stack',
    headline: 'Recovery doesn\'t stop when you leave.',
    body:
      'Take the BEST protocol home. Medical-grade tools and supplements curated for active recovery — the same gear our therapists trust in-session.',
    items: [
      { name: 'Normatec Boots', scent: 'Compression', notes: 'Dynamic air compression for legs & hips' },
      { name: 'Hypervolt Pro', scent: 'Percussion', notes: 'Deep-tissue percussion therapy device' },
      { name: 'CBD Recovery Balm', scent: 'Topical', notes: 'Targeted relief for sore muscles & joints' },
      { name: 'Electrolyte Protocol', scent: 'Nutrition', notes: 'Replenishment formula for post-session recovery' },
    ],
    footnote: 'Available in-clinic or shipped to your door.',
  },

  finalCta: {
    line1: 'Every second off the clock',
    line2: 'is a second you\'re losing ground.',
    button: 'Book Your Session',
  },

  footer: {
    tagline: 'Precision active recovery for athletes, teams, and anyone who refuses to accept downtime.',
  },

  legal: {
    companyLegalName: 'BEST Therapeutics LLC',
  },

  booking: {
    checkout: {
      notesLabel: 'SESSION NOTES',
      notesPlaceholder: 'Injuries, focus areas, training load, or access instructions.',
      addressPlaceholder: 'Address',
      billingSameLabel: 'Billing address is the same as the address above',
      termsAcknowledgment:
        'By confirming this booking, you agree to the recovery protocol selected above and BEST Therapeutics\' service terms.',
      cancellationPolicy:
        'Cancel or reschedule free up to 12 hours before your session. Late cancellations may incur a $35 fee.',
      customQuoteSidebar:
        'Custom protocol pricing confirmed in your personalized quote.',
      propertyTypes: ['Gym / Training Facility', 'Corporate Wellness', 'Sports Team', 'Other'] as const,
    },
  },
} as const;

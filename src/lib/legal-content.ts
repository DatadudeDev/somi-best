/**
 * General-purpose Privacy & Terms copy for tenant sites.
 * Personalised via site.legal + site.contact + site.location (VITE_* at build time).
 */
import { site } from '../config/site';

export interface LegalBlock {
  subtitle: string;
  text: string;
}

export interface LegalSection {
  number: string;
  label: string;
  heading: string;
  content: LegalBlock[];
}

function provinceName(region: string): string {
  const map: Record<string, string> = {
    AB: 'Alberta',
    BC: 'British Columbia',
    MB: 'Manitoba',
    NB: 'New Brunswick',
    NL: 'Newfoundland and Labrador',
    NS: 'Nova Scotia',
    NT: 'Northwest Territories',
    NU: 'Nunavut',
    ON: 'Ontario',
    PE: 'Prince Edward Island',
    QC: 'Quebec',
    SK: 'Saskatchewan',
    YT: 'Yukon',
  };
  return map[region.toUpperCase()] ?? region;
}

export function getLegalContext() {
  const biz = site.legal.businessName;
  const legal = site.legal.companyLegalName;
  const loc = site.legal.locationLabel;
  const email = site.contact.emailPublic;
  const province = provinceName(site.location.region);
  const effective = site.legal.effectiveDate;
  const cancellation = site.booking.checkout.cancellationPolicy;

  return { biz, legal, loc, email, province, effective, cancellation };
}

export function buildPrivacySections(): LegalSection[] {
  const { biz, legal, loc, email, province, effective } = getLegalContext();

  return [
    {
      number: '01',
      label: 'Information We Collect',
      heading: 'What we collect and why',
      content: [
        {
          subtitle: 'Booking & contact information',
          text: `When you book an appointment or request information from ${biz}, we may collect your name, email address, phone number, and any details you provide about your visit (such as notes, preferences, or location information if required for your booking). This helps us schedule, confirm, and deliver your service.`,
        },
        {
          subtitle: 'Payment information',
          text: 'Payments are processed securely through Stripe. We do not store your full credit card number on our servers. Stripe handles card data in accordance with its privacy policy and PCI-DSS requirements.',
        },
        {
          subtitle: 'Communications',
          text: `When you contact ${biz} through our website, email, or phone, we retain that correspondence so we can respond to your inquiry and maintain a record of our relationship with you.`,
        },
        {
          subtitle: 'Usage data',
          text: 'We may collect aggregated analytics (such as pages visited, session duration, and referral source) to understand how our website is used. This data is not used to identify you personally unless combined with information you voluntarily provide.',
        },
      ],
    },
    {
      number: '02',
      label: 'How We Use Your Information',
      heading: 'What your data is used for',
      content: [
        {
          subtitle: 'Service delivery',
          text: `We use your information to manage bookings, send confirmations and reminders, deliver the services you request, and communicate updates related to your appointments with ${biz}.`,
        },
        {
          subtitle: 'Payments & billing',
          text: 'Payment information is used solely to process transactions for services you purchase. We do not use payment data for unrelated purposes.',
        },
        {
          subtitle: 'Improvement & support',
          text: 'We may use feedback and anonymized usage data to improve our services, website, and customer experience.',
        },
        {
          subtitle: 'Marketing (optional)',
          text: `With your consent where required, ${biz} may send occasional updates about offers or news. You may unsubscribe from marketing emails at any time using the link in any message.`,
        },
      ],
    },
    {
      number: '03',
      label: 'Data Retention',
      heading: 'How long we keep your data',
      content: [
        {
          subtitle: 'Active relationships',
          text: 'We retain personal information for as long as needed to provide services, maintain your account or booking history, and resolve disputes or inquiries.',
        },
        {
          subtitle: 'Deletion requests',
          text: `You may request deletion of your personal data by emailing ${email}. We will respond within 30 days, subject to legal or contractual requirements to retain certain records.`,
        },
        {
          subtitle: 'Financial records',
          text: 'Transaction and booking records may be kept for up to seven years where required for tax, accounting, or regulatory compliance under applicable Canadian law.',
        },
      ],
    },
    {
      number: '04',
      label: 'Cookies & Tracking',
      heading: 'Cookies and similar technologies',
      content: [
        {
          subtitle: 'Essential cookies',
          text: 'Our site uses cookies and similar technologies needed for core functionality (for example, maintaining your session during checkout). Disabling them may limit how the site works.',
        },
        {
          subtitle: 'Analytics',
          text: 'We may use analytics tools to understand aggregate traffic patterns. You can limit tracking through your browser settings or privacy extensions where available.',
        },
        {
          subtitle: 'No sale of personal data',
          text: `${biz} does not sell your personal information to third parties for their advertising purposes.`,
        },
      ],
    },
    {
      number: '05',
      label: 'Your Rights',
      heading: 'Your privacy rights',
      content: [
        {
          subtitle: 'Access & correction',
          text: `You may request access to or correction of personal information we hold about you by contacting ${email}. We will respond within a reasonable timeframe.`,
        },
        {
          subtitle: 'Withdrawal of consent',
          text: 'Where we rely on your consent (for example, for optional marketing), you may withdraw it at any time without affecting the lawfulness of processing before withdrawal.',
        },
        {
          subtitle: 'Canadian privacy law',
          text: `${legal} operates in ${loc} and handles personal information in accordance with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy laws, including the laws of ${province}.`,
        },
      ],
    },
    {
      number: '06',
      label: 'Contact',
      heading: 'Questions about this policy',
      content: [
        {
          subtitle: 'Reach us',
          text: `Questions, concerns, or privacy requests may be sent to ${email}. ${legal} is located in ${loc}.`,
        },
        {
          subtitle: 'Policy updates',
          text: `We may update this Privacy Policy from time to time. The effective date at the top of this page will change when we do. Continued use of our services after an update constitutes acceptance of the revised policy. (Effective date: ${effective}.)`,
        },
      ],
    },
  ];
}

export function buildTermsSections(): LegalSection[] {
  const { biz, legal, loc, email, province, effective, cancellation } = getLegalContext();

  return [
    {
      number: '01',
      label: 'Services',
      heading: `What ${biz} provides`,
      content: [
        {
          subtitle: 'Scope of service',
          text: `${biz} provides professional services as described on our website and at the time of booking. Specific offerings, duration, and inclusions may vary by service type and are confirmed when you book or receive a written quote.`,
        },
        {
          subtitle: 'Service standards',
          text: `${biz} strives to deliver services professionally and as described. If you have health concerns, allergies, access requirements, or other preferences, please share them before your appointment so we can plan accordingly.`,
        },
        {
          subtitle: 'Limitations',
          text: `${biz} is not responsible for outcomes beyond the agreed scope of a booked service. Services are not a substitute for emergency medical care. If you require urgent medical attention, contact emergency services.`,
        },
      ],
    },
    {
      number: '02',
      label: 'Booking & Scheduling',
      heading: 'How bookings work',
      content: [
        {
          subtitle: 'Confirmation',
          text: `A booking is confirmed when you receive written confirmation from ${biz} (email or other agreed channel). Pricing and service details shown at checkout or in your confirmation apply to that appointment.`,
        },
        {
          subtitle: 'Your responsibilities',
          text: 'You are responsible for providing accurate contact information and, where applicable, timely access to the location of service. Late arrival may reduce session time without a price adjustment.',
        },
        {
          subtitle: 'Rescheduling',
          text: `Reschedule requests are subject to availability. ${cancellation} Contact us as early as possible if your plans change.`,
        },
      ],
    },
    {
      number: '03',
      label: 'Cancellation & no-shows',
      heading: 'Cancellations and missed appointments',
      content: [
        {
          subtitle: 'Client cancellations',
          text: cancellation,
        },
        {
          subtitle: 'No-shows',
          text: `If you miss an appointment without notice, ${biz} may charge the full scheduled service fee or decline future bookings at our discretion.`,
        },
        {
          subtitle: 'Recurring appointments',
          text: 'For recurring or multi-visit bookings, the cancellation policy applies to each scheduled visit unless otherwise agreed in writing.',
        },
        {
          subtitle: `Cancellations by ${biz}`,
          text: `If ${biz} must cancel or reschedule, we will notify you as soon as possible and work with you on an alternative time or applicable refund.`,
        },
      ],
    },
    {
      number: '04',
      label: 'Pricing & Payment',
      heading: 'Fees and payment terms',
      content: [
        {
          subtitle: 'Pricing',
          text: 'Prices are shown at booking or in your quote confirmation. Amounts are in Canadian dollars unless stated otherwise. Applicable taxes are included or itemized as shown at checkout.',
        },
        {
          subtitle: 'Payment',
          text: 'Payment is collected through our secure online checkout (Stripe). We accept major credit and debit cards unless otherwise noted. Other payment methods are not guaranteed unless agreed in advance.',
        },
        {
          subtitle: 'Promotions',
          text: 'Promotional codes and discounts must be applied at booking unless stated otherwise, cannot typically be combined, and are subject to expiry and usage limits.',
        },
        {
          subtitle: 'Price changes',
          text: `${biz} may update published pricing at any time. Confirmed bookings are honored at the price agreed at confirmation.`,
        },
      ],
    },
    {
      number: '05',
      label: 'Satisfaction & refunds',
      heading: 'Service concerns and refunds',
      content: [
        {
          subtitle: 'Raising a concern',
          text: `If you are dissatisfied with a service, contact ${email} promptly with details of your concern. We will review and respond in good faith.`,
        },
        {
          subtitle: 'Remedies',
          text: `Depending on the situation, ${biz} may offer a partial credit, reschedule, or other remedy. Remedies are assessed case by case and are not guaranteed.`,
        },
        {
          subtitle: 'Refunds',
          text: `Approved refunds are returned to the original payment method where possible, typically within 5–10 business days. Refund eligibility is at ${biz}'s discretion except where required by law.`,
        },
      ],
    },
    {
      number: '06',
      label: 'Liability',
      heading: 'Limitation of liability',
      content: [
        {
          subtitle: 'Care of property',
          text: `Please inform ${biz} of any fragile items, health considerations, or property access issues before your appointment. Report any damage or incident within 24 hours with supporting details.`,
        },
        {
          subtitle: 'Cap on liability',
          text: `${legal}'s total liability for any claim arising from a service is limited to the amount you paid for that specific appointment, except where prohibited by law.`,
        },
        {
          subtitle: 'No indirect damages',
          text: `${biz} is not liable for indirect, incidental, or consequential damages arising from the use of our services or website.`,
        },
        {
          subtitle: 'Insurance',
          text: `${legal} maintains appropriate business insurance where applicable. Certificates may be provided upon request.`,
        },
      ],
    },
    {
      number: '07',
      label: 'General',
      heading: 'Legal & contact',
      content: [
        {
          subtitle: 'Governing law',
          text: `These Terms are governed by the laws of the Province of ${province} and the federal laws of Canada applicable therein. Disputes shall be addressed in ${loc}, subject to mandatory consumer protections.`,
        },
        {
          subtitle: 'Changes to these terms',
          text: `${biz} may update these Terms from time to time. The effective date on this page will reflect the latest version. Continued use after changes constitutes acceptance. (Effective date: ${effective}.)`,
        },
        {
          subtitle: 'Contact',
          text: `Questions about these Terms? Email ${email}. ${legal}, ${loc}.`,
        },
      ],
    },
  ];
}

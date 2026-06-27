import { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSEO, seoMeta } from '../lib/useSEO';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { colors, fonts, typography } from '../styles/tokens';
import { site } from '../config/site';
import { addOns as addOnData, frequencyDiscounts, PKG_DISPLAY_NAME, PRICES, SIZE_LABELS, type Frequency, type SizeKey, type Pkg } from '../data/pricing';
import { getBasePriceForMode } from '../lib/booking/constants';
import { bookingRequiresAddress } from '../lib/booking/booking-config';
import { getMockDaySlots, getMockMonthAvailability, getFirstAvailableMonth, monthHasAvailability, isBookingApiEnabled } from '../lib/booking/mock-availability';
import BookingStepper from '../components/ui/BookingStepper';
import Button from '../components/ui/Button';
import PhoneInput from '../components/ui/PhoneInput';
import LazyAddressField, { type AddressResult } from '../components/ui/LazyAddressField';
import { useTurnstile } from '../lib/useTurnstile';
import { tracker } from '../lib/tracker';

import type {
  AvailabilitySlot,
  MonthDaySummary,
  SlotSelection,
  CreateIntentResponse,
  PromoResponse,
} from '../lib/booking/booking-types';
import {
  getPrice,
  getAvailableSlotsFallback,
  formatCompletionTime,
  getMonthData,
  MONTH_NAMES,
  DAY_HEADERS,
  FREQUENCY_OPTIONS,
  getMaxSlots,
  formatCalendarSelectionLabel,
  CAL_SELECTED_LABEL_FONT,
} from '../lib/booking/booking-helpers';
import { SERVICE_DESC, SERVICE_INCLUDES, ADDONS_INCLUDED_IN, PKGS } from '../lib/booking/service-meta';
import { validateName, validateEmail, validatePhone } from '../lib/booking/validation';
import { navBtn, emptyCell, inputStyle, textareaStyle, inlineQtyBtn, fieldError } from '../lib/booking/booking-styles';
import { ADDON_ICONS, ADDON_ICON_SIZE, ADDON_ICON_PADDING, ADDON_CARD_GAP } from '../components/booking/addon-icons';

const BookStripeCheckout = lazy(() => import('../components/booking/BookStripeCheckout'));

function bookingServiceKey(pkg: string): string {
  return pkg.toLowerCase();
}

export default function BookPage() {
  useSEO(seoMeta.book);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = searchParams;
  const step: 2 | 3 = searchParams.get('step') === 'checkout' ? 3 : 2;

  const setBookingStep = useCallback((next: 2 | 3, replace = false) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next === 3) nextParams.set('step', 'checkout');
    else nextParams.delete('step');
    setSearchParams(nextParams, { replace });
  }, [searchParams, setSearchParams]);

  const serviceSectionRef = useRef<HTMLDivElement>(null);
  const scheduleSectionRef = useRef<HTMLDivElement>(null);
  const pkgParam = params.get('pkg') || 'Tier1';
  const sizeParam = params.get('size') || 's1';

  // Booking mode — business vs individual pricing/UI
  const isBusiness = params.get('mode') === 'business';

  // Strip legacy custom-quote URL params (mode=custom, quoteId, prefill, etc.)
  useEffect(() => {
    const legacyKeys = ['quoteId', 'prefill', 'promo', 'date', 'time', 'notes'] as const;
    const hasLegacy = params.get('mode') === 'custom' || legacyKeys.some((k) => params.has(k));
    if (!hasLegacy) return;
    const next = new URLSearchParams(searchParams);
    if (next.get('mode') === 'custom') next.delete('mode');
    legacyKeys.forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Booking source attribution — read from URL params set by email click redirects or UTM campaigns
  const utmSource = params.get('utm_source') ?? undefined;
  const utmMedium = params.get('utm_medium') ?? undefined;
  const utmCampaign = params.get('utm_campaign') ?? undefined;
  const refParam = params.get('ref');
  const eidParam = params.get('eid');
  // source='email' when arriving via a tracked email click (ref=email&eid=<email_id>)
  // source='utm'   when arriving with any utm_ param
  // source='direct' otherwise
  const bookingSource: string = refParam === 'email' ? 'email' : (utmSource || utmMedium || utmCampaign) ? 'utm' : 'direct';
  const sourceEmailId: string | undefined = refParam === 'email' ? (eidParam ?? undefined) : undefined;

  const { containerRef: turnstileRef, getToken, reset: resetTurnstile } = useTurnstile('booking', step === 3);
  const turnstileEnabled = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const fetchedDayKeysRef = useRef(new Set<string>());
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [expandedAddOn, setExpandedAddOn] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState(pkgParam);
  const [selectedSize, setSelectedSize] = useState(sizeParam);

  /* frequency state */
  const [frequency, setFrequency] = useState<Frequency>('one-time');

  /* calendar state — open on first month with availability, not always current month */
  const today = new Date();
  const calendarFloorYear = today.getFullYear();
  const calendarFloorMonth = today.getMonth();
  const initialCalendarMonth = getFirstAvailableMonth(
    calendarFloorYear,
    calendarFloorMonth,
    bookingServiceKey(pkgParam),
    sizeParam,
  );
  const [calYear, setCalYear] = useState(initialCalendarMonth.year);
  const [calMonth, setCalMonth] = useState(initialCalendarMonth.month);
  const [earliestAvailableMonth, setEarliestAvailableMonth] = useState(initialCalendarMonth);
  const calendarUserNavigatedRef = useRef(false);
  const calendarAutoAdvanceCountRef = useRef(0);
  const canGoPrevMonth = calYear > earliestAvailableMonth.year
    || (calYear === earliestAvailableMonth.year && calMonth > earliestAvailableMonth.month);

  /** Keep pkg/size in sync when arriving via bento links (same route, new query). */
  const searchKey = params.toString();
  useEffect(() => {
    const nextPkg = params.get('pkg') || 'Tier1';
    const nextSize = params.get('size') || 's1';
    setSelectedPkg(nextPkg);
    setSelectedSize(nextSize);
    calendarUserNavigatedRef.current = false;
    calendarAutoAdvanceCountRef.current = 0;
    const nextMonth = getFirstAvailableMonth(
      calendarFloorYear,
      calendarFloorMonth,
      bookingServiceKey(nextPkg),
      nextSize,
    );
    setCalYear(nextMonth.year);
    setCalMonth(nextMonth.month);
    setEarliestAvailableMonth(nextMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  /* ── API availability state ── */
  const [monthAvailability, setMonthAvailability] = useState<Record<string, MonthDaySummary>>({});
  const [monthLoading, setMonthLoading] = useState(false);
  const [daySlots, setDaySlots] = useState<Record<number, AvailabilitySlot[]>>({});
  const [dayLoading, setDayLoading] = useState<Record<number, boolean>>({});

  /* multi-slot selections */
  const [selections, setSelections] = useState<SlotSelection[]>([]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  const { firstDay, daysInMonth } = useMemo(() => getMonthData(calYear, calMonth), [calYear, calMonth]);
  const bookingApiEnabled = isBookingApiEnabled();

  const maxSlots = getMaxSlots();
  const selectedDays = new Set(selections.filter(s => s.month === calMonth && s.year === calYear).map(s => s.day));
  const allSlotsHaveTime = selections.length > 0 && selections.every(s => s.time !== null);
  const hasMinimumSlots = selections.length >= 1;
  const scheduleComplete = hasMinimumSlots && allSlotsHaveTime;

  const hasProtocol = Boolean(selectedPkg);
  const hasFrequency = Boolean(frequency);
  const canProceedToCheckout = hasProtocol && hasFrequency && hasMinimumSlots && allSlotsHaveTime;

  const attemptContinueToStep3 = () => {
    if (!canProceedToCheckout) return;
    tracker.bookingStep(3, { service: selectedPkg, size: selectedSize, frequency });
    setBookingStep(3);
  };

  const handleStepperClick = useCallback((stepNum: number) => {
    if (stepNum === 1) {
      if (step === 3) setBookingStep(2, true);
      serviceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (stepNum === 2) {
      if (step === 3) setBookingStep(2, true);
      scheduleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (stepNum === 3) {
      attemptContinueToStep3();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, canProceedToCheckout, selectedPkg, selectedSize, frequency, setBookingStep]);

  /* checkout state */
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string,{on:boolean,qty:number}>>({});
  const [sessionNotes, setSessionNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('+1 ');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [serviceAddressCoords, setServiceAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [billingSameAsService, setBillingSameAsService] = useState(true);
  const [billingAddress, setBillingAddress] = useState('');
  const [unitNumber, setUnitNumber] = useState('');

  /* business-mode state */
  const [businessName, setBusinessName] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [businessNameError, setBusinessNameError] = useState('');

  /* promo code state */
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<PromoResponse | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  /* payment / booking state */
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerSessionClientSecret, setCustomerSessionClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [checkoutInitialized, setCheckoutInitialized] = useState(false);
  // Central-payments (Connect) — supplied by create-intent when USE_CENTRAL_PAYMENTS is on.
  const [stripeAccount, setStripeAccount] = useState<string | undefined>(undefined);
  const [publishableKey, setPublishableKey] = useState<string | undefined>(undefined);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [freeLoading, setFreeLoading] = useState(false);
  const [freeError, setFreeError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  /* pricing (local) */
  const basePrice = isBusiness
    ? getBasePriceForMode(selectedPkg, selectedSize, 'business')
    : getPrice(selectedPkg, selectedSize);
  const applicableAddOns = addOnData.filter(a => !(ADDONS_INCLUDED_IN[selectedPkg as Pkg] || []).includes(a.id));
  const addOnTotal = applicableAddOns.reduce((sum, a) => {
    const state = selectedAddOns[a.id];
    if (!state?.on) return sum;
    return sum + a.price * (a.unit ? state.qty : 1);
  }, 0);
  const discountInfo = frequencyDiscounts[frequency];
  const perVisitSubtotal = basePrice + addOnTotal;
  const discountAmount = Math.round(perVisitSubtotal * discountInfo.discount * 100) / 100;
  const perVisitAfterFrequencyDiscount = perVisitSubtotal - discountAmount;
  const totalVisits = selections.length || 1;
  const subtotalBeforePromo = perVisitAfterFrequencyDiscount * totalVisits;

  /* apply promo discount on top of frequency discount */
  let promoDiscountAmount = 0;
  /** For quote_price promos, this is the override total in dollars (pre-GST) */
  let quotePriceOverrideDollars: number | null = null;
  if (promoResult?.valid && appliedPromo) {
    if (promoResult.type === 'quote_price' && promoResult.finalPrice != null) {
      // quote_price sets a fixed total (cents) — derive discount from that
      quotePriceOverrideDollars = promoResult.finalPrice / 100;
      promoDiscountAmount = Math.max(0, subtotalBeforePromo - quotePriceOverrideDollars);
    } else if (promoResult.type === 'complimentary') {
      promoDiscountAmount = subtotalBeforePromo;
    } else if (promoResult.discountAmount != null) {
      promoDiscountAmount = promoResult.discountAmount;
    }
  }

  /* GST is always 5% of the post-discount subtotal (never negative) */
  const GST_RATE = 0.05;
  // For quote_price promos: approved_amount is the GST-inclusive total (subtotal + 5% GST).
  // Reverse-calculate the pre-tax subtotal so we don't add GST a second time.
  // Example: admin approves $157.50 (= $150 + $7.50 GST) → subtotal = 157.50 / 1.05 = 150.00
  const subtotalAfterAllDiscounts = quotePriceOverrideDollars != null
    ? Math.round((quotePriceOverrideDollars / (1 + GST_RATE)) * 100) / 100
    : Math.max(0, subtotalBeforePromo - promoDiscountAmount);
  const gstAmount = Math.round(subtotalAfterAllDiscounts * GST_RATE * 100) / 100;
  const grandTotal = Math.round((subtotalAfterAllDiscounts + gstAmount) * 100) / 100;
  const isFreeBooking = grandTotal === 0;

  const contactValid = useMemo(() => (
    !validateName(contactName)
    && !validateEmail(contactEmail)
    && !validatePhone(contactPhone)
    && (!bookingRequiresAddress || !!serviceAddress.trim())
    && (!isBusiness || (businessName.trim().length > 0 && propertyType.length > 0))
  ), [contactName, contactEmail, contactPhone, serviceAddress, isBusiness, businessName, propertyType]);

  const formattedServiceAddress = useMemo(() => {
    if (!serviceAddress.trim()) return '';
    return unitNumber ? `${serviceAddress}, Unit ${unitNumber}` : serviceAddress;
  }, [serviceAddress, unitNumber]);

  /* per-clean values kept for display purposes */
  const perVisitAfterDiscount = perVisitAfterFrequencyDiscount;
  const perVisitTotal = perVisitAfterDiscount * (1 + GST_RATE);

  /* ── Fetch month availability from API (or local mock in template mode) ── */
  const fetchMonthAvailability = useCallback(async (year: number, month: number) => {
    setMonthLoading(true);
    try {
      const serviceKey = bookingServiceKey(selectedPkg);

      if (!bookingApiEnabled) {
        setMonthAvailability(getMockMonthAvailability(year, month, serviceKey, selectedSize));
        return;
      }

      const url = `/api/availability/month?year=${year}&month=${month + 1}&service=${serviceKey}&sizeKey=${selectedSize}`;
      const res = await fetch(url);
      const ct = res.headers.get('content-type') ?? '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json() as { days: Record<string, MonthDaySummary> };
        setMonthAvailability(data.days ?? {});
      } else {
        if (import.meta.env.DEV) {
          console.warn('[book] month availability API failed — empty calendar for', year, month + 1);
        }
        setMonthAvailability({});
      }
    } catch {
      if (import.meta.env.DEV) {
        console.warn('[book] month availability fetch error');
      }
      setMonthAvailability({});
    } finally {
      setMonthLoading(false);
    }
  }, [selectedPkg, selectedSize, bookingApiEnabled]);

  useEffect(() => {
    fetchMonthAvailability(calYear, calMonth);
  }, [calYear, calMonth, fetchMonthAvailability]);

  /** If the visible month has no open slots (e.g. API blocks differ from mock), advance automatically. */
  useEffect(() => {
    if (monthLoading || calendarUserNavigatedRef.current) return;
    if (monthHasAvailability(monthAvailability)) {
      calendarAutoAdvanceCountRef.current = 0;
      setEarliestAvailableMonth(prev => {
        if (calYear < prev.year || (calYear === prev.year && calMonth < prev.month)) {
          return { year: calYear, month: calMonth };
        }
        return prev;
      });
      return;
    }
    if (calendarAutoAdvanceCountRef.current >= 12) return;
    calendarAutoAdvanceCountRef.current += 1;
    if (calMonth === 11) {
      setCalYear(y => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth(m => m + 1);
    }
  }, [monthAvailability, monthLoading, calYear, calMonth]);

  /** When protocol or size changes, re-open the first month that has slots. */
  useEffect(() => {
    calendarUserNavigatedRef.current = false;
    calendarAutoAdvanceCountRef.current = 0;
    const nextMonth = getFirstAvailableMonth(
      calendarFloorYear,
      calendarFloorMonth,
      bookingServiceKey(selectedPkg),
      selectedSize,
    );
    setCalYear(nextMonth.year);
    setCalMonth(nextMonth.month);
    setEarliestAvailableMonth(nextMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPkg, selectedSize]);

  /* scroll to top on step change */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  /* ── Get available days from API response ── */
  const available = useMemo(() => {
    const set = new Set<number>();
    Object.entries(monthAvailability).forEach(([dateStr, summary]) => {
      if (summary.available && summary.slotCount > 0) {
        const day = parseInt(dateStr.split('-')[2], 10);
        set.add(day);
      }
    });
    return set;
  }, [monthAvailability]);

  const getSlotCountForDay = (day: number): number => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return monthAvailability[dateStr]?.slotCount ?? 0;
  };

  useEffect(() => {
    fetchedDayKeysRef.current.clear();
  }, [selectedPkg, selectedSize, calYear, calMonth]);

  /* ── Fetch time slots for a specific day ── */
  const fetchDaySlots = useCallback(async (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const serviceKey = bookingServiceKey(selectedPkg);
    const cacheKey = `${dateStr}:${serviceKey}:${selectedSize}`;
    if (fetchedDayKeysRef.current.has(cacheKey)) return;
    fetchedDayKeysRef.current.add(cacheKey);
    setDayLoading(prev => ({ ...prev, [day]: true }));
    try {
      const fallback = getMockDaySlots(serviceKey, selectedSize);

      if (!bookingApiEnabled) {
        setDaySlots(prev => ({ ...prev, [day]: fallback }));
        return;
      }

      const url = `/api/availability?date=${dateStr}&service=${serviceKey}&sizeKey=${selectedSize}`;
      const res = await fetch(url);
      const ct = res.headers.get('content-type') ?? '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json() as { slots: AvailabilitySlot[]; available: boolean };
        setDaySlots(prev => ({ ...prev, [day]: data.slots ?? [] }));
      } else {
        if (import.meta.env.DEV) {
          console.warn('[book] day slots API failed for', dateStr);
        }
        setDaySlots(prev => ({ ...prev, [day]: [] }));
      }
    } catch {
      if (import.meta.env.DEV) {
        console.warn('[book] day slots fetch error for', dateStr);
      }
      setDaySlots(prev => ({ ...prev, [day]: [] }));
    } finally {
      setDayLoading(prev => ({ ...prev, [day]: false }));
    }
  }, [calYear, calMonth, selectedPkg, selectedSize, bookingApiEnabled]);

  /* When active slot or service changes, fetch its day slots */
  useEffect(() => {
    if (activeSlotIndex !== null && selections[activeSlotIndex]) {
      const day = selections[activeSlotIndex].day;
      fetchDaySlots(day);
    }
  }, [activeSlotIndex, selectedPkg, selectedSize, fetchDaySlots, selections]);

  /* ── Promo code validation ── */
  const handlePromoValidate = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoResult(null);
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode.trim(),
          service: selectedPkg,
          basePrice: perVisitSubtotal,
        }),
      });
      const data = await res.json() as PromoResponse;
      setPromoResult(data);
      if (data.valid) setAppliedPromo(promoCode.trim().toUpperCase());
    } catch {
      setPromoResult({ valid: false, reason: 'Could not validate promo code.' });
    } finally {
      setPromoLoading(false);
    }
  };

  const buildCheckoutPayload = useCallback(() => {
    const primarySelection = selections[0];
    if (!primarySelection?.time) return null;
    const dateStr = `${primarySelection.year}-${String(primarySelection.month + 1).padStart(2, '0')}-${String(primarySelection.day).padStart(2, '0')}`;
    const addOnsPayload = applicableAddOns
      .filter(a => selectedAddOns[a.id]?.on)
      .map(a => ({ id: a.id, quantity: a.unit ? (selectedAddOns[a.id]?.qty ?? 1) : 1 }));
    return {
      dateStr,
      addOnsPayload,
      body: {
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        service: selectedPkg,
        sizeKey: selectedSize,
        date: dateStr,
        time: primarySelection.time,
        addOns: addOnsPayload,
        notes: sessionNotes,
        promoCode: appliedPromo ?? undefined,
        frequency,
        visitCount: selections.length || 1,
        ...(formattedServiceAddress ? { serviceAddress: formattedServiceAddress } : {}),
        ...(serviceAddressCoords ? { lat: serviceAddressCoords.lat, lng: serviceAddressCoords.lng } : {}),
        source: bookingSource,
        utmSource,
        utmMedium,
        utmCampaign,
        sourceEmailId,
        ...(isBusiness && {
          mode: 'business' as const,
          business_name: businessName,
          property_type: propertyType,
        }),
      },
    };
  }, [
    selections, applicableAddOns, selectedAddOns, contactName, contactEmail, contactPhone,
    selectedPkg, selectedSize, sessionNotes, appliedPromo, frequency, formattedServiceAddress,
    serviceAddressCoords, bookingSource, utmSource, utmMedium, utmCampaign, sourceEmailId,
    isBusiness, businessName, propertyType,
  ]);

  /* ── Bootstrap PaymentIntent as soon as step 3 opens (no contact required) ── */
  const bootstrapPaymentIntent = async () => {
    setIntentError(null);
    setIntentLoading(true);

    const built = buildCheckoutPayload();
    if (!built) {
      setIntentError('Please select a date and time before continuing.');
      setIntentLoading(false);
      return;
    }

    const { body } = built;
    const bootstrapBody = {
      service: body.service,
      sizeKey: body.sizeKey,
      date: body.date,
      time: body.time,
      addOns: body.addOns,
      notes: body.notes,
      promoCode: body.promoCode,
      frequency: body.frequency,
      visitCount: selections.length || 1,
      ...(isBusiness && {
        mode: 'business' as const,
        business_name: businessName,
        property_type: propertyType,
      }),
    };

    try {
      const res = await fetch('/api/bookings/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bootstrapBody),
      });

      const data = await res.json() as CreateIntentResponse & { error?: string };

      if (!res.ok) {
        setIntentError(data.error ?? 'Booking failed. Please try again.');
        resetTurnstile();
        setIntentLoading(false);
        return;
      }

      if (data.paymentIntentId) setPaymentIntentId(data.paymentIntentId);
      setStripeAccount(data.stripeAccount);
      setPublishableKey(data.publishableKey);

      if (data.isFree || data.clientSecret === null) {
        setClientSecret(null);
        setCustomerSessionClientSecret(null);
      } else {
        setClientSecret(data.clientSecret);
        if (data.customerSessionClientSecret) setCustomerSessionClientSecret(data.customerSessionClientSecret);
      }

      setCheckoutInitialized(true);
    } catch {
      setIntentError('Network error. Please check your connection and try again.');
    } finally {
      setIntentLoading(false);
    }
  };

  const syncPaymentIntent = useCallback(async (turnstileToken?: string): Promise<boolean> => {
    if (!paymentIntentId || isFreeBooking) return true;
    const built = buildCheckoutPayload();
    if (!built) return false;

    try {
      const res = await fetch('/api/bookings/update-intent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          ...built.body,
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setIntentError(data.error ?? 'Could not update booking details.');
        if (res.status === 403) resetTurnstile();
        return false;
      }
      return true;
    } catch {
      setIntentError('Network error while preparing payment.');
      return false;
    }
  }, [paymentIntentId, isFreeBooking, buildCheckoutPayload, resetTurnstile]);

  /** Run immediately before Stripe charge — verifies Turnstile and stamps PI metadata. */
  const preparePaymentWithTurnstile = useCallback(async (): Promise<boolean> => {
    if (turnstileEnabled) {
      try {
        const token = await getToken();
        return syncPaymentIntent(token);
      } catch {
        setIntentError('Bot verification failed. Please refresh and try again.');
        resetTurnstile();
        return false;
      }
    }
    return syncPaymentIntent();
  }, [turnstileEnabled, getToken, syncPaymentIntent, resetTurnstile]);

  const intentBootstrapReady = step === 3
    && !checkoutInitialized
    && !intentLoading
    && !intentError
    && selections.length > 0
    && !!selections[0]?.time;

  useEffect(() => {
    if (intentBootstrapReady) {
      bootstrapPaymentIntent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentBootstrapReady]);

  useEffect(() => {
    if (step !== 3) {
      setCheckoutInitialized(false);
      setClientSecret(null);
      setPaymentIntentId(null);
      setCustomerSessionClientSecret(null);
    }
  }, [step]);

  /* ── Update intent when cart or contact changes on step 3 (debounced) ── */
  useEffect(() => {
    if (step !== 3 || !paymentIntentId || isFreeBooking || !checkoutInitialized) return;
    const timer = window.setTimeout(() => {
      syncPaymentIntent().catch(console.error);
    }, 450);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddOns, appliedPromo, frequency, contactName, contactEmail, contactPhone, formattedServiceAddress, sessionNotes]);


  /* ── Build booking success state for /booking-success redirect ── */
  const buildSuccessState = () => {
    const primarySel = [...selections].sort((a, b) => (a.year - b.year) || (a.month - b.month) || (a.day - b.day))[0] ?? selections[0];
    const MONTH_NAMES_LOCAL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dateTime = primarySel
      ? `${MONTH_NAMES_LOCAL[primarySel.month]} ${primarySel.day}, ${primarySel.year}${primarySel.time ? ` at ${primarySel.time}` : ''}`
      : '';
    return {
      service: `${PKG_DISPLAY_NAME[selectedPkg as Pkg]} — ${SIZE_LABELS[selectedSize as SizeKey]}`,
      dateTime,
      frequency: frequencyDiscounts[frequency].label,
      total: isFreeBooking ? 'FREE' : `$${grandTotal.toFixed(2)} CAD`,
      isFree: isFreeBooking,
      promoApplied: !!(promoResult?.valid && appliedPromo),
      email: contactEmail || undefined,
    };
  };

  /* ── Paid booking confirmation — called after Stripe succeeds client-side ── */
  const handlePaymentSuccess = async () => {
    if (!paymentIntentId) return;
    setPaymentError(null);
    try {
      const res = await fetch('/api/bookings/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      });
      if (res.ok) {
        tracker.event('booking_checkout_started', { svc: selectedPkg, sz: selectedSize, freq: frequency });
        navigate('/booking-success', { state: buildSuccessState() });
      } else {
        const err = await res.json() as { error?: string };
        setPaymentError(
          err.error ??
          'Your payment was processed but we could not create your booking. Please contact us at hello@example.com',
        );
      }
    } catch {
      setPaymentError(
        'Your payment was processed but we encountered an error. Please contact us at hello@example.com',
      );
    }
  };

  /* ── Free booking confirmation ── */
  const handleFreeBooking = async () => {
    const primarySelection = selections[0];
    if (!primarySelection || !primarySelection.time) return;
    setFreeLoading(true);
    setFreeError(null);
    const dateStr = `${primarySelection.year}-${String(primarySelection.month + 1).padStart(2,'0')}-${String(primarySelection.day).padStart(2,'0')}`;
    const addOnsPayload = applicableAddOns
      .filter(a => selectedAddOns[a.id]?.on)
      .map(a => ({ id: a.id, quantity: a.unit ? (selectedAddOns[a.id]?.qty ?? 1) : 1 }));
    try {
      let turnstileToken: string | undefined;
      if (turnstileEnabled) {
        try {
          turnstileToken = await getToken();
        } catch {
          setFreeError('Bot verification failed. Please refresh and try again.');
          resetTurnstile();
          return;
        }
      }

      const res = await fetch('/api/bookings/confirm-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          service: selectedPkg,
          sizeKey: selectedSize,
          date: dateStr,
          time: primarySelection.time,
          addOns: addOnsPayload,
          notes: sessionNotes,
          promoCode: appliedPromo ?? undefined,
          frequency,
          serviceAddress: unitNumber ? `${serviceAddress}, Unit ${unitNumber}` : serviceAddress,
          ...(serviceAddressCoords ? { lat: serviceAddressCoords.lat, lng: serviceAddressCoords.lng } : {}),
          ...(turnstileToken ? { turnstileToken } : {}),
          // Source attribution
          source: bookingSource,
          utmSource,
          utmMedium,
          utmCampaign,
          sourceEmailId,
        }),
      });
      if (res.ok) {
        tracker.event('booking_checkout_started', { svc: selectedPkg, sz: selectedSize, freq: frequency });
        navigate('/booking-success', { state: buildSuccessState() });
      } else {
        const err = await res.json() as { error?: string };
        setFreeError(err.error ?? 'Could not confirm booking. Please try again.');
      }
    } catch {
      setFreeError('Network error. Please try again.');
    } finally {
      setFreeLoading(false);
    }
  };

  /* nav helpers */
  const prevMonth = () => {
    if (!canGoPrevMonth) return;
    calendarUserNavigatedRef.current = true;
    setDaySlots({});
    setActiveSlotIndex(null);
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    calendarUserNavigatedRef.current = true;
    setDaySlots({});
    setActiveSlotIndex(null);
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  /* day click handler — multi-select toggle */
  const handleDayClick = (day: number) => {
    if (!available.has(day)) return;

    if (selectedDays.has(day)) {
      const newSelections = selections.filter(s => !(s.day === day && s.month === calMonth && s.year === calYear));
      setSelections(newSelections);
      setActiveSlotIndex(newSelections.length > 0 ? newSelections.length - 1 : null);
    } else if (selections.length < maxSlots) {
      const newSelections = [...selections, { day, month: calMonth, year: calYear, time: null }];
      setSelections(newSelections);
      setActiveSlotIndex(newSelections.length - 1);
    }
  };

  /* time selection for the active slot */
  const handleTimeSelect = (slot: AvailabilitySlot) => {
    if (activeSlotIndex === null) return;
    setSelections(prev => prev.map((s, i) => i === activeSlotIndex ? { ...s, time: slot.label, endsBy: slot.endsBy } : s));
  };

  /* frequency change — reset selections */
  const handleFrequencyChange = (freq: Frequency) => {
    setFrequency(freq);
    setSelections([]);
    setActiveSlotIndex(null);
  };

  /* Service changes — update state without clearing calendar selections.
     Frequency changes (handleFrequencyChange) still clear selections as before. */
  const handlePkgChange = (pkg: Pkg) => {
    setSelectedPkg(pkg);
    // Do NOT clear selections — user's calendar picks persist across service changes
    setDaySlots({});
  };

  const toggleAddOn = (key: string) => {
    setSelectedAddOns(prev => {
      const cur = prev[key];
      if (!cur || !cur.on) return { ...prev, [key]: { on: true, qty: 1 } };
      return { ...prev, [key]: { ...cur, on: false } };
    });
  };
  const setAddOnQty = (key: string, qty: number) => {
    setSelectedAddOns(prev => ({ ...prev, [key]: { on: true, qty: Math.max(1, Math.min(10, qty)) } }));
  };

  /* ── shared styles ── */
  const sidebarCard: React.CSSProperties = {
    background: colors.white,
    border: `1px solid ${colors.stone}`,
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
  };
  const sidebarLabel: React.CSSProperties = {
    ...typography.sectionLabel,
    fontSize: '11px',
    color: colors.warmGray,
    marginBottom: '8px',
  };
  const sidebarValue: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: '15px',
    color: colors.charcoal,
    fontWeight: 400,
  };

  const sortedSelections = [...selections].sort((a, b) => (a.year - b.year) || (a.month - b.month) || (a.day - b.day));

  /* ── Active day's time slots ── */
  const activeDay = activeSlotIndex !== null ? selections[activeSlotIndex]?.day : null;
  const activeDayApiSlots: AvailabilitySlot[] = activeDay != null ? (daySlots[activeDay] ?? []) : [];
  const activeDayFallbackSlots = getAvailableSlotsFallback(selectedPkg, selectedSize).map(s => ({
    hour: s.hour,
    label: s.label,
    endsBy: formatCompletionTime(s.label, selectedPkg, selectedSize),
  }));
  // When the live booking API is on, trust its filtered result: an empty list
  // means the day is genuinely full or past, so we must NOT fall back to the
  // unfiltered static slot list (that would re-expose booked/past hours).
  // Fallback is only for mock/disabled mode; API errors already pre-populate
  // daySlots with the fallback inside fetchDaySlots.
  const activeSlots: AvailabilitySlot[] = bookingApiEnabled
    ? activeDayApiSlots
    : (activeDay != null && !dayLoading[activeDay] ? activeDayFallbackSlots : []);
  const isLoadingActiveSlots = activeDay != null && !!dayLoading[activeDay];

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <>

    <div
      style={{ paddingTop: '54px', background: colors.cream, minHeight: '100vh' }}
    >
      <div className="book-outer" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 60px' }}>

        <BookingStepper
          currentStep={step}
          canGoToCheckout={canProceedToCheckout}
          onStepClick={handleStepperClick}
        />

        <style>{`
          /* ── Layout ── */
          .book-layout { display: grid; grid-template-columns: 1fr 300px; gap: 40px; align-items: start; }
          @media (max-width: 900px) { .book-layout { grid-template-columns: 1fr; } }

          /* ── Frequency grid ── */
          .book-freq-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
          @media (max-width: 600px) { .book-freq-grid { grid-template-columns: repeat(2, 1fr); } }

          /* ── Sidebar: desktop sticky → hidden on mobile ── */
          .book-sidebar { position: sticky; top: 66px; }
          @media (max-width: 900px) { .book-sidebar { display: none; } }

          /* ── Calendar day cells ── */
          .book-calendar-day {
            aspect-ratio: 1;
            display: flex; flex-direction: column;
            align-items: flex-start; justify-content: flex-start;
            padding: 10px; font-size: 15px; gap: 4px;
          }
          @media (max-width: 768px) {
            .book-calendar-day { padding: 4px !important; font-size: 12px !important; }
            .book-cal-slot-label { display: none; }
          }

          /* ── Time slots: 2-col → 1-col on mobile ── */
          .book-time-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          @media (max-width: 768px) { .book-time-grid { grid-template-columns: 1fr; } }
          .book-time-btn { min-height: 44px; }

          /* ── Add-ons: 3-col → 2-col → 1-col ── */
          .book-addons-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; }
          @media (max-width: 900px) { .book-addons-grid { grid-template-columns: 1fr 1fr; } }
          @media (max-width: 480px) { .book-addons-grid { grid-template-columns: 1fr; } }

          /* ── Address + Unit row: stack on mobile ── */
          .book-address-row { display: flex; gap: 10px; }
          .book-address-unit { width: 120px; flex-shrink: 0; }
          @media (max-width: 768px) {
            .book-address-row { flex-direction: column; gap: 8px; }
            .book-address-unit { width: 100%; }
          }

          /* ── Promo apply button: 44px touch target ── */
          .book-promo-btn { min-height: 44px; }

          /* ── Nav (calendar prev/next) buttons: 44px on mobile ── */
          .book-nav-btn { min-height: 44px; min-width: 44px; }

          /* ── Frequency option buttons: 44px touch target ── */
          .book-freq-btn { min-height: 44px; }

          /* ── Overall page padding ── */
          @media (max-width: 768px) {
            .book-outer { padding: 0 16px 100px !important; }
          }

          /* ── Mobile sticky bottom bar (step 2) ── */
          .book-mobile-bar {
            display: none;
            position: fixed; bottom: 0; left: 0; right: 0;
            background: #FFFFFF; border-top: 1px solid #E8E2D8;
            padding: 12px 16px;
            align-items: center; justify-content: space-between;
            gap: 12px; z-index: 100;
            box-shadow: 0 -4px 16px rgba(0,0,0,0.08);
          }
          @media (max-width: 900px) { .book-mobile-bar { display: flex; } }

          /* ── Mobile inline order summary (step 3) ── */
          .book-mobile-order-summary { display: none; }
          @media (max-width: 900px) { .book-mobile-order-summary { display: block; } }
        `}</style>
        <div className="book-layout">

          {/* ─── LEFT COLUMN ─── */}
          <div>
            {step === 2 && (
              <>
                {/* ── SERVICE TYPE SELECTOR ── */}
                <div ref={serviceSectionRef} style={{ marginBottom: '24px' }}>
                  <div style={{ ...typography.sectionLabel, fontSize: '12px', color: colors.warmGray, marginBottom: '12px' }}>
                    SERVICE TYPE
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {(PKGS as readonly Pkg[]).map(pkg => {
                      const isSelected = pkg === selectedPkg;
                      const isExpanded = expandedPkg === pkg;
                      return (
                        <div key={pkg} style={{ position: 'relative' }}>
                          <button
                            onClick={() => handlePkgChange(pkg)}
                            style={{
                              width: '100%',
                              padding: '14px 12px 14px 12px',
                              paddingRight: '36px',
                              background: isSelected ? colors.sageGreen : colors.white,
                              border: `1px solid ${isSelected ? colors.sageGreen : colors.stone}`,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              textAlign: 'left' as const,
                            }}
                          >
                            <div style={{
                              fontFamily: fonts.display,
                              fontSize: '15px',
                              fontWeight: 500,
                              color: isSelected ? '#000000' : colors.charcoal,
                              marginBottom: '4px',
                            }}>
                              {PKG_DISPLAY_NAME[pkg]}
                            </div>
                            <div style={{
                              fontFamily: fonts.body,
                              fontSize: '12px',
                              color: isSelected ? '#000000' : colors.sageGreen,
                            }}>
                              ${isBusiness ? getBasePriceForMode(pkg, selectedSize, 'business') : PRICES[pkg as Pkg][selectedSize as SizeKey]}
                            </div>
                          </button>
                          {/* Expand/collapse icon — separate from card select */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPkg(prev => prev === pkg ? null : pkg);
                            }}
                            aria-label={isExpanded ? `Collapse ${PKG_DISPLAY_NAME[pkg]} description` : `Expand ${PKG_DISPLAY_NAME[pkg]} description`}
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '8px',
                              width: '22px',
                              height: '22px',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              color: isSelected ? 'rgba(0,0,0,0.65)' : colors.warmGray,
                              transition: 'color 0.15s ease',
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                              }}
                            >
                              <polyline points="2 5 7 10 12 5" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Collapsible description panel */}
                  <AnimatePresence>
                    {expandedPkg && (
                      <motion.div
                        key={expandedPkg}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          marginTop: '10px',
                          padding: '14px 16px',
                          background: colors.white,
                          borderRadius: '8px',
                          border: `1px solid ${colors.stone}`,
                        }}>
                          <p style={{
                            fontFamily: fonts.body,
                            fontSize: '13px',
                            color: colors.warmGray,
                            margin: '0 0 10px 0',
                            lineHeight: 1.6,
                          }}>
                            {SERVICE_DESC[expandedPkg as Pkg]}
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {(SERVICE_INCLUDES[expandedPkg as Pkg] || []).map((item: string) => (
                              <span key={item} style={{
                                fontFamily: fonts.body,
                                fontSize: '11px',
                                color: colors.charcoal,
                                background: colors.cream,
                                padding: '3px 8px',
                                borderRadius: '16px',
                                border: `1px solid ${colors.stone}`,
                              }}>
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── FREQUENCY SELECTOR ── */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ ...typography.sectionLabel, fontSize: '12px', color: colors.warmGray, marginBottom: '16px' }}>
                      HOW OFTEN?
                    </div>
                    <div className="book-freq-grid">
                      {FREQUENCY_OPTIONS.map(opt => {
                        const isActive = frequency === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => handleFrequencyChange(opt.value)}
                            style={{
                              padding: '16px 12px',
                              background: isActive ? colors.sageGreen : colors.white,
                              border: `1px solid ${isActive ? colors.sageGreen : colors.stone}`,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              textAlign: 'center' as const,
                            }}
                          >
                            <div style={{
                              fontFamily: fonts.body,
                              fontSize: '15px',
                              fontWeight: 500,
                              color: isActive ? '#000000' : colors.charcoal,
                              marginBottom: '4px',
                            }}>
                              {opt.label}
                            </div>
                            <div style={{
                              fontFamily: fonts.body,
                              fontSize: '11px',
                              color: isActive ? '#000000' : colors.warmGray,
                              lineHeight: 1.3,
                            }}>
                              {opt.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                {/* Calendar header */}
                <div ref={scheduleSectionRef}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <span style={{ ...typography.sectionLabel, fontSize: '13px', color: colors.warmGray }}>
                    {MONTH_NAMES[calMonth].toUpperCase()} {calYear}
                    {monthLoading && <span style={{ marginLeft: '8px', fontSize: '11px', opacity: 0.6 }}>loading…</span>}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={prevMonth}
                      disabled={!canGoPrevMonth}
                      style={{
                        ...navBtn,
                        opacity: canGoPrevMonth ? 1 : 0.35,
                        cursor: canGoPrevMonth ? 'pointer' : 'not-allowed',
                      }}
                      className="book-nav-btn"
                    >‹</button>
                    <button onClick={nextMonth} style={navBtn} className="book-nav-btn">›</button>
                  </div>
                </div>

                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', marginBottom: '4px' }}>
                  {DAY_HEADERS.map(d => (
                    <div key={d} style={{ ...typography.sectionLabel, fontSize: '12px', color: colors.warmGray, textAlign: 'left', padding: '0 0 8px 8px' }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`e${i}`} style={emptyCell} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isAvailable = available.has(day);
                    const isSelected = selectedDays.has(day);
                    const selIndex = selections.findIndex(s => s.day === day);
                    const isActiveSlot = activeSlotIndex !== null && selIndex === activeSlotIndex;
                    const isFull = selections.length >= maxSlots && !isSelected;
                    const hasTime = selIndex >= 0 && selections[selIndex].time !== null;
                    const slotCount = isAvailable ? getSlotCountForDay(day) : 0;

                    return (
                      <div
                        key={day}
                        onClick={() => { if (isAvailable && !isFull) handleDayClick(day); }}
                        className="book-calendar-day"
                        style={{
                          fontFamily: fonts.body,
                          fontWeight: 400,
                          color: isSelected || isActiveSlot
                            ? '#000000'
                            : isAvailable && !isFull
                              ? colors.creamText
                              : colors.stone,
                          background: isSelected || isActiveSlot
                            ? colors.sageGreen
                            : isAvailable && !isFull
                              ? '#1a1a1a'
                              : '#0a0a0a',
                          cursor: isAvailable && !isFull ? 'pointer' : 'default',
                          borderRadius: '4px',
                          transition: 'background 0.15s ease, border-color 0.15s ease',
                          border: `1px solid ${isSelected || isActiveSlot
                            ? colors.sageGreen
                            : isAvailable && !isFull
                              ? '#333333'
                              : colors.stone}`,
                          gap: '4px',
                          position: 'relative',
                        }}
                      >
                        <span>{day}</span>
                        {isAvailable && !isFull && !isSelected && (
                          <span className="book-cal-slot-label" style={{
                            fontSize: '9px',
                            fontWeight: 400,
                            letterSpacing: '0.02em',
                            color: colors.sageGreen,
                            lineHeight: 1.2,
                          }}>
                            {slotCount > 0 ? `${slotCount} slot${slotCount !== 1 ? 's' : ''}` : 'avail'}
                          </span>
                        )}
                        {isSelected && (
                          <span style={{
                            fontSize: CAL_SELECTED_LABEL_FONT,
                            fontWeight: 500,
                            letterSpacing: '0.01em',
                            color: hasTime ? '#000000' : 'rgba(0,0,0,0.65)',
                            lineHeight: 1.25,
                          }}>
                            {formatCalendarSelectionLabel(selections[selIndex], frequency)}
                          </span>
                        )}
                        {isSelected && selections.length > 1 && (
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: hasTime ? '#000000' : 'rgba(0,0,0,0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: 600,
                            color: hasTime ? colors.sageGreen : '#000000',
                          }}>
                            {selIndex + 1}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── SELECTED DAYS CHIPS ── */}
                {selections.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px' }}>
                    {sortedSelections.map((sel) => {
                      const idx = selections.findIndex(s => s.day === sel.day && s.month === sel.month && s.year === sel.year);
                      const isActive = idx === activeSlotIndex;
                      return (
                        <button
                          key={`${sel.year}-${sel.month}-${sel.day}`}
                          onClick={() => setActiveSlotIndex(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            background: isActive ? colors.sageGreen : colors.white,
                            border: `1px solid ${isActive ? colors.sageGreen : sel.time ? colors.sageLight : colors.gold}`,
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontFamily: fonts.body,
                            fontSize: '14px',
                            color: isActive ? '#000000' : colors.charcoal,
                            fontWeight: isActive ? 600 : 400,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ textAlign: 'left' as const, lineHeight: 1.3 }}>
                            {formatCalendarSelectionLabel(sel, frequency)}
                          </span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              const newSelections = selections.filter(s => !(s.day === sel.day && s.month === sel.month && s.year === sel.year));
                              setSelections(newSelections);
                              setActiveSlotIndex(newSelections.length > 0 ? 0 : null);
                            }}
                            style={{
                              fontSize: '12px',
                              opacity: 0.5,
                              marginLeft: '2px',
                              cursor: 'pointer',
                            }}
                          >
                            ×
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── TIME SLOTS ── */}
                {activeSlotIndex !== null && selections[activeSlotIndex] && (
                  <div style={{ marginTop: '32px' }}>
                    <div style={{ ...typography.sectionLabel, fontSize: '12px', color: colors.warmGray, marginBottom: '16px' }}>
                      {selections.length > 1
                        ? `PICK A TIME — ${MONTH_NAMES[calMonth].toUpperCase()} ${selections[activeSlotIndex].day} (SESSION ${activeSlotIndex + 1} OF ${selections.length})`
                        : `AVAILABLE START TIMES — ${MONTH_NAMES[calMonth].toUpperCase()} ${selections[activeSlotIndex].day}`
                      }
                    </div>

                    {isLoadingActiveSlots ? (
                      <div style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.warmGray, padding: '20px 0' }}>Loading available times…</div>
                    ) : activeSlots.length === 0 ? (
                      <div style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.warmGray, padding: '20px 0' }}>No available times for this day.</div>
                    ) : (
                      <div className="book-time-grid">
                        {activeSlots.map(slot => {
                          const isSel = slot.label === selections[activeSlotIndex]?.time;
                          return (
                            <button
                              key={slot.label}
                              onClick={() => handleTimeSelect(slot)}
                              className="book-time-btn"
                              style={{
                                padding: '14px 16px',
                                fontFamily: fonts.body,
                                fontSize: '15px',
                                fontWeight: 400,
                                color: isSel ? '#000000' : colors.charcoal,
                                background: isSel ? colors.sageGreen : colors.white,
                                border: `1px solid ${isSel ? colors.sageGreen : colors.stone}`,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                letterSpacing: '0.01em',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <span>{slot.label}</span>
                              <span style={{ fontSize: '12px', opacity: isSel ? 0.75 : 0.65 }}>done by {slot.endsBy}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                {/* ── Mobile inline order summary (step 3, ≤900px) ── */}
                <div className="book-mobile-order-summary">
                  <div style={{ background: colors.white, border: `1px solid ${colors.stone}`, borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                    <div style={{ ...typography.sectionLabel, fontSize: '11px', color: colors.warmGray, marginBottom: '10px' }}>ORDER SUMMARY</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.charcoal }}>{PKG_DISPLAY_NAME[selectedPkg as Pkg]}{isBusiness ? ' (Business)' : ''}</span>
                      <span style={{ fontFamily: fonts.body, fontSize: '14px', fontWeight: 500, color: colors.charcoal }}>${basePrice}</span>
                    </div>
                    {sortedSelections[0] && (
                      <div style={{ fontFamily: fonts.body, fontSize: '13px', color: colors.warmGray, marginBottom: '4px' }}>
                        {MONTH_NAMES[sortedSelections[0].month]} {sortedSelections[0].day}{sortedSelections[0].time ? ` at ${sortedSelections[0].time}` : ''}
                      </div>
                    )}
                    {addOnTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontFamily: fonts.body, fontSize: '13px', color: colors.warmGray }}>Add-ons</span>
                        <span style={{ fontFamily: fonts.body, fontSize: '13px', color: colors.warmGray }}>+${addOnTotal}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: `1px solid ${colors.stone}`, marginTop: '4px' }}>
                      <span style={{ fontFamily: fonts.body, fontSize: '14px', fontWeight: 500, color: colors.charcoal }}>Total (incl. GST)</span>
                      <span style={{ fontFamily: fonts.body, fontSize: '15px', fontWeight: 500, color: isFreeBooking ? colors.sageGreen : colors.charcoal }}>
                        {isFreeBooking ? 'FREE' : `$${grandTotal.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* YOUR INFO */}
                <div style={{ ...typography.sectionLabel, fontSize: '12px', marginBottom: '16px' }}>YOUR INFO</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>

                  {/* Business Name + Property Type (business mode only) */}
                  {isBusiness && (
                    <>
                      <div>
                        <input
                          placeholder="Business Name"
                          value={businessName}
                          onChange={e => {
                            setBusinessName(e.target.value);
                            if (businessNameError) setBusinessNameError(e.target.value.trim() ? '' : 'Business name is required');
                            if (intentError) setIntentError(null);
                          }}
                          onBlur={e => setBusinessNameError(e.target.value.trim() ? '' : 'Business name is required')}
                          style={{ ...inputStyle, borderColor: businessNameError ? '#df1b41' : undefined }}
                        />
                        {businessNameError && <div style={fieldError}>{businessNameError}</div>}
                      </div>
                      <div>
                        <select
                          value={propertyType}
                          onChange={e => { setPropertyType(e.target.value); if (intentError) setIntentError(null); }}
                          style={{
                            ...inputStyle,
                            appearance: 'none' as const,
                            WebkitAppearance: 'none' as const,
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 14px center',
                            paddingRight: '36px',
                            color: propertyType ? undefined : '#9B958C',
                          }}
                        >
                          <option value="" disabled>Property Type</option>
                          {site.booking.checkout.propertyTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Full Name */}
                  <div>
                    <input
                      placeholder="Full Name"
                      value={contactName}
                      onChange={e => {
                        // Auto-capitalize each word
                        const val = e.target.value.replace(/\b\w/g, c => c.toUpperCase());
                        setContactName(val);
                        if (nameError) setNameError(validateName(val));
                        if (intentError) setIntentError(null);
                      }}
                      onBlur={e => setNameError(validateName(e.target.value))}
                      style={{ ...inputStyle, borderColor: nameError ? '#df1b41' : undefined }}
                    />
                    {nameError && <div style={fieldError}>{nameError}</div>}
                  </div>

                  {/* Email */}
                  <div>
                    <input
                      placeholder="Email"
                      type="email"
                      value={contactEmail}
                      onChange={e => { setContactEmail(e.target.value); if (emailError) setEmailError(validateEmail(e.target.value)); if (intentError) setIntentError(null); }}
                      onBlur={e => setEmailError(validateEmail(e.target.value))}
                      style={{ ...inputStyle, borderColor: emailError ? '#df1b41' : undefined }}
                    />
                    {emailError && <div style={fieldError}>{emailError}</div>}
                  </div>

                  {/* Phone */}
                  <div>
                    <PhoneInput
                      value={contactPhone}
                      onChange={(val) => {
                        setContactPhone(val);
                        if (phoneError) setPhoneError(validatePhone(val));
                        if (intentError) setIntentError(null);
                      }}
                      onBlur={() => setPhoneError(validatePhone(contactPhone))}
                      borderColor={phoneError ? '#df1b41' : undefined}
                    />
                    {phoneError && <div style={fieldError}>{phoneError}</div>}
                  </div>

                  {/* Address row — optional per tenant (VITE_BOOKING_REQUIRES_ADDRESS) */}
                  {bookingRequiresAddress && (
                  <div className="book-address-row">
                    <div style={{ flex: 1 }}>
                      <LazyAddressField
                        placeholder={site.booking.checkout.addressPlaceholder}
                        value={serviceAddress}
                        onChange={setServiceAddress}
                        onSelect={(r: AddressResult) => { setServiceAddress(r.formatted); setServiceAddressCoords({ lat: r.lat, lng: r.lng }); }}
                        style={inputStyle}
                      />
                    </div>
                    <div className="book-address-unit">
                      <input
                        placeholder="Unit # (opt.)"
                        value={unitNumber}
                        onChange={e => setUnitNumber(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  )}

                </div>

                {/* ADD-ONS */}
                <div style={{ ...typography.sectionLabel, fontSize: '12px', marginBottom: '16px' }}>ADD-ONS</div>
                <div>
                  <div className="book-addons-grid">
                    {applicableAddOns.map(a => {
                      const state = selectedAddOns[a.id];
                      const isOn = state?.on;
                      const qty = state?.qty || 1;
                      const hasQty = !!a.unit;
                      const isExpanded = expandedAddOn === a.id;
                      return (
                        <div
                          key={a.id}
                          style={{
                            border: `1px solid ${isOn || isExpanded ? colors.sageGreen : colors.stone}`,
                            borderRadius: '6px',
                            background: isOn ? 'rgba(115,115,115,0.08)' : colors.white,
                            transition: 'border-color 0.15s ease, background 0.15s ease',
                          }}
                        >
                          <div
                            onClick={() => !hasQty && toggleAddOn(a.id)}
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: '10px 12px',
                              cursor: hasQty ? 'default' : 'pointer',
                              gap: `${ADDON_CARD_GAP}px`,
                              minHeight: '56px',
                            }}
                          >
                            <span
                              style={{
                                width: ADDON_ICON_SIZE + ADDON_ICON_PADDING * 2,
                                height: ADDON_ICON_SIZE + ADDON_ICON_PADDING * 2,
                                padding: ADDON_ICON_PADDING,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {ADDON_ICONS[a.id]}
                            </span>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                flexWrap: 'nowrap',
                              }}>
                                <span style={{
                                  fontFamily: fonts.body,
                                  fontSize: '12px',
                                  color: colors.charcoal,
                                  fontWeight: isOn ? 500 : 400,
                                  lineHeight: 1.3,
                                }}>
                                  {a.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedAddOn(prev => prev === a.id ? null : a.id);
                                  }}
                                  aria-label={isExpanded ? `Hide ${a.label} details` : `Show ${a.label} details`}
                                  aria-expanded={isExpanded}
                                  style={{
                                    flexShrink: 0,
                                    width: '16px',
                                    height: '16px',
                                    padding: 0,
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: isExpanded ? colors.sageGreen : colors.warmGray,
                                    transition: 'color 0.15s ease',
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                    <circle cx="7" cy="7" r="6.25" stroke="currentColor" strokeWidth="1.25" />
                                    <circle cx="7" cy="4.25" r="0.85" fill="currentColor" stroke="none" />
                                    <line x1="7" y1="6.25" x2="7" y2="10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                              <div style={{ fontFamily: fonts.body, fontSize: '11px', color: colors.warmGray, marginTop: '2px' }}>
                                +${hasQty && isOn ? a.price * qty : a.price}{a.unit ? `/${a.unit}` : ''}
                              </div>
                            </div>

                            {hasQty ? (
                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  onClick={e => { e.stopPropagation(); if (!isOn) { toggleAddOn(a.id); } else if (qty <= 1) { toggleAddOn(a.id); } else { setAddOnQty(a.id, qty - 1); } }}
                                  style={{ ...inlineQtyBtn, opacity: 1 }}
                                >−</button>
                                <span style={{ fontFamily: fonts.body, fontSize: '12px', color: isOn ? colors.charcoal : colors.warmGray, minWidth: '14px', textAlign: 'center' }}>
                                  {isOn ? qty : 0}
                                </span>
                                <button
                                  onClick={e => { e.stopPropagation(); if (!isOn) { toggleAddOn(a.id); } else { setAddOnQty(a.id, qty + 1); } }}
                                  style={inlineQtyBtn}
                                >+</button>
                              </div>
                            ) : isOn ? (
                              <svg width="16" height="16" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                                <circle cx="7" cy="7" r="7" fill={colors.sageGreen}/>
                                <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <AnimatePresence initial={false}>
                    {expandedAddOn && (() => {
                      const expanded = applicableAddOns.find(a => a.id === expandedAddOn);
                      if (!expanded) return null;
                      return (
                        <motion.div
                          key={expandedAddOn}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{
                            marginTop: '10px',
                            padding: '14px 16px',
                            background: colors.white,
                            borderRadius: '8px',
                            border: `1px solid ${colors.stone}`,
                          }}>
                            <p style={{
                              fontFamily: fonts.body,
                              fontSize: '13px',
                              color: colors.warmGray,
                              margin: 0,
                              lineHeight: 1.6,
                              maxWidth: '72ch',
                            }}>
                              {expanded.description}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>

                {/* JOB NOTES */}
                <div style={{ marginTop: '24px' }}>
                  <div style={{ ...typography.sectionLabel, fontSize: '12px', marginBottom: '12px' }}>{site.booking.checkout.notesLabel}</div>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      placeholder={site.booking.checkout.notesPlaceholder}
                      value={sessionNotes}
                      onChange={e => setSessionNotes(e.target.value.slice(0, 120))}
                      style={{ ...textareaStyle, paddingBottom: '28px', width: '100%', resize: 'none' }}
                    />
                    <div style={{
                      position: 'absolute', bottom: '8px', right: '12px',
                      fontFamily: fonts.body, fontSize: '11px',
                      color: sessionNotes.length >= 110 ? colors.gold : colors.warmGray,
                      opacity: 0.8,
                    }}>
                      {sessionNotes.length}/120
                    </div>
                  </div>
                </div>

                {/* PROMO CODE */}
                <div style={{ ...typography.sectionLabel, fontSize: '12px', marginBottom: '12px' }}>PROMO CODE</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); setAppliedPromo(null); }}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={handlePromoValidate}
                    disabled={promoLoading || !promoCode.trim()}
                    className="book-promo-btn"
                    style={{
                      padding: '14px 20px',
                      background: promoLoading || !promoCode.trim() ? colors.stone : colors.sageGreen,
                      color: promoLoading || !promoCode.trim() ? colors.warmGray : colors.cream,
                      border: 'none',
                      borderRadius: '6px',
                      fontFamily: fonts.body,
                      fontSize: '14px',
                      cursor: promoLoading || !promoCode.trim() ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s ease',
                      whiteSpace: 'normal' as const,
                    }}
                  >
                    {promoLoading ? 'Checking…' : 'Apply'}
                  </button>
                </div>
                {promoResult && (
                  <div style={{
                    padding: '10px 14px',
                    background: promoResult.valid ? 'rgba(115,115,115,0.08)' : 'rgba(223,27,65,0.06)',
                    border: `1px solid ${promoResult.valid ? colors.sageLight : 'rgba(223,27,65,0.3)'}`,
                    borderRadius: '6px',
                    fontFamily: fonts.body,
                    fontSize: '13px',
                    color: promoResult.valid ? colors.sageGreen : '#df1b41',
                    marginBottom: '24px',
                  }}>
                    {promoResult.valid
                      ? `✓ ${promoResult.description ?? 'Promo applied!'}`
                      : `✗ ${promoResult.reason ?? 'Invalid code'}`
                    }
                  </div>
                )}

                {/* PAYMENT section label */}
                <div style={{ ...typography.sectionLabel, fontSize: '12px', marginBottom: '12px', marginTop: '8px' }}>PAYMENT</div>

                {/* Error from create-intent */}
                {intentError && (
                  <div role="alert" style={{
                    padding: '12px 16px',
                    background: 'rgba(223,27,65,0.06)',
                    border: '1px solid rgba(223,27,65,0.3)',
                    borderRadius: '6px',
                    fontFamily: fonts.body,
                    fontSize: '14px',
                    color: '#df1b41',
                    marginBottom: '20px',
                  }}>
                    {intentError}
                  </div>
                )}

                {/* $0 free booking flow */}
                {isFreeBooking && clientSecret === null && (
                  <div style={{
                    background: 'rgba(115,115,115,0.08)',
                    border: `1px solid ${colors.sageLight}`,
                    borderRadius: '8px',
                    padding: '24px',
                    marginBottom: '32px',
                    textAlign: 'center' as const,
                  }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
                    <div style={{ fontFamily: fonts.body, fontSize: '16px', color: colors.charcoal, fontWeight: 500, marginBottom: '4px' }}>
                      Your promo covers this booking!
                    </div>
                    <div style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.warmGray, marginBottom: '20px' }}>
                      No payment required.
                    </div>
                    {freeError && (
                      <div style={{ color: '#df1b41', fontFamily: fonts.body, fontSize: '14px', marginBottom: '12px' }}>{freeError}</div>
                    )}
                    <Button variant="primary" fullWidth onClick={handleFreeBooking} disabled={!contactValid || freeLoading}>
                      {freeLoading ? 'Confirming…' : 'Confirm Free Booking'}
                    </Button>
                  </div>
                )}

                {/* Stripe Payment Element — lazy-loaded on checkout step */}
                {!isFreeBooking && (clientSecret || intentLoading) && (
                  <Suspense fallback={
                    <div style={{
                      background: colors.white,
                      border: `1px solid ${colors.stone}`,
                      borderRadius: '8px',
                      padding: '24px',
                      marginBottom: '32px',
                      textAlign: 'center' as const,
                      fontFamily: fonts.body,
                      fontSize: '14px',
                      color: colors.warmGray,
                    }}>
                      Loading payment form…
                    </div>
                  }>
                    <BookStripeCheckout
                      clientSecret={clientSecret}
                      intentLoading={intentLoading}
                      customerSessionClientSecret={customerSessionClientSecret}
                      publishableKey={publishableKey}
                      stripeAccount={stripeAccount}
                      contactName={contactName}
                      contactEmail={contactEmail}
                      contactPhone={contactPhone}
                      contactValid={contactValid}
                      grandTotal={grandTotal}
                      frequencyLabel={frequencyDiscounts[frequency].label}
                      billingSameAsService={billingSameAsService}
                      onBillingSameChange={setBillingSameAsService}
                      billingAddress={billingAddress}
                      onBillingAddressChange={setBillingAddress}
                      paymentError={paymentError}
                      onBeforeConfirm={preparePaymentWithTurnstile}
                      onSuccess={handlePaymentSuccess}
                      onError={setIntentError}
                    />
                  </Suspense>
                )}

                <p style={{
                  fontFamily: fonts.body,
                  fontSize: '11px',
                  color: colors.warmGray,
                  lineHeight: 1.6,
                  marginTop: '16px',
                  maxWidth: 'none',
                  textAlign: 'center' as const,
                }}>
                  {site.booking.checkout.termsAcknowledgment}
                </p>
              </>
            )}
          </div>

          {/* ─── RIGHT SIDEBAR (desktop only, hidden on ≤900px) ─── */}
          <div className="book-sidebar">
            <div style={{ ...typography.sectionLabel, fontSize: '11px', marginBottom: '16px' }}>
              {step === 2 ? 'YOUR BOOKING' : 'ORDER SUMMARY'}
            </div>

            {/* Service card */}
            <div style={sidebarCard}>
              <div style={sidebarLabel}>SERVICE</div>
              <div style={{ ...sidebarValue, fontWeight: 500 }}>
                {PKG_DISPLAY_NAME[selectedPkg as Pkg]}{isBusiness ? ' (Business)' : ''}
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: '13px', color: colors.warmGray, marginTop: '2px' }}>
                ${basePrice} per visit
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: '13px', color: colors.warmGray, marginTop: '8px', lineHeight: 1.5, fontStyle: 'italic' }}>
                {SERVICE_DESC[selectedPkg as Pkg]}
              </div>
              {step === 3 && (
                <div style={{ marginTop: '10px', borderTop: `1px solid ${colors.stone}`, paddingTop: '10px' }}>
                  <div style={{ fontFamily: fonts.body, fontWeight: 500, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: colors.warmGray, marginBottom: '6px' }}>
                    INCLUDED
                  </div>
                  {(SERVICE_INCLUDES[selectedPkg as Pkg] || []).map((item: string, idx: number) => (
                    <div key={idx} style={{ fontFamily: fonts.body, fontSize: '12px', color: colors.charcoal, display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px', lineHeight: 1.4 }}>
                      <span style={{ color: colors.sageGreen, fontSize: '10px', marginTop: '3px', flexShrink: 0 }}>✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Frequency card */}
            <div style={sidebarCard}>
              <div style={sidebarLabel}>FREQUENCY</div>
              <div style={{ ...sidebarValue, fontWeight: 500 }}>{frequencyDiscounts[frequency].label}</div>
              {discountInfo.discount > 0 && (
                <div style={{
                  display: 'inline-block',
                  marginTop: '6px',
                  padding: '3px 8px',
                  background: 'rgba(115,115,115,0.1)',
                  borderRadius: '4px',
                  fontFamily: fonts.body,
                  fontSize: '12px',
                  color: colors.sageGreen,
                  fontWeight: 500,
                }}>
                  {discountInfo.description}
                </div>
              )}
            </div>

            {/* Schedule card */}
            <div style={sidebarCard}>
              <div style={sidebarLabel}>
                {selections.length <= 1 ? 'DATE & TIME' : `SCHEDULED SESSIONS (${selections.length}/${maxSlots})`}
              </div>
              {selections.length === 0 ? (
                <div style={{ ...sidebarValue, color: colors.warmGray }}>—</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sortedSelections.map((sel, i) => (
                    <div key={`${sel.year}-${sel.month}-${sel.day}`} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: selections.length > 1 ? '6px 0' : '0',
                      borderBottom: selections.length > 1 && i < sortedSelections.length - 1 ? `1px solid ${colors.stone}` : 'none',
                    }}>
                      <div>
                        <div style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.charcoal, lineHeight: 1.35 }}>
                          {formatCalendarSelectionLabel(sel, frequency)}
                        </div>
                        {sel.time && sel.endsBy && (
                          <div style={{ fontFamily: fonts.body, fontSize: '12px', color: colors.sageGreen, marginTop: '2px' }}>
                            done by {sel.endsBy ?? formatCompletionTime(sel.time, selectedPkg, selectedSize)}
                          </div>
                        )}
                      </div>
                      {sel.time ? (
                        <span style={{ color: colors.sageGreen, fontSize: '12px' }}>✓</span>
                      ) : (
                        <span style={{ color: colors.gold, fontSize: '11px', fontFamily: fonts.body }}>needs time</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add-ons summary on checkout step */}
            {step === 3 && addOnTotal > 0 && (
              <div style={sidebarCard}>
                <div style={sidebarLabel}>ADD-ONS</div>
                {applicableAddOns.filter(a => selectedAddOns[a.id]?.on).map(a => {
                  const st = selectedAddOns[a.id];
                  return (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.charcoal }}>
                        {a.label}{a.unit && st ? ` × ${st.qty}` : ''}
                      </span>
                      <span style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.warmGray }}>
                        ${a.price * (a.unit && st ? st.qty : 1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cancellation policy on checkout */}
            {step === 3 && (
              <div style={sidebarCard}>
                <div style={sidebarLabel}>CANCELLATION POLICY</div>
                <div style={{ fontFamily: fonts.body, fontSize: '13px', color: colors.warmGray, lineHeight: 1.5 }}>
                  {site.booking.checkout.cancellationPolicy}
                </div>
              </div>
            )}

            {/* Pricing breakdown on checkout */}
            {step === 3 && (
              <div style={{ borderTop: `1px solid ${colors.stone}`, marginTop: '8px', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.warmGray }}>
                    {quotePriceOverrideDollars != null ? 'Subtotal' : (frequency === 'one-time' ? 'Subtotal' : `Per visit`)}
                  </span>
                  <span style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.warmGray }}>${(quotePriceOverrideDollars != null ? subtotalAfterAllDiscounts : perVisitSubtotal).toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.sageGreen }}>
                      {frequencyDiscounts[frequency].label} discount
                    </span>
                    <span style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.sageGreen }}>−${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {promoDiscountAmount > 0 && quotePriceOverrideDollars == null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.sageGreen }}>Promo ({appliedPromo})</span>
                    <span style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.sageGreen }}>−${promoDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.warmGray }}>GST (5%)</span>
                  <span style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.warmGray }}>
                    ${gstAmount.toFixed(2)}
                  </span>
                </div>
                {frequency !== 'one-time' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingTop: '8px', borderTop: `1px solid ${colors.stone}` }}>
                    <span style={{ fontFamily: fonts.body, fontSize: '13px', color: colors.warmGray }}>
                      {totalVisits} visit{totalVisits !== 1 ? 's' : ''} this month
                    </span>
                    <span style={{ fontFamily: fonts.body, fontSize: '13px', color: colors.warmGray }}>
                      ${perVisitTotal.toFixed(2)} each
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: `1px solid ${colors.stone}` }}>
                  <span style={{ fontFamily: fonts.body, fontSize: '16px', fontWeight: 500, color: colors.charcoal }}>
                    {frequency === 'one-time' ? 'Total' : 'Total this month'}
                  </span>
                  <span style={{ fontFamily: fonts.body, fontSize: '18px', fontWeight: 500, color: isFreeBooking ? colors.sageGreen : colors.charcoal }}>
                    {isFreeBooking ? 'FREE' : `$${grandTotal.toFixed(2)}`}
                  </span>
                </div>
              </div>
            )}

            {/* Continue button on schedule step */}
            {step === 2 && (
              <div style={{ marginTop: '16px' }}>
                <Button
                  variant="primary"
                  fullWidth
                  size="large"
                  disabled={!canProceedToCheckout}
                  onClick={attemptContinueToStep3}
                >
                  Continue to Checkout →
                </Button>
              </div>
            )}


          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom bar (step 2, ≤900px) ── */}
      {step === 2 && (
        <div className="book-mobile-bar">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: fonts.body, fontSize: '14px', fontWeight: 500, color: colors.charcoal, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {PKG_DISPLAY_NAME[selectedPkg as Pkg]}{isBusiness ? ' (Business)' : ''}
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: '13px', color: colors.warmGray, marginTop: '2px' }}>
              {scheduleComplete && selections[0]?.time
                ? `${MONTH_NAMES[selections[0].month]} ${selections[0].day} · ${selections[0].time} · $${grandTotal.toFixed(2)}`
                : `$${basePrice} per visit`}
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <Button
              variant="primary"
              size="default"
              disabled={!canProceedToCheckout}
              onClick={attemptContinueToStep3}
            >
              Continue →
            </Button>
          </div>
        </div>
      )}
    </div>

      {/* Cloudflare Turnstile — invisible bot protection */}
      <div ref={turnstileRef} aria-hidden="true" />
    </>
  );
}

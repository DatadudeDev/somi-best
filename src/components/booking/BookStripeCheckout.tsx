/**
 * Stripe Payment Element — lazy-loaded on checkout step only.
 */
import { useMemo } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import PaymentForm from '../ui/PaymentForm';
import LazyAddressField from '../ui/LazyAddressField';
import { getStripe, getStripeFor, hasStripeKey } from '../../lib/stripe';
import { STRIPE_APPEARANCE, inputStyle } from '../../lib/booking/booking-styles';
import { colors, fonts } from '../../styles/tokens';
import { site } from '../../config/site';

export interface BookStripeCheckoutProps {
  clientSecret: string | null;
  intentLoading: boolean;
  customerSessionClientSecret?: string | null;
  publishableKey?: string;
  stripeAccount?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactValid: boolean;
  grandTotal: number;
  frequencyLabel: string;
  billingSameAsService: boolean;
  onBillingSameChange: (v: boolean) => void;
  billingAddress: string;
  onBillingAddressChange: (v: string) => void;
  paymentError: string | null;
  onBeforeConfirm: () => Promise<boolean>;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function BookStripeCheckout({
  clientSecret,
  intentLoading,
  customerSessionClientSecret,
  publishableKey,
  stripeAccount,
  contactName,
  contactEmail,
  contactPhone,
  contactValid,
  grandTotal,
  frequencyLabel,
  billingSameAsService,
  onBillingSameChange,
  billingAddress,
  onBillingAddressChange,
  paymentError,
  onBeforeConfirm,
  onSuccess,
  onError,
}: BookStripeCheckoutProps) {
  const stripePromise = useMemo((): Promise<Stripe | null> | null => {
    if (publishableKey) return getStripeFor(publishableKey, stripeAccount);
    return getStripe();
  }, [publishableKey, stripeAccount]);

  if (!clientSecret && !intentLoading) return null;

  return (
    <div style={{
      background: colors.white,
      border: `1px solid ${colors.stone}`,
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '32px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <svg width="38" height="16" viewBox="0 0 38 16" fill="none" aria-hidden="true">
          <rect width="38" height="16" rx="3" fill="#635BFF" />
          <text x="4" y="12" fill="white" fontSize="9" fontFamily="sans-serif">stripe</text>
        </svg>
        <span style={{ fontFamily: fonts.body, fontSize: '13px', color: colors.warmGray }}>Secured by Stripe</span>
      </div>

      {clientSecret && stripePromise && (hasStripeKey || publishableKey) ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            ...(customerSessionClientSecret ? { customerSessionClientSecret } : {}),
            appearance: STRIPE_APPEARANCE,
            loader: 'never',
          }}
        >
          <PaymentForm
            returnUrl={window.location.origin + '/book/confirmation'}
            billingDetails={{
              name: contactName,
              email: contactEmail,
              phone: contactPhone,
            }}
            total={grandTotal}
            frequencyLabel={frequencyLabel}
            canSubmit={contactValid}
            onBeforeConfirm={onBeforeConfirm}
            onSuccess={onSuccess}
            onError={onError}
          />
        </Elements>
      ) : clientSecret ? (
        <p style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.warmGray, lineHeight: 1.6, margin: 0 }}>
          Stripe is not configured for local preview. Copy <code>.env.example</code> to <code>.env</code> and set{' '}
          <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to enable the payment form.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px 0' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke={colors.stone} strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke={colors.sageGreen} strokeWidth="3" strokeLinecap="round" />
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.warmGray }}>Loading payment form…</span>
        </div>
      )}

      {paymentError && (
        <div style={{
          background: '#fff0f0',
          border: '1px solid #ffcccc',
          borderRadius: '6px',
          padding: '12px 16px',
          marginTop: '16px',
          fontFamily: 'inherit',
          fontSize: '14px',
          color: '#c0392b',
          lineHeight: 1.5,
        }}>
          {paymentError}
        </div>
      )}

      <label style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        marginTop: '16px',
        cursor: 'pointer',
        paddingTop: '16px',
        borderTop: '1px solid ' + colors.stone,
      }}>
        <input
          type="checkbox"
          checked={billingSameAsService}
          onChange={(e) => onBillingSameChange(e.target.checked)}
          style={{ marginTop: '3px', accentColor: colors.sageGreen, width: '16px', height: '16px', flexShrink: 0 }}
        />
        <span style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.charcoal, lineHeight: 1.5 }}>
          {site.booking.checkout.billingSameLabel}
        </span>
      </label>
      {!billingSameAsService && (
        <LazyAddressField
          placeholder="Billing Address"
          value={billingAddress}
          onChange={onBillingAddressChange}
          onSelect={(r) => onBillingAddressChange(r.formatted)}
          style={{ ...inputStyle, marginTop: '12px' }}
        />
      )}
    </div>
  );
}

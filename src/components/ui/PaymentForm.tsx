import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { colors, fonts } from '../../styles/tokens';

interface PaymentFormProps {
  /** Return URL after successful payment confirmation */
  returnUrl: string;
  /** Called when confirmPayment succeeds (booking confirmed client-side) */
  onSuccess?: () => void;
  /** Called when confirmPayment fails */
  onError?: (message: string) => void;
  /** Grand total in dollars — displayed on the button */
  total: number;
  /** Label for the frequency type, e.g. "Weekly Booking" */
  frequencyLabel: string;
  /** Whether form is submitting from parent */
  isSubmitting?: boolean;
}

export default function PaymentForm({
  returnUrl,
  onSuccess,
  onError,
  total,
  frequencyLabel,
  isSubmitting: parentSubmitting = false,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });

    if (error) {
      const msg = error.message ?? 'Payment failed. Please try again.';
      setErrorMessage(msg);
      onError?.(msg);
      setLoading(false);
    } else {
      // redirect: 'if_required' means 3DS was not needed; payment succeeded in-place
      onSuccess?.();
      setLoading(false);
    }
  };

  const isDisabled = loading || parentSubmitting || !stripe || !elements;

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        id="stripe-payment-element"
        options={{
          layout: 'tabs',
        }}
      />

      {errorMessage && (
        <div
          role="alert"
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'rgba(223,27,65,0.06)',
            border: '1px solid rgba(223,27,65,0.3)',
            borderRadius: '6px',
            fontFamily: fonts.body,
            fontSize: '14px',
            color: '#df1b41',
            lineHeight: 1.5,
          }}
        >
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isDisabled}
        style={{
          marginTop: '20px',
          width: '100%',
          padding: '16px 24px',
          background: isDisabled ? colors.stone : colors.sageGreen,
          color: isDisabled ? colors.warmGray : colors.cream,
          border: 'none',
          borderRadius: '6px',
          fontFamily: fonts.body,
          fontSize: '16px',
          fontWeight: 500,
          letterSpacing: '0.04em',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {loading ? (
          <>
            <Spinner />
            Processing…
          </>
        ) : (
          `Confirm ${frequencyLabel} — $${total.toFixed(2)} CAD`
        )}
      </button>
    </form>
  );
}

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12" cy="12" r="10"
        stroke={colors.cream}
        strokeWidth="2.5"
        strokeOpacity="0.3"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={colors.cream}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}


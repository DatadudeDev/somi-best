import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { colors, fonts, typography } from '../styles/tokens';
import Button from '../components/ui/Button';
import { useSEO } from '../lib/useSEO';

export interface BookingSuccessState {
  service: string;
  dateTime: string;
  frequency: string;
  total: string;
  isFree?: boolean;
  promoApplied?: boolean;
  email?: string;
  mode?: 'quote';
  name?: string;
  quoteRef?: string;
}

export default function BookingSuccess() {
  useSEO({ title: 'Booking Confirmed — Your Company', description: 'Your booking is confirmed.', canonical: 'https://example.com/booking-success' });
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as BookingSuccessState | null;

  useEffect(() => {
    if (!state) {
      navigate('/book', { replace: true });
    }
  }, [state, navigate]);

  if (!state) return null;

  return (
    <div style={{ paddingTop: '54px', background: colors.cream, minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '24px' }}>✨</div>
        <h1 style={{ ...typography.h2, color: colors.charcoal, marginBottom: '12px' }}>
          {state.mode === 'quote' && state.quoteRef
            ? 'Your quote has been booked!'
            : state.mode === 'quote'
            ? 'Quote request received!'
            : 'Your booking is confirmed!'}
        </h1>
        <p style={{
          fontFamily: fonts.body,
          fontSize: '17px',
          color: colors.warmGray,
          lineHeight: 1.65,
          marginBottom: '32px',
        }}>
          {state.mode === 'quote'
            ? "We’ll review your request and send a personalised quote within 1 business day."
            : "You'll receive a confirmation email shortly. We look forward to taking care of your home."
          }
        </p>

        <div style={{
          background: colors.white,
          border: `1px solid ${colors.stone}`,
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'left',
          marginBottom: '32px',
        }}>
          <div style={{ ...typography.sectionLabel, fontSize: '11px', color: colors.warmGray, marginBottom: '20px' }}>
            {state.mode === 'quote' ? 'QUOTE DETAILS' : 'BOOKING DETAILS'}
          </div>
          {state.mode === 'quote' && state.quoteRef ? (
            <>
              {state.name && <ConfirmRow label="Name" value={state.name} />}
              {state.email && <ConfirmRow label="Email" value={state.email} />}
              <ConfirmRow label="Service" value="Custom Quote" />
              <ConfirmRow label="Reference" value={state.quoteRef} />
              <ConfirmRow label="Submitted" value={new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })} />
              <ConfirmRow label="Total" value={state.total} highlight />
              <ConfirmRow label="Status" value="Confirmed — We will in touch within 24 hours" highlight />
            </>
          ) : state.mode === 'quote' ? (
            <>
              {state.name && <ConfirmRow label="Name" value={state.name} />}
              {state.email && <ConfirmRow label="Email" value={state.email} />}
              <ConfirmRow label="Status" value="Quote Requested — we'll be in touch within 1 business day" highlight />
            </>
          ) : (
            <>
              <ConfirmRow label="Service" value={state.service} />
              <ConfirmRow label="Date & Time" value={state.dateTime} />
              <ConfirmRow label="Frequency" value={state.frequency} />
              <ConfirmRow label="Total" value={state.total} highlight />
            </>
          )}
          {state.isFree && state.promoApplied && (
            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              background: 'rgba(90,122,90,0.08)',
              borderRadius: '6px',
              fontFamily: fonts.body,
              fontSize: '13px',
              color: colors.sageGreen,
            }}>
              🎉 Free clean promo applied!
            </div>
          )}
        </div>

        <Button variant="primary" onClick={() => { window.location.href = '/'; }}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}

function ConfirmRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
      <span style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.warmGray }}>{label}</span>
      <span style={{ fontFamily: fonts.body, fontSize: '14px', fontWeight: highlight ? 500 : 400, color: colors.charcoal }}>
        {value}
      </span>
    </div>
  );
}

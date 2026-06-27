/**
 * Custom quote intake — template UI only (no backend; wire POST /api/quotes on reskin).
 */
import { useState } from 'react';
import { site } from '../../config/site';
import { colors, fonts, typography } from '../../styles/tokens';
import Button from '../ui/Button';
import PhoneInput from '../ui/PhoneInput';
import LazyAddressField, { type AddressResult } from '../ui/LazyAddressField';

export interface QuoteIntakeFormProps {
  name: string;
  onNameChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
  serviceAddress: string;
  onAddressChange: (v: string) => void;
  onAddressSelect: (r: AddressResult) => void;
  unitNumber: string;
  onUnitChange: (v: string) => void;
  customServices: string[];
  sizeKey: string;
  pendingDropFiles: File[];
  onDropFilesConsumed: () => void;
  selectedDate?: string;
  selectedTime?: string;
  onSuccess: (result: { email: string; name: string }) => void;
}

export default function QuoteIntakeForm({
  name,
  onNameChange,
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  serviceAddress,
  onAddressChange,
  onAddressSelect,
  unitNumber,
  onUnitChange,
  customServices,
  pendingDropFiles,
  onDropFilesConsumed,
  selectedDate,
  selectedTime,
  onSuccess,
}: QuoteIntakeFormProps) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !serviceAddress.trim()) {
      setError('Name, email, and address are required.');
      return;
    }
    if (customServices.length === 0) {
      setError('Select at least one service.');
      return;
    }

    setSubmitting(true);
    // Template: no quotes API — preview success flow only.
    void pendingDropFiles;
    onDropFilesConsumed();
    await new Promise(r => setTimeout(r, 400));
    setSubmitting(false);
    onSuccess({ email: email.trim(), name: name.trim() });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: `1px solid ${colors.stone}`,
    borderRadius: '6px',
    fontFamily: fonts.body,
    fontSize: '15px',
    color: colors.charcoal,
    background: colors.white,
    boxSizing: 'border-box',
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ ...typography.sectionLabel, fontSize: '12px', marginBottom: '16px' }}>
        REQUEST A CUSTOM QUOTE
      </div>
      <p style={{ ...typography.body, fontSize: '15px', color: colors.warmGray, marginBottom: '24px' }}>
        {site.booking.checkout.customQuoteSidebar}
      </p>

      {customServices.length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {customServices.map(svc => (
            <span
              key={svc}
              style={{
                fontFamily: fonts.body,
                fontSize: '12px',
                padding: '6px 10px',
                borderRadius: '4px',
                background: colors.cream,
                color: colors.charcoal,
                border: `1px solid ${colors.stone}`,
              }}
            >
              {svc}
            </span>
          ))}
        </div>
      )}

      {(selectedDate || selectedTime) && (
        <p style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.warmGray, marginBottom: '20px' }}>
          Preferred: {[selectedDate, selectedTime].filter(Boolean).join(' · ')}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        <input
          placeholder="Full Name"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          style={inputStyle}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => onEmailChange(e.target.value)}
          style={inputStyle}
          required
        />
        <PhoneInput
          value={phone}
          onChange={onPhoneChange}
        />
        <LazyAddressField
          value={serviceAddress}
          onChange={onAddressChange}
          onSelect={onAddressSelect}
          placeholder={site.booking.checkout.addressPlaceholder}
        />
        <input
          placeholder="Unit # (opt.)"
          value={unitNumber}
          onChange={e => onUnitChange(e.target.value)}
          style={inputStyle}
        />
        <textarea
          placeholder={site.booking.checkout.notesPlaceholder}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {error && (
        <p style={{ color: '#b91c1c', fontFamily: fonts.body, fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </p>
      )}

      <Button type="submit" variant="primary" size="large" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Quote Request'}
      </Button>
    </form>
  );
}

import { useRef, useCallback } from 'react';
import { colors, fonts } from '../../styles/tokens';
import { phoneFromNationalInput, phoneNationalDisplay } from '../../lib/booking/validation';

interface PhoneInputProps {
  value: string;
  onChange: (full: string) => void;
  onBlur?: () => void;
  style?: React.CSSProperties;
  borderColor?: string;
}

export default function PhoneInput({ value, onChange, onBlur, style, borderColor }: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const national = phoneNationalDisplay(value);

  const focusAfterPrefix = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        border: `1px solid ${borderColor ?? colors.stone}`,
        borderRadius: '6px',
        background: colors.white,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          padding: '12px 0 12px 14px',
          fontFamily: fonts.body,
          fontSize: '15px',
          color: colors.charcoal,
          flexShrink: 0,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          cursor: 'default',
        }}
      >
        +1
      </span>
      <input
        ref={inputRef}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="(403) 399-9154"
        value={national}
        onChange={(e) => onChange(phoneFromNationalInput(e.target.value))}
        onFocus={focusAfterPrefix}
        onClick={focusAfterPrefix}
        onKeyDown={(e) => {
          if ((e.key === 'Backspace' || e.key === 'Delete') && national.length === 0) {
            e.preventDefault();
          }
        }}
        onBlur={onBlur}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          padding: '12px 14px 12px 4px',
          fontFamily: fonts.body,
          fontSize: '15px',
          color: colors.charcoal,
          background: 'transparent',
        }}
      />
    </div>
  );
}

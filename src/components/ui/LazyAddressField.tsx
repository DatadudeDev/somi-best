/**
 * Google Places autocomplete — lazy-loaded (Maps JS only fetched when rendered).
 */
import { lazy, Suspense } from 'react';
import type { ComponentProps } from 'react';
import { inputStyle } from '../../lib/booking/booking-styles';

const AddressAutocomplete = lazy(() => import('./AddressAutocomplete'));

export type { AddressResult } from './AddressAutocomplete';

type AddressFieldProps = ComponentProps<typeof AddressAutocomplete>;

function AddressFallback({ value, placeholder, style }: Pick<AddressFieldProps, 'value' | 'placeholder' | 'style'>) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder ?? 'Loading address search…'}
      readOnly
      style={style ?? inputStyle}
      aria-busy="true"
    />
  );
}

export default function LazyAddressField(props: AddressFieldProps) {
  return (
    <Suspense fallback={<AddressFallback value={props.value} placeholder={props.placeholder} style={props.style} />}>
      <AddressAutocomplete {...props} />
    </Suspense>
  );
}

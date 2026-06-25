/**
 * AddressAutocomplete
 * Google Places autocomplete input — matches Book.tsx inputStyle exactly.
 * Loads the Places JS API once via a singleton promise.
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string || '';

// Singleton loader — only injects the script once
let loaderPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (loaderPromise) return loaderPromise;
  if (typeof window !== 'undefined' && window.google?.maps?.places) {
    loaderPromise = Promise.resolve();
    return loaderPromise;
  }
  loaderPromise = new Promise((resolve, reject) => {
    // Use a named callback so we know exactly when the API is fully ready
    const callbackName = '__googleMapsReady';
    const w = window as unknown as Record<string, () => void>;
    w[callbackName] = () => {
      delete w[callbackName];
      resolve();
    };
    const script = document.createElement('script');
    // callback= ensures the promise resolves only after google.maps is fully initialized
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return loaderPromise;
}

export interface AddressResult {
  formatted: string;
  lat: number;
  lng: number;
}

interface Props {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
  style?: React.CSSProperties;
}

export default function AddressAutocomplete({ placeholder = 'Service Address', value, onChange, onSelect, style }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_API_KEY) return;
    loadGoogleMaps().then(() => setReady(true)).catch(console.error);
  }, []);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || autocompleteRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'ca' },
      fields: ['formatted_address', 'geometry'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.formatted_address || !place.geometry?.location) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      onSelect({ formatted: place.formatted_address, lat, lng });
      onChange(place.formatted_address);
    });
    autocompleteRef.current = ac;
  }, [onChange, onSelect]);

  useEffect(() => {
    if (ready) initAutocomplete();
  }, [ready, initAutocomplete]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete="off"
      style={style}
    />
  );
}

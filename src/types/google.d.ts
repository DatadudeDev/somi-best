/// <reference types="google.maps" />
// Ambient augmentation so we can read `window.google` (Maps JS API) without `any`.
// The `google` namespace itself is provided by @types/google.maps.
export {};

declare global {
  interface Window {
    google: typeof google;
  }
}

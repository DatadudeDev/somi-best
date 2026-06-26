/** Client-side booking flags (mirror server BOOKING_REQUIRES_ADDRESS in .env / wrangler). */
export const bookingRequiresAddress =
  import.meta.env.VITE_BOOKING_REQUIRES_ADDRESS === 'true';

/**
 * src/lib/booking/validation.ts
 * Contact-field formatting + validation and flexible date parsing for the
 * booking flow (extracted from Book.tsx).
 */

export function formatPhoneNumber(raw: string): string {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, '');
  // Remove leading 1 if present (we'll add +1 prefix)
  const d = digits.startsWith('1') ? digits.slice(1) : digits;
  if (d.length === 0) return '+1 ';
  if (d.length <= 3) return `+1 (${d}`;
  if (d.length <= 6) return `+1 (${d.slice(0,3)}) ${d.slice(3)}`;
  return `+1 (${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`;
}

/** National number portion for display beside a fixed +1 prefix. */
export function phoneNationalDisplay(full: string): string {
  const digits = full.replace(/\D/g, '');
  const d = digits.startsWith('1') ? digits.slice(1) : digits;
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

/** Build full +1 formatted value from national input edits. */
export function phoneFromNationalInput(nationalRaw: string): string {
  const digits = nationalRaw.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '+1 ';
  return formatPhoneNumber(`1${digits}`);
}

export function validateName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Full name is required';
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2 || parts.some(p => p.length < 1)) return 'Please enter your first and last name';
  return '';
}

export function validateEmail(email: string): string {
  if (!email.trim()) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email.trim())) return 'Please enter a valid email address';
  return '';
}

export function validatePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const d = digits.startsWith('1') ? digits.slice(1) : digits;
  if (d.length !== 10) return 'Please enter a valid 10-digit phone number';
  return '';
}

/**
 * Parse a date string in either ISO ("2026-05-13") or display ("May 13, 2026") format.
 * Returns { year, month (0-indexed), day } or null if parsing fails.
 */
export function parseFlexDate(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  // Try ISO first: "2026-05-13"
  const isoParts = dateStr.split('-');
  if (isoParts.length === 3) {
    const y = parseInt(isoParts[0], 10);
    const m = parseInt(isoParts[1], 10) - 1;
    const d = parseInt(isoParts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y > 2000) return { year: y, month: m, day: d };
  }
  // Try display format: "May 13, 2026"
  const MONTHS: Record<string, number> = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
    'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11,
  };
  const match = dateStr.match(/^(\w+)\s+(\d+),?\s+(\d{4})$/);
  if (match && MONTHS[match[1]] !== undefined) {
    return { year: parseInt(match[3], 10), month: MONTHS[match[1]], day: parseInt(match[2], 10) };
  }
  return null;
}

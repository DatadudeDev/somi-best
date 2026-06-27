/** Cloudflare Turnstile server-side verification (booking bot gate). */

export function contactFieldsComplete(
  name?: string,
  email?: string,
  phone?: string,
): boolean {
  return !!(name?.trim() && email?.trim() && phone?.trim());
}

export async function verifyTurnstile(
  secret: string,
  token: string,
  ip: string,
): Promise<boolean> {
  if (!token.trim()) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }).toString(),
    });
    if (!res.ok) {
      console.error('[turnstile] verify HTTP error:', res.status);
      return false;
    }
    const data = await res.json() as { success: boolean };
    return data.success === true;
  } catch (err) {
    console.error('[turnstile] verify failed (fail-closed):', err);
    return false;
  }
}

/** Returns false when verification fails; true when skipped or passed. */
export async function verifyTurnstileForContact(
  env: { TURNSTILE_SECRET_KEY?: string },
  token: string | undefined,
  ip: string,
  name?: string,
  email?: string,
  phone?: string,
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!contactFieldsComplete(name, email, phone)) return true;
  return verifyTurnstile(env.TURNSTILE_SECRET_KEY, token ?? '', ip);
}

/**
 * POST /api/contact
 * Forwards contact form submissions when Resend + notify inbox are configured.
 */
import type { Env } from '../../../src/lib/server/config.ts';
import { resolveConfig } from '../../../src/lib/server/config.ts';
import { sendContactInquiry } from '../../../src/lib/server/email.ts';
import { jsonOk, jsonError } from '../../../src/lib/server/http.ts';
import { apiNotConfigured } from '../../../src/lib/server/stubs.ts';

interface ContactBody {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as ContactBody;
    const name = body.name?.trim() ?? '';
    const email = body.email?.trim() ?? '';
    const message = body.message?.trim() ?? '';
    const phone = body.phone?.trim() || undefined;

    if (!name || name.length < 2) return jsonError('Name is required');
    if (!email || !EMAIL_RE.test(email)) return jsonError('A valid email is required');
    if (!message || message.length < 10) return jsonError('Message must be at least 10 characters');

    const config = resolveConfig(context.env);
    if (!context.env.RESEND_API_KEY || !(config.notifyEmail ?? config.replyToEmail)) {
      return apiNotConfigured('Contact form delivery');
    }

    const sent = await sendContactInquiry(context.env, config, { name, email, phone, message });
    if (!sent) return jsonError('Could not send your message. Please try again later.', 503);

    return jsonOk({ ok: true });
  } catch (err) {
    console.error('[contact]', err);
    return jsonError(err instanceof Error ? err.message : 'Internal server error', 500);
  }
};

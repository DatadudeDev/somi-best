import { useState, useRef } from 'react';
import { site } from '../config/site';
import { useSEO, seoMeta } from '../lib/useSEO';
import { colors, fonts, typography } from '../styles/tokens';
import SectionLabel from '../components/ui/SectionLabel';
import Button from '../components/ui/Button';

type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function ContactPage() {
  useSEO(seoMeta.contact);
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setFormState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name') as string,
          email: data.get('email') as string,
          phone: (data.get('phone') as string) || undefined,
          message: data.get('message') as string,
        }),
      });

      if (res.ok) {
        setFormState('success');
        formRef.current?.reset();
      } else {
        let reason = 'Something went wrong. Please try again.';
        try {
          const json = await res.json() as { error?: string };
          if (json.error) reason = json.error;
        } catch { /* ignore */ }
        setErrorMsg(reason);
        setFormState('error');
      }
    } catch {
      setErrorMsg('Could not send your message. Please check your connection and try again.');
      setFormState('error');
    }
  };

  return (
    <section style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: colors.white,
      padding: '100px 24px 64px',
      boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {formState === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
            <h1 style={{ ...typography.h2, fontSize: 'clamp(28px, 5vw, 36px)', color: colors.charcoal, marginBottom: '12px' }}>
              Message sent
            </h1>
            <p style={{ ...typography.body, color: colors.warmGray, marginBottom: '8px' }}>
              Thanks for reaching out. We&apos;ll get back to you within 24 hours.
            </p>
            <p style={{ ...typography.caption, color: colors.warmGray }}>
              Prefer a faster reply? Email{' '}
              <a href={`mailto:${site.contact.emailPublic}`} style={{ color: colors.sageGreen }}>
                {site.contact.emailPublic}
              </a>
            </p>
            <button
              onClick={() => setFormState('idle')}
              style={{
                marginTop: '28px',
                background: 'none',
                border: `1px solid ${colors.stone}`,
                borderRadius: '4px',
                padding: '10px 20px',
                fontFamily: fonts.body,
                fontSize: '14px',
                color: colors.warmGray,
                cursor: 'pointer',
              }}
            >
              Send another message
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <SectionLabel text="Contact" />
              <h1 style={{ ...typography.h2, fontSize: 'clamp(32px, 5vw, 40px)', color: colors.charcoal, margin: '12px 0' }}>
                Get in Touch
              </h1>
              <p style={{ ...typography.body, color: colors.warmGray, margin: 0 }}>
                Questions about recovery sessions, team programs, or our performance stack? Send us a message — we&apos;re here to help.
              </p>
            </div>

            <form
              ref={formRef}
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                background: colors.cream,
                padding: 'clamp(28px, 5vw, 40px)',
                border: `1px solid ${colors.stone}`,
              }}
            >
              {formState === 'error' && (
                <div role="alert" style={{
                  padding: '12px 16px',
                  background: 'rgba(223,27,65,0.06)',
                  border: '1px solid rgba(223,27,65,0.3)',
                  borderRadius: '4px',
                  fontFamily: fonts.body,
                  fontSize: '14px',
                  color: '#df1b41',
                  lineHeight: 1.5,
                }}>
                  {errorMsg}
                </div>
              )}

              {[
                { label: 'Name', name: 'name', type: 'text', required: true },
                { label: 'Email', name: 'email', type: 'email', required: true },
                { label: 'Phone (optional)', name: 'phone', type: 'tel', required: false },
              ].map(field => (
                <div key={field.name}>
                  <label style={{ ...typography.button, fontSize: '12px', color: colors.charcoal, display: 'block', marginBottom: '6px' }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    required={field.required}
                    disabled={formState === 'loading'}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: `1px solid ${colors.stone}`,
                      borderRadius: '4px',
                      fontFamily: fonts.body,
                      fontSize: '16px',
                      color: colors.charcoal,
                      background: colors.white,
                      outline: 'none',
                      opacity: formState === 'loading' ? 0.7 : 1,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
              <div>
                <label style={{ ...typography.button, fontSize: '12px', color: colors.charcoal, display: 'block', marginBottom: '6px' }}>
                  Message
                </label>
                <textarea
                  name="message"
                  rows={5}
                  required
                  disabled={formState === 'loading'}
                  placeholder="How can we help? Session booking, team programs, partnerships..."
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: `1px solid ${colors.stone}`,
                    borderRadius: '4px',
                    fontFamily: fonts.body,
                    fontSize: '16px',
                    color: colors.charcoal,
                    background: colors.white,
                    outline: 'none',
                    resize: 'vertical',
                    opacity: formState === 'loading' ? 0.7 : 1,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <Button type="submit" variant="primary" fullWidth disabled={formState === 'loading'}>
                {formState === 'loading' ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Spinner />
                    Sending…
                  </span>
                ) : 'Send Message'}
              </Button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

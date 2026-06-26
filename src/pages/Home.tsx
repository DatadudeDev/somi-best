import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { site } from '../config/site';
import { useSEO, seoMeta } from '../lib/useSEO';
import { colors, fonts, typography, transitions, images } from '../styles/tokens';
import AnimatedSection from '../components/ui/AnimatedSection';
import SectionLabel from '../components/ui/SectionLabel';
import Button from '../components/ui/Button';
import HomeServicesSection from '../components/home/HomeServicesSection';
import HomeHeroSlideshow from '../components/home/HomeHeroSlideshow';

/* PLACEHOLDER (reskin): hero title/subtitle responsive sizing */
const homeHeroCSS = `
  /* Desktop: space between hero headline and subheader */
  @media (min-width: 768px) {
    .home-hero-title { margin-bottom: 48px !important; }
  }
  /* Mobile: larger title; subheader size */
  @media (max-width: 767px) {
    .home-hero-title {
      font-size: 50px !important;
      margin-bottom: 28px !important;
    }
    .home-hero-subtitle { font-size: 14.0625px !important; }
  }
`;

/** PLACEHOLDER (reskin): fallback testimonials when live Google reviews API is unavailable */
const FALLBACK_TESTIMONIALS = site.testimonials.fallback;

interface Testimonial {
  name: string;
  neighborhood: string;
  service: string;
  quote: string;
}

export default function HomePage() {
  useSEO(seoMeta.home);

  // ── Live Google rating ─────────────────────────────────────────────────────
  // PLACEHOLDER (reskin): Google Business Profile URL for reviews badge
  const GOOGLE_PROFILE_URL = site.googleProfileUrl;
  const [googleRating, setGoogleRating] = useState<{ rating: number; reviewCount: number; url: string } | null>(null);

  useEffect(() => {
    fetch('/api/google-rating')
      .then(r => r.json() as Promise<{ rating: number; reviewCount: number; url: string }>)
      .then(data => setGoogleRating(data))
      .catch(() => setGoogleRating({ rating: 5.0, reviewCount: 15, url: GOOGLE_PROFILE_URL }));
  }, [GOOGLE_PROFILE_URL]);

  const [liveTestimonials, setLiveTestimonials] = useState<Testimonial[] | null>(null);

  useEffect(() => {
    fetch('/api/google-reviews')
      .then(r => r.json() as Promise<{ reviews: Array<{ author_name: string; text: string; relative_time_description: string }> }>)
      .then(data => {
        if (data.reviews && data.reviews.length >= 3) {
          setLiveTestimonials(data.reviews.map(r => ({
            name: r.author_name,
            neighborhood: r.relative_time_description,
            service: 'Google Review',
            quote: r.text,
          })));
        }
      })
      .catch(() => {}); // silently fall back to FALLBACK_TESTIMONIALS
  }, []);

  const ratingDisplay = googleRating
    ? `${googleRating.rating % 1 === 0 ? googleRating.rating.toFixed(1) : googleRating.rating}★`
    : '5.0★';
  const ratingUrl = googleRating?.url ?? GOOGLE_PROFILE_URL;

  // ── Testimonials carousel ──────────────────────────────────────────────────
  const testimonials: readonly Testimonial[] = liveTestimonials ?? FALLBACK_TESTIMONIALS;

  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Reset index if testimonials array shrinks (e.g. live reviews load with fewer entries)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTestimonial(i => Math.min(i, testimonials.length - 1));
  }, [testimonials.length]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveTestimonial(i => (i + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, testimonials.length]);

  const goTo = (index: number) => {
    setActiveTestimonial(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  };

  const prevTestimonial = () => goTo((activeTestimonial - 1 + testimonials.length) % testimonials.length);
  const nextTestimonial = () => goTo((activeTestimonial + 1) % testimonials.length);

  const t = testimonials[Math.min(activeTestimonial, testimonials.length - 1)];

  return (
    <div>
      <style>{homeHeroCSS}</style>
      {/* SCAFFOLDING: full-viewport hero — PLACEHOLDER (reskin): headline/copy + heroSlides URLs */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: colors.deepSage,
        padding: 0,
      }}>
        <HomeHeroSlideshow />

        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
          style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            maxWidth: '700px',
            padding: '60px 24px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h1 className="home-hero-title" style={{
            fontFamily: fonts.tagline,
            fontWeight: 400,
            fontStyle: 'normal',
            fontSize: 'clamp(36px, 6vw, 88px)',
            letterSpacing: '0.01em',
            lineHeight: 1.2,
            color: colors.creamText,
            marginBottom: '24px',
          }}>
            {site.hero.headline}
          </h1>
          <p className="home-hero-subtitle" style={{
            ...typography.body,
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: 'rgba(245,245,245,0.8)',
            marginBottom: '40px',
            maxWidth: '520px',
            margin: '0 auto 32px',
          }}>
            {site.hero.subheadline}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
            <Button variant="primary" size="large" href="/book?pkg=Premier&size=s1">
              {site.hero.primaryCta}
            </Button>
            <Button variant="outlineCream" href="/contact">
              {site.hero.secondaryCta}
            </Button>
          </div>
        </motion.div>
      </section>

      <HomeServicesSection />

      <section
        id="testimonials"
        style={{
        background: colors.cream,
        padding: 'clamp(16px, 2.5vw, 28px) 24px clamp(48px, 7vw, 72px)',
      }}>
        <AnimatedSection>
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <SectionLabel text={site.testimonials.sectionLabel} />
              <h2 style={{ ...typography.h2, color: colors.charcoal, marginBottom: '20px' }}>
                {site.testimonials.headline}
              </h2>
              <a
                href={ratingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: colors.white,
                  border: `1px solid ${colors.stone}`,
                  borderRadius: '24px',
                  padding: '8px 20px',
                  textDecoration: 'none',
                }}
              >
                <span style={{ color: colors.gold, fontSize: '16px', letterSpacing: '2px' }}>★★★★★</span>
                <span style={{
                  ...typography.caption,
                  color: colors.charcoal,
                  fontWeight: 500,
                  fontSize: '13px',
                  letterSpacing: '0.06em',
                }}>
                  {ratingDisplay.replace('★', '')} on Google Reviews{googleRating ? ` (${googleRating.reviewCount})` : ' (15)'}
                </span>
              </a>
            </div>

            {/* Carousel */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div style={{
                background: colors.white,
                borderRadius: '12px',
                padding: 'clamp(28px, 5vw, 48px) clamp(28px, 8vw, 72px)',
                border: `1px solid ${colors.stone}`,
                minHeight: '240px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}>
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transitions.fadeUp, duration: 0.4 }}
                >
                  <div style={{
                    color: colors.gold,
                    fontSize: '18px',
                    letterSpacing: '3px',
                    marginBottom: '20px',
                  }}>
                    ★★★★★
                  </div>
                  <blockquote style={{
                    ...typography.body,
                    fontSize: 'clamp(17px, 2.2vw, 20px)',
                    color: colors.charcoal,
                    fontStyle: 'italic',
                    margin: '0 0 28px',
                    lineHeight: 1.65,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: 'calc(3 * 1.65em)',
                  }}>
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '3px',
                      height: '36px',
                      background: colors.sageGreen,
                      borderRadius: '2px',
                      flexShrink: 0,
                    }} />
                    <div>
                      <div style={{
                        fontFamily: fonts.display,
                        fontWeight: 500,
                        fontSize: '16px',
                        color: colors.charcoal,
                        textTransform: 'capitalize' as const,
                        marginBottom: '2px',
                      }}>
                        {t.name}
                      </div>
                      <div style={{
                        ...typography.caption,
                        color: colors.warmGray,
                        fontSize: '13px',
                      }}>
                        {t.neighborhood} &middot; {t.service}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Prev arrow */}
              <motion.button
                onClick={prevTestimonial}
                whileHover={{ scale: 1.1 }}
                transition={transitions.button}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '-20px',
                  marginTop: '-20px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: colors.white,
                  border: `1px solid ${colors.stone}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: fonts.display,
                  fontSize: '20px',
                  color: colors.charcoal,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
                aria-label="Previous testimonial"
              >
                ‹
              </motion.button>

              {/* Next arrow */}
              <motion.button
                onClick={nextTestimonial}
                whileHover={{ scale: 1.1 }}
                transition={transitions.button}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-20px',
                  marginTop: '-20px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: colors.white,
                  border: `1px solid ${colors.stone}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: fonts.display,
                  fontSize: '20px',
                  color: colors.charcoal,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
                aria-label="Next testimonial"
              >
                ›
              </motion.button>
            </div>

            {/* Dot indicators */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '28px',
            }}>
              {testimonials.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => goTo(i)}
                  animate={{
                    width: i === activeTestimonial ? '24px' : '8px',
                    backgroundColor: i === activeTestimonial ? colors.sageGreen : colors.stone,
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{
                    height: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* PLACEHOLDER (reskin): product / add-on section copy and image */}
      <section id="products" style={{ background: colors.white }}>
        <style>{`
          .almost-friday-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 48px;
            align-items: center;
          }
          .almost-friday-img {
            border-radius: 0;
            overflow: hidden;
            height: 400px;
            background: #0d0d0d;
            border: 2px solid #2A2A2A;
            display: flex;
            align-items: center;
            justify-content: center;
            order: 1;
          }
          .almost-friday-img img {
            max-height: 90%;
            max-width: 90%;
            object-fit: contain;
          }
          .almost-friday-content {
            order: 0;
          }
          .scent-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 24px;
          }
          @media (max-width: 640px) {
            .almost-friday-img {
              height: 260px;
              order: 0;
            }
            .almost-friday-content {
              order: 1;
            }
            .scent-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
        <AnimatedSection>
          <div className="container">
            <div className="almost-friday-grid">
              <div className="almost-friday-content">
                <SectionLabel text={site.productSection.label} />
                <h2 style={{ ...typography.h2, color: colors.charcoal, marginBottom: '20px' }}>
                  {site.productSection.headline}
                </h2>
                <p style={{
                  ...typography.body,
                  color: colors.warmGray,
                  marginBottom: '32px',
                }}>
                  {site.productSection.body}
                </p>
                <div className="scent-grid">
                  {site.productSection.items.map((scent, i) => (
                    <div key={i} style={{
                      padding: '12px 16px',
                      background: colors.cream,
                      borderRadius: '0',
                      border: `1px solid ${colors.stone}`,
                    }}>
                      <div style={{
                        fontFamily: fonts.display,
                        fontSize: '15px',
                        fontWeight: 500,
                        color: colors.sageGreen,
                      }}>
                        {scent.name}
                      </div>
                      {scent.scent && <div style={{ ...typography.caption, color: colors.charcoal, fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>
                        {scent.scent}
                      </div>}
                      <div style={{ ...typography.caption, color: colors.warmGray, fontSize: '12px', marginTop: '2px' }}>
                        {scent.notes}
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{
                  ...typography.caption,
                  color: colors.warmGray,
                  fontSize: '13px',
                  fontStyle: 'italic',
                  marginBottom: '0',
                }}>
                  {site.productSection.footnote}
                </p>
              </div>
              <div className="almost-friday-img">
                <img src={images.almostFridayBottles} alt="BEST Therapeutics logo mark" />
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* PLACEHOLDER (reskin): closing CTA copy */}
      <section style={{
        background: colors.deepSage,
        textAlign: 'center',
      }}>
        <AnimatedSection>
          <div className="container-narrow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{
              fontFamily: fonts.tagline,
              fontWeight: 400,
              fontStyle: 'normal',
              fontSize: 'clamp(24px, 4vw, 48px)',
              lineHeight: 1.35,
              color: colors.creamText,
              marginBottom: '40px',
              textAlign: 'left',
              alignSelf: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 'clamp(10px, 1.75vw, 18px)',
              maxWidth: '100%',
            }}>
              <span style={{ display: 'block' }}>{site.finalCta.line1}</span>
              <span style={{ display: 'block', marginLeft: 'clamp(1.25rem, 5vw, 3rem)' }}>{site.finalCta.line2}</span>
            </h2>
            <Button variant="primary" size="large" href="/book?pkg=Premier&size=s1">
              {site.finalCta.button}
            </Button>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}

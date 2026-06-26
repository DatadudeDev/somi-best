import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { heroSlides } from '../../styles/tokens';
import '../../styles/home-hero-slideshow.css';

const SLIDE_MS = 7500;
const FADE_S = 1.4;

export default function HomeHeroSlideshow() {
  /** Monotonic counter so AnimatePresence keys never repeat when the deck loops. */
  const [slideEpoch, setSlideEpoch] = useState(0);
  const activeIndex = slideEpoch % heroSlides.length;
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (reducedMotion || heroSlides.length <= 1) return;
    const id = window.setInterval(() => {
      setSlideEpoch((e) => e + 1);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const slide = heroSlides[activeIndex];

  return (
    <div className="home-hero-slideshow" aria-hidden="true">
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={slideEpoch}
          className="home-hero-slide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : FADE_S, ease: 'easeInOut' }}
        >
          <img
            src={slide.src}
            alt=""
            className={`home-hero-kb--${slide.effect}`}
            loading={slideEpoch === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

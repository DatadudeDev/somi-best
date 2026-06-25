import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { heroSlides } from '../../styles/tokens';
import '../../styles/home-hero-slideshow.css';

const SLIDE_MS = 7500;
const FADE_S = 1.4;

export default function HomeHeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);
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
      setActiveIndex((i) => (i + 1) % heroSlides.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const slide = heroSlides[activeIndex];

  return (
    <div className="home-hero-slideshow" aria-hidden="true">
      <AnimatePresence mode="sync">
        <motion.div
          key={activeIndex}
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
            loading={activeIndex === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

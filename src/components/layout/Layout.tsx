import '../../styles/global.css';
import { useEffect, useRef } from 'react';
import { useLocation, Outlet, useNavigate, useNavigationType } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { transitions } from '../../styles/tokens';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    const prevPath = prevPathnameRef.current;
    const isHome = path === '/';
    /** Ignore initial `POP` (first load); only normalize when returning to `/` from another path. */
    const backToHome =
      navigationType === 'POP' &&
      isHome &&
      prevPath !== null &&
      prevPath !== '/';

    if (backToHome) {
      if (location.search || location.hash) {
        navigate({ pathname: '/', search: '', hash: '' }, { replace: true });
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      prevPathnameRef.current = path;
      return;
    }

    const raw = location.hash;
    if (raw.length > 1) {
      prevPathnameRef.current = path;
      const id = raw.startsWith('#') ? raw.slice(1) : raw;
      let frames = 0;
      let cancelled = false;
      const tryScroll = () => {
        if (cancelled) return;
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        if (frames++ < 40) requestAnimationFrame(tryScroll);
      };
      tryScroll();
      return () => {
        cancelled = true;
      };
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    prevPathnameRef.current = path;
  }, [location.pathname, location.hash, location.search, navigationType, navigate]);

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transitions.page}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
    </>
  );
}

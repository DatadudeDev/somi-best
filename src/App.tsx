import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { siteSectionTo } from './lib/services-nav';
import { lazy, Suspense } from 'react';

const Layout = lazy(() => import('./components/layout/Layout.tsx'));
const Home = lazy(() => import('./pages/Home.tsx'));
const Contact = lazy(() => import('./pages/Contact.tsx'));
const Book = lazy(() => import('./pages/Book.tsx'));
const BookingSuccess = lazy(() => import('./pages/BookingSuccess.tsx'));
const Help = lazy(() => import('./pages/Help.tsx'));
const NotFound = lazy(() => import('./pages/NotFound.tsx'));
const Privacy = lazy(() => import('./pages/Privacy.tsx'));
const Terms = lazy(() => import('./pages/Terms.tsx'));

function PageSpinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      background: '#000000',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        border: '3px solid #e5e5e5',
        borderTopColor: '#FFB800',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Navigate to={siteSectionTo('services')} replace />} />
            <Route path="/pricing" element={<Navigate to={siteSectionTo('services')} replace />} />
            <Route path="/custom-services" element={<Navigate to={siteSectionTo('services')} replace />} />
            <Route path="/business-services" element={<Navigate to={siteSectionTo('services')} replace />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/for-business" element={<Navigate to="/contact" replace />} />
            <Route path="/book" element={<Book />} />
            <Route path="/help" element={<Help />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Route>

          <Route path="/booking-success" element={<BookingSuccess />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { tracker } from './lib/tracker';

tracker.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { clarityInit } from './lib/clarity';
import { tracker } from './lib/tracker';

// Initialise Clarity once at app boot — before first render
clarityInit();
tracker.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

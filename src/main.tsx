import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for Android Chrome PWA installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[GigPilot] Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('[GigPilot] Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);


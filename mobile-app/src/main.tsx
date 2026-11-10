import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Auto-bust any stale Service Worker caches from previous dev sessions
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      // Purge v1/v2/v3 caches so updates always take immediate effect
      if (key.includes('financial-suite')) {
        console.log('Purging stale service worker cache:', key);
        caches.delete(key);
      }
    });
  });
}

// In development, ensure no active service worker intercepts Vite HMR
if (import.meta.env.DEV && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      console.log('Unregistering dev service worker:', registration.scope);
      registration.unregister();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

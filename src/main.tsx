import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexReactClient } from "convex/react"
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import './index.css'
import App from './App.tsx'
import { authClient } from './lib/auth-client'

const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://dummy-convex-url.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <App />
    </ConvexBetterAuthProvider>
  </StrictMode>,
)

// Register the PWA service worker in production, or unregister in development to prevent stale caches
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service worker registered successfully:', reg.scope);
          
          // Periodically check for updates (every hour)
          setInterval(() => {
            reg.update();
          }, 1000 * 60 * 60);
        })
        .catch((err) => console.error('Service worker registration failed:', err));
        
      // Auto-reload the page when a new service worker takes over (OTA updates)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  } else {
    // Unregister active development service worker and clear cache to guarantee fresh reloads
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      let unregistered = false;
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('Unregistered active service worker in development mode.');
            unregistered = true;
          }
        });
      }
      if (unregistered) {
        caches.keys().then((keys) => {
          Promise.all(keys.map((key) => caches.delete(key))).then(() => {
            window.location.reload();
          });
        });
      }
    });
  }
}

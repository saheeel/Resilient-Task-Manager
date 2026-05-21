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

// Register the PWA service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service worker registered successfully:', reg.scope))
      .catch((err) => console.error('Service worker registration failed:', err));
  });
}

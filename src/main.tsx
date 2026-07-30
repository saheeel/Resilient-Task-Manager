import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexReactClient } from "convex/react"
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import './index.css'
import App from './App.tsx'
import { authClient } from './lib/auth-client'

const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://dummy-convex-url.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

import React from 'react'

class GlobalErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace', wordBreak: 'break-all', backgroundColor: '#fee2e2', minHeight: '100vh' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Fatal App Crash</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{this.state.error?.message}</pre>
          <hr style={{ margin: '10px 0' }} />
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '10px' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

window.onerror = function(message, source, lineno, colno, error) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fee2e2;color:red;padding:20px;z-index:99999;font-family:monospace;word-break:break-all;max-height:100vh;overflow:auto;';
  div.innerHTML = '<h3 style="margin-top:0">Global JS Error</h3><p>' + message + '</p><p>' + source + ':' + lineno + ':' + colno + '</p><pre style="white-space:pre-wrap;font-size:10px">' + (error && error.stack ? error.stack : '') + '</pre>';
  document.body.appendChild(div);
};

window.addEventListener('unhandledrejection', function(event) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fee2e2;color:red;padding:20px;z-index:99999;font-family:monospace;word-break:break-all;max-height:100vh;overflow:auto;';
  div.innerHTML = '<h3 style="margin-top:0">Unhandled Promise Rejection</h3><p>' + event.reason + '</p><pre style="white-space:pre-wrap;font-size:10px">' + (event.reason && event.reason.stack ? event.reason.stack : '') + '</pre>';
  document.body.appendChild(div);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <ConvexBetterAuthProvider client={convex} authClient={authClient}>
        <App />
      </ConvexBetterAuthProvider>
    </GlobalErrorBoundary>
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

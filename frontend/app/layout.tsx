'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // In development, unregister any existing service workers and clear caches
    // so stale bundles never hijack HMR or navigation.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
      }
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  }, []);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%9B%92%3C/text%3E%3C/svg%3E"
        />
        <title>Apni Dukan - Online Grocery Store | Free Delivery Over Rs. 5000</title>
        <meta
          name="description"
          content="Apni Dukan - Order groceries online and get them delivered to your doorstep. Minimum order Rs. 800, free home delivery on orders over Rs. 5000."
        />
        <meta property="og:title" content="Apni Dukan - Online Grocery Store" />
        <meta
          property="og:description"
          content="Fresh groceries delivered to your home. Minimum order Rs. 800. Free delivery on orders over Rs. 5000."
        />
        <meta property="og:type" content="website" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

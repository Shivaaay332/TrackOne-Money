import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'], // Agar aapke paas hain toh rakhein, warna theek hai
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          }
        ]
      },
      manifest: {
        name: 'TrackOne-Money',
        short_name: 'TrackOne',
        description: 'Advanced Financial Management System',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        // PWA INSTALL TRIGGER HONE KE LIYE ICONS COMPULSORY HAIN:
        icons: [
          {
            src: '/icons.png', // Ensure this file exists in frontend/public/
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons.png', // Or ideally a larger 512x512 version
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 2000
  }
});
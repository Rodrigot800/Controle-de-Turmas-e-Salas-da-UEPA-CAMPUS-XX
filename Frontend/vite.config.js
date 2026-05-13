import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Hydrazil',
        short_name: 'Hydrazil',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',

        icons: [
          {
            src: '/pwa-192x192-desktop.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/pwa-512x512-desktop.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],

  server: {
    host: true,
    allowedHosts: true,
    port: 5173,

    https: {
      key: fs.readFileSync('./192.168.10.231-key.pem'),
      cert: fs.readFileSync('./192.168.10.231.pem'),
    },
    proxy: {
      '/api': {
        target: 'http://192.168.10.231:3001',
        changeOrigin: true,
      },
    },
  },
})
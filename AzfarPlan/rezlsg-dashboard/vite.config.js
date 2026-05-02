import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'RezlSG Dashboard',
        short_name: 'RezlSG',
        description: 'Azfar 2026 Master Plan',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
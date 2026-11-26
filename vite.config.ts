import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo.svg', 'marca.svg'],
      manifest: {
        name: 'Wagner Regularização Imobiliária',
        short_name: 'Wagner',
        description: 'Orçamento gratuito e acompanhamento de usucapião, inventário, holding, regularização e certidões.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: '/icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        // dados e arquivos do Supabase nunca ficam em cache no aparelho
        navigateFallbackDenylist: [/^\/auth/],
        runtimeCaching: []
      }
    })
  ]
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteOrigin = (env.VITE_SITE_ORIGIN || 'https://treytherapy.com').replace(/\/$/, '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-site-origin',
        transformIndexHtml(html) {
          return html.replaceAll('__SITE_ORIGIN__', siteOrigin)
        },
      },
    ],
    server: {
      host: '0.0.0.0',
      port: 6768,
      allowedHosts: true,
    },
    build: {
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/framer-motion')) return 'framer-motion'
            if (id.includes('node_modules/@stripe/')) return 'stripe'
          },
        },
      },
    },
  }
})

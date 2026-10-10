import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const isGhPages = Boolean(process.env.GITHUB_ACTIONS);
const repoName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : 'NFL-Savvy';
const base = isGhPages ? `/${repoName}/` : './';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: "NFL Savvy",
        short_name: "NFLSavvy",
        description: "NFL stats, salaries, coaches, weather & referee analytics",
        theme_color: "#013369",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "any",
        scope: isGhPages ? `/${repoName}/` : "/",
        start_url: isGhPages ? `/${repoName}/` : "./",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],
  build: {
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand']
        }
      }
    }
  }
})

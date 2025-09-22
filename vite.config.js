import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sitemap } from 'vite-plugin-sitemap'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    sitemap({
      hostname: 'https://m3u8-player.krystal.fit',
      dynamicRoutes: ['/', '/krystal'],
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://m3u8-player.krystal.fit',
        changeOrigin: true,
      },
    },
  },
})

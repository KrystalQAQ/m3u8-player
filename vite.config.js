import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import sitemapPlugin from 'vite-plugin-sitemap'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    sitemapPlugin({
      hostname: 'https://m3u8-player.krystal.fit',
      dynamicRoutes: ['/', '/krystal'],
    }),
  ],
  server: {
    port: 10801,
    proxy: {
      '/api': {
        target: 'https://m3u8-player.krystal.fit',
        changeOrigin: true,
      },
    },
  },
})

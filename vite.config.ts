import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  base: '/product-testing-dashboard/',
  build: {
    // The default CSS minifier merges the two backdrop-filter lines
    // and keeps only the -webkit one, which breaks the blur in Firefox.
    // Our CSS is a few KB, so skipping CSS minification costs almost
    // nothing (gzip closes most of the gap) and keeps both lines.
    cssMinify: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

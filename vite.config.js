import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  // Empty base for relative paths (GitHub Pages deployment)
  base: '',
  resolve: {
    alias: {
      // Vue 2 full build (runtime + template compiler) for inline templates
      'vue': 'vue/dist/vue.esm.js',
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 8080
  }
})

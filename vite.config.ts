import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'https://localhost:7036',
        changeOrigin: true,
        secure: false
      },
      '/identity': {
        target: 'https://localhost:7036',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
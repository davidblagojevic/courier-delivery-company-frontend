import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      // Proxy all '/api' requests to the backend
      '/api': {
        target: 'https://localhost:7036',
        changeOrigin: true,
        secure: false,
      },
      // Proxy all '/identity' requests to the backend
      '/identity': {
        target: 'https://localhost:7036',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
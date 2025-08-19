import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      '/notificationHub': {
        target: 'http://localhost:5080',
        changeOrigin: true,
        ws: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
      '/identity': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
});
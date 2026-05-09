import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      api: path.resolve(__dirname, 'src/api'),
      domain: path.resolve(__dirname, 'src/domain'),
      router: path.resolve(__dirname, 'src/router'),
      shared: path.resolve(__dirname, 'src/shared'),
      types: path.resolve(__dirname, 'src/types'),
      style: path.resolve(__dirname, 'src/style'),
    },
  },
  build: {
    sourcemap: true,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'mui': ['@mui/material', '@mui/icons-material', '@mui/x-data-grid', '@mui/x-date-pickers'],
          'mui-style': ['@emotion/react', '@emotion/styled'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'signalr': ['@microsoft/signalr'],
          'date-fns': ['date-fns'],
        },
      },
    },
  },
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

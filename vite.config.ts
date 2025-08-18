import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Server as ProxyServer } from 'http-proxy';
import type { IncomingMessage, ServerResponse, ClientRequest } from 'http';
import type { Socket } from 'net';

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
        configure: (proxy: ProxyServer) => {
          // TODO - Remove this when the issue is resolved
          proxy.on('error', (err: Error, req: IncomingMessage, res: ServerResponse) => {
            console.log('WebSocket proxy error:', err);
          });
          proxy.on('proxyReqWs', (proxyReq: ClientRequest, req: IncomingMessage, socket: Socket) => {
            console.log('WebSocket proxy request:', req.url);
          });
          proxy.on('open', (proxySocket: Socket) => {
            console.log('WebSocket proxy connection opened');
          });
          proxy.on('close', (res: IncomingMessage, socket: Socket, head: Buffer) => {
            console.log('WebSocket proxy connection closed');
          });
        },
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
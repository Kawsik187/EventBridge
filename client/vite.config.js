import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: [
      'diligent-bankable-sandbank.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.app',
      '.ngrok.io',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-utils': ['axios', 'qrcode'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { chunkSizeWarningLimit: 900, rollupOptions: { output: { manualChunks: { vendor: ['react', 'react-dom', 'react-router-dom', 'zustand'], charts: ['recharts'], motion: ['framer-motion'] } } } },
  test: { environment: 'node', include: ['src/tests/**/*.test.ts'] },
} as never);

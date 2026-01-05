import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@web-agent/core': path.resolve(__dirname, '../../packages/core/src'),
      '@web-agent/react': path.resolve(__dirname, '../../packages/react/src'),
      '@web-agent/ui-protocol': path.resolve(__dirname, '../../packages/ui-protocol/src'),
      '@web-agent/transformers': path.resolve(__dirname, '../../packages/transformers/src'),
    },
  },
  server: {
    port: 3001,
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
  },
});


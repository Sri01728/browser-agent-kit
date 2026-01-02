import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['react', 'react-dom', '@web-agent/core', '@web-agent/ui-protocol'],
  platform: 'browser',
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});


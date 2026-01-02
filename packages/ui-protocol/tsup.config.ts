import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'a2u/index': 'src/a2u/index.ts',
    'ag-ui/index': 'src/ag-ui/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['@web-agent/core', 'dompurify'],
  platform: 'browser',
});


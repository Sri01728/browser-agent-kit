import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'agent/index': 'src/agent/index.ts',
    'tool/index': 'src/tool/index.ts',
    'memory/index': 'src/memory/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
});


import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'hooks/use-agent': 'src/hooks/use-agent.ts',
    'hooks/use-agent-stream': 'src/hooks/use-agent-stream.ts',
    'components/AgentChat': 'src/components/AgentChat.tsx',
    'components/A2UComponent': 'src/components/A2UComponent.tsx',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  external: ['react', 'react-dom', '@web-agent/core', '@web-agent/ui-protocol'],
  platform: 'browser',
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});


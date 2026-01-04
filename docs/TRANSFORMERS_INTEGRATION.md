# Transformers.js Integration Guide

This guide shows how to use Hugging Face Transformers.js models with the web-agent framework.

## Overview

Transformers.js allows you to run state-of-the-art ML models directly in the browser. The framework now supports Transformers.js as a model provider alongside MediaPipe.

## Installation

The `@xenova/transformers` package is automatically included when you install `@web-agent/core`:

```bash
npm install @web-agent/core @web-agent/react
# or
pnpm add @web-agent/core @web-agent/react
```

## Quick Start

### Using createWebAgent

```tsx
import { createWebAgent, TRANSFORMERS_MODELS } from '@web-agent/react';

const agent = createWebAgent({
  persona: 'You are a helpful assistant.',
  model: {
    provider: 'transformers',
    path: TRANSFORMERS_MODELS.gemma2b, // 'Xenova/gemma-2b-it'
    maxTokens: 512,
    temperature: 0.7,
  },
  autoLoad: true,
});

// Use the agent
await agent.load();
const response = await agent.send('Hello!');
console.log(response);
```

### Using React Hooks

```tsx
import { useWebAgent, TRANSFORMERS_MODELS } from '@web-agent/react';

function MyComponent() {
  const agent = useWebAgent({
    persona: 'You are a coding assistant.',
    model: {
      provider: 'transformers',
      path: TRANSFORMERS_MODELS.phi2, // 'Xenova/Phi-3-mini-4k-instruct'
      maxTokens: 1024,
    },
  });

  return (
    <div>
      <button onClick={() => agent.send('Explain React hooks')}>
        Ask Question
      </button>
      {agent.isReady && <p>Model loaded!</p>}
    </div>
  );
}
```

### Using SmartAgentProvider

```tsx
import { SmartAgentProvider } from '@web-agent/react';
import { TRANSFORMERS_MODELS } from '@web-agent/react';

function App() {
  return (
    <SmartAgentProvider
      persona="You are a helpful assistant."
      modelPath={TRANSFORMERS_MODELS.gpt2}
      autoLoad={true}
    >
      <YourComponents />
    </SmartAgentProvider>
  );
}
```

## Available Models

The framework provides pre-configured model identifiers:

```tsx
import { TRANSFORMERS_MODELS } from '@web-agent/react';

// Small models (fast, lower quality)
TRANSFORMERS_MODELS.gpt2          // 'Xenova/gpt2'
TRANSFORMERS_MODELS.gpt2Medium     // 'Xenova/gpt2-medium'

// Medium models (balanced)
TRANSFORMERS_MODELS.gemma2b        // 'Xenova/gemma-2b-it'
TRANSFORMERS_MODELS.phi2           // 'Xenova/Phi-3-mini-4k-instruct'

// Large models (slower, higher quality)
TRANSFORMERS_MODELS.mistral7b      // 'Xenova/Mistral-7B-Instruct-v0.2'
TRANSFORMERS_MODELS.llama3         // 'Xenova/Llama-3-8B-Instruct'

// Specialized models
TRANSFORMERS_MODELS.qwen           // 'Xenova/Qwen2.5-0.5B-Instruct'
```

You can also use any Hugging Face model identifier:

```tsx
const agent = createWebAgent({
  model: {
    provider: 'transformers',
    path: 'Xenova/your-custom-model', // Any Hugging Face model
  },
});
```

## Advanced Usage

### Direct Adapter Usage

For more control, you can use the adapter directly:

```tsx
import { TransformersAdapter } from '@web-agent/core';

const adapter = new TransformersAdapter({
  modelPath: 'Xenova/gemma-2b-it',
  modelConfig: {
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
    topK: 50,
    repetitionPenalty: 1.1,
  },
  useWebGPU: true, // Use WebGPU if available
  useWASM: true,   // Fallback to WASM
  onProgress: (progress) => {
    console.log(`Loading: ${progress.loaded}/${progress.total}`);
  },
});

await adapter.initialize();

const result = await adapter.generate({
  messages: [
    { role: 'user', content: 'Hello!' },
  ],
  maxTokens: 512,
  temperature: 0.7,
});

console.log(result.text);
```

### Streaming Responses

```tsx
const adapter = new TransformersAdapter({
  modelPath: 'Xenova/gpt2',
});

await adapter.initialize();

for await (const chunk of adapter.stream({
  messages: [{ role: 'user', content: 'Tell me a story' }],
})) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.text);
  } else if (chunk.type === 'done') {
    console.log('\nDone!', chunk.usage);
  }
}
```

## Model Configuration

### Supported Parameters

- `maxTokens`: Maximum tokens to generate (default: 512)
- `temperature`: Sampling temperature (0.0-2.0, default: 0.7)
- `topP`: Nucleus sampling (0.0-1.0)
- `topK`: Top-K sampling (integer)
- `repetitionPenalty`: Penalty for repetition (default: 1.0)

### Model-Specific Chat Templates

The adapter automatically detects and applies the correct chat template:

- **Gemma/Llama**: Uses `<start_of_turn>` tags
- **Mistral**: Uses `[INST]` tags
- **GPT-2/Others**: Simple format

## Performance Considerations

### WebGPU vs WASM

- **WebGPU**: Faster inference, requires Chrome 113+ or Edge 113+
- **WASM**: Broader compatibility, slower but still fast

The adapter automatically selects the best available backend.

### Model Size

- **Small models** (< 1B params): Load quickly, good for simple tasks
- **Medium models** (1-7B params): Balanced performance/quality
- **Large models** (> 7B params): Best quality but slower loading

### Caching

Transformers.js automatically caches models in the browser's IndexedDB. Models are downloaded once and reused across sessions.

## Comparison: Transformers.js vs MediaPipe

| Feature | Transformers.js | MediaPipe |
|---------|----------------|-----------|
| Model Selection | Wide variety (Hugging Face) | Limited (Gemma) |
| Browser Support | All modern browsers | Chrome/Edge 113+ |
| WebGPU Required | Optional (WASM fallback) | Required |
| Model Size | Variable | Optimized binaries |
| Setup Complexity | Simple | Simple |
| Performance | Good (WASM) / Excellent (WebGPU) | Excellent (WebGPU) |

## Troubleshooting

### Model Not Loading

```tsx
// Check browser console for errors
// Ensure model identifier is correct
const agent = createWebAgent({
  model: {
    provider: 'transformers',
    path: 'Xenova/gpt2', // Must be a valid Hugging Face model
  },
});
```

### WebGPU Not Available

The adapter automatically falls back to WASM if WebGPU isn't available. No action needed.

### Out of Memory

For large models, consider:
- Using a smaller model
- Reducing `maxTokens`
- Clearing browser cache

## Examples

See the `examples/` directory for complete working examples:

- `examples/transformers-basic/` - Basic usage
- `examples/transformers-chat/` - Chat interface
- `examples/transformers-streaming/` - Streaming responses

## Resources

- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [Hugging Face Models](https://huggingface.co/models)
- [WebGPU Support](https://caniuse.com/webgpu)


# @web-agent/mediapipe

MediaPipe LLM Inference adapter for browser-based AI agents. Enables running Gemma and compatible models locally in the browser with WebGPU acceleration and WASM fallback.

## Installation

```bash
pnpm add @web-agent/mediapipe @web-agent/core
```

## Quick Start

```typescript
import { MediaPipeAdapter } from '@web-agent/mediapipe';
import { Agent } from '@web-agent/core';

// Create the adapter
const adapter = new MediaPipeAdapter({
  modelPath: '/models/gemma-2b-it-gpu-int4.bin',
});

// Initialize (downloads model, loads into WebGPU)
await adapter.initialize();

// Use with an agent
const agent = new Agent({
  id: 'my-agent',
  name: 'My Agent',
  model: adapter,
  instructions: 'You are a helpful assistant.',
});

const response = await agent.generate('Hello!');
console.log(response.text);
```

## Configuration

```typescript
const adapter = new MediaPipeAdapter({
  // Required: Path to model file
  modelPath: '/models/gemma-2b-it-gpu-int4.bin',

  // Optional: Generation parameters
  maxTokens: 1024,      // Maximum tokens to generate (default: 1024)
  temperature: 0.7,     // Sampling temperature 0-2 (default: 0.7)
  topP: 0.95,           // Nucleus sampling threshold (default: 0.95)
  topK: 40,             // Top-K sampling (default: 40)
  seed: 12345,          // Random seed for reproducibility (optional)

  // Optional: Hardware acceleration
  useWebGPU: true,      // Use WebGPU, falls back to WASM (default: true)

  // Optional: LoRA fine-tuning
  loraRanks: 0,         // LoRA ranks (default: 0)
  loraPath: undefined,  // Path to LoRA model (optional)
});
```

## Streaming

```typescript
for await (const chunk of adapter.stream({
  messages: [{ role: 'user', content: 'Tell me a story' }]
})) {
  switch (chunk.type) {
    case 'text':
      process.stdout.write(chunk.text);
      break;
    case 'tool_call':
      console.log('Tool called:', chunk.toolCall);
      break;
    case 'done':
      console.log('\nGeneration complete');
      console.log('Usage:', chunk.usage);
      break;
  }
}
```

## Function Calling (Tools)

The adapter supports function calling through prompt engineering:

```typescript
const result = await adapter.generate({
  messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
  tools: [{
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' },
      },
      required: ['location'],
    },
  }],
});

if (result.toolCalls) {
  for (const call of result.toolCalls) {
    console.log(`Tool: ${call.name}`, call.arguments);
  }
}
```

## WebGPU Detection

```typescript
import { MediaPipeAdapter, WebGPUNotAvailableError } from '@web-agent/mediapipe';

const adapter = new MediaPipeAdapter({
  modelPath: '/models/gemma-2b-it-gpu-int4.bin',
  useWebGPU: true,
});

try {
  await adapter.initialize();
  console.log('Using WebGPU acceleration');
} catch (error) {
  if (error instanceof WebGPUNotAvailableError) {
    console.log('WebGPU not available, using WASM fallback');
    // Adapter will automatically fall back to WASM
  }
}
```

## Error Handling

The adapter provides specific error classes for different failure scenarios:

```typescript
import {
  MediaPipeAdapter,
  ModelInitializationError,
  ModelNotInitializedError,
  InferenceError,
  ConfigurationError,
} from '@web-agent/mediapipe';

try {
  await adapter.generate({ messages });
} catch (error) {
  if (error instanceof ModelNotInitializedError) {
    console.error('Call initialize() first');
  } else if (error instanceof InferenceError) {
    console.error('Generation failed:', error.message);
  } else if (error instanceof ConfigurationError) {
    console.error('Invalid config:', error.invalidFields);
  }
}
```

## Model Files

Download Gemma models from:

- [Kaggle Gemma Models](https://www.kaggle.com/models/google/gemma)
- [Hugging Face Gemma](https://huggingface.co/google/gemma-2b-it)

Convert to MediaPipe format using the [MediaPipe Model Maker](https://developers.google.com/mediapipe/solutions/customization/llms).

Recommended models:
- `gemma-2b-it-gpu-int4.bin` - 2B parameters, INT4 quantized, WebGPU optimized
- `gemma-2b-it-cpu-int4.bin` - 2B parameters, INT4 quantized, CPU/WASM

## Browser Support

| Browser | WebGPU | WASM Fallback |
|---------|--------|---------------|
| Chrome 113+ | ✅ | ✅ |
| Edge 113+ | ✅ | ✅ |
| Firefox 121+ | ✅ | ✅ |
| Safari 18+ | ✅ | ✅ |
| Mobile Chrome | ⚠️ | ✅ |
| Mobile Safari | ⚠️ | ✅ |

⚠️ = Limited WebGPU support, WASM fallback recommended

## Resource Cleanup

Always dispose the adapter when done to free memory:

```typescript
// When finished
adapter.dispose();
```

## API Reference

### `MediaPipeAdapter`

#### Constructor

```typescript
new MediaPipeAdapter(config: MediaPipeConfig)
```

#### Methods

| Method | Description |
|--------|-------------|
| `initialize()` | Load model into memory |
| `isReady()` | Check if model is loaded |
| `generate(options)` | Generate text response |
| `stream(options)` | Stream text response |
| `supportsTools()` | Returns `true` |
| `getContextWindow()` | Returns `8192` |
| `dispose()` | Free resources |

## License

MIT


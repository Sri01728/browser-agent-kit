# @web-agent/transformers

Transformers.js adapter for browser-based AI agents. Enables running popular Hugging Face models like **Phi-3**, **Llama**, **Mistral**, and **Gemma** locally in the browser with WebGPU acceleration and WASM fallback.

## Features

- ✅ **Model Agnostic**: Support for Phi-3, Llama, Mistral, Gemma, GPT-2, and more
- ✅ **Function Calling**: Built-in support for tool/function calling via chat templates
- ✅ **WebGPU Acceleration**: Automatic WebGPU detection with WASM fallback
- ✅ **Type Safe**: Full TypeScript support with Zod validation
- ✅ **Streaming**: Support for streaming responses
- ✅ **Zero Configuration**: Works out of the box with sensible defaults
- ✅ **Client-First**: Runs entirely in the browser, no server required

## Installation

```bash
pnpm add @web-agent/transformers @web-agent/core
```

## Quick Start

```typescript
import { TransformersAdapter } from '@web-agent/transformers';
import { Agent } from '@web-agent/core';

// Create the adapter
const adapter = new TransformersAdapter({
  modelPath: 'Xenova/Phi-3-mini-4k-instruct',
  modelConfig: {
    maxTokens: 2048,
    temperature: 0.7,
  },
});

// Initialize (downloads model, loads into WebGPU/WASM)
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

## Supported Models

### Phi Models (Recommended for Browser)

Phi models are optimized for efficiency and work great in browsers:

```typescript
const adapter = new TransformersAdapter({
  modelPath: 'Xenova/Phi-3-mini-4k-instruct', // 4K context
});
```

**Models:**
- `Xenova/Phi-3-mini-4k-instruct` - 4K context window
- `Xenova/phi-2` - 2K context window

### Llama Models

```typescript
const adapter = new TransformersAdapter({
  modelPath: 'Xenova/llama-2-7b-chat', // 4K context
});
```

**Models:**
- `Xenova/llama-2-7b-chat` - 4K context window
- `Xenova/llama-3-8b` - 8K context window

### Mistral Models

```typescript
const adapter = new TransformersAdapter({
  modelPath: 'Xenova/Mistral-7B-Instruct-v0.2', // 8K context
});
```

**Models:**
- `Xenova/Mistral-7B-Instruct-v0.2` - 8K context window

### Gemma Models

```typescript
const adapter = new TransformersAdapter({
  modelPath: 'Xenova/gemma-2b-it', // 8K context
});
```

**Models:**
- `Xenova/gemma-2b-it` - 8K context window
- `Xenova/gemma-7b-it` - 8K context window

## Configuration

```typescript
const adapter = new TransformersAdapter({
  // Required: Hugging Face model identifier or local path
  modelPath: 'Xenova/Phi-3-mini-4k-instruct',

  // Optional: Generation parameters
  modelConfig: {
    maxTokens: 2048,         // Maximum tokens to generate (default: 512)
    temperature: 0.7,        // Sampling temperature 0-2 (default: 0.7)
    topP: 0.95,              // Nucleus sampling threshold (default: undefined)
    topK: 50,                // Top-K sampling (default: undefined)
    repetitionPenalty: 1.1,  // Repetition penalty (default: 1.0)
  },

  // Optional: Hardware acceleration
  useWebGPU: true,  // Use WebGPU if available (default: true)
  useWASM: true,    // Use WASM fallback (default: true)

  // Optional: Progress callback for model loading
  onProgress: (progress) => {
    console.log(`Loading: ${progress.loaded}/${progress.total}`);
  },
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
      console.log('Tool call:', chunk.toolCall);
      break;
    case 'done':
      console.log('\nUsage:', chunk.usage);
      break;
  }
}
```

## Function Calling

All models support function calling via model-specific chat templates:

```typescript
import { createTool } from '@web-agent/core';
import { z } from 'zod';

// Define a tool
const weatherTool = createTool({
  id: 'get_weather',
  description: 'Get weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    condition: z.string(),
  }),
  execute: async ({ location }) => {
    // Fetch weather data
    return { temperature: 72, condition: 'sunny' };
  },
});

// Use with agent
const result = await adapter.generate({
  messages: [{ role: 'user', content: 'What is the weather in Paris?' }],
  tools: [weatherTool],
});

if (result.toolCalls) {
  console.log('Tool calls:', result.toolCalls);
  // Execute tools and continue conversation
}
```

### Model-Specific Function Calling Formats

The adapter automatically formats function calls based on the model family:

- **Phi**: `TOOL_CALL: {"name": "...", "arguments": {...}}`
- **Llama**: `<tool_call>{"name": "...", "arguments": {...}}</tool_call>`
- **Mistral**: `{"function": "...", "parameters": {...}}`
- **Gemma**: `CALL_TOOL(name, {...})`

## Advanced Usage

### Custom Chat Templates

```typescript
import {
  formatPhiChat,
  formatLlamaChat,
  formatMistralChat,
  formatGemmaChat,
  parseToolCalls,
} from '@web-agent/transformers';

const messages = [
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'Hello!' },
];

// Format for specific model
const prompt = formatPhiChat(messages);

// Parse tool calls from response
const toolCalls = parseToolCalls(responseText, 'phi');
```

### Model Family Detection

```typescript
import { detectModelFamily } from '@web-agent/transformers';

const family = detectModelFamily('Xenova/Phi-3-mini-4k-instruct');
console.log(family); // 'phi'
```

### Context Window Sizes

```typescript
const contextWindow = adapter.getContextWindow();
console.log(contextWindow); // 4096 for Phi-3
```

## Error Handling

```typescript
import {
  ModelInitializationError,
  ModelNotInitializedError,
  InferenceError,
  ConfigurationError,
  WebGPUNotAvailableError,
  UnsupportedModelError,
} from '@web-agent/transformers';

try {
  await adapter.initialize();
} catch (error) {
  if (error instanceof ModelInitializationError) {
    console.error('Failed to load model:', error.message);
  } else if (error instanceof WebGPUNotAvailableError) {
    console.error('WebGPU not available, using WASM fallback');
  }
}
```

## Performance Tips

1. **Choose the Right Model**: Phi-3 mini is recommended for browser use due to its small size and efficiency.

2. **WebGPU Acceleration**: Ensure WebGPU is available in your browser for best performance.

3. **Model Caching**: Models are cached by Transformers.js after first download.

4. **Context Window**: Keep conversations within the model's context window to avoid truncation.

5. **Streaming**: Use streaming for better UX with long responses.

## Browser Compatibility

- **WebGPU**: Chrome 113+, Edge 113+
- **WASM**: All modern browsers
- **Recommended**: Latest Chrome or Edge for WebGPU support

## Examples

See the [examples directory](../../examples/) for complete examples:

- **Basic Chat**: Simple chatbot with Phi-3
- **Function Calling**: Weather agent with tools
- **Streaming**: Real-time streaming responses
- **Multi-Model**: Comparing different models

## API Reference

### TransformersAdapter

#### Constructor

```typescript
new TransformersAdapter(config: TransformersConfig)
```

#### Methods

- `initialize(): Promise<void>` - Initialize the model
- `isReady(): boolean` - Check if model is ready
- `generate(options: GenerateOptions): Promise<GenerateResult>` - Generate completion
- `stream(options: GenerateOptions): AsyncGenerator<StreamChunk>` - Stream completion
- `supportsTools(): boolean` - Check if tools are supported (always true)
- `getContextWindow(): number` - Get context window size
- `dispose(): void` - Cleanup resources

## Contributing

Contributions are welcome! Please see the [contributing guide](../../CONTRIBUTING.md).

## License

MIT


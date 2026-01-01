# GitHub Copilot Instructions for Web Agent Framework

## Project Context

This is a **client-side web agent orchestration framework** that enables AI agents to:
1. Run LLMs entirely in the browser (MediaPipe, Transformers.js, LiteRT)
2. Execute tools with automatic function calling
3. Control web UI dynamically using A2U and AG-UI protocols
4. Persist conversation memory in IndexedDB

**Inspired by**: Mastra framework (but optimized for browsers, not servers)

**Key Differentiator**: Agents can control and update the UI automatically using declarative protocols

---

## Architecture Overview

```
@web-agent/
├── core/           # Agent, Tool, Memory, Context primitives
├── ui-protocol/    # A2U + AG-UI implementation (Phase 2)
├── react/          # React components (Phase 2)
├── mediapipe/      # MediaPipe LLM adapter (Phase 2)
└── transformers/   # Transformers.js adapter (Future)
```

---

## Code Patterns to Follow

### 1. Type Safety (Always use Zod + TypeScript)

```typescript
import { z } from 'zod';

// ✅ GOOD: Define schemas for validation
const inputSchema = z.object({
  location: z.string(),
  date: z.string().optional()
});

type Input = z.infer<typeof inputSchema>;

// ❌ BAD: Using 'any' or loose types
function process(data: any) { }
```

### 2. Tool Creation Pattern

```typescript
import { createTool } from '@web-agent/core';
import { z } from 'zod';

// ✅ GOOD: Full type safety with schemas
export const myTool = createTool({
  id: 'my-tool',
  description: 'Clear, specific description for LLM',
  inputSchema: z.object({
    param: z.string()
  }),
  outputSchema: z.object({
    result: z.string()
  }),
  execute: async ({ param }) => {
    // Type-safe: param is string
    return { result: `Processed ${param}` };
  }
});
```

### 3. Agent Creation Pattern

```typescript
import { Agent } from '@web-agent/core';

// ✅ GOOD: Clear instructions for LLM behavior
export const agent = new Agent({
  id: 'my-agent',
  name: 'My Agent',
  instructions: `
    You are a helpful assistant that...
    
    Use the following tools:
    - toolName: when to use it
    
    Always respond in a friendly tone.
  `,
  model: modelAdapter,
  tools: { myTool },
  memory: true, // Auto-configure IndexedDB
  defaultOptions: {
    maxSteps: 10, // Prevent infinite loops
    temperature: 0.7
  }
});
```

### 4. Error Handling Pattern

```typescript
// ✅ GOOD: Try-catch with specific error types
try {
  const result = await tool.execute(input);
  return result;
} catch (error) {
  if (error instanceof ToolExecutionError) {
    console.error(`Tool ${error.toolId} failed:`, error.message);
  }
  throw error;
}

// ❌ BAD: Silent failures
try {
  const result = await tool.execute(input);
} catch (error) {
  // Nothing here
}
```

### 5. Memory Usage Pattern

```typescript
// ✅ GOOD: Provide context for memory isolation
await agent.generate("What's the weather?", {
  memory: {
    resource: 'user-123',  // User/entity ID
    thread: 'chat-session-1'  // Conversation thread
  }
});

// ❌ BAD: No context (loses conversation history)
await agent.generate("What's the weather?");
```

---

## UI Control Patterns (Phase 2)

### A2U Protocol Response

```typescript
// ✅ GOOD: Agent returns structured UI
const response = {
  type: 'ui',
  ui: {
    type: 'card',
    props: { title: 'Results' },
    children: [
      { type: 'text', props: { content: 'Details here' } }
    ],
    actions: [
      { type: 'call_tool', params: { tool: 'bookFlight', id: '123' } }
    ]
  }
};
```

### AG-UI Event Pattern

```typescript
// ✅ GOOD: Bidirectional communication
agent.eventBus.on('ui:action', async (action) => {
  const response = await agent.generate(action.message);
  agent.eventBus.emit('agent:response', response);
});
```

---

## Security Guidelines

### ❌ NEVER expose API keys in browser

```typescript
// ❌ BAD: API key in browser code
const tool = createTool({
  execute: async () => {
    return fetch('https://api.example.com', {
      headers: { 'Authorization': `Bearer ${SECRET_KEY}` }
    });
  }
});

// ✅ GOOD: Proxy through backend
const tool = createTool({
  execute: async () => {
    return fetch('/api/proxy/example'); // Your backend handles auth
  }
});
```

### ✅ Always validate inputs

```typescript
// ✅ GOOD: Zod validates at runtime
inputSchema: z.object({
  url: z.string().url(),  // Validates URL format
  amount: z.number().positive().max(1000)  // Range check
})

// ❌ BAD: No validation
function process(data: any) {
  fetch(data.url); // Could be malicious URL
}
```

---

## Performance Guidelines

### Model Loading

```typescript
// ✅ GOOD: Initialize once, cache model
const adapter = new MediaPipeAdapter({
  modelPath: '/models/gemma-2b',
  cache: {
    enabled: true,
    storageKey: 'model-cache'
  }
});

await adapter.initialize(); // Only once

// ❌ BAD: Re-initialize on every request
const adapter = new MediaPipeAdapter({...});
await adapter.initialize(); // Slow!
```

### Memory Management

```typescript
// ✅ GOOD: Limit message history
await agent.memory?.getMessages(context, 50); // Last 50 messages

// ✅ GOOD: Clear old conversations
await agent.memory?.clearMessages({ resource, thread });

// ❌ BAD: Load all messages (memory leak)
await agent.memory?.getMessages(context); // Could be thousands
```

---

## Testing Patterns

```typescript
// ✅ GOOD: Test with mock adapter
import { describe, it, expect } from 'vitest';

describe('Agent', () => {
  it('should call tool correctly', async () => {
    const mockAdapter = {
      isReady: () => true,
      generate: async () => ({
        text: 'Result',
        toolCalls: [{ id: '1', name: 'myTool', arguments: { param: 'test' } }],
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
      })
    };
    
    const agent = new Agent({
      id: 'test-agent',
      model: mockAdapter as any,
      tools: { myTool }
    });
    
    const result = await agent.generate('test');
    expect(result.toolCalls).toHaveLength(1);
  });
});
```

---

## Documentation Standards

### Function Documentation

```typescript
/**
 * Create a new tool with type-safe input/output schemas
 * 
 * @param config - Tool configuration
 * @returns Tool instance with execute() method
 * 
 * @example
 * ```typescript
 * const tool = createTool({
 *   id: 'weather-tool',
 *   inputSchema: z.object({ location: z.string() }),
 *   outputSchema: z.object({ weather: z.string() }),
 *   execute: async ({ location }) => {
 *     const weather = await fetchWeather(location);
 *     return { weather };
 *   }
 * });
 * ```
 */
export function createTool<T, U>(config: ToolConfig<T, U>): Tool<T, U>
```

### Interface Documentation

```typescript
/**
 * LLM adapter interface for browser-based models
 * 
 * Implementations:
 * - MediaPipeAdapter: Google's Gemma models
 * - TransformersAdapter: HuggingFace models  
 * - LiteRTAdapter: TensorFlow Lite models
 */
export interface LLMAdapter {
  /** Unique identifier for this adapter */
  id: string;
  
  /** Initialize the model (download, load into WebGPU) */
  initialize(): Promise<void>;
  
  // ... rest of interface
}
```

---

## File Organization

```
packages/[package-name]/
├── src/
│   ├── index.ts              # Public exports
│   ├── types.ts              # TypeScript types
│   ├── [feature]/
│   │   ├── index.ts          # Feature exports
│   │   ├── types.ts          # Feature types
│   │   └── [implementation].ts
│   └── utils/                # Shared utilities
├── package.json
├── tsconfig.json
└── tsup.config.ts            # Build config
```

---

## Common Gotchas

### 1. IndexedDB API is Async

```typescript
// ✅ GOOD: Await database operations
await this.db.transaction('messages', 'readwrite');

// ❌ BAD: Synchronous assumption
this.db.transaction('messages', 'readwrite'); // Returns Promise!
```

### 2. WebGPU Not Available Everywhere

```typescript
// ✅ GOOD: Check for WebGPU support
if (!navigator.gpu) {
  throw new Error('WebGPU not supported. Use a modern browser.');
}

// ❌ BAD: Assume WebGPU exists
await navigator.gpu.requestAdapter(); // Might fail
```

### 3. CORS Limitations

```typescript
// ✅ GOOD: Document CORS requirements
/**
 * Calls external API. Requires CORS headers or backend proxy.
 */
async execute({ url }) {
  return fetch(url); // May fail due to CORS
}

// Better: Provide proxy option
async execute({ url }, { proxy = '/api/proxy' }) {
  return fetch(`${proxy}?url=${encodeURIComponent(url)}`);
}
```

---

## When to Use Each Primitive

### Agent
Use for: Open-ended tasks requiring reasoning and multiple tools
```typescript
// ✅ "Book me a flight to Paris with hotel"
// ✅ "Analyze this data and create a report"
```

### Tool
Use for: Single, well-defined operations
```typescript
// ✅ searchFlights({ destination: "Paris" })
// ✅ bookHotel({ city: "Paris", dates: [...] })
```

### Workflow (Future)
Use for: Predefined sequences with branching logic
```typescript
// ✅ Step 1: Search flights
// ✅ Step 2: If price < $500, book, else notify user
// ✅ Step 3: Send confirmation email
```

---

## Generate Code That Follows These Patterns!

When generating code for this project:

1. ✅ Use Zod for all schemas
2. ✅ Export types using `z.infer<>`
3. ✅ Add JSDoc comments with examples
4. ✅ Include error handling
5. ✅ Follow the file organization structure
6. ✅ Use the established patterns above
7. ✅ Add TODO comments for Phase 2+ features

**Example**:
```typescript
// When asked to create a new tool:
import { createTool } from '@web-agent/core';
import { z } from 'zod';

/**
 * [Clear description of what the tool does]
 * 
 * @example
 * ```typescript
 * const result = await myTool.execute({ param: 'value' });
 * ```
 */
export const myTool = createTool({
  id: 'my-tool',
  description: 'Clear description for LLM',
  inputSchema: z.object({
    param: z.string()
  }),
  outputSchema: z.object({
    result: z.string()
  }),
  execute: async ({ param }) => {
    try {
      // Implementation
      return { result: 'success' };
    } catch (error) {
      throw new ToolExecutionError(
        `Failed to execute: ${error.message}`,
        'my-tool',
        error
      );
    }
  }
});
```

---

## Phase 2 TODOs (UI Protocol Layer)

When implementing A2U/AG-UI features:

```typescript
// TODO(Phase-2): Implement A2U component renderer
// TODO(Phase-2): Add AG-UI event bus
// TODO(Phase-2): Create React integration
```

---

**Remember**: This is a BROWSER-FIRST framework. No server-side code in core packages!


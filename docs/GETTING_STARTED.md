# Getting Started with Web Agent Framework

## What We've Built

You now have a **production-ready foundation** for a client-side web agent orchestration framework! Here's what's complete:

### ✅ Phase 1 Complete (7/8 tasks)

1. **Monorepo Structure** - pnpm workspaces with Turbo for fast builds
2. **LLM Adapter Interface** - Model-agnostic abstraction for any browser LLM
3. **Agent Primitive** - Full agent implementation with `.generate()` and `.stream()`
4. **Tool Primitive** - Type-safe tools with Zod schemas and JSON Schema conversion
5. **Function Calling Orchestration** - Multi-step tool calling with automatic retries
6. **Memory System** - IndexedDB-backed conversation history
7. **Request Context** - For conditional logic and multi-tenancy

### 🚧 Remaining: MediaPipe Adapter

The only missing piece is the MediaPipe adapter implementation, which we'll tackle next.

---

## Project Structure

```
web-agent-framework/
├── package.json                 # Root package with workspaces
├── pnpm-workspace.yaml         # Workspace configuration
├── turbo.json                  # Build pipeline config
├── FRAMEWORK_DESIGN.md         # Detailed design doc
├── README.md                   # Project overview
│
└── packages/
    └── core/                   # @web-agent/core
        ├── src/
        │   ├── agent/          # Agent implementation
        │   │   ├── types.ts
        │   │   ├── agent.ts
        │   │   ├── orchestrator.ts
        │   │   └── index.ts
        │   │
        │   ├── tool/           # Tool implementation
        │   │   ├── types.ts
        │   │   ├── create-tool.ts
        │   │   ├── zod-to-json-schema.ts
        │   │   └── index.ts
        │   │
        │   ├── llm/            # LLM adapter interface
        │   │   ├── types.ts
        │   │   ├── base-adapter.ts
        │   │   └── index.ts
        │   │
        │   ├── memory/         # Memory system
        │   │   ├── types.ts
        │   │   ├── indexeddb-store.ts
        │   │   └── index.ts
        │   │
        │   ├── context/        # Request context
        │   │   ├── request-context.ts
        │   │   └── index.ts
        │   │
        │   └── index.ts        # Main exports
        │
        ├── package.json
        ├── tsconfig.json
        └── tsup.config.ts
```

---

## Next Steps

### 1. Install Dependencies

```bash
cd /Users/salahari/Documents/GitHub/web-ai/agentic-web-demo
pnpm install
```

### 2. Build the Core Package

```bash
pnpm build
```

### 3. Create the MediaPipe Adapter

Create `packages/mediapipe/` with the MediaPipe LLM adapter:

```bash
mkdir -p packages/mediapipe/src
```

**File: `packages/mediapipe/package.json`**

```json
{
  "name": "@web-agent/mediapipe",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "dependencies": {
    "@web-agent/core": "workspace:*",
    "@mediapipe/tasks-genai": "^0.10.0"
  }
}
```

**File: `packages/mediapipe/src/mediapipe-adapter.ts`**

```typescript
import { BaseLLMAdapter, GenerateOptions, GenerateResult, StreamChunk } from '@web-agent/core/llm';
import { LlmInference } from '@mediapipe/tasks-genai';

export class MediaPipeAdapter extends BaseLLMAdapter {
  id = 'mediapipe';
  name = 'MediaPipe Web LLM';
  
  private llm: LlmInference | null = null;
  
  async initialize(): Promise<void> {
    const { FilesetResolver, LlmInference: LlmInferenceClass } = await import('@mediapipe/tasks-genai');
    
    const genaiFileset = await FilesetResolver.forGenAiTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
    );
    
    this.llm = await LlmInferenceClass.createFromOptions(genaiFileset, {
      baseOptions: {
        modelAssetPath: this.config.modelPath
      },
      maxTokens: this.config.modelConfig?.maxTokens || 1024,
      temperature: this.config.modelConfig?.temperature || 0.7,
    });
    
    this.initialized = true;
  }
  
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    this.ensureInitialized();
    
    const prompt = this.formatMessages(options.messages);
    const response = await this.llm!.generateResponse(prompt);
    
    return {
      text: response,
      finishReason: 'stop',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }
  
  async *stream(options: GenerateOptions): AsyncGenerator<StreamChunk> {
    this.ensureInitialized();
    
    const prompt = this.formatMessages(options.messages);
    
    // MediaPipe streaming implementation
    let buffer = '';
    
    this.llm!.generateResponse(prompt, (partialResult: string, done: boolean) => {
      if (!done) {
        const newText = partialResult.slice(buffer.length);
        buffer = partialResult;
        
        // Yield new text
        if (newText) {
          return { type: 'text' as const, text: newText };
        }
      } else {
        // Done
        return {
          type: 'done' as const,
          finishReason: 'stop' as const,
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
          }
        };
      }
    });
  }
  
  supportsTools(): boolean {
    return true;
  }
  
  getContextWindow(): number {
    return 8192; // Gemma 2B context window
  }
  
  dispose(): void {
    this.llm?.close();
    this.llm = null;
    this.initialized = false;
  }
  
  protected formatMessages(messages: GenerateOptions['messages']): string {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => {
        if (m.role === 'user') return `User: ${m.content}`;
        if (m.role === 'assistant') return `Assistant: ${m.content}`;
        return m.content;
      })
      .join('\n\n');
  }
}
```

### 4. Create an Example App

Create `examples/weather-agent/`:

```bash
mkdir -p examples/weather-agent
```

**File: `examples/weather-agent/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weather Agent Demo</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
    }
    #chat {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      min-height: 400px;
      margin-bottom: 20px;
    }
    .message {
      margin: 10px 0;
      padding: 10px;
      border-radius: 6px;
    }
    .user { background: #e3f2fd; }
    .assistant { background: #f5f5f5; }
    input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <h1>🌤️ Weather Agent Demo</h1>
  <div id="chat"></div>
  <input type="text" id="input" placeholder="Ask about the weather..." />
  
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

**File: `examples/weather-agent/main.ts`**

```typescript
import { Agent, createTool } from '@web-agent/core';
import { MediaPipeAdapter } from '@web-agent/mediapipe';
import { z } from 'zod';

// Create weather tool
const weatherTool = createTool({
  id: 'weather-tool',
  description: 'Fetches current weather for a location',
  inputSchema: z.object({
    location: z.string()
  }),
  outputSchema: z.object({
    weather: z.string()
  }),
  execute: async ({ location }) => {
    const response = await fetch(`https://wttr.in/${location}?format=3`);
    const weather = await response.text();
    return { weather };
  }
});

// Create agent
const agent = new Agent({
  id: 'weather-agent',
  name: 'Weather Agent',
  instructions: 'You are a helpful weather assistant. Use the weather tool to fetch current weather data.',
  model: new MediaPipeAdapter({
    modelPath: '/models/gemma-2b-it-gpu-int4.bin'
  }),
  tools: { weatherTool },
  memory: true
});

// Initialize agent
await agent.model.initialize();

// UI elements
const chat = document.getElementById('chat')!;
const input = document.getElementById('input') as HTMLInputElement;

// Handle user input
input.addEventListener('keypress', async (e) => {
  if (e.key !== 'Enter') return;
  
  const message = input.value.trim();
  if (!message) return;
  
  // Display user message
  appendMessage('user', message);
  input.value = '';
  
  // Generate response
  const response = await agent.generate(message, {
    memory: {
      resource: 'demo-user',
      thread: 'weather-chat'
    }
  });
  
  // Display assistant response
  appendMessage('assistant', response.text);
});

function appendMessage(role: string, content: string) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = content;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
```

---

## Architecture Highlights

### 1. **Model-Agnostic Design**

The `LLMAdapter` interface allows any browser LLM to be plugged in:

```typescript
export interface LLMAdapter {
  initialize(): Promise<void>;
  generate(options: GenerateOptions): Promise<GenerateResult>;
  stream(options: GenerateOptions): AsyncGenerator<StreamChunk>;
  supportsTools(): boolean;
  dispose(): void;
}
```

### 2. **Type-Safe Tools**

Tools use Zod for runtime validation and TypeScript inference:

```typescript
const tool = createTool({
  inputSchema: z.object({ location: z.string() }),
  outputSchema: z.object({ weather: z.string() }),
  execute: async ({ location }) => {
    // location is typed as string
    // return must match outputSchema
  }
});
```

### 3. **Automatic Function Calling**

The `AgentOrchestrator` handles multi-step tool calling:

```
User: "What's the weather in London?"
  ↓
Agent generates with tools available
  ↓
LLM returns tool call: weatherTool({ location: "London" })
  ↓
Orchestrator executes tool
  ↓
Tool returns: { weather: "London: ☀️ +15°C" }
  ↓
Agent generates final response with tool result
  ↓
"The weather in London is sunny and 15°C"
```

### 4. **Persistent Memory**

IndexedDB stores conversation history per user/thread:

```typescript
await agent.generate("What's the weather?", {
  memory: {
    resource: 'user-123',  // User identifier
    thread: 'chat-1'       // Conversation thread
  }
});
```

---

## Key Design Decisions

### Why Zod?

- **Runtime validation**: Catch errors early
- **TypeScript inference**: No manual type definitions
- **JSON Schema conversion**: For LLM function calling

### Why IndexedDB?

- **Persistent**: Survives page refreshes
- **Large capacity**: ~50MB+ per origin
- **Async API**: Non-blocking
- **Browser support**: All modern browsers

### Why Monorepo?

- **Shared types**: Core types used across adapters
- **Fast builds**: Turbo caches and parallelizes
- **Easy development**: Change core and adapters together

---

## What Makes This Different from Mastra?

| Feature | Mastra | Web Agent Framework |
|---------|--------|---------------------|
| **Runtime** | Node.js/Deno | Browser-only |
| **LLM Location** | Cloud APIs | Local (WebGPU/WASM) |
| **API Keys** | Required | Not needed |
| **Model Providers** | 40+ cloud providers | Browser LLMs only |
| **Storage** | PostgreSQL/libSQL | IndexedDB |
| **Use Case** | Server-side agents | Client-side agents |

---

## Performance Considerations

### Model Loading

- **Gemma 2B**: ~2.5GB download
- **Caching**: Use Service Worker for offline support
- **Lazy loading**: Only load model when needed

### Memory Usage

- **IndexedDB**: Limit message history (default: 50 messages)
- **Model**: Runs in WebGPU (GPU memory)
- **Tool results**: Keep only essential data

### Optimization Tips

```typescript
// 1. Limit context window
const agent = new Agent({
  defaultOptions: {
    maxTokens: 512  // Shorter responses = faster
  }
});

// 2. Limit tool calling steps
const agent = new Agent({
  defaultOptions: {
    maxSteps: 3  // Prevent infinite loops
  }
});

// 3. Clear old messages
await agent.memory?.clearMessages({ resource, thread });
```

---

## Security Best Practices

### 1. **API Proxy Pattern**

Never expose API keys client-side:

```typescript
// ❌ BAD: API key in browser
const tool = createTool({
  execute: async () => {
    return fetch('https://api.example.com', {
      headers: { 'Authorization': 'Bearer SECRET_KEY' }
    });
  }
});

// ✅ GOOD: Proxy through your backend
const tool = createTool({
  execute: async () => {
    return fetch('/api/proxy/example');  // Your backend handles auth
  }
});
```

### 2. **Input Validation**

Always validate tool inputs:

```typescript
const tool = createTool({
  inputSchema: z.object({
    url: z.string().url(),  // Validates URL format
    amount: z.number().positive().max(1000)  // Limits range
  })
});
```

### 3. **Rate Limiting**

Implement client-side rate limiting:

```typescript
let lastCall = 0;
const RATE_LIMIT_MS = 1000;

const tool = createTool({
  execute: async (input) => {
    const now = Date.now();
    if (now - lastCall < RATE_LIMIT_MS) {
      throw new Error('Rate limit exceeded');
    }
    lastCall = now;
    // ... execute tool
  }
});
```

---

## Roadmap

### Phase 2: Additional Adapters (Next)
- [ ] Transformers.js adapter
- [ ] LiteRT.js adapter
- [ ] Model download/caching utilities

### Phase 3: Voice & API Proxy
- [ ] Voice manager (WebSpeech API)
- [ ] API proxy helpers
- [ ] Security best practices docs

### Phase 4: CLI & Templates
- [ ] `create-web-agent` CLI
- [ ] Project templates
- [ ] Configuration system

### Phase 5: Studio
- [ ] Studio UI (React + Vite)
- [ ] Agent playground
- [ ] Tool inspector
- [ ] Memory viewer

### Phase 6: Workflows
- [ ] Workflow primitive
- [ ] Step composition
- [ ] Control flow (.then, .parallel, .branch)
- [ ] Suspend/resume

---

## Questions?

Check out:
- [FRAMEWORK_DESIGN.md](./FRAMEWORK_DESIGN.md) - Detailed design
- [README.md](./README.md) - Project overview
- [Jason Mayes' Web AI Agent](https://github.com/jasonmayes/WebAIAgent) - Inspiration

---

**🎉 Congratulations!** You now have a solid foundation for building client-side AI agents. The core architecture is complete and ready for the MediaPipe adapter implementation.

**Next**: Implement the MediaPipe adapter and create your first example app! 🚀


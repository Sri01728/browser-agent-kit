# Client-Side Web Agent Orchestration Framework
## Design Document

> **Goal**: Build a Mastra-inspired framework for orchestrating browser-based LLMs with great DX, zero configuration, and model-agnostic architecture.

---

## Architecture Overview

### Design Principles

1. **Zero Configuration**: Works out of the box with sensible defaults
2. **Model Agnostic**: Support MediaPipe, Transformers.js, LiteRT.js through adapters
3. **Type Safe**: Full TypeScript support with Zod schemas
4. **Composable**: Agents, Workflows, Tools as first-class primitives
5. **Client-First**: No server required for LLM execution
6. **Secure by Default**: API proxy patterns for external calls

---

## Core Primitives

### 1. Agent

```typescript
import { Agent } from '@web-agent/core';
import { MediaPipeAdapter } from '@web-agent/mediapipe';

const agent = new Agent({
  id: 'my-agent',
  name: 'My Agent',
  instructions: 'You are a helpful assistant',
  model: new MediaPipeAdapter({
    modelPath: '/models/gemma-2b'
  }),
  tools: { weatherTool },
  memory: true // Auto-configure IndexedDB
});

// Generate
const response = await agent.generate('Hello!');

// Stream
const stream = await agent.stream('Hello!');
for await (const chunk of stream.textStream) {
  console.log(chunk);
}
```

### 2. Tool

```typescript
import { createTool } from '@web-agent/core';
import { z } from 'zod';

export const weatherTool = createTool({
  id: 'weather-tool',
  description: 'Fetches weather for a location',
  inputSchema: z.object({
    location: z.string()
  }),
  outputSchema: z.object({
    weather: z.string()
  }),
  execute: async ({ location }) => {
    // Call external API through proxy
    const weather = await fetch(`/api/weather?location=${location}`)
      .then(r => r.json());
    return { weather };
  }
});
```

### 3. Workflow (Future Phase)

```typescript
import { createWorkflow, createStep } from '@web-agent/core';

const step1 = createStep({
  id: 'step-1',
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ inputData }) => {
    return { result: `Processed: ${inputData.query}` };
  }
});

export const workflow = createWorkflow({
  id: 'my-workflow',
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ result: z.string() })
})
  .then(step1)
  .commit();
```

---

## LLM Adapter Interface

### Base Interface

```typescript
export interface LLMAdapter {
  id: string;
  name: string;
  
  // Initialize the model (download, load into WebGPU)
  initialize(): Promise<void>;
  
  // Check if model is ready
  isReady(): boolean;
  
  // Generate text
  generate(options: GenerateOptions): Promise<GenerateResult>;
  
  // Stream text
  stream(options: GenerateOptions): AsyncGenerator<StreamChunk>;
  
  // Function calling support
  supportsTools(): boolean;
  
  // Cleanup
  dispose(): void;
}

export interface GenerateOptions {
  messages: Message[];
  tools?: Tool[];
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

export interface GenerateResult {
  text: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'length' | 'tool_calls';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### MediaPipe Adapter Implementation

```typescript
import { LLMAdapter, GenerateOptions, GenerateResult } from '@web-agent/core';
import { LlmInference } from '@mediapipe/tasks-genai';

export class MediaPipeAdapter implements LLMAdapter {
  id = 'mediapipe';
  name = 'MediaPipe Web LLM';
  
  private llm: LlmInference | null = null;
  private modelPath: string;
  
  constructor(config: { modelPath: string }) {
    this.modelPath = config.modelPath;
  }
  
  async initialize(): Promise<void> {
    this.llm = await LlmInference.createFromOptions(wasmLoaderOptions, {
      baseOptions: { modelAssetPath: this.modelPath },
      maxTokens: 1024,
      temperature: 0.7,
    });
  }
  
  isReady(): boolean {
    return this.llm !== null;
  }
  
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    if (!this.llm) throw new Error('Model not initialized');
    
    const prompt = this.formatMessages(options.messages);
    const response = await this.llm.generateResponse(prompt);
    
    return {
      text: response,
      finishReason: 'stop',
      usage: {
        promptTokens: 0, // MediaPipe doesn't provide this
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }
  
  async *stream(options: GenerateOptions): AsyncGenerator<StreamChunk> {
    if (!this.llm) throw new Error('Model not initialized');
    
    const prompt = this.formatMessages(options.messages);
    
    // MediaPipe streaming implementation
    this.llm.generateResponse(prompt, (partialResult: string, done: boolean) => {
      // Yield chunks
    });
  }
  
  supportsTools(): boolean {
    return true; // Implement function calling
  }
  
  dispose(): void {
    this.llm?.close();
    this.llm = null;
  }
  
  private formatMessages(messages: Message[]): string {
    // Convert messages to MediaPipe format
    return messages.map(m => `${m.role}: ${m.content}`).join('\n');
  }
}
```

---

## Memory Architecture

### Client-Side Storage

```typescript
export interface MemoryStore {
  // Save message
  saveMessage(message: Message, context: MemoryContext): Promise<void>;
  
  // Retrieve messages
  getMessages(context: MemoryContext, limit?: number): Promise<Message[]>;
  
  // Clear messages
  clearMessages(context: MemoryContext): Promise<void>;
}

export interface MemoryContext {
  resource: string; // User ID or entity
  thread: string;   // Conversation thread
}

// IndexedDB implementation
export class IndexedDBMemoryStore implements MemoryStore {
  private db: IDBDatabase;
  
  async saveMessage(message: Message, context: MemoryContext): Promise<void> {
    const tx = this.db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    
    await store.add({
      ...message,
      resource: context.resource,
      thread: context.thread,
      timestamp: Date.now()
    });
  }
  
  async getMessages(context: MemoryContext, limit = 50): Promise<Message[]> {
    const tx = this.db.transaction('messages', 'readonly');
    const store = tx.objectStore('messages');
    const index = store.index('by_thread');
    
    const messages = await index.getAll(
      IDBKeyRange.only([context.resource, context.thread])
    );
    
    return messages.slice(-limit);
  }
  
  async clearMessages(context: MemoryContext): Promise<void> {
    // Implementation
  }
}
```

---

## Function Calling Orchestration

### Agent Orchestration Logic

```typescript
export class AgentOrchestrator {
  private agent: Agent;
  private maxIterations: number;
  
  async execute(prompt: string, options: ExecuteOptions): Promise<AgentResult> {
    let messages: Message[] = [
      { role: 'system', content: this.agent.instructions },
      { role: 'user', content: prompt }
    ];
    
    let iteration = 0;
    
    while (iteration < this.maxIterations) {
      // Generate response
      const result = await this.agent.model.generate({
        messages,
        tools: this.agent.tools
      });
      
      // No tool calls? We're done
      if (!result.toolCalls || result.toolCalls.length === 0) {
        return {
          text: result.text,
          steps: iteration,
          finishReason: result.finishReason
        };
      }
      
      // Execute tool calls
      const toolResults = await this.executeTools(result.toolCalls);
      
      // Add assistant message with tool calls
      messages.push({
        role: 'assistant',
        content: result.text,
        toolCalls: result.toolCalls
      });
      
      // Add tool results
      for (const toolResult of toolResults) {
        messages.push({
          role: 'tool',
          content: JSON.stringify(toolResult.result),
          toolCallId: toolResult.id
        });
      }
      
      iteration++;
    }
    
    throw new Error('Max iterations reached');
  }
  
  private async executeTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    return Promise.all(
      toolCalls.map(async (call) => {
        const tool = this.agent.tools[call.name];
        if (!tool) {
          return {
            id: call.id,
            error: `Tool ${call.name} not found`
          };
        }
        
        try {
          const result = await tool.execute(call.arguments);
          return {
            id: call.id,
            result
          };
        } catch (error) {
          return {
            id: call.id,
            error: error.message
          };
        }
      })
    );
  }
}
```

---

## API Proxy Patterns

### Secure External API Calls

Since external API keys can't be exposed client-side, provide patterns for proxying:

**Option 1: User-provided proxy endpoint**

```typescript
const agent = new Agent({
  id: 'my-agent',
  tools: {
    weatherTool: createTool({
      id: 'weather',
      execute: async ({ location }) => {
        // User provides their own backend endpoint
        const response = await fetch('/api/weather', {
          method: 'POST',
          body: JSON.stringify({ location })
        });
        return response.json();
      }
    })
  }
});
```

**Option 2: Framework-provided proxy helpers**

```typescript
import { createProxiedTool } from '@web-agent/core';

export const weatherTool = createProxiedTool({
  id: 'weather',
  proxyEndpoint: '/api/weather', // User's backend
  inputSchema: z.object({ location: z.string() }),
  outputSchema: z.object({ weather: z.string() })
});
```

---

## Voice Integration

### WebSpeech API + TTS

```typescript
export class VoiceManager {
  private recognition: SpeechRecognition;
  private synthesis: SpeechSynthesis;
  
  // Speech-to-Text
  async listen(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };
      this.recognition.onerror = reject;
      this.recognition.start();
    });
  }
  
  // Text-to-Speech
  async speak(text: string, options?: SpeakOptions): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = options?.voice || this.getDefaultVoice();
      utterance.onend = () => resolve();
      this.synthesis.speak(utterance);
    });
  }
  
  private getDefaultVoice(): SpeechSynthesisVoice {
    const voices = this.synthesis.getVoices();
    return voices[0];
  }
}

// Agent with voice
const agent = new Agent({
  id: 'voice-agent',
  voice: new VoiceManager()
});

// Voice interaction
const transcript = await agent.voice.listen();
const response = await agent.generate(transcript);
await agent.voice.speak(response.text);
```

---

## CLI & Scaffolding

### `create-web-agent` CLI

```bash
npm create web-agent@latest my-app
```

**Template structure:**

```
my-app/
├── src/
│   ├── agents/
│   │   └── assistant.ts
│   ├── tools/
│   │   └── weather.ts
│   ├── index.ts
│   └── web-agent.config.ts
├── public/
│   └── models/           # LLM model files
├── package.json
└── tsconfig.json
```

**Configuration file:**

```typescript
// web-agent.config.ts
import { defineConfig } from '@web-agent/core';

export default defineConfig({
  llm: {
    adapter: 'mediapipe',
    modelPath: '/models/gemma-2b'
  },
  memory: {
    provider: 'indexeddb',
    dbName: 'web-agent-memory'
  },
  voice: {
    enabled: true,
    language: 'en-US'
  }
});
```

---

## Studio (Visual Debugger)

### Features

1. **Agent Playground**: Test agents with different prompts
2. **Tool Inspector**: View tool calls and results
3. **Memory Viewer**: Inspect conversation history
4. **Model Manager**: Download/manage LLM models
5. **Performance Monitor**: Track token usage, latency

### Implementation

```typescript
// Studio as a separate package
import { Studio } from '@web-agent/studio';

const studio = new Studio({
  agents: [agent1, agent2],
  port: 3000
});

studio.start();
// Opens http://localhost:3000
```

---

## Example Use Cases

### 1. E-commerce Shopping Assistant

```typescript
import { Agent, createTool } from '@web-agent/core';
import { MediaPipeAdapter } from '@web-agent/mediapipe';

const searchProductsTool = createTool({
  id: 'search-products',
  description: 'Search for products',
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ products: z.array(z.any()) }),
  execute: async ({ query }) => {
    const products = await fetch(`/api/products?q=${query}`)
      .then(r => r.json());
    return { products };
  }
});

const shoppingAgent = new Agent({
  id: 'shopping-assistant',
  instructions: 'You help users find and purchase products',
  model: new MediaPipeAdapter({ modelPath: '/models/gemma-2b' }),
  tools: { searchProductsTool },
  memory: true
});

// Usage
const response = await shoppingAgent.generate(
  'I need a laptop under $1000',
  {
    memory: {
      resource: 'user-123',
      thread: 'shopping-session-1'
    }
  }
);
```

### 2. Data Dashboard Assistant

```typescript
const queryDataTool = createTool({
  id: 'query-data',
  description: 'Query analytics data',
  inputSchema: z.object({
    metric: z.string(),
    timeRange: z.string()
  }),
  outputSchema: z.object({ data: z.any() }),
  execute: async ({ metric, timeRange }) => {
    // Query local IndexedDB or API
    return { data: [] };
  }
});

const dashboardAgent = new Agent({
  id: 'dashboard-assistant',
  instructions: 'You help users analyze their data',
  model: new MediaPipeAdapter({ modelPath: '/models/gemma-2b' }),
  tools: { queryDataTool }
});
```

---

## Implementation Phases

### Phase 1: Core Foundation (Weeks 1-3)
- [ ] Monorepo setup (pnpm workspaces)
- [ ] LLM adapter interface
- [ ] MediaPipe adapter implementation
- [ ] Agent primitive (generate/stream)
- [ ] Tool primitive with Zod schemas
- [ ] Function calling orchestration
- [ ] IndexedDB memory store
- [ ] Request context

### Phase 2: Additional Adapters (Weeks 4-5)
- [ ] Transformers.js adapter
- [ ] LiteRT.js adapter
- [ ] Adapter testing suite
- [ ] Model download/caching utilities

### Phase 3: Voice & API Proxy (Week 6)
- [ ] Voice manager (WebSpeech API)
- [ ] API proxy helpers
- [ ] Security best practices docs

### Phase 4: CLI & Templates (Week 7)
- [ ] `create-web-agent` CLI
- [ ] Project templates
- [ ] Configuration system

### Phase 5: Studio (Weeks 8-9)
- [ ] Studio UI (React + Vite)
- [ ] Agent playground
- [ ] Tool inspector
- [ ] Memory viewer

### Phase 6: Workflows (Weeks 10-12)
- [ ] Workflow primitive
- [ ] Step composition
- [ ] Control flow (.then, .parallel, .branch)
- [ ] Suspend/resume

---

## Success Metrics

1. **DX**: Time to first agent < 5 minutes
2. **Performance**: Model load time < 10 seconds
3. **Bundle Size**: Core < 50KB gzipped
4. **Documentation**: 100% API coverage
5. **Examples**: 5+ real-world use cases

---

## References

- [Jason Mayes Web AI Agent](https://github.com/jasonmayes/WebAIAgent)
- [Mastra Framework](https://mastra.ai)
- [MediaPipe Web LLM](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/web_js)
- [Transformers.js](https://huggingface.co/docs/transformers.js)
- [WebGPU Specification](https://www.w3.org/TR/webgpu/)

---

**Next Steps**: Review this design, provide feedback, and we'll start implementing Phase 1! 🚀


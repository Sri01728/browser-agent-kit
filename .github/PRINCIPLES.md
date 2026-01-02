# Code Generation Principles for Web Agent Framework

> Use these principles when generating code with GitHub Copilot or any AI assistant for this project.

---

## 🎯 Project Vision

**Build a production-grade, client-side AI agent framework that:**
1. Runs LLMs entirely in the browser (privacy-first, offline-capable)
2. Enables agents to dynamically control web interfaces
3. Provides exceptional developer experience with zero configuration
4. Maintains type safety and runtime validation throughout

---

## 1. 📐 Code Quality Principles

### Type Safety First

```typescript
// ✅ ALWAYS: Full type safety with inference
import { z } from 'zod';

const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email()
});

type User = z.infer<typeof userSchema>;

function processUser(user: User) {
  // Fully typed, IDE autocomplete works
}

// ❌ NEVER: Using 'any' or 'unknown' without validation
function processUser(user: any) { }
function processUser(user: unknown) {
  user.name; // No validation, unsafe
}
```

### Schema-Driven Development

```typescript
// ✅ ALWAYS: Define schemas first, derive types
const inputSchema = z.object({ query: z.string() });
const outputSchema = z.object({ results: z.array(z.string()) });

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// ❌ NEVER: Define types manually then validate separately
interface Input { query: string; }
// Then forget to validate...
```

### Error Handling Excellence

```typescript
// ✅ ALWAYS: Specific error types with context
export class ToolExecutionError extends Error {
  constructor(
    message: string,
    public toolId: string,
    public input: unknown,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}

try {
  await tool.execute(input);
} catch (error) {
  if (error instanceof ToolExecutionError) {
    console.error(`Tool ${error.toolId} failed with input:`, error.input);
    // Can retry, log, or recover gracefully
  }
  throw error;
}

// ❌ NEVER: Generic errors or swallowed exceptions
try {
  await tool.execute(input);
} catch (e) {
  throw new Error('Something went wrong'); // No context!
}
```

### Immutability by Default

```typescript
// ✅ ALWAYS: Immutable updates
function updateConfig(config: Config, updates: Partial<Config>): Config {
  return { ...config, ...updates };
}

const messages = [...previousMessages, newMessage];

// ❌ NEVER: Mutate in place
function updateConfig(config: Config, updates: Partial<Config>) {
  Object.assign(config, updates); // Mutates!
  return config;
}

messages.push(newMessage); // Side effect!
```

### Single Responsibility

```typescript
// ✅ ALWAYS: One function, one purpose
async function validateInput(input: unknown): Promise<ValidatedInput> {
  return inputSchema.parse(input);
}

async function executeLogic(input: ValidatedInput): Promise<Output> {
  // Only business logic here
}

async function formatOutput(output: Output): Promise<FormattedOutput> {
  // Only formatting here
}

// ❌ NEVER: God functions that do everything
async function doEverything(input: unknown) {
  // Validates, executes, formats, logs, retries... 500 lines
}
```

---

## 2. 🧪 Testing Standards

### Test Structure

```typescript
// ✅ ALWAYS: Arrange-Act-Assert pattern
describe('Agent', () => {
  describe('generate()', () => {
    it('should return response with tool calls when tools match prompt', async () => {
      // Arrange
      const mockAdapter = createMockAdapter({
        response: { text: 'Result', toolCalls: [...] }
      });
      const agent = new Agent({ model: mockAdapter, tools: { myTool } });
      
      // Act
      const result = await agent.generate('Use myTool');
      
      // Assert
      expect(result.text).toBe('Result');
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('myTool');
    });
  });
});
```

### Test Coverage Requirements

```typescript
// ✅ ALWAYS: Test these scenarios

// 1. Happy path
it('should succeed with valid input', async () => {});

// 2. Edge cases
it('should handle empty input', async () => {});
it('should handle maximum length input', async () => {});

// 3. Error cases
it('should throw ToolExecutionError on failure', async () => {});
it('should validate input schema', async () => {});

// 4. Async behavior
it('should handle concurrent calls', async () => {});
it('should timeout after 30 seconds', async () => {});

// 5. Memory/cleanup
it('should clean up resources on dispose', async () => {});
```

### Mock Patterns

```typescript
// ✅ ALWAYS: Type-safe mocks
function createMockAdapter(overrides?: Partial<LLMAdapter>): LLMAdapter {
  return {
    id: 'mock',
    name: 'Mock Adapter',
    isReady: () => true,
    initialize: async () => {},
    generate: async () => ({
      text: 'Mock response',
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
    }),
    stream: async function* () { yield { type: 'text', text: 'Mock' }; },
    supportsTools: () => true,
    getContextWindow: () => 4096,
    dispose: () => {},
    ...overrides
  };
}

// ❌ NEVER: Partial mocks that miss required methods
const mock = { generate: jest.fn() } as any; // Dangerous!
```

### Integration Test Patterns

```typescript
// ✅ ALWAYS: Test real interactions where possible
describe('Integration: Agent with IndexedDB Memory', () => {
  let agent: Agent;
  
  beforeEach(async () => {
    // Use real IndexedDB (in-memory for tests)
    agent = new Agent({
      id: 'test-agent',
      model: createMockAdapter(),
      memory: true
    });
  });
  
  afterEach(async () => {
    await agent.memory?.clearMessages({ resource: 'test', thread: 'test' });
  });
  
  it('should persist and retrieve messages', async () => {
    await agent.generate('Hello', { memory: { resource: 'test', thread: 'test' } });
    const messages = await agent.memory?.getMessages({ resource: 'test', thread: 'test' });
    
    expect(messages).toHaveLength(2); // User + Assistant
  });
});
```

---

## 3. 🎨 User Experience Principles

### Developer Experience (DX)

```typescript
// ✅ ALWAYS: Sensible defaults, minimal configuration
const agent = new Agent({
  id: 'my-agent',
  model: adapter,
  // memory: true,          // Default: false
  // defaultOptions: {...}  // All optional with smart defaults
});

// ✅ ALWAYS: Clear, actionable error messages
throw new Error(
  `Tool "${toolId}" not found. Available tools: ${Object.keys(tools).join(', ')}`
);

// ❌ NEVER: Cryptic errors
throw new Error('Invalid state'); // What state? How to fix?
```

### Progressive Disclosure

```typescript
// ✅ ALWAYS: Simple API for common cases
const result = await agent.generate('Hello');

// ✅ ALWAYS: Advanced options for power users
const result = await agent.generate('Hello', {
  maxTokens: 1000,
  temperature: 0.7,
  maxSteps: 5,
  memory: { resource: 'user-123', thread: 'chat-1' },
  context: { customData: 'value' }
});
```

### Consistent API Patterns

```typescript
// ✅ ALWAYS: Follow established patterns across all primitives

// All primitives have id + name
interface Primitive {
  id: string;
  name: string;
}

// All async operations return promises
async generate(): Promise<Result>
async execute(): Promise<Output>
async saveMessage(): Promise<void>

// All disposable resources have dispose()
dispose(): void

// All with options use last parameter
method(required: T, options?: Options): Result
```

### Helpful Intellisense

```typescript
/**
 * Generate a response from the agent.
 * 
 * @param prompt - User message or array of messages
 * @param options - Generation options
 * @returns Agent response with text, tool calls, and usage stats
 * 
 * @example Basic usage
 * ```typescript
 * const result = await agent.generate('Hello');
 * console.log(result.text);
 * ```
 * 
 * @example With memory
 * ```typescript
 * const result = await agent.generate('Remember my name is Alex', {
 *   memory: { resource: 'user-123', thread: 'chat-1' }
 * });
 * ```
 * 
 * @throws {Error} If model is not initialized
 * @throws {ToolExecutionError} If a tool call fails
 */
async generate(
  prompt: string | Message[],
  options?: GenerateOptions
): Promise<AgentResult>
```

---

## 4. ⚡ Performance Principles

### Memory Efficiency

```typescript
// ✅ ALWAYS: Limit unbounded collections
async getMessages(context: MemoryContext, limit = 50): Promise<Message[]> {
  // Never return unlimited messages
}

// ✅ ALWAYS: Clean up resources
class Agent {
  dispose(): void {
    this.model.dispose();
    this.memory?.close();
  }
}

// ✅ ALWAYS: Use streaming for large responses
for await (const chunk of agent.stream(prompt)) {
  process.stdout.write(chunk.text || '');
}

// ❌ NEVER: Unbounded growth
const allMessages = await memory.getMessages(context); // Could be millions!
```

### Lazy Initialization

```typescript
// ✅ ALWAYS: Initialize on first use
class Agent {
  async generate(prompt: string): Promise<Result> {
    if (!this.model.isReady()) {
      await this.model.initialize(); // Only when needed
    }
    return this.model.generate(...);
  }
}

// ❌ NEVER: Initialize in constructor (blocks creation)
class Agent {
  constructor(config: Config) {
    await this.model.initialize(); // Can't await in constructor!
  }
}
```

### Caching Strategies

```typescript
// ✅ ALWAYS: Cache expensive computations
const modelCache = new Map<string, LLMAdapter>();

function getOrCreateAdapter(modelPath: string): LLMAdapter {
  if (!modelCache.has(modelPath)) {
    modelCache.set(modelPath, new MediaPipeAdapter({ modelPath }));
  }
  return modelCache.get(modelPath)!;
}

// ✅ ALWAYS: Provide cache control options
interface AdapterConfig {
  modelPath: string;
  cache?: {
    enabled: boolean;
    maxAge?: number; // ms
    storageKey?: string;
  };
}
```

### Async Best Practices

```typescript
// ✅ ALWAYS: Parallel when independent
const [weather, news, stocks] = await Promise.all([
  weatherTool.execute({ location }),
  newsTool.execute({ topic }),
  stocksTool.execute({ symbol })
]);

// ✅ ALWAYS: Use AbortController for cancellation
async function generate(prompt: string, signal?: AbortSignal): Promise<Result> {
  if (signal?.aborted) {
    throw new Error('Operation cancelled');
  }
  // Check periodically in long operations
}

// ❌ NEVER: Sequential when parallel is possible
const weather = await weatherTool.execute({ location });
const news = await newsTool.execute({ topic }); // Waits for weather!
```

---

## 5. 🔒 Security Principles

### No Secrets in Browser

```typescript
// ✅ ALWAYS: Proxy sensitive calls through backend
const tool = createTool({
  id: 'api-call',
  execute: async ({ query }) => {
    // Your backend handles the API key
    return fetch('/api/proxy/external-service', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  }
});

// ❌ NEVER: API keys in browser code
const API_KEY = 'sk-1234567890';
fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${API_KEY}` } // EXPOSED!
});
```

### Input Validation

```typescript
// ✅ ALWAYS: Validate all external input
const toolInput = toolSchema.parse(rawInput);

// ✅ ALWAYS: Sanitize URLs
const urlSchema = z.string().url().refine(
  (url) => url.startsWith('https://'),
  'Only HTTPS URLs allowed'
);

// ✅ ALWAYS: Limit sizes
const contentSchema = z.string().max(10000);
const arraySchema = z.array(z.string()).max(100);

// ❌ NEVER: Trust raw input
function execute(input: any) {
  fetch(input.url); // Could be file://, javascript:, etc.
}
```

### Safe DOM Manipulation

```typescript
// ✅ ALWAYS: Use safe APIs for UI updates
function renderText(text: string, container: HTMLElement) {
  container.textContent = text; // Safe: escapes HTML
}

// ✅ ALWAYS: Sanitize if HTML is needed
import DOMPurify from 'dompurify';

function renderHTML(html: string, container: HTMLElement) {
  container.innerHTML = DOMPurify.sanitize(html);
}

// ❌ NEVER: innerHTML with untrusted content
container.innerHTML = userInput; // XSS vulnerability!
```

### A2U Security Model

```typescript
// ✅ ALWAYS: Only render pre-approved components
const allowedComponents = new Set(['card', 'button', 'text', 'list', 'image']);

function validateComponent(component: A2UComponent): boolean {
  if (!allowedComponents.has(component.type)) {
    console.warn(`Unknown component type: ${component.type}`);
    return false;
  }
  return true;
}

// ❌ NEVER: Execute arbitrary code from agent
if (component.type === 'script') {
  eval(component.code); // EXTREMELY DANGEROUS!
}
```

---

## 6. 🏗️ Architecture Principles

### Separation of Concerns

```typescript
// ✅ ALWAYS: Clear boundaries between layers

// Layer 1: Core primitives (no dependencies on specific implementations)
// packages/core/src/agent/types.ts
export interface Agent {
  generate(prompt: string): Promise<Result>;
}

// Layer 2: Implementations
// packages/core/src/agent/agent.ts
export class AgentImpl implements Agent {
  constructor(private model: LLMAdapter) {}
}

// Layer 3: Adapters
// packages/mediapipe/src/mediapipe-adapter.ts
export class MediaPipeAdapter implements LLMAdapter {}

// Layer 4: UI integration
// packages/react/src/use-agent.ts
export function useAgent(agent: Agent) {}
```

### Dependency Injection

```typescript
// ✅ ALWAYS: Inject dependencies
class Agent {
  constructor(config: {
    model: LLMAdapter;      // Injected
    memory?: MemoryStore;   // Injected
    tools?: Record<string, Tool>;  // Injected
  }) {}
}

// This enables:
// - Easy testing with mocks
// - Swapping implementations
// - No hidden dependencies

// ❌ NEVER: Hard-coded dependencies
class Agent {
  private model = new MediaPipeAdapter(); // Can't swap, can't mock
}
```

### Interface-First Design

```typescript
// ✅ ALWAYS: Define interfaces before implementations
// packages/core/src/llm/types.ts
export interface LLMAdapter {
  generate(options: GenerateOptions): Promise<GenerateResult>;
}

// packages/mediapipe/src/adapter.ts
export class MediaPipeAdapter implements LLMAdapter {
  // Must implement the interface
}

// packages/transformers/src/adapter.ts
export class TransformersAdapter implements LLMAdapter {
  // Same interface, different implementation
}
```

### Event-Driven for UI

```typescript
// ✅ ALWAYS: Use events for UI communication (AG-UI pattern)
class AgentEventBus {
  on(event: 'response', handler: (data: AgentResponse) => void): void;
  on(event: 'tool-call', handler: (data: ToolCall) => void): void;
  on(event: 'error', handler: (data: Error) => void): void;
  
  emit(event: string, data: unknown): void;
}

// ❌ NEVER: Direct UI manipulation from agent logic
class Agent {
  async generate() {
    document.getElementById('output')!.innerHTML = result; // Coupling!
  }
}
```

---

## 7. 📚 Documentation Principles

### JSDoc Everything Public

```typescript
/**
 * Create a type-safe tool for agent function calling.
 * 
 * Tools are the primary way agents interact with external systems.
 * Each tool has a defined input/output schema that the LLM uses
 * to understand how to call it.
 * 
 * @typeParam TInput - Zod schema type for input validation
 * @typeParam TOutput - Zod schema type for output validation
 * 
 * @param config - Tool configuration object
 * @param config.id - Unique identifier (used in tool calls)
 * @param config.description - Human-readable description for LLM
 * @param config.inputSchema - Zod schema for input validation
 * @param config.outputSchema - Zod schema for output validation
 * @param config.execute - Async function that performs the tool's action
 * 
 * @returns A Tool instance ready to use with an Agent
 * 
 * @example Basic tool
 * ```typescript
 * const greetTool = createTool({
 *   id: 'greet',
 *   description: 'Generate a greeting for a person',
 *   inputSchema: z.object({ name: z.string() }),
 *   outputSchema: z.object({ greeting: z.string() }),
 *   execute: async ({ name }) => ({
 *     greeting: `Hello, ${name}!`
 *   })
 * });
 * ```
 * 
 * @example Tool with error handling
 * ```typescript
 * const fetchTool = createTool({
 *   id: 'fetch-data',
 *   description: 'Fetch data from an API',
 *   inputSchema: z.object({ url: z.string().url() }),
 *   outputSchema: z.object({ data: z.unknown() }),
 *   execute: async ({ url }) => {
 *     const response = await fetch(url);
 *     if (!response.ok) {
 *       throw new Error(`HTTP ${response.status}`);
 *     }
 *     return { data: await response.json() };
 *   }
 * });
 * ```
 * 
 * @see {@link Tool} for the returned type
 * @see {@link Agent} for using tools with agents
 */
export function createTool<TInput, TOutput>(
  config: ToolConfig<TInput, TOutput>
): Tool<TInput, TOutput>
```

### README for Every Package

```markdown
# @web-agent/package-name

Brief description of what this package does.

## Installation

\`\`\`bash
pnpm add @web-agent/package-name
\`\`\`

## Quick Start

\`\`\`typescript
import { Something } from '@web-agent/package-name';

const something = new Something({...});
\`\`\`

## API Reference

### `Something`

Description...

### `somethingElse()`

Description...

## Examples

Link to examples directory...
```

### Inline Comments for Complex Logic

```typescript
// ✅ ALWAYS: Explain non-obvious logic
function parseToolCalls(text: string): ToolCall[] {
  // The LLM returns tool calls in a specific JSON format:
  // ```json
  // { "tool_calls": [{ "id": "...", "name": "...", "arguments": {...} }] }
  // ```
  // We need to extract this from the text response, handling cases where
  // the JSON might be wrapped in markdown code blocks.
  
  const jsonMatch = text.match(/```json\n(.*?)\n```/s);
  if (!jsonMatch) return [];
  
  // ... rest of implementation
}

// ❌ NEVER: Leave complex code unexplained
function parseToolCalls(text: string): ToolCall[] {
  const m = text.match(/```json\n(.*?)\n```/s);
  return m ? JSON.parse(m[1]).tool_calls || [] : [];
}
```

---

## 8. 🌐 Browser Compatibility Principles

### Feature Detection

```typescript
// ✅ ALWAYS: Check for feature support
function checkWebGPUSupport(): boolean {
  if (!navigator.gpu) {
    console.warn('WebGPU not available. Some features may be limited.');
    return false;
  }
  return true;
}

async function initializeModel(): Promise<LLMAdapter> {
  if (checkWebGPUSupport()) {
    return new MediaPipeAdapter({...});
  } else {
    // Fallback to WASM-based adapter
    return new WasmAdapter({...});
  }
}

// ❌ NEVER: Assume features exist
await navigator.gpu.requestAdapter(); // Crashes if not available!
```

### Progressive Enhancement

```typescript
// ✅ ALWAYS: Start with basic functionality, enhance if available
class Agent {
  async generate(prompt: string): Promise<Result> {
    // Level 1: Basic text response (always works)
    const result = await this.model.generate({...});
    
    // Level 2: Tool calling (if model supports it)
    if (this.model.supportsTools() && result.toolCalls) {
      await this.executeTools(result.toolCalls);
    }
    
    // Level 3: UI control (if protocol available)
    if (result.ui && this.uiRenderer) {
      this.uiRenderer.render(result.ui);
    }
    
    return result;
  }
}
```

### Storage Fallbacks

```typescript
// ✅ ALWAYS: Handle storage limitations
async function getStorage(): Promise<MemoryStore> {
  try {
    // Try IndexedDB first (best capacity)
    const idb = new IndexedDBMemoryStore({...});
    await idb.initialize();
    return idb;
  } catch (error) {
    console.warn('IndexedDB unavailable, falling back to memory store');
    // Fall back to in-memory (loses data on refresh)
    return new InMemoryStore();
  }
}
```

---

## 9. 🔄 Versioning & Compatibility

### Semantic Versioning

```typescript
// MAJOR.MINOR.PATCH

// ✅ MAJOR: Breaking changes
// - Removing public methods
// - Changing method signatures
// - Removing config options

// ✅ MINOR: New features (backwards compatible)
// - Adding new methods
// - Adding optional config options
// - New primitives

// ✅ PATCH: Bug fixes
// - Fixing incorrect behavior
// - Performance improvements
// - Security patches
```

### Deprecation Pattern

```typescript
/**
 * @deprecated Use `generateAsync()` instead. Will be removed in v2.0.
 */
function generate(prompt: string): Promise<Result> {
  console.warn('generate() is deprecated. Use generateAsync() instead.');
  return this.generateAsync(prompt);
}
```

---

## 10. 🎯 Summary: The Quality Checklist

Before completing any code generation, verify:

### ✅ Code Quality
- [ ] All types defined with Zod schemas
- [ ] No `any` or unvalidated `unknown`
- [ ] Specific error types with context
- [ ] Immutable data patterns
- [ ] Single responsibility functions

### ✅ Testing
- [ ] Happy path tests
- [ ] Edge case tests
- [ ] Error case tests
- [ ] Async behavior tests
- [ ] Resource cleanup tests

### ✅ User Experience
- [ ] Sensible defaults
- [ ] Clear error messages
- [ ] Consistent API patterns
- [ ] Complete JSDoc with examples

### ✅ Performance
- [ ] Bounded collections
- [ ] Lazy initialization
- [ ] Proper caching
- [ ] Parallel async when possible

### ✅ Security
- [ ] No secrets in browser code
- [ ] All inputs validated
- [ ] Safe DOM manipulation
- [ ] Only pre-approved A2U components

### ✅ Architecture
- [ ] Clear layer separation
- [ ] Dependencies injected
- [ ] Interface-first design
- [ ] Event-driven UI communication

### ✅ Documentation
- [ ] JSDoc on all public APIs
- [ ] Examples for common use cases
- [ ] Inline comments for complex logic

---

## 🚀 Using These Principles

### With GitHub Copilot

When prompting Copilot, reference these principles:

```
"Create a weather tool following the project's code quality, 
testing, and security principles from PRINCIPLES.md"
```

### In Code Reviews

Use the checklist above to review generated code.

### In Design Decisions

Refer to the architecture principles when making structural choices.

---

**Remember**: These principles exist to create a framework that developers **love to use** and users **trust to run in their browsers**. Every line of code should serve that goal.


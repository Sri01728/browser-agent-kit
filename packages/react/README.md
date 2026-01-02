# @web-agent/react

React hooks and components for browser-based AI agents. Runs entirely in the browser using WebGPU and local LLMs like Gemma 2B.

## Features

- 🧠 **Browser-native AI** - No server required, runs on WebGPU
- ⚡ **Zero-config** - Works out of the box with sensible defaults  
- 🔌 **Multiple APIs** - Hooks, factory, context - pick what works for you
- 🎨 **A2U Protocol** - Dynamic UI generation from AI responses
- 📦 **Model caching** - IndexedDB caching for instant subsequent loads
- 🔄 **AI SDK compatible** - Works with existing AI SDK UI patterns

## Installation

```bash
npm install @web-agent/react @web-agent/ui-protocol
```

## Quick Start

### 1. useWebAgent (Recommended)

The simplest way to add an AI agent to your React app:

```tsx
import { useWebAgent, WebAgentUI } from '@web-agent/react';

function App() {
  const agent = useWebAgent({
    persona: 'You are a helpful assistant.',
  });

  return (
    <div>
      <WebAgentUI agent={agent} />
      <input
        placeholder={agent.isReady ? 'Ask anything...' : 'Loading...'}
        disabled={!agent.isReady}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            agent.send(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}
```

### 2. useAgentChat (AI SDK UI Compatible)

If you're familiar with Vercel's AI SDK, use this hook:

```tsx
import { useAgentChat } from '@web-agent/react';

function Chat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
    loadModel,
  } = useAgentChat({
    persona: 'You are a coding assistant.',
  });

  // Load model on first render
  useEffect(() => {
    loadModel();
  }, []);

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={isLoading || status !== 'ready'}>
          {isLoading ? 'Generating...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

### 3. createWebAgent (Factory Pattern)

For more control, create agents programmatically:

```tsx
import { createWebAgent } from '@web-agent/react';

// Create agent instance
const agent = createWebAgent({
  id: 'my-agent',
  name: 'Coding Assistant',
  persona: 'You are an expert TypeScript developer.',
  autoLoad: true,
  model: {
    maxTokens: 2048,
    temperature: 0.7,
  },
  middleware: [
    {
      beforeSend: (msg) => `Please help with: ${msg}`,
      afterReceive: (response) => response.trim(),
    },
  ],
});

// Subscribe to events
agent.onStatusChange((status) => {
  console.log('Status:', status);
});

agent.onResponse((response, ui) => {
  console.log('Response:', response);
  if (ui) console.log('UI:', ui);
});

// Use in component
function App() {
  const [status, setStatus] = useState(agent.status);

  useEffect(() => {
    return agent.onStatusChange(setStatus);
  }, []);

  const handleSend = async () => {
    await agent.send('How do I create a React hook?');
  };

  return (
    <button onClick={handleSend} disabled={status !== 'ready'}>
      {status === 'ready' ? 'Ask' : 'Loading...'}
    </button>
  );
}
```

### 4. WebAgentProvider (App-wide Config)

Share configuration across your entire app:

```tsx
import { WebAgentProvider, useWebAgent } from '@web-agent/react';

function App() {
  return (
    <WebAgentProvider
      config={{
        defaultModel: '/models/gemma-2b-it-gpu-int4.bin',
        enableCache: true,
        debug: true,
        onError: (err, agentId) => {
          console.error(`Agent ${agentId} error:`, err);
        },
      }}
    >
      <Chat />
    </WebAgentProvider>
  );
}

function Chat() {
  // Uses config from provider automatically
  const agent = useWebAgent({
    persona: 'You are helpful.',
  });

  return <WebAgentUI agent={agent} />;
}
```

## Pre-built Personas

```tsx
import { useWebAgent, personas } from '@web-agent/react';

// Available personas:
// - personas.assistant - General helper
// - personas.flightBooking - Travel booking
// - personas.shopping - E-commerce
// - personas.support - Customer service
// - personas.formHelper - Form filling

const agent = useWebAgent({
  persona: personas.flightBooking,
});
```

## Model Setup

Download the Gemma 2B model from Kaggle and place it in your public folder:

1. Go to [Kaggle Gemma 2B](https://www.kaggle.com/models/google/gemma-2b-it/tfLite/gemma-2b-it-gpu-int4)
2. Download `gemma-2b-it-gpu-int4.bin`
3. Place in `public/models/gemma-2b-it-gpu-int4.bin`

## API Reference

### useWebAgent

```tsx
const agent = useWebAgent({
  // Required
  persona: string,              // System prompt

  // Optional
  modelPath?: string,           // Default: '/models/gemma-2b-it-gpu-int4.bin'
  autoLoad?: boolean,           // Default: false
  maxTokens?: number,           // Default: 2048
  temperature?: number,         // Default: 0.7
  onUI?: (ui) => void,          // A2U callback
  onError?: (error) => void,    // Error callback
});

// Returns
agent.status       // 'idle' | 'loading' | 'initializing' | 'ready' | 'error'
agent.isReady      // boolean
agent.isGenerating // boolean
agent.error        // Error | null
agent.thinking     // string (current response text)
agent.ui           // A2UResponse | null
agent.history      // Array<{role, content}>
agent.load()       // Promise<void>
agent.send(msg)    // Promise<void>
agent.clear()      // void
```

### useAgentChat

```tsx
const chat = useAgentChat({
  persona: string,
  initialMessages?: Message[],
  modelPath?: string,
  onFinish?: (message) => void,
  onError?: (error) => void,
  onUI?: (ui) => void,
});

// Returns (AI SDK UI compatible)
chat.messages          // Message[]
chat.input             // string
chat.setInput          // (input: string) => void
chat.handleInputChange // (e) => void
chat.handleSubmit      // (e?) => void
chat.append            // (message) => Promise<void>
chat.isLoading         // boolean
chat.stop              // () => void
chat.reload            // () => Promise<void>
chat.setMessages       // (messages) => void
chat.error             // Error | undefined
chat.status            // 'idle' | 'loading' | 'ready' | 'error'
chat.loadModel         // () => Promise<void>
```

### createWebAgent

```tsx
const agent = createWebAgent({
  id?: string,
  name?: string,
  persona: string,
  model?: ModelConfig,
  memory?: MemoryConfig,
  autoLoad?: boolean,
  middleware?: AgentMiddleware[],
  onUI?: (ui) => void,
  onError?: (error) => void,
  onStatusChange?: (status) => void,
});

// Returns
agent.id              // string
agent.name            // string
agent.status          // AgentStatus
agent.isReady         // boolean
agent.isGenerating    // boolean
agent.error           // Error | null
agent.load()          // Promise<void>
agent.send(msg)       // Promise<string>
agent.clear()         // void
agent.onStatusChange  // Subscribe to status
agent.onResponse      // Subscribe to responses
agent.dispose()       // Cleanup
```

## Browser Requirements

- Chrome 113+ or Edge 113+ (WebGPU support required)
- ~2GB GPU memory for Gemma 2B model

## License

MIT

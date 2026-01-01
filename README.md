# Web Agent Framework

> A next-generation framework for orchestrating browser-based LLMs with **agent-controlled UI**, zero configuration, and model-agnostic architecture. Inspired by Mastra, powered by Google's A2U protocol.

## 🚀 Features

- **Agent-Controlled UI**: Agents can dynamically update and control your web interface using A2U/AG-UI protocols
- **Zero Configuration**: Works out of the box with sensible defaults
- **Model Agnostic**: Support for MediaPipe, Transformers.js, LiteRT.js through adapters
- **Type Safe**: Full TypeScript support with Zod schemas
- **Composable**: Agents, Workflows, Tools as first-class primitives
- **Client-First**: No server required for LLM execution (runs locally via WebGPU/WASM)
- **Framework Agnostic**: Works with React, Vue, Svelte, or vanilla JavaScript
- **Secure by Default**: API proxy patterns for external calls, no exposed API keys

## 📦 Packages

- `@web-agent/core` - Core orchestration engine ✅
- `@web-agent/ui-protocol` - A2U & AG-UI protocol implementation (next)
- `@web-agent/react` - React components and hooks (next)
- `@web-agent/mediapipe` - MediaPipe LLM adapter (next)
- `@web-agent/transformers` - Transformers.js adapter (future)
- `@web-agent/litert` - LiteRT.js adapter (future)

## 🎯 What Makes This Different?

### Traditional Web Apps
```
User clicks → JavaScript → Update UI
```

### Web Agent Framework
```
User speaks/types → AI Agent → Agent controls UI directly
```

**Example**: Ask "Show me flights to Paris" and the agent automatically:
- Renders flight cards
- Highlights the best option
- Pre-fills booking forms
- Updates the UI based on your preferences

All without you writing UI update logic!

## 🏗️ Project Status

**Phase 1: Core Foundation** ✅ (Complete - 7/8 tasks)

- [x] Monorepo structure with pnpm workspaces
- [x] LLM adapter interface (model-agnostic)
- [x] Agent primitive with `.generate()` and `.stream()`
- [x] Tool primitive with Zod schemas
- [x] Function calling orchestration logic
- [x] Conversation memory (IndexedDB-backed)
- [x] Request context for conditional logic
- [ ] MediaPipe adapter implementation (90% designed)

**Phase 2: UI Protocol Layer** 🚧 (Next - 6-8 weeks to MVP)

- [ ] A2U protocol renderer
- [ ] AG-UI event bus
- [ ] Component registry
- [ ] React integration (`@web-agent/react`)
- [ ] Example: Flight booking with UI control
- [ ] Documentation

**Phase 3: Additional Adapters** 🔮 (Future)

- [ ] Transformers.js adapter
- [ ] LiteRT.js adapter
- [ ] Model caching utilities

## 📖 Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## 🎯 Usage Examples

### Basic Agent (Text-Only)

```typescript
import { Agent, createTool } from '@web-agent/core';
import { MediaPipeAdapter } from '@web-agent/mediapipe';
import { z } from 'zod';

// Create a tool
const weatherTool = createTool({
  id: 'weather-tool',
  description: 'Fetches weather for a location',
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

// Create an agent
const agent = new Agent({
  id: 'weather-agent',
  name: 'Weather Agent',
  instructions: 'You help users check the weather',
  model: new MediaPipeAdapter({
    modelPath: '/models/gemma-2b'
  }),
  tools: { weatherTool },
  memory: true // Auto-configure IndexedDB
});

// Generate a response
const response = await agent.generate("What's the weather in London?", {
  memory: {
    resource: 'user-123',
    thread: 'conversation-1'
  }
});

console.log(response.text);
```

### Agent with UI Control (A2U Protocol)

```typescript
import { Agent } from '@web-agent/core';
import { A2URenderer } from '@web-agent/ui-protocol';

// Agent generates structured UI
const flightAgent = new Agent({
  id: 'flight-agent',
  instructions: `
    When showing flights, use A2U protocol:
    
    \`\`\`json
    {
      "type": "ui",
      "ui": {
        "type": "list",
        "children": [
          {
            "type": "card",
            "props": { "title": "London → Paris" },
            "children": [
              { "type": "text", "props": { "content": "€99 • 2h" } }
            ],
            "actions": [
              { "type": "call_tool", "params": { "tool": "bookFlight" } }
            ]
          }
        ]
      }
    }
    \`\`\`
  `,
  model: new MediaPipeAdapter({...}),
  tools: { searchFlights, bookFlight }
});

// Agent automatically renders UI
const response = await flightAgent.generate("Find flights to Paris");

if (response.ui) {
  const renderer = new A2URenderer();
  renderer.render(response.ui, document.getElementById('results'));
  // Agent just controlled your UI! 🎉
}
```

### React Integration

```tsx
import { AgentChat } from '@web-agent/react';
import { flightAgent } from './agents';

function App() {
  return (
    <AgentChat 
      agent={flightAgent}
      onUIUpdate={(component) => {
        // Agent renders interactive UI components
        console.log('Agent rendered:', component);
      }}
    />
  );
}
```

## 🏛️ Architecture

```
web-agent-framework/
├── packages/
│   ├── core/                    # Core orchestration engine
│   │   ├── agent/              # Agent primitive
│   │   ├── tool/               # Tool primitive
│   │   ├── memory/             # Memory management
│   │   ├── llm/                # LLM adapter interface
│   │   └── context/            # Request context
│   │
│   ├── mediapipe/              # MediaPipe adapter
│   ├── transformers/           # Transformers.js adapter
│   └── litert/                 # LiteRT.js adapter
│
├── examples/                    # Example applications
└── docs/                       # Documentation
```

## 📚 Documentation

All documentation is in the [`docs/`](./docs/) folder:

- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Visual guides & quick start
- **[Getting Started](./docs/GETTING_STARTED.md)** - Step-by-step implementation guide
- **[Framework Design](./docs/FRAMEWORK_DESIGN.md)** - Complete architecture
- **[Agent UI Integration](./docs/AGENT_UI_INTEGRATION.md)** - A2U & AG-UI protocols
- **[Decision Matrix](./docs/DECISION_MATRIX.md)** - Why this approach
- **[Executive Summary](./docs/EXECUTIVE_SUMMARY.md)** - High-level overview

**[→ Browse All Documentation](./docs/)**

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT

## 🙏 Acknowledgments

- Inspired by [Mastra](https://mastra.ai)
- Built on [Jason Mayes' Web AI Agent](https://github.com/jasonmayes/WebAIAgent)
- Powered by [MediaPipe](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/web_js), [Transformers.js](https://huggingface.co/docs/transformers.js), and [LiteRT.js](https://ai.google.dev/edge/litert)


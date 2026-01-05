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

- `@web-agent/core` - Core orchestration engine with enhanced memory ✅
- `@web-agent/ui-protocol` - A2U & AG-UI protocol implementation (9 components) ✅
- `@web-agent/react` - React components and hooks (Modal, Tabs, Dropdown) ✅
- `@web-agent/mediapipe` - MediaPipe LLM adapter ✅
- `@web-agent/transformers` - Transformers.js adapter (Phi-3, Llama, Mistral, Gemma) ✅
- `create-web-agent` - CLI tool for scaffolding new projects ✅
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

### 📦 Bundler Support

**For Browser-Based ML (Transformers.js)**:
- ✅ **Webpack 5** (Recommended) - See `examples/spotify-demo-webpack`
  - Native WASM support via `experiments.asyncWebAssembly`
  - Mature Web Worker handling
  - Proven track record with ML libraries
  
**For Standard Web Apps**:
- ✅ **Vite** - See `examples/demo-app`
  - Faster dev server
  - Simpler configuration
  - Perfect for non-ML demos

## 🏗️ Project Status

**Phase 1: Core Foundation** ✅ (Complete)

- [x] Monorepo structure with pnpm workspaces
- [x] LLM adapter interface (model-agnostic)
- [x] Agent primitive with `.generate()` and `.stream()`
- [x] Tool primitive with Zod schemas
- [x] Function calling orchestration logic
- [x] Conversation memory (IndexedDB-backed)
- [x] Request context for conditional logic
- [x] MediaPipe adapter implementation

**Phase 2: UI Protocol Layer** ✅ (Complete)

- [x] A2U protocol renderer
- [x] AG-UI event bus
- [x] Component registry (6 core components)
- [x] React integration (`@web-agent/react`)
- [x] Example applications
- [x] Documentation

**Phase 3: Production Ready** ✅ (Complete - 100%)

**Week 1: Quick Wins** ✅
- [x] Fixed 4 integration tests
- [x] Fixed 5+ accessibility tests
- [x] Set up bundle optimization (size-limit)
- [x] Implemented code splitting (30 KB compressed)
- [x] Verified bundle size targets

**Week 2-3: Transformers.js Adapter** ✅
- [x] Adapter implementation with model family detection
- [x] Function calling via chat templates (Phi, Llama, Mistral, Gemma)
- [x] Support for Phi-3, Llama, Mistral, Gemma models
- [x] 42 comprehensive tests (89% coverage on core logic)
- [x] Complete documentation and examples

**Week 4-5: UI Components** ✅
- [x] Modal, Tabs, Dropdown components with full ARIA support
- [x] ARIA attributes and keyboard navigation (WCAG 2.1 AA compliant)
- [x] 62 comprehensive tests (100% passing)
- [x] React wrapper components (Modal, Tabs, Dropdown)
- [x] Complete documentation and examples
- [x] WCAG 2.1 AA compliance audit

**Week 6-7: Enhanced Memory & CLI** ✅
- [x] Multi-resource memory system (user, session, context)
- [x] 4 memory processors (summarization, filtering, metadata, TTL)
- [x] Memory search (text + metadata + date ranges)
- [x] 55+ comprehensive tests (90% coverage)
- [x] CLI tool for scaffolding (`create-web-agent`)
- [x] React template with Next.js
- [x] Complete documentation (1,200+ lines)

## 📖 Quick Start

### Create a New Project (Recommended)

```bash
# Create a new project with the CLI
npm create web-agent@latest my-app

# Navigate to project
cd my-app

# Start development server
npm run dev
```

### Manual Setup

```bash
# Clone and install dependencies
git clone https://github.com/your-org/web-agent-framework
cd web-agent-framework
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

### Getting Started
- **[CLI Guide](./docs/CLI_GUIDE.md)** - Create new projects with `create-web-agent`
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Visual guides & quick start
- **[Getting Started](./docs/GETTING_STARTED.md)** - Step-by-step implementation guide

### Core Concepts
- **[Framework Design](./docs/FRAMEWORK_DESIGN.md)** - Complete architecture
- **[Agent UI Integration](./docs/AGENT_UI_INTEGRATION.md)** - A2U & AG-UI protocols
- **[Enhanced Memory](./docs/ENHANCED_MEMORY.md)** - Multi-resource memory system
- **[Decision Matrix](./docs/DECISION_MATRIX.md)** - Why this approach

### Reference
- **[Executive Summary](./docs/EXECUTIVE_SUMMARY.md)** - High-level overview
- **[UI Components](./docs/UI_COMPONENTS.md)** - Modal, Tabs, Dropdown
- **[WCAG Compliance](./docs/WCAG_COMPLIANCE_AUDIT.md)** - Accessibility audit

**[→ Browse All Documentation](./docs/)**

## 🤝 Contributing

Contributions are welcome! 

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Development workflow
- **[Code Principles](./.github/PRINCIPLES.md)** - Quality standards
- **[Prompt Templates](./.github/PROMPT_TEMPLATE.md)** - AI code generation prompts

## 📄 License

MIT

## 🙏 Acknowledgments

- Inspired by [Mastra](https://mastra.ai)
- Built on [Jason Mayes' Web AI Agent](https://github.com/jasonmayes/WebAIAgent)
- Powered by [MediaPipe](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/web_js), [Transformers.js](https://huggingface.co/docs/transformers.js), and [LiteRT.js](https://ai.google.dev/edge/litert)


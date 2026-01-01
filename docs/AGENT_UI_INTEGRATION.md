# Agent-to-UI Integration Strategy

## Architecture Overview

Your framework will support **3 levels of UI control**:

### Level 1: Text-Only (Current)
```
Agent → Text Response → You manually update UI
```

### Level 2: Structured Actions (A2U Protocol)
```
Agent → JSON with UI actions → Framework auto-updates UI
```

### Level 3: Generative UI (AG-UI + CopilotKit)
```
Agent → UI Components → Framework renders dynamic components
```

---

## Implementation Plan

### Phase 1: Add A2U Protocol Support

Create `packages/ui-protocol/` for A2U integration:

```typescript
// packages/ui-protocol/src/a2u/types.ts

export interface A2UComponent {
  type: 'card' | 'list' | 'form' | 'button' | 'text' | 'image';
  id?: string;
  props?: Record<string, unknown>;
  children?: A2UComponent[];
  actions?: A2UAction[];
}

export interface A2UAction {
  type: 'navigate' | 'submit' | 'update' | 'call_tool';
  target?: string;
  params?: Record<string, unknown>;
}

export interface A2UResponse {
  type: 'ui' | 'text';
  ui?: A2UComponent;
  text?: string;
}
```

**Agent Integration:**

```typescript
// packages/core/src/agent/agent.ts (UPDATED)

import type { A2UResponse } from '@web-agent/ui-protocol';

export class Agent {
  async generate(prompt: string, options?: GenerateOptions): Promise<AgentResult> {
    // ... existing code ...
    
    // Parse A2U response if present
    const a2uResponse = this.parseA2UResponse(result.text);
    
    return {
      text: result.text,
      ui: a2uResponse?.ui,  // NEW: UI description
      steps: iteration,
      finishReason: result.finishReason,
      usage: totalUsage,
    };
  }
  
  private parseA2UResponse(text: string): A2UResponse | null {
    // Look for JSON blocks in response
    const match = text.match(/```json\n(.*?)\n```/s);
    if (!match) return null;
    
    try {
      const json = JSON.parse(match[1]);
      if (json.type === 'ui') {
        return json as A2UResponse;
      }
    } catch {
      return null;
    }
    
    return null;
  }
}
```

**UI Renderer:**

```typescript
// packages/ui-protocol/src/a2u/renderer.ts

export class A2URenderer {
  private componentMap: Map<string, ComponentRenderer>;
  
  constructor() {
    this.componentMap = new Map();
    this.registerDefaultComponents();
  }
  
  render(component: A2UComponent, container: HTMLElement): void {
    const renderer = this.componentMap.get(component.type);
    if (!renderer) {
      throw new Error(`Unknown component type: ${component.type}`);
    }
    
    const element = renderer(component);
    container.appendChild(element);
  }
  
  private registerDefaultComponents(): void {
    // Card component
    this.componentMap.set('card', (comp) => {
      const card = document.createElement('div');
      card.className = 'a2u-card';
      
      if (comp.props?.title) {
        const title = document.createElement('h3');
        title.textContent = comp.props.title as string;
        card.appendChild(title);
      }
      
      // Render children
      comp.children?.forEach(child => {
        this.render(child, card);
      });
      
      // Render actions
      comp.actions?.forEach(action => {
        const button = this.createActionButton(action);
        card.appendChild(button);
      });
      
      return card;
    });
    
    // Button component
    this.componentMap.set('button', (comp) => {
      const button = document.createElement('button');
      button.textContent = comp.props?.label as string;
      button.onclick = () => this.handleAction(comp.actions?.[0]);
      return button;
    });
    
    // List component
    this.componentMap.set('list', (comp) => {
      const list = document.createElement('ul');
      comp.children?.forEach(child => {
        const li = document.createElement('li');
        this.render(child, li);
        list.appendChild(li);
      });
      return list;
    });
  }
  
  private handleAction(action?: A2UAction): void {
    if (!action) return;
    
    switch (action.type) {
      case 'navigate':
        window.location.href = action.target || '/';
        break;
      case 'call_tool':
        // Trigger tool call through agent
        this.emit('tool:call', action.params);
        break;
      // ... other actions
    }
  }
}
```

---

### Phase 2: Add AG-UI Event System

```typescript
// packages/ui-protocol/src/ag-ui/event-bus.ts

export class AGUIEventBus {
  private listeners: Map<string, Set<Function>>;
  
  constructor() {
    this.listeners = new Map();
  }
  
  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }
  
  emit(event: string, data: unknown): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
  
  off(event: string, handler: Function): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }
}

// Agent Integration
export class Agent {
  private eventBus: AGUIEventBus;
  
  constructor(config: AgentConfig) {
    // ... existing code ...
    this.eventBus = new AGUIEventBus();
    
    // Subscribe to UI events
    this.eventBus.on('ui:action', this.handleUIAction.bind(this));
  }
  
  private async handleUIAction(action: { type: string; data: unknown }): Promise<void> {
    // Agent processes user action
    const response = await this.generate(`User performed action: ${action.type}`, {
      context: { action: action.data }
    });
    
    // Emit UI update
    this.eventBus.emit('agent:response', {
      text: response.text,
      ui: response.ui
    });
  }
}
```

---

### Phase 3: React Integration (CopilotKit-style)

```typescript
// packages/react/src/use-agent.ts

import { Agent } from '@web-agent/core';
import { useState, useEffect } from 'react';

export function useAgent(agent: Agent) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Subscribe to agent events
    agent.eventBus.on('agent:response', (response) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.text,
        ui: response.ui
      }]);
      setIsLoading(false);
    });
  }, [agent]);
  
  const sendMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);
    
    await agent.generate(text, {
      memory: {
        resource: 'user',
        thread: 'chat'
      }
    });
  };
  
  return { messages, sendMessage, isLoading };
}
```

**React Components:**

```typescript
// packages/react/src/AgentChat.tsx

import { Agent } from '@web-agent/core';
import { useAgent } from './use-agent';
import { A2URenderer } from '@web-agent/ui-protocol';

export function AgentChat({ agent }: { agent: Agent }) {
  const { messages, sendMessage, isLoading } = useAgent(agent);
  const [input, setInput] = useState('');
  
  return (
    <div className="agent-chat">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
            {msg.ui && <A2UComponent component={msg.ui} />}
          </div>
        ))}
      </div>
      
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => {
          if (e.key === 'Enter') {
            sendMessage(input);
            setInput('');
          }
        }}
        disabled={isLoading}
      />
    </div>
  );
}

// A2U Component Renderer
function A2UComponent({ component }: { component: A2UComponent }) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (ref.current) {
      const renderer = new A2URenderer();
      renderer.render(component, ref.current);
    }
  }, [component]);
  
  return <div ref={ref} />;
}
```

---

## Example: Flight Booking with UI Control

### Agent Prompt Engineering

```typescript
const flightAgent = new Agent({
  id: 'flight-agent',
  name: 'Flight Agent',
  instructions: `
    You are a flight booking assistant.
    
    When showing flight results, use the A2U protocol to render interactive cards:
    
    \`\`\`json
    {
      "type": "ui",
      "ui": {
        "type": "list",
        "children": [
          {
            "type": "card",
            "props": { "title": "London to Paris" },
            "children": [
              { "type": "text", "props": { "content": "€99 - 2h flight" } }
            ],
            "actions": [
              { 
                "type": "call_tool", 
                "params": { "tool": "bookFlight", "flightId": "LHR-CDG-123" }
              }
            ]
          }
        ]
      }
    }
    \`\`\`
    
    When user clicks "Book", call the bookFlight tool.
  `,
  model: new MediaPipeAdapter({...}),
  tools: {
    searchFlights,
    bookFlight
  }
});
```

### Usage

```typescript
// Plain HTML/JS
const response = await flightAgent.generate("Find flights to Paris");

if (response.ui) {
  const renderer = new A2URenderer();
  renderer.render(response.ui, document.getElementById('results'));
}

// React
function App() {
  return <AgentChat agent={flightAgent} />;
}
```

---

## Benefits of This Approach

### 1. **Separation of Concerns**
- Agent logic: `@web-agent/core`
- UI protocol: `@web-agent/ui-protocol`
- React bindings: `@web-agent/react`

### 2. **Progressive Enhancement**
- Level 1: Works with plain text (like now)
- Level 2: Add A2U for structured UI updates
- Level 3: Add React for rich components

### 3. **Security**
- A2U only allows pre-approved components
- No arbitrary code execution
- All actions go through your tool system

### 4. **Framework Agnostic**
- A2U renderer works with vanilla JS
- Can create `@web-agent/vue`, `@web-agent/svelte` later

---

## Updated Package Structure

```
web-agent-framework/
├── packages/
│   ├── core/                    # Existing
│   ├── ui-protocol/             # NEW: A2U + AG-UI
│   │   ├── src/
│   │   │   ├── a2u/
│   │   │   │   ├── types.ts
│   │   │   │   ├── renderer.ts
│   │   │   │   └── parser.ts
│   │   │   └── ag-ui/
│   │   │       ├── event-bus.ts
│   │   │       └── types.ts
│   │   └── package.json
│   │
│   ├── react/                   # NEW: React integration
│   │   ├── src/
│   │   │   ├── AgentChat.tsx
│   │   │   ├── use-agent.ts
│   │   │   └── components/
│   │   └── package.json
│   │
│   ├── mediapipe/               # Existing
│   └── transformers/            # Future
```

---

## Comparison: Fork Mastra vs Build with UI Protocol

| Aspect | Fork Mastra | Build with UI Protocol |
|--------|-------------|------------------------|
| **Effort** | High (60-70% rewrite) | Medium (add to existing) |
| **UI Control** | Need to build from scratch | Standards-based (A2U, AG-UI) |
| **Compatibility** | Maintain Mastra API | Can adopt Mastra API patterns |
| **React Support** | Need to build | Use CopilotKit patterns |
| **Community** | Mastra community | A2U + AG-UI communities |
| **Time to MVP** | 3-4 months | 1-2 months |

---

## My Recommendation

**Don't fork Mastra fully.** Instead:

1. ✅ **Keep what we built** - Core architecture is solid
2. ✅ **Add UI Protocol layer** - Implement A2U + AG-UI
3. ✅ **Create React package** - Follow CopilotKit patterns
4. ✅ **Maintain API compatibility** - Use Mastra-like APIs where it makes sense
5. ✅ **Contribute back** - Share learnings with Mastra community

This gives you:
- **Faster development** (build on what's done)
- **Standards-based UI** (A2U, AG-UI)
- **React support** (like CopilotKit)
- **Future-proof** (can adopt more Mastra patterns later)

---

## Next Steps

1. **Finish MediaPipe adapter** (from Phase 1)
2. **Add `@web-agent/ui-protocol` package** (A2U + AG-UI)
3. **Create example: Flight booking with UI control**
4. **Add `@web-agent/react` package** (optional, if using React)

Want me to implement the UI protocol layer next? 🚀


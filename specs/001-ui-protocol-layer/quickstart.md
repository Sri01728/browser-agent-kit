# Quickstart: UI Protocol Layer

**Feature**: 001-ui-protocol-layer
**Date**: 2026-01-01

## Installation

```bash
# Install all packages
pnpm add @web-agent/ui-protocol @web-agent/react

# Or install individually
pnpm add @web-agent/ui-protocol  # For vanilla JS
pnpm add @web-agent/react        # For React (includes ui-protocol)
```

## Quick Examples

### Example 1: Render A2U Components (Vanilla JS)

```typescript
import { A2URenderer } from '@web-agent/ui-protocol';
import { Agent } from '@web-agent/core';
import { MediaPipeAdapter } from '@web-agent/mediapipe';

// Create agent
const agent = new Agent({
  id: 'my-agent',
  model: new MediaPipeAdapter({ modelPath: '/models/gemma-2b' }),
  instructions: 'You are a helpful assistant. Use A2U format for UI.',
});

// Create renderer
const renderer = new A2URenderer();

// Generate and render
const response = await agent.generate('Show me a welcome card');

if (response.ui) {
  renderer.render(response.ui, document.getElementById('container')!);
}
```

### Example 2: Listen to Agent Events

```typescript
import { AGUIEventBus } from '@web-agent/ui-protocol';
import { Agent } from '@web-agent/core';

const agent = new Agent({
  id: 'my-agent',
  model: adapter,
});

const eventBus = new AGUIEventBus();

// Subscribe to events
eventBus.on('generation:start', (event) => {
  console.log('Started:', event.payload.prompt);
});

eventBus.on('tool:call', (event) => {
  console.log('Tool called:', event.payload.toolId);
});

eventBus.on('error', (event) => {
  console.error('Error:', event.payload.message);
});

// Connect to agent
agent.connectEventBus(eventBus);

// Generate (events will fire automatically)
await agent.generate('What is the weather?');

// Cleanup
eventBus.dispose();
```

### Example 3: React Integration

```tsx
import { AgentChat } from '@web-agent/react';
import { Agent } from '@web-agent/core';
import { MediaPipeAdapter } from '@web-agent/mediapipe';

// Create agent
const agent = new Agent({
  id: 'chat-agent',
  model: new MediaPipeAdapter({ modelPath: '/models/gemma-2b' }),
  instructions: 'You are a helpful assistant.',
});

// Use pre-built chat component
function App() {
  return (
    <AgentChat
      agent={agent}
      placeholder="Ask me anything..."
      onError={(error) => console.error(error)}
    />
  );
}
```

### Example 4: Custom React Hook Usage

```tsx
import { useAgent } from '@web-agent/react';
import { A2UComponent } from '@web-agent/react';

function CustomChat({ agent }) {
  const { messages, sendMessage, isLoading, error } = useAgent(agent);
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div>
      {/* Message list */}
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
            {msg.ui && <A2UComponent component={msg.ui} />}
          </div>
        ))}
        {isLoading && <div className="loading">Thinking...</div>}
        {error && <div className="error">{error.message}</div>}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

### Example 5: Register Custom Component

```typescript
import { A2URenderer, ComponentRenderer } from '@web-agent/ui-protocol';
import { z } from 'zod';

// Define custom component props schema
const chartPropsSchema = z.object({
  data: z.array(z.object({
    label: z.string(),
    value: z.number(),
  })),
  title: z.string().optional(),
});

// Create custom renderer
const chartRenderer: ComponentRenderer = (component, context) => {
  const props = chartPropsSchema.parse(component.props);
  
  const container = document.createElement('div');
  container.className = 'chart-container';
  
  // Create simple bar chart
  const title = document.createElement('h3');
  title.textContent = props.title || 'Chart';
  container.appendChild(title);
  
  props.data.forEach((item) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.width = `${item.value}%`;
    bar.textContent = `${item.label}: ${item.value}`;
    container.appendChild(bar);
  });
  
  return container;
};

// Register with renderer
const renderer = new A2URenderer();
renderer.registerComponent('chart', chartRenderer, chartPropsSchema);

// Now agents can use type: "chart" in their responses
```

### Example 6: Streaming with React

```tsx
import { useAgentStream } from '@web-agent/react';

function StreamingChat({ agent }) {
  const {
    messages,
    sendMessage,
    isStreaming,
    currentChunk,
  } = useAgentStream(agent);

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      
      {/* Show streaming content */}
      {isStreaming && (
        <div className="streaming">
          {currentChunk}
          <span className="cursor">▌</span>
        </div>
      )}
    </div>
  );
}
```

## Configuration Options

### A2URenderer

```typescript
const renderer = new A2URenderer({
  maxDepth: 10,          // Max nesting depth (default: 10)
  maxComponents: 100,    // Max components per response (default: 100)
  logLevel: 'warn',      // Log level: debug|info|warn|error (default: warn)
  sanitizeHtml: true,    // Sanitize HTML content (default: true)
});
```

### AGUIEventBus

```typescript
const eventBus = new AGUIEventBus({
  logLevel: 'warn',           // Log level (default: warn)
  logEvents: false,           // Log all events (default: false)
  catchHandlerErrors: true,   // Catch handler errors (default: true)
});
```

### useAgent Hook

```typescript
const { messages, sendMessage, isLoading, error } = useAgent(agent, {
  memory: {
    resource: 'user-123',
    thread: 'chat-1',
  },
  onError: (error) => console.error(error),
  onMessage: (message) => console.log('New message:', message),
});
```

## Error Handling

```typescript
import {
  A2UParseError,
  ComponentRenderError,
  EventBusError,
} from '@web-agent/ui-protocol';

try {
  renderer.render(response.ui, container);
} catch (error) {
  if (error instanceof A2UParseError) {
    console.error('Invalid A2U JSON:', error.rawJson);
  } else if (error instanceof ComponentRenderError) {
    console.error('Render failed:', error.componentType, error.cause);
  }
}
```

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { A2URenderer } from '@web-agent/ui-protocol';

describe('A2URenderer', () => {
  it('renders a card component', () => {
    const renderer = new A2URenderer();
    const container = document.createElement('div');
    
    renderer.render({
      type: 'card',
      props: { title: 'Test Card' },
      children: [
        { type: 'text', props: { content: 'Hello world' } },
      ],
    }, container);
    
    expect(container.querySelector('h3')?.textContent).toBe('Test Card');
    expect(container.textContent).toContain('Hello world');
  });
});
```

## Next Steps

1. Build the flight booking demo: `examples/flight-booking/`
2. Add custom components for your domain
3. Integrate with your existing agent
4. Customize styling with CSS variables


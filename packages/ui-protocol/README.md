# @web-agent/ui-protocol

A2U Protocol Renderer and AG-UI Event Bus for browser-based AI agents.

## Features

- **A2U Protocol Renderer** - Parse and render agent UI responses into native DOM elements
- **AG-UI Event Bus** - Real-time typed events for agent-UI communication
- **Built-in Components** - Card, List, Button, Text, Image, Form
- **Custom Component Registry** - Extend with your own component types
- **XSS Protection** - DOMPurify sanitization built-in
- **TypeScript First** - Full type safety with Zod schemas

## Installation

```bash
pnpm add @web-agent/ui-protocol
```

## Quick Start

### A2U Renderer

```typescript
import { A2URenderer, parseA2UResponse } from '@web-agent/ui-protocol';

// Create renderer
const renderer = new A2URenderer();

// Parse A2U JSON from agent
const response = parseA2UResponse(`{
  "version": "1.0",
  "type": "ui",
  "ui": {
    "type": "card",
    "props": { "title": "Flight to Paris" },
    "children": [
      { "type": "text", "props": { "content": "Price: $450" } }
    ],
    "actions": [
      { "type": "call_tool", "params": { "tool": "book", "args": { "id": "123" } } }
    ]
  }
}`);

// Render to container
const container = document.getElementById('app');
renderer.render(response, container, {
  onAction: (action, componentId) => {
    console.log('Action triggered:', action, componentId);
  }
});
```

### AG-UI Event Bus

```typescript
import { AGUIEventBus } from '@web-agent/ui-protocol';

const bus = new AGUIEventBus();

// Subscribe to events
bus.on('generation:start', (event) => {
  console.log('Generation started:', event.payload.prompt);
});

bus.on('tool:call', (event) => {
  console.log('Tool called:', event.payload.toolId);
});

// Emit events
bus.emit('generation:start', {
  requestId: '123',
  prompt: 'Find flights to Paris'
});

// Cleanup
bus.dispose();
```

### Custom Components

```typescript
import { A2URenderer } from '@web-agent/ui-protocol';
import { z } from 'zod';

const renderer = new A2URenderer();

// Register custom component
renderer.registerComponent({
  type: 'flight-card',
  propsSchema: z.object({
    airline: z.string(),
    price: z.number(),
    departure: z.string(),
  }),
  renderer: (component, context) => {
    const props = component.props as any;
    const div = document.createElement('div');
    div.className = 'flight-card';
    div.innerHTML = `
      <h3>${props.airline}</h3>
      <p>Departure: ${props.departure}</p>
      <p class="price">$${props.price}</p>
    `;
    return div;
  }
});
```

## API Reference

### A2URenderer

| Method | Description |
|--------|-------------|
| `constructor(config?)` | Create renderer with optional config |
| `render(response, container, options?)` | Render A2U response to container |
| `registerComponent(entry)` | Register custom component |
| `unregisterComponent(type)` | Remove component registration |
| `getConfig()` | Get current configuration |
| `updateConfig(config)` | Update configuration |

### AGUIEventBus

| Method | Description |
|--------|-------------|
| `on(type, handler)` | Subscribe to event type |
| `off(type, handler)` | Unsubscribe from event type |
| `emit(type, payload)` | Emit event to subscribers |
| `dispose()` | Clean up all subscriptions |
| `isDisposed()` | Check if bus is disposed |

### Event Types

- `generation:start` - Agent started generating
- `generation:end` - Agent finished generating
- `tool:call` - Tool invocation started
- `tool:result` - Tool returned result
- `ui:action` - User triggered UI action
- `error` - Error occurred

### Component Types (Built-in)

- `card` - Container with title, subtitle, actions
- `list` - Ordered/unordered list
- `button` - Clickable button with actions
- `text` - Text with variants (body, heading, caption, code)
- `image` - Image with alt text
- `form` - Form with input fields

## Configuration

```typescript
const renderer = new A2URenderer({
  maxDepth: 10,        // Max component nesting depth
  maxComponents: 100,  // Max total components
  logLevel: 'warn',    // debug | info | warn | error
  sanitizeHtml: true,  // Enable XSS protection
});
```

## License

MIT


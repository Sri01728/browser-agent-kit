# Web Agent Framework - Demo Application

A live demonstration of the Web Agent Framework showcasing agent-controlled UI using the A2U protocol.

## 🎯 What This Demo Shows

- **Agent-Controlled UI**: Watch AI agents dynamically generate and render UI components
- **A2U Protocol**: See the Agent-to-UI protocol in action
- **React Integration**: Full integration with React hooks and components
- **UI Components**: Modal, Tabs, Dropdown, Button, Card, List, and more
- **Interactive**: Click buttons, switch tabs, open modals - all agent-controlled

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open browser
# http://localhost:3000
```

## 📦 What's Included

### Features Demonstrated

1. **Agent-Controlled UI Generation**
   - Agent generates A2U JSON
   - Framework renders components
   - Dynamic, context-aware interfaces

2. **React Components**
   - Modal with actions
   - Tabs with multiple panels
   - Dropdown with options
   - Buttons with variants

3. **A2U Protocol**
   - Structured UI definitions
   - Action handling
   - Component composition

4. **Interactive Demo**
   - Generate UI on demand
   - See agent responses
   - Interact with components

## 🎨 Demo Sections

### 1. Live Demo Tab
- Generate agent-controlled UI
- Select different models (mock for demo)
- See real-time agent responses
- Interact with generated components

### 2. Features Tab
- Overview of framework capabilities
- Feature cards with descriptions
- Visual presentation of benefits

### 3. Code Example Tab
- Quick start code snippet
- Shows how easy it is to use
- Copy-paste ready examples

## 🛠️ Technologies Used

- **Web Agent Framework** - Core agent orchestration
- **React** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **A2U Protocol** - Agent-to-UI communication

## 📝 Code Structure

```
demo-app/
├── src/
│   ├── App.tsx           # Main application
│   ├── App.css           # Application styles
│   ├── main.tsx          # Entry point
│   ├── index.css         # Global styles
│   └── tools.ts          # Agent tools
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── package.json          # Dependencies
└── README.md             # This file
```

## 🎯 Key Concepts Demonstrated

### 1. Agent Creation

```typescript
const agent = new Agent({
  model: new TransformersAdapter({
    modelPath: 'Xenova/Phi-3-mini-4k-instruct'
  }),
  instructions: 'Help users find flights',
  tools: [searchFlights, bookFlight]
});
```

### 2. Agent-Controlled UI

```typescript
const response = await agent.generate("Show me flights to Paris");

if (response.ui) {
  renderer.render(response.ui, container);
  // Agent just controlled your UI! 🎉
}
```

### 3. React Integration

```typescript
import { Modal, Tabs, Dropdown } from '@web-agent/react';

<Tabs
  tabs={[...]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

## 🎨 Customization

### Styling
All styles are in `src/index.css` and `src/App.css`. Modify these to change the look and feel.

### Agent Behavior
Edit `src/App.tsx` to change how the agent responds and what UI it generates.

### Tools
Add new tools in `src/tools.ts` to extend agent capabilities.

## 🚀 Next Steps

1. **Add Real LLM**: Replace mock agent with Transformers.js adapter
2. **More Tools**: Add more agent tools for different use cases
3. **Custom Components**: Create custom A2U components
4. **Styling**: Customize the theme and colors
5. **Deploy**: Deploy to Vercel, Netlify, or any hosting platform

## 📚 Learn More

- [Web Agent Framework Docs](../../docs/)
- [A2U Protocol Guide](../../docs/A2U_PROTOCOL.md)
- [React Integration](../../docs/REACT_INTEGRATION.md)
- [Enhanced Memory](../../docs/ENHANCED_MEMORY.md)

## 🎉 Enjoy!

This demo showcases the power of agent-controlled UI. Explore, experiment, and build amazing AI-powered applications!


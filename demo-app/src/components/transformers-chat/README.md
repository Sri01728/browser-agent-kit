# Transformers.js Chat - How Simple It Is!

This folder demonstrates how incredibly simple it is to use Transformers.js models in your React app.

## The Magic: Just 3 Steps!

### Step 1: Create Agent
```typescript
const agent = createWebAgent({
  model: {
    provider: 'transformers',
    path: 'Xenova/gpt2', // Any Hugging Face model
  },
});
```

### Step 2: Load Model
```typescript
await agent.load(); // Downloads and initializes the model
```

### Step 3: Send Messages
```typescript
const response = await agent.send('Hello!');
console.log(response); // AI response!
```

That's it! 🎉

## Component Structure

The chat is split into simple, focused components:

- **`useTransformersAgent.ts`** - Custom hook that handles all the logic (3 steps above)
- **`TransformersChat.tsx`** - Main component that orchestrates everything
- **`ModelSelector.tsx`** - Dropdown to select which model to use
- **`ModelStatus.tsx`** - Shows if model is loading/ready/error
- **`LoadModelButton.tsx`** - Button to load the model
- **`MessageList.tsx`** - Displays chat messages
- **`MessageInput.tsx`** - Input field and send button
- **`WelcomeMessage.tsx`** - Welcome message when ready

## Usage Example

```tsx
import { TransformersChat } from './components/TransformersChat';

function App() {
  return <TransformersChat />;
}
```

Or use the hook directly:

```tsx
import { useTransformersAgent, AVAILABLE_MODELS } from './components/transformers-chat';

function MyComponent() {
  const { agent, messages, loadModel, sendMessage } = useTransformersAgent('gpt2');
  
  return (
    <div>
      {!agent?.isReady && <button onClick={loadModel}>Load Model</button>}
      {agent?.isReady && (
        <div>
          {messages.map(msg => <div key={msg.timestamp}>{msg.content}</div>)}
          <button onClick={() => sendMessage('Hello!')}>Send</button>
        </div>
      )}
    </div>
  );
}
```

## Available Models

- `gpt2` - GPT-2 (Small, Fast)
- `gpt2-medium` - GPT-2 Medium
- `gemma2b` - Gemma 2B (Balanced)
- `phi2` - Phi-3 Mini (Coding)

Or use any Hugging Face model ID!

## That's All!

No servers, no API keys, no complex setup. Just:
1. Create agent
2. Load model
3. Send messages

Everything runs in your browser! 🚀


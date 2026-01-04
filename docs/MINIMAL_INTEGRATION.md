# Minimal Integration Guide

## Goal: Add Browser AI to Any React App in 2 Lines

The framework is designed for **zero-config, minimal-code integration** into existing React applications.

## Before vs After

### ❌ Before (Complex - 27+ lines)

```tsx
import { useState, useEffect } from 'react';
import { SmartAgentProvider, checkWebGPUSupport, isModelCached } from '@web-agent/react';

function App() {
  const [webGPUStatus, setWebGPUStatus] = useState(null);
  const [modelCached, setModelCached] = useState(null);

  useEffect(() => {
    const status = checkWebGPUSupport();
    setWebGPUStatus(status);
    isModelCached().then(setModelCached);
  }, []);

  if (webGPUStatus === null) {
    return <LoadingScreen message="Checking..." />;
  }

  if (!webGPUStatus.supported) {
    return <ErrorScreen message="WebGPU not supported" />;
  }

  return (
    <SmartAgentProvider
      persona="..."
      modelPath="/models/gemma-2b-it-gpu-int4.bin"
      autoLoad={true}
      includeDOM={false}
      includeForms={false}
      includeTables={false}
      maxContextLength={500}
    >
      {/* Your app */}
    </SmartAgentProvider>
  );
}
```

### ✅ After (Minimal - 2 lines!)

```tsx
import { SmartAgentProvider } from '@web-agent/react';

function App() {
  return (
    <SmartAgentProvider>
      {/* Your existing app code - works as-is! */}
    </SmartAgentProvider>
  );
}
```

## What Changed

### 1. **Automatic WebGPU Detection**
- Provider checks WebGPU support internally
- Shows error UI automatically if unsupported
- No manual checks needed

### 2. **Automatic Error Handling**
- Provider handles all errors gracefully
- Shows user-friendly error messages
- Your app continues to work even if AI fails

### 3. **Automatic Loading States**
- Provider shows loading UI while model loads
- No need to manage loading state manually
- Progress indicators built-in

### 4. **Sensible Defaults**
- Optimized defaults for Gemma 2B (500 token limit)
- DOM/form/table extraction disabled by default (saves tokens)
- Auto-load enabled by default

## Integration Patterns

### Pattern 1: Zero Config (Recommended)

```tsx
import { SmartAgentProvider } from '@web-agent/react';

function App() {
  return (
    <SmartAgentProvider>
      <YourExistingApp />
    </SmartAgentProvider>
  );
}
```

**That's it!** The AI is now available via `useSmartAgent()` hook.

### Pattern 2: Custom Persona

```tsx
<SmartAgentProvider persona="You are a shopping assistant.">
  <YourApp />
</SmartAgentProvider>
```

### Pattern 3: Custom Model Path

```tsx
<SmartAgentProvider modelPath="/models/my-model.bin">
  <YourApp />
</SmartAgentProvider>
```

### Pattern 4: Register Component Data

```tsx
import { useRegisterData, useSmartAgent } from '@web-agent/react';

function ProductList() {
  const [products] = useState([...]);
  
  // Auto-register data - AI can see it!
  useRegisterData('products', products);
  
  return <div>{/* Your UI */}</div>;
}

function Chat() {
  const { send, messages, isReady } = useSmartAgent();
  
  return (
    <div>
      {messages.map(m => <div key={m.id}>{m.content}</div>)}
      <input 
        onKeyDown={e => e.key === 'Enter' && send(e.target.value)}
        disabled={!isReady}
      />
    </div>
  );
}
```

## What Gets Added Automatically

1. ✅ **WebGPU compatibility check** - Runs on mount
2. ✅ **Model loading** - Downloads and caches model automatically
3. ✅ **Error handling** - Shows friendly error messages
4. ✅ **Loading states** - Progress indicators during model load
5. ✅ **Data registration** - Components can register data via `useRegisterData()`
6. ✅ **DOM context** - Optionally extracts visible content (disabled by default)

## Code Reduction Summary

| Aspect | Before | After | Reduction |
|--------|--------|-------|-----------|
| **Setup code** | 27 lines | 2 lines | **92%** |
| **Manual checks** | Required | Automatic | **100%** |
| **Error handling** | Manual | Automatic | **100%** |
| **Loading states** | Manual | Automatic | **100%** |
| **Configuration** | 6+ props | 0-2 props | **67-100%** |

## Migration Guide

### Step 1: Remove Manual Checks

**Remove:**
```tsx
const [webGPUStatus, setWebGPUStatus] = useState(null);
useEffect(() => {
  const status = checkWebGPUSupport();
  setWebGPUStatus(status);
}, []);
if (!webGPUStatus?.supported) return <ErrorScreen />;
```

**Keep:** Nothing - provider handles it!

### Step 2: Remove Manual Loading States

**Remove:**
```tsx
if (webGPUStatus === null) {
  return <LoadingScreen />;
}
```

**Keep:** Nothing - provider shows loading automatically!

### Step 3: Simplify Provider Props

**Before:**
```tsx
<SmartAgentProvider
  persona={GENERAL_PERSONA}
  modelPath="/models/gemma-2b-it-gpu-int4.bin"
  autoLoad={true}
  includeDOM={false}
  includeForms={false}
  includeTables={false}
  maxContextLength={500}
>
```

**After:**
```tsx
<SmartAgentProvider persona="Your persona">
```

All other props use optimized defaults!

## Best Practices

1. **Start with zero config** - Just wrap your app
2. **Add persona only if needed** - Default is helpful assistant
3. **Use `useRegisterData()`** - Let components register their own data
4. **Keep it simple** - Framework handles complexity internally

## Example: Real-World Integration

```tsx
// Before: Your existing app
function MyApp() {
  return (
    <div>
      <Header />
      <ProductList />
      <ShoppingCart />
    </div>
  );
}

// After: Add AI in 2 lines
import { SmartAgentProvider } from '@web-agent/react';

function MyApp() {
  return (
    <SmartAgentProvider>
      <div>
        <Header />
        <ProductList />
        <ShoppingCart />
        <AIChat /> {/* New component using useSmartAgent() */}
      </div>
    </SmartAgentProvider>
  );
}
```

## Summary

✅ **92% less code** to integrate  
✅ **Zero configuration** required  
✅ **Automatic error handling**  
✅ **Automatic loading states**  
✅ **Works with existing apps** - no refactoring needed  

The framework is now **truly plug-and-play** for any React application!


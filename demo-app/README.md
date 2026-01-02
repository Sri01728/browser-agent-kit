# @web-agent Demo App

A simple demo showcasing all the framework hooks and components.

## Features Demonstrated

- ✅ `SmartAgentProvider` - Auto-context provider
- ✅ `useSmartAgent` - Agent state and messaging
- ✅ `useRegisterData` - Register data for AI context
- ✅ `checkWebGPUSupport` - Browser compatibility check
- ✅ `isModelCached` - Model caching status
- ✅ `personas` - Pre-built AI personas

## Quick Start

```bash
# From the monorepo root
pnpm install
pnpm build

# Run the demo
cd demo-app
pnpm dev
```

## Model Setup

1. Download Gemma 2B from [Kaggle](https://www.kaggle.com/models/google/gemma/tfLite)
2. Place `gemma-2b-it-gpu-int4.bin` in `demo-app/public/models/`

## Delete This Demo

To clean up, simply delete the `demo-app` folder:

```bash
rm -rf demo-app
```

And remove `'demo-app'` from `pnpm-workspace.yaml`.


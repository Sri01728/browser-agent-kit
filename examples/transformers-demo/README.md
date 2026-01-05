# Transformers.js Demo

This demo showcases the Web Agent Framework with a **real browser-based LLM** using Transformers.js.

## Features

- 🧠 **Real AI Model**: Phi-3-mini running entirely in your browser
- 🚀 **No Server Required**: All inference happens locally
- 🛠️ **Tool Calling**: Agent can call custom tools
- 💾 **Model Caching**: Model downloads once and is cached
- ⚡ **WebGPU/WASM**: Supports both acceleration methods

## Running the Demo

```bash
# Install dependencies
cd examples/transformers-demo
pnpm install

# Start the dev server
pnpm dev

# Open http://localhost:3001
```

## What Happens

1. **Model Loading**: On first load, Phi-3-mini (~2GB) downloads from Hugging Face
2. **Initialization**: Model loads into memory (takes 30-60 seconds)
3. **Ready**: Green status badge appears when ready
4. **Generate**: Type a prompt and click "Generate"
5. **Response**: Agent processes prompt and responds (takes 5-20 seconds)

## Model Details

- **Model**: Phi-3-mini-4k-instruct (by Microsoft)
- **Size**: ~2GB (downloaded once, then cached)
- **Context**: 4096 tokens
- **Speed**: 1-5 tokens/second (depends on device)

## System Requirements

- Modern browser (Chrome/Edge recommended)
- 4GB+ RAM
- Fast internet for initial model download
- Optional: GPU for WebGPU acceleration

## Notes

- First load is slow (model download)
- Subsequent loads are much faster (cached)
- Inference is slower than cloud APIs but 100% private
- All processing happens on your device


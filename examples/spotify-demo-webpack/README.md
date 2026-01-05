# Spotify AI Agent Demo (Webpack)

> **Control Spotify with natural language using AI agents powered by the Web Agent Framework**

This demo showcases the Web Agent Framework's capabilities by creating a Spotify-like music player that can be controlled through natural conversation with an AI agent running entirely in your browser.

## 🎯 What This Demonstrates

- **Browser-based LLM**: Phi-3-mini running locally via Transformers.js
- **Tool Calling**: 6 music control tools the agent can use
- **State Management**: React Context for player state
- **UI Updates**: Real-time UI changes based on agent actions
- **Zero Server**: Everything runs client-side

## ✨ Features

### Music Control Tools

1. **Play/Pause** - Control playback with natural language
2. **Skip Songs** - Navigate next/previous
3. **Search & Play** - Find songs by title, artist, or genre
4. **Volume Control** - Adjust volume up/down or set specific levels
5. **Create Playlists** - Generate playlists by genre or mood
6. **Recommendations** - Get music suggestions

### UI Components

- **Agent Chat** (Left) - Natural language conversation interface
- **Spotify Player** (Right) - Full-featured mock music player
  - Album art display
  - Play/pause/skip controls
  - Volume slider
  - Queue management
  - Progress tracking

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# From the monorepo root
pnpm install

# Navigate to this example
cd examples/spotify-demo-webpack

# Install dependencies (if not already done)
pnpm install

# Start the dev server
pnpm dev
```

The app will open automatically at `http://localhost:3002`.

### First Run

⚠️ **Important**: The first time you run the app, it will download the Phi-3-mini model (~2GB). This is a one-time download and will be cached in your browser.

You'll see a loading screen with progress. This can take 2-5 minutes depending on your internet connection.

## 💬 Example Conversations

Try these prompts with the agent:

- "Play some jazz music"
- "Turn up the volume"
- "Next song please"
- "Create a chill playlist with 5 songs"
- "Recommend some upbeat music"
- "Play Rock Anthem by The Rockers"
- "Set volume to 75"

## 🏗️ Architecture

### Key Files

```
src/
├── agent/
│   └── musicAgent.ts          # Agent setup with Phi-3-mini
├── components/
│   ├── SpotifyPlayer.tsx      # Mock player UI
│   ├── SpotifyPlayer.css      # Player styling
│   ├── LoadingScreen.tsx      # Model loading feedback
│   └── LoadingScreen.css      # Loading styling
├── context/
│   └── PlayerContext.tsx      # React Context for state
├── tools/
│   └── musicTools.ts          # 6 music control tools
├── types/
│   └── music.ts               # TypeScript interfaces
├── data/
│   └── mockMusic.ts           # Sample music library
├── App.tsx                     # Main app component
├── App.css                     # App styling
├── main.tsx                    # Entry point
└── index.css                   # Global styles
```

### Technology Stack

- **Framework**: React 18 + TypeScript
- **Bundler**: Webpack 5 (better Transformers.js support than Vite)
- **AI Model**: Phi-3-mini-4k-instruct (via Transformers.js)
- **State**: React Context API
- **Agent Framework**: @web-agent/core, @web-agent/react, @web-agent/transformers

## 🔧 Why Webpack?

This demo uses Webpack instead of Vite because:

1. **Better WASM Support**: Webpack handles WASM modules more reliably
2. **Worker Compatibility**: Better support for Web Workers used by Transformers.js
3. **Dynamic Imports**: More mature handling of complex dynamic imports
4. **Proven Track Record**: Webpack is battle-tested with ML libraries

## 🎨 Customization

### Change the AI Model

Edit `src/agent/musicAgent.ts`:

```typescript
const adapter = new TransformersAdapter({
  modelPath: 'Xenova/gemma-2b-it', // Try a different model
  onProgress,
});
```

### Add More Songs

Edit `src/data/mockMusic.ts` to add songs to the mock library.

### Modify Agent Instructions

Edit the `instructions` in `src/agent/musicAgent.ts` to change agent behavior.

## 🐛 Troubleshooting

### Model Download Fails

- Check your internet connection
- Clear browser cache and try again
- Try a smaller model like `Xenova/Phi-2`

### Agent Not Responding

- Check browser console for errors
- Ensure model finished loading (check loading screen)
- Refresh the page

### Performance Issues

- Close other browser tabs
- Ensure you have sufficient RAM (4GB+ recommended)
- Try a smaller model

## 📦 Build for Production

```bash
pnpm build
pnpm preview
```

This creates an optimized production build in the `dist/` directory.

## 🎓 Learning Resources

- [Web Agent Framework Docs](../../README.md)
- [Transformers.js Docs](https://huggingface.co/docs/transformers.js)
- [Phi-3 Model Card](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct)

## 📝 License

MIT - See root LICENSE file

## 🤝 Contributing

This is part of the Web Agent Framework. See the main README for contribution guidelines.

---

Built with ❤️ using the Web Agent Framework


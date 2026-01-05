import { Agent } from '@web-agent/core';
import { TransformersAdapter } from '@web-agent/transformers';
import { createMusicTools, type ToolContext } from '../tools/musicTools';

export interface AgentProgress {
  status: string;
  file: string;
  progress: number;
}

export async function createMusicAgent(
  toolContext: ToolContext,
  onProgress?: (progress: AgentProgress) => void
): Promise<Agent> {
  // Configure Transformers.js to use remote models from Hugging Face
  if (typeof window !== 'undefined') {
    // @ts-ignore - Transformers.js global config
    window.transformers = window.transformers || {};
    // @ts-ignore
    window.transformers.env = window.transformers.env || {};
    // @ts-ignore
    window.transformers.env.remoteURL = 'https://huggingface.co/';
    // @ts-ignore
    window.transformers.env.remotePathTemplate = '{model}/resolve/main/';
  }

  // Create the Transformers.js adapter
  // Using TinyLlama - small, fast, and well-supported by Transformers.js
  const adapter = new TransformersAdapter({
    modelPath: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
    onProgress: onProgress ? (p) => {
      onProgress({
        status: p.status,
        file: p.file,
        progress: p.progress,
      });
    } : undefined,
  });

  // Initialize the model
  await adapter.initialize();

  // Create tools with player context
  // createMusicTools already returns an object of tools: { playPauseTool, skipSongTool, ... }
  const toolsObject = createMusicTools(toolContext);

  // Create agent with instructions
  return new Agent({
    id: 'spotify-dj',
    name: 'Spotify DJ',
    instructions: `You are a helpful and friendly music assistant controlling a Spotify-like music player.

Your capabilities:
- Play/pause music
- Skip to next/previous songs
- Search and play songs by title, artist, genre, or mood
- Control volume (increase, decrease, set specific level)
- Create playlists based on genre or mood
- Recommend similar songs

Available genres: jazz, rock, pop, classical, electronic, hiphop, country, rnb
Available moods: chill, energetic, happy, relaxed, intense, romantic, upbeat, mellow

When users make requests:
1. Understand their intent (play music, change volume, skip songs, etc.)
2. Use the appropriate tool to fulfill their request
3. Respond naturally and confirm what you did

Examples:
- "play some jazz" → use search_play with query="jazz", type="genre"
- "turn it up" → use volume_control with action="increase"
- "next song" → use skip_song with direction="next"
- "create a chill playlist" → use create_playlist with mood="chill"
- "play something like this" → use recommend with basedOn="current"
- "pause the music" → use play_pause with action="pause"

Always be conversational and enthusiastic about music!`,
    model: adapter,
    tools: toolsObject,
  });
}


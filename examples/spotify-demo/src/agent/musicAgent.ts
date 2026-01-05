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
  // Create the Transformers.js adapter
  const adapter = new TransformersAdapter({
    modelPath: 'Xenova/Phi-3-mini-4k-instruct',
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
  const tools = createMusicTools(toolContext);

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
    tools: Object.values(tools),
  });
}


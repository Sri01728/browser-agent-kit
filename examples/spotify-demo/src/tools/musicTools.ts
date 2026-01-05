import { createTool } from '@web-agent/core';
import { z } from 'zod';
import type { Song } from '../types/music';
import {
  searchByGenre,
  searchByMood,
  searchGeneral,
  getRecommendations,
  getSongById,
} from '../data/mockMusic';

// Shared schemas
const songSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  album: z.string(),
  genre: z.string(),
  mood: z.string().optional(),
  duration: z.number(),
  albumArt: z.string().optional(),
});

// Tool execution context (will be injected)
export interface ToolContext {
  playSong: (song: Song) => void;
  togglePlay: () => void;
  nextSong: () => void;
  previousSong: () => void;
  setVolume: (volume: number) => void;
  adjustVolume: (delta: number) => void;
  addToQueue: (song: Song) => void;
  setQueue: (songs: Song[]) => void;
  getCurrentSong: () => Song | null;
  isPlaying: () => boolean;
  getVolume: () => number;
  getQueue: () => Song[];
}

// Factory function to create tools with context
export function createMusicTools(context: ToolContext) {
  const playPauseTool = createTool({
    id: 'play_pause',
    description: 'Play or pause the current song. Use this when user wants to start/stop music.',
    inputSchema: z.object({
      action: z.enum(['play', 'pause', 'toggle']).describe('The action to perform: play, pause, or toggle current state'),
    }),
    outputSchema: z.object({
      status: z.enum(['playing', 'paused']),
      song: z.string().describe('Current song playing'),
    }),
    execute: async ({ action }) => {
      const currentSong = context.getCurrentSong();
      
      if (action === 'toggle') {
        context.togglePlay();
      } else if (action === 'play') {
        if (!context.isPlaying()) {
          context.togglePlay();
        }
      } else if (action === 'pause') {
        if (context.isPlaying()) {
          context.togglePlay();
        }
      }
      
      const isPlaying = context.isPlaying();
      return {
        status: isPlaying ? 'playing' : 'paused',
        song: currentSong ? `${currentSong.title} by ${currentSong.artist}` : 'No song loaded',
      };
    },
  });

  const skipSongTool = createTool({
    id: 'skip_song',
    description: 'Skip to the next or previous song. Use when user wants to change the current track.',
    inputSchema: z.object({
      direction: z.enum(['next', 'previous']).describe('Direction to skip: next or previous'),
    }),
    outputSchema: z.object({
      newSong: z.object({
        title: z.string(),
        artist: z.string(),
      }),
    }),
    execute: async ({ direction }) => {
      if (direction === 'next') {
        context.nextSong();
      } else {
        context.previousSong();
      }
      
      const currentSong = context.getCurrentSong();
      return {
        newSong: {
          title: currentSong?.title || 'Unknown',
          artist: currentSong?.artist || 'Unknown',
        },
      };
    },
  });

  const searchPlayTool = createTool({
    id: 'search_play',
    description: 'Search for music by title, artist, genre, or mood and play it. Use when user asks for specific music.',
    inputSchema: z.object({
      query: z.string().describe('Search query - song title, artist name, genre (jazz/rock/pop/classical/electronic/hiphop/country/rnb), or mood'),
      type: z.enum(['song', 'artist', 'genre', 'mood', 'general']).optional().describe('Type of search to perform'),
    }),
    outputSchema: z.object({
      found: z.boolean(),
      song: z.object({
        title: z.string(),
        artist: z.string(),
        genre: z.string(),
      }).optional(),
      message: z.string(),
    }),
    execute: async ({ query, type = 'general' }) => {
      let results: Song[] = [];
      
      // Perform search based on type
      if (type === 'genre' || ['jazz', 'rock', 'pop', 'classical', 'electronic', 'hiphop', 'country', 'rnb'].some(g => query.toLowerCase().includes(g))) {
        results = searchByGenre(query);
      } else if (type === 'mood' || ['chill', 'energetic', 'happy', 'sad', 'relaxed', 'intense'].some(m => query.toLowerCase().includes(m))) {
        results = searchByMood(query);
      } else {
        results = searchGeneral(query);
      }
      
      if (results.length > 0) {
        const song = results[0];
        context.playSong(song);
        
        // If more results, add to queue
        if (results.length > 1) {
          context.setQueue(results.slice(1, 6)); // Add up to 5 more to queue
        }
        
        // Make sure it's playing
        if (!context.isPlaying()) {
          context.togglePlay();
        }
        
        return {
          found: true,
          song: {
            title: song.title,
            artist: song.artist,
            genre: song.genre,
          },
          message: results.length > 1 
            ? `Found ${results.length} songs. Playing "${song.title}" by ${song.artist}. Added ${Math.min(results.length - 1, 5)} more to queue.`
            : `Now playing "${song.title}" by ${song.artist}`,
        };
      }
      
      return {
        found: false,
        message: `Sorry, I couldn't find any music matching "${query}". Try searching for jazz, rock, pop, classical, electronic, hiphop, country, or rnb.`,
      };
    },
  });

  const volumeControlTool = createTool({
    id: 'volume_control',
    description: 'Control the volume level. Use when user wants to adjust how loud the music is.',
    inputSchema: z.object({
      action: z.enum(['set', 'increase', 'decrease']).describe('Action: set to specific level, increase, or decrease'),
      value: z.number().min(0).max(100).optional().describe('Volume level (0-100) for "set" action'),
    }),
    outputSchema: z.object({
      volume: z.number(),
      message: z.string(),
    }),
    execute: async ({ action, value }) => {
      const currentVolume = context.getVolume();
      
      if (action === 'set' && value !== undefined) {
        context.setVolume(value);
        return {
          volume: value,
          message: `Volume set to ${value}%`,
        };
      } else if (action === 'increase') {
        const delta = value || 10;
        context.adjustVolume(delta);
        const newVolume = context.getVolume();
        return {
          volume: newVolume,
          message: `Volume increased to ${newVolume}%`,
        };
      } else if (action === 'decrease') {
        const delta = value || 10;
        context.adjustVolume(-delta);
        const newVolume = context.getVolume();
        return {
          volume: newVolume,
          message: `Volume decreased to ${newVolume}%`,
        };
      }
      
      return {
        volume: currentVolume,
        message: `Current volume is ${currentVolume}%`,
      };
    },
  });

  const createPlaylistTool = createTool({
    id: 'create_playlist',
    description: 'Create a playlist based on genre, mood, or mix of songs. Use when user wants a collection of similar music.',
    inputSchema: z.object({
      name: z.string().describe('Name for the playlist'),
      criteria: z.object({
        genre: z.string().optional().describe('Genre filter (jazz/rock/pop/classical/electronic/hiphop/country/rnb)'),
        mood: z.string().optional().describe('Mood filter (chill/energetic/happy/relaxed/intense/romantic)'),
        count: z.number().optional().default(10).describe('Number of songs (default 10)'),
      }),
    }),
    outputSchema: z.object({
      playlist: z.object({
        name: z.string(),
        count: z.number(),
        songs: z.array(z.object({
          title: z.string(),
          artist: z.string(),
        })),
      }),
      message: z.string(),
    }),
    execute: async ({ name, criteria }) => {
      let songs: Song[] = [];
      
      // Search based on criteria
      if (criteria.genre) {
        songs = searchByGenre(criteria.genre);
      } else if (criteria.mood) {
        songs = searchByMood(criteria.mood);
      }
      
      // Limit to requested count
      const count = Math.min(criteria.count || 10, songs.length);
      const playlistSongs = songs.slice(0, count);
      
      if (playlistSongs.length > 0) {
        // Set as queue
        context.setQueue(playlistSongs);
        
        // Play first song
        context.playSong(playlistSongs[0]);
        if (!context.isPlaying()) {
          context.togglePlay();
        }
        
        return {
          playlist: {
            name,
            count: playlistSongs.length,
            songs: playlistSongs.map(s => ({ title: s.title, artist: s.artist })),
          },
          message: `Created "${name}" playlist with ${playlistSongs.length} songs${criteria.genre ? ` in ${criteria.genre} genre` : ''}${criteria.mood ? ` with ${criteria.mood} mood` : ''}. Now playing!`,
        };
      }
      
      return {
        playlist: {
          name,
          count: 0,
          songs: [],
        },
        message: `Couldn't create playlist with those criteria. Try different genre or mood.`,
      };
    },
  });

  const recommendTool = createTool({
    id: 'recommend',
    description: 'Get song recommendations based on current song, genre, or mood. Use when user wants music suggestions.',
    inputSchema: z.object({
      basedOn: z.enum(['current', 'genre', 'mood']).describe('What to base recommendations on'),
      preference: z.string().optional().describe('Genre or mood preference if not using current song'),
    }),
    outputSchema: z.object({
      recommendations: z.array(z.object({
        title: z.string(),
        artist: z.string(),
        genre: z.string(),
      })),
      message: z.string(),
    }),
    execute: async ({ basedOn, preference }) => {
      let recommendations: Song[] = [];
      
      if (basedOn === 'current') {
        const currentSong = context.getCurrentSong();
        if (currentSong) {
          recommendations = getRecommendations(currentSong, 5);
        }
      } else if (basedOn === 'genre' && preference) {
        const genreSongs = searchByGenre(preference);
        recommendations = genreSongs.slice(0, 5);
      } else if (basedOn === 'mood' && preference) {
        const moodSongs = searchByMood(preference);
        recommendations = moodSongs.slice(0, 5);
      }
      
      if (recommendations.length > 0) {
        // Add to queue
        context.setQueue([...context.getQueue(), ...recommendations]);
        
        return {
          recommendations: recommendations.map(s => ({
            title: s.title,
            artist: s.artist,
            genre: s.genre,
          })),
          message: `Added ${recommendations.length} recommended songs to your queue!`,
        };
      }
      
      return {
        recommendations: [],
        message: `Couldn't find recommendations. Try playing a song first or specify a genre/mood.`,
      };
    },
  });

  return {
    playPauseTool,
    skipSongTool,
    searchPlayTool,
    volumeControlTool,
    createPlaylistTool,
    recommendTool,
  };
}


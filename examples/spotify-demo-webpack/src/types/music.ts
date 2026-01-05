// Music related types
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  mood?: string;
  duration: number; // in seconds
  albumArt?: string;
}

export interface PlayerState {
  currentSong: Song | null;
  playing: boolean;
  volume: number; // 0-100
  currentTime: number; // in seconds
  queue: Song[];
  history: Song[];
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: Date;
}

export type PlayerAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_SONG'; song: Song }
  | { type: 'NEXT_SONG' }
  | { type: 'PREVIOUS_SONG' }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'ADJUST_VOLUME'; delta: number }
  | { type: 'SET_TIME'; time: number }
  | { type: 'ADD_TO_QUEUE'; song: Song }
  | { type: 'SET_QUEUE'; songs: Song[] }
  | { type: 'CLEAR_QUEUE' };


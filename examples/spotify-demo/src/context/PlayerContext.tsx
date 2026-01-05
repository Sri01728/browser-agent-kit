import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import type { PlayerState, PlayerAction, Song } from '../types/music';
import { mockLibrary } from '../data/mockMusic';

// Initial state
const initialState: PlayerState = {
  currentSong: mockLibrary[0], // Start with first song
  playing: false,
  volume: 50,
  currentTime: 0,
  queue: [],
  history: [],
};

// Reducer
function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'PLAY':
      return { ...state, playing: true };
    
    case 'PAUSE':
      return { ...state, playing: false };
    
    case 'TOGGLE_PLAY':
      return { ...state, playing: !state.playing };
    
    case 'SET_SONG':
      return {
        ...state,
        currentSong: action.song,
        currentTime: 0,
        history: state.currentSong ? [...state.history, state.currentSong] : state.history,
      };
    
    case 'NEXT_SONG':
      if (state.queue.length > 0) {
        const [nextSong, ...remaining] = state.queue;
        return {
          ...state,
          currentSong: nextSong,
          currentTime: 0,
          queue: remaining,
          history: state.currentSong ? [...state.history, state.currentSong] : state.history,
        };
      }
      // If no queue, find next song in library
      const currentIndex = mockLibrary.findIndex((s) => s.id === state.currentSong?.id);
      const nextIndex = (currentIndex + 1) % mockLibrary.length;
      return {
        ...state,
        currentSong: mockLibrary[nextIndex],
        currentTime: 0,
        history: state.currentSong ? [...state.history, state.currentSong] : state.history,
      };
    
    case 'PREVIOUS_SONG':
      if (state.history.length > 0) {
        const previousSong = state.history[state.history.length - 1];
        const newHistory = state.history.slice(0, -1);
        return {
          ...state,
          currentSong: previousSong,
          currentTime: 0,
          history: newHistory,
          queue: state.currentSong ? [state.currentSong, ...state.queue] : state.queue,
        };
      }
      // If no history, go to previous in library
      const currentIdx = mockLibrary.findIndex((s) => s.id === state.currentSong?.id);
      const prevIdx = currentIdx > 0 ? currentIdx - 1 : mockLibrary.length - 1;
      return {
        ...state,
        currentSong: mockLibrary[prevIdx],
        currentTime: 0,
      };
    
    case 'SET_VOLUME':
      return { ...state, volume: Math.max(0, Math.min(100, action.volume)) };
    
    case 'ADJUST_VOLUME':
      return {
        ...state,
        volume: Math.max(0, Math.min(100, state.volume + action.delta)),
      };
    
    case 'SET_TIME':
      return { ...state, currentTime: action.time };
    
    case 'ADD_TO_QUEUE':
      return { ...state, queue: [...state.queue, action.song] };
    
    case 'SET_QUEUE':
      return { ...state, queue: action.songs };
    
    case 'CLEAR_QUEUE':
      return { ...state, queue: [] };
    
    default:
      return state;
  }
}

// Context
interface PlayerContextType {
  state: PlayerState;
  dispatch: React.Dispatch<PlayerAction>;
  playSong: (song: Song) => void;
  togglePlay: () => void;
  nextSong: () => void;
  previousSong: () => void;
  setVolume: (volume: number) => void;
  adjustVolume: (delta: number) => void;
  addToQueue: (song: Song) => void;
  setQueue: (songs: Song[]) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const intervalRef = useRef<number | null>(null);

  // Handle time progression when playing
  useEffect(() => {
    if (state.playing && state.currentSong) {
      intervalRef.current = window.setInterval(() => {
        dispatch({ type: 'SET_TIME', time: state.currentTime + 1 });
        
        // Auto-advance to next song when current finishes
        if (state.currentTime >= state.currentSong.duration) {
          dispatch({ type: 'NEXT_SONG' });
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.playing, state.currentTime, state.currentSong]);

  const contextValue: PlayerContextType = {
    state,
    dispatch,
    playSong: (song: Song) => dispatch({ type: 'SET_SONG', song }),
    togglePlay: () => dispatch({ type: 'TOGGLE_PLAY' }),
    nextSong: () => dispatch({ type: 'NEXT_SONG' }),
    previousSong: () => dispatch({ type: 'PREVIOUS_SONG' }),
    setVolume: (volume: number) => dispatch({ type: 'SET_VOLUME', volume }),
    adjustVolume: (delta: number) => dispatch({ type: 'ADJUST_VOLUME', delta }),
    addToQueue: (song: Song) => dispatch({ type: 'ADD_TO_QUEUE', song }),
    setQueue: (songs: Song[]) => dispatch({ type: 'SET_QUEUE', songs }),
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
}


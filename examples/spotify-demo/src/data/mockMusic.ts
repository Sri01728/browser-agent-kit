import type { Song } from '../types/music';

// Mock music library with diverse genres
export const mockLibrary: Song[] = [
  // Jazz
  {
    id: 'jazz-1',
    title: 'Smooth Operator',
    artist: 'Jazz Collective',
    album: 'Midnight Blues',
    genre: 'jazz',
    mood: 'chill',
    duration: 245,
    albumArt: '🎷',
  },
  {
    id: 'jazz-2',
    title: 'Blue Monday',
    artist: 'The Saxophones',
    album: 'Live at Blue Note',
    genre: 'jazz',
    mood: 'relaxed',
    duration: 312,
    albumArt: '🎺',
  },
  {
    id: 'jazz-3',
    title: 'Take Five More',
    artist: 'Dave & Friends',
    album: 'Time Signatures',
    genre: 'jazz',
    mood: 'sophisticated',
    duration: 298,
    albumArt: '🎹',
  },

  // Rock
  {
    id: 'rock-1',
    title: 'Thunder Road',
    artist: 'The Electric Band',
    album: 'Highway Nights',
    genre: 'rock',
    mood: 'energetic',
    duration: 276,
    albumArt: '🎸',
  },
  {
    id: 'rock-2',
    title: 'Rebel Yell',
    artist: 'Wild Ones',
    album: 'Maximum Volume',
    genre: 'rock',
    mood: 'intense',
    duration: 234,
    albumArt: '🤘',
  },
  {
    id: 'rock-3',
    title: 'Born to Run Fast',
    artist: 'Bruce & The Band',
    album: 'American Dreams',
    genre: 'rock',
    mood: 'anthemic',
    duration: 289,
    albumArt: '🎙️',
  },

  // Pop
  {
    id: 'pop-1',
    title: 'Dance All Night',
    artist: 'Pop Stars',
    album: 'Summer Hits',
    genre: 'pop',
    mood: 'happy',
    duration: 198,
    albumArt: '💫',
  },
  {
    id: 'pop-2',
    title: 'Love Supreme',
    artist: 'The Melodics',
    album: 'Chart Toppers',
    genre: 'pop',
    mood: 'romantic',
    duration: 223,
    albumArt: '❤️',
  },
  {
    id: 'pop-3',
    title: 'Sunset Boulevard',
    artist: 'California Dreams',
    album: 'West Coast',
    genre: 'pop',
    mood: 'upbeat',
    duration: 211,
    albumArt: '🌅',
  },

  // Classical
  {
    id: 'classical-1',
    title: 'Moonlight Sonata Reimagined',
    artist: 'Modern Orchestra',
    album: 'Classical Revival',
    genre: 'classical',
    mood: 'serene',
    duration: 456,
    albumArt: '🎻',
  },
  {
    id: 'classical-2',
    title: 'Symphony No. 10',
    artist: 'Philharmonic Ensemble',
    album: 'Great Works',
    genre: 'classical',
    mood: 'majestic',
    duration: 523,
    albumArt: '🎼',
  },

  // Electronic
  {
    id: 'electronic-1',
    title: 'Digital Dreams',
    artist: 'Synthwave',
    album: 'Future Sound',
    genre: 'electronic',
    mood: 'futuristic',
    duration: 267,
    albumArt: '🎛️',
  },
  {
    id: 'electronic-2',
    title: 'Neon Lights',
    artist: 'DJ Pulse',
    album: 'Night Drive',
    genre: 'electronic',
    mood: 'energetic',
    duration: 245,
    albumArt: '💿',
  },
  {
    id: 'electronic-3',
    title: 'Bass Drop',
    artist: 'Dubstep Kings',
    album: 'Heavy Beats',
    genre: 'electronic',
    mood: 'intense',
    duration: 198,
    albumArt: '🔊',
  },

  // Hip Hop
  {
    id: 'hiphop-1',
    title: 'Street Poetry',
    artist: 'MC Flow',
    album: 'Urban Stories',
    genre: 'hiphop',
    mood: 'confident',
    duration: 223,
    albumArt: '🎤',
  },
  {
    id: 'hiphop-2',
    title: 'Beats & Rhymes',
    artist: 'The Lyricists',
    album: 'Word Play',
    genre: 'hiphop',
    mood: 'groovy',
    duration: 234,
    albumArt: '🎧',
  },

  // Country
  {
    id: 'country-1',
    title: 'Dusty Roads',
    artist: 'Nashville Stars',
    album: 'Country Heart',
    genre: 'country',
    mood: 'nostalgic',
    duration: 256,
    albumArt: '🤠',
  },
  {
    id: 'country-2',
    title: 'Whiskey Sunrise',
    artist: 'The Cowboys',
    album: 'Southern Soul',
    genre: 'country',
    mood: 'mellow',
    duration: 289,
    albumArt: '🌾',
  },

  // R&B
  {
    id: 'rnb-1',
    title: 'Smooth Soul',
    artist: 'R&B Collective',
    album: 'Night Vibes',
    genre: 'rnb',
    mood: 'romantic',
    duration: 267,
    albumArt: '🌙',
  },
  {
    id: 'rnb-2',
    title: 'Velvet Voice',
    artist: 'Soul Sisters',
    album: 'Love Letters',
    genre: 'rnb',
    mood: 'intimate',
    duration: 245,
    albumArt: '💝',
  },
];

// Helper functions to search the library
export function searchByTitle(query: string): Song[] {
  const lowerQuery = query.toLowerCase();
  return mockLibrary.filter((song) =>
    song.title.toLowerCase().includes(lowerQuery)
  );
}

export function searchByArtist(query: string): Song[] {
  const lowerQuery = query.toLowerCase();
  return mockLibrary.filter((song) =>
    song.artist.toLowerCase().includes(lowerQuery)
  );
}

export function searchByGenre(genre: string): Song[] {
  const lowerGenre = genre.toLowerCase();
  return mockLibrary.filter((song) =>
    song.genre.toLowerCase() === lowerGenre
  );
}

export function searchByMood(mood: string): Song[] {
  const lowerMood = mood.toLowerCase();
  return mockLibrary.filter((song) =>
    song.mood?.toLowerCase().includes(lowerMood)
  );
}

export function searchGeneral(query: string): Song[] {
  const lowerQuery = query.toLowerCase();
  return mockLibrary.filter(
    (song) =>
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery) ||
      song.genre.toLowerCase().includes(lowerQuery) ||
      song.mood?.toLowerCase().includes(lowerQuery) ||
      song.album.toLowerCase().includes(lowerQuery)
  );
}

export function getSongById(id: string): Song | undefined {
  return mockLibrary.find((song) => song.id === id);
}

export function getRandomSongs(count: number): Song[] {
  const shuffled = [...mockLibrary].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getRecommendations(baseSong: Song, count: number = 5): Song[] {
  // Recommend songs from the same genre or mood
  const sameMood = mockLibrary.filter(
    (song) =>
      song.id !== baseSong.id &&
      (song.genre === baseSong.genre || song.mood === baseSong.mood)
  );
  
  if (sameMood.length >= count) {
    return sameMood.slice(0, count);
  }
  
  // If not enough, add random songs
  const remaining = count - sameMood.length;
  const others = mockLibrary.filter(
    (song) => song.id !== baseSong.id && !sameMood.includes(song)
  );
  const randomOthers = others.sort(() => Math.random() - 0.5).slice(0, remaining);
  
  return [...sameMood, ...randomOthers];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}


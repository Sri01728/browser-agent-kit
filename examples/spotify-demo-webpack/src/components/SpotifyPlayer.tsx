import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../data/mockMusic';
import './SpotifyPlayer.css';

export function SpotifyPlayer() {
  const { state, togglePlay, nextSong, previousSong, setVolume, dispatch } = usePlayer();
  const { currentSong, playing, volume, currentTime, queue } = state;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentSong) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = Math.floor(percent * currentSong.duration);
    dispatch({ type: 'SET_TIME', time: newTime });
  };

  const progressPercent = currentSong
    ? (currentTime / currentSong.duration) * 100
    : 0;

  return (
    <div className="spotify-player">
      {/* Album Art & Song Info */}
      <div className="player-main">
        <div className="album-art">
          {currentSong?.albumArt || '🎵'}
        </div>
        <div className="song-info">
          <h2 className="song-title">{currentSong?.title || 'No song playing'}</h2>
          <p className="song-artist">{currentSong?.artist || 'Select a song'}</p>
          <p className="song-album">{currentSong?.album || ''}</p>
          {currentSong && (
            <div className="song-meta">
              <span className="genre-badge">{currentSong.genre}</span>
              {currentSong.mood && (
                <span className="mood-badge">{currentSong.mood}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <span className="time-current">{formatDuration(currentTime)}</span>
        <div className="progress-bar" onClick={handleProgressClick}>
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="time-total">
          {currentSong ? formatDuration(currentSong.duration) : '0:00'}
        </span>
      </div>

      {/* Playback Controls */}
      <div className="controls">
        <button
          className="control-btn control-btn-secondary"
          onClick={previousSong}
          title="Previous"
        >
          ⏮️
        </button>
        <button
          className="control-btn control-btn-primary"
          onClick={togglePlay}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? '⏸️' : '▶️'}
        </button>
        <button
          className="control-btn control-btn-secondary"
          onClick={nextSong}
          title="Next"
        >
          ⏭️
        </button>
      </div>

      {/* Volume Control */}
      <div className="volume-section">
        <span className="volume-icon">🔊</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="volume-slider"
        />
        <span className="volume-value">{volume}%</span>
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="queue-section">
          <h3 className="queue-title">Up Next ({queue.length})</h3>
          <div className="queue-list">
            {queue.slice(0, 5).map((song, index) => (
              <div key={song.id} className="queue-item">
                <span className="queue-number">{index + 1}</span>
                <div className="queue-item-info">
                  <p className="queue-item-title">{song.title}</p>
                  <p className="queue-item-artist">{song.artist}</p>
                </div>
                <span className="queue-item-duration">
                  {formatDuration(song.duration)}
                </span>
              </div>
            ))}
            {queue.length > 5 && (
              <p className="queue-more">+ {queue.length - 5} more songs</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


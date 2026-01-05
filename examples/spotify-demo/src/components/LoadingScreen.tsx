import React from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  progress?: {
    status: string;
    file: string;
    progress: number;
  };
}

export function LoadingScreen({ progress }: LoadingScreenProps) {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <h2 className="loading-title">Loading AI Music Assistant...</h2>
        {progress && (
          <div className="loading-details">
            <p className="loading-status">{progress.status}</p>
            <div className="loading-bar">
              <div
                className="loading-bar-fill"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <p className="loading-message">
              {progress.progress < 100
                ? 'Downloading model (first time only, ~500MB)...'
                : 'Model ready!'}
            </p>
          </div>
        )}
        <p className="loading-hint">
          💡 Tip: The model is cached in your browser, so future loads will be instant!
        </p>
      </div>
    </div>
  );
}


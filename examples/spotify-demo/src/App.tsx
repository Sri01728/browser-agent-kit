import { useState, useEffect, useCallback } from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { SpotifyPlayer } from './components/SpotifyPlayer';
import { LoadingScreen } from './components/LoadingScreen';
import { createMusicAgent, type AgentProgress } from './agent/musicAgent';
import type { Agent, Message } from '@web-agent/core';
import type { ToolContext } from './tools/musicTools';
import './App.css';

function AppContent() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<AgentProgress | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const player = usePlayer();

  const initializeAgent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Create tool context from player
      const toolContext: ToolContext = {
        playSong: player.playSong,
        togglePlay: player.togglePlay,
        nextSong: player.nextSong,
        previousSong: player.previousSong,
        setVolume: player.setVolume,
        adjustVolume: player.adjustVolume,
        addToQueue: player.addToQueue,
        setQueue: player.setQueue,
        getCurrentSong: () => player.state.currentSong,
        isPlaying: () => player.state.playing,
        getVolume: () => player.state.volume,
        getQueue: () => player.state.queue,
      };

      const newAgent = await createMusicAgent(toolContext, setProgress);
      setAgent(newAgent);
      
      // Add welcome message
      setMessages([
        {
          role: 'assistant',
          content: '🎵 Hey there! I\'m your AI music assistant. I can help you play music, control volume, skip songs, create playlists, and more! Try saying "play some jazz" or "create a chill playlist".',
        },
      ]);
    } catch (err: any) {
      console.error('Failed to initialize agent:', err);
      setError(err.message || 'Failed to load AI agent');
    } finally {
      setLoading(false);
    }
  }, [player]);

  useEffect(() => {
    initializeAgent();
  }, [initializeAgent]);

  const handleSend = async () => {
    if (!input.trim() || !agent || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await agent.generate({
        messages: [...messages, userMessage],
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.text,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Failed to generate response:', err);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return <LoadingScreen progress={progress || undefined} />;
  }

  if (error) {
    return (
      <div className="error-screen">
        <h1>❌ Error</h1>
        <p>{error}</p>
        <button onClick={initializeAgent}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎵 Spotify AI Agent Demo</h1>
        <p>Control your music with natural language using browser-based AI</p>
      </header>

      <div className="app-content">
        {/* Chat Section */}
        <div className="chat-section">
          <div className="chat-header">
            <h2>💬 Chat with AI DJ</h2>
          </div>
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message message-${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {isProcessing && (
              <div className="message message-assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <span className="typing-indicator">●●●</span>
                </div>
              </div>
            )}
          </div>
          <div className="chat-input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Try: 'play some jazz' or 'turn it up'"
              className="chat-input"
              disabled={isProcessing}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="chat-send-btn"
            >
              ➤
            </button>
          </div>
          <div className="chat-suggestions">
            <p>Try these commands:</p>
            <button
              onClick={() => setInput('play some jazz')}
              className="suggestion-btn"
            >
              Play jazz
            </button>
            <button
              onClick={() => setInput('turn it up')}
              className="suggestion-btn"
            >
              Turn it up
            </button>
            <button
              onClick={() => setInput('create a chill playlist')}
              className="suggestion-btn"
            >
              Create playlist
            </button>
            <button
              onClick={() => setInput('next song')}
              className="suggestion-btn"
            >
              Next song
            </button>
          </div>
        </div>

        {/* Player Section */}
        <div className="player-section">
          <SpotifyPlayer />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
}

export default App;


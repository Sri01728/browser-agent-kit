import { useState, useEffect } from 'react';
import { Agent } from '@web-agent/core';
import { TransformersAdapter } from '@web-agent/transformers';
import { A2URenderer } from '@web-agent/ui-protocol';
import { createTool } from '@web-agent/core';
import { z } from 'zod';
import './App.css';

// Create a simple greeting tool
const greetingTool = createTool({
  id: 'greet_user',
  description: 'Greet a user by name',
  inputSchema: z.object({
    name: z.string().describe('The name of the user to greet'),
  }),
  outputSchema: z.object({
    greeting: z.string(),
  }),
  execute: async ({ name }) => {
    return {
      greeting: `Hello, ${name}! Welcome to the Web Agent Framework!`,
    };
  },
});

function App() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [prompt, setPrompt] = useState('Greet a user named Alice');
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Initialize the agent with Transformers.js
  useEffect(() => {
    const initAgent = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        setLoadingProgress('Creating Transformers.js adapter...');
        
        // Use Phi-3 mini - a small, fast model that works in the browser
        const adapter = new TransformersAdapter({
          modelPath: 'Xenova/Phi-3-mini-4k-instruct',
          useWebGPU: false, // Start with WASM for compatibility
          onProgress: (progress) => {
            if (progress.status === 'downloading') {
              setLoadingProgress(
                `Downloading model: ${progress.file} (${Math.round(progress.progress || 0)}%)`
              );
            } else if (progress.status === 'loading') {
              setLoadingProgress(`Loading model: ${progress.file}`);
            } else if (progress.status === 'ready') {
              setLoadingProgress('Model ready!');
            }
          },
        });

        setLoadingProgress('Initializing model...');
        await adapter.initialize();
        
        setLoadingProgress('Creating agent...');
        const newAgent = new Agent({
          id: 'transformers-agent',
          name: 'Browser AI Agent',
          instructions: 'You are a helpful AI assistant running entirely in the browser using Phi-3. Keep responses concise.',
          model: adapter,
          tools: [greetingTool],
        });

        setAgent(newAgent);
        setIsReady(true);
        setLoadingProgress('✅ Agent ready!');
      } catch (err) {
        console.error('Failed to initialize agent:', err);
        setError(`Failed to initialize: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };

    initAgent();
  }, []);

  const handleGenerate = async () => {
    if (!agent || !prompt.trim()) return;

    setIsGenerating(true);
    setResponse('');
    setError('');

    try {
      const result = await agent.generate(prompt);
      setResponse(result.text);

      // If there's UI in the response, render it
      if (result.ui) {
        const renderer = new A2URenderer();
        const container = document.getElementById('ui-output');
        if (container) {
          renderer.render(result.ui, container, {
            onAction: (action, componentId) => {
              console.log('Action triggered:', action, componentId);
            },
          });
        }
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🤖 Transformers.js + Web Agent Framework</h1>
          <p className="subtitle">
            AI Agent running Phi-3 entirely in your browser!
          </p>
        </header>

        {isLoading && (
          <div className="loading-card">
            <div className="spinner"></div>
            <p className="loading-text">{loadingProgress}</p>
            <p className="info-text">
              First load will download the model (~2GB). This happens once and is cached.
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="error-card">
            <h3>❌ Error</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {isReady && (
          <div className="demo-card">
            <div className="status-badge">
              <span className="status-dot"></span>
              Model: Phi-3-mini (Running in Browser)
            </div>

            <div className="input-section">
              <label htmlFor="prompt">Enter your prompt:</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask the agent something..."
                rows={3}
              />
              
              <button
                className="generate-btn"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? '🤔 Thinking...' : '✨ Generate'}
              </button>
            </div>

            {response && (
              <div className="response-card">
                <h3>Agent Response:</h3>
                <div className="response-text">{response}</div>
              </div>
            )}

            <div id="ui-output" className="ui-output"></div>

            <div className="info-section">
              <h3>How it works:</h3>
              <ol>
                <li>Phi-3 model loads in your browser via Transformers.js</li>
                <li>Agent processes your prompt locally (no server needed)</li>
                <li>Can call tools like <code>greet_user</code></li>
                <li>All inference happens on your device</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;


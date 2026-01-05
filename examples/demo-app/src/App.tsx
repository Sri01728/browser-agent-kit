import { useState } from 'react';
import { Agent } from '@web-agent/core';
import { A2URenderer } from '@web-agent/ui-protocol';
import { Modal, Tabs, Dropdown } from '@web-agent/react';
import { weatherTool, flightSearchTool } from './tools';
import './App.css';

function App() {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('demo');
  const [selectedModel, setSelectedModel] = useState('mock');
  const [agentResponse, setAgentResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Create a mock agent (since we don't have a real LLM in the demo)
  const agent = new Agent({
    id: 'demo-agent',
    name: 'Demo Agent',
    instructions: 'You are a helpful travel assistant. Help users find flights and check weather.',
    model: {
      generate: async (messages) => {
        // Mock response with A2U UI
        return {
          text: "I found some flights for you! Here's what I found:",
          ui: {
            type: 'ui' as const,
            version: '1.0',
            ui: {
              type: 'card',
              props: {
                title: 'Flight Results',
              },
              children: [
                {
                  type: 'text',
                  props: {
                    content: 'Here are the available flights:',
                  },
                },
                {
                  type: 'list',
                  props: {
                    ordered: false,
                  },
                  children: [
                    {
                      type: 'text',
                      props: {
                        content: '✈️ Flight AA123: $299 - Departs 9:00 AM',
                      },
                    },
                    {
                      type: 'text',
                      props: {
                        content: '✈️ Flight UA456: $349 - Departs 2:00 PM',
                      },
                    },
                    {
                      type: 'text',
                      props: {
                        content: '✈️ Flight DL789: $279 - Departs 6:00 PM',
                      },
                    },
                  ],
                },
                {
                  type: 'button',
                  props: {
                    label: 'Book Flight',
                    variant: 'primary',
                  },
                  actions: [
                    {
                      type: 'call_tool',
                      params: {
                        tool: 'book_flight',
                      },
                    },
                  ],
                },
              ],
            },
          },
        };
      },
    } as any,
    tools: [weatherTool, flightSearchTool],
  });

  const handleGenerateUI = async () => {
    setIsLoading(true);
    setAgentResponse('');

    try {
      // Simulate agent thinking time
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await agent.generate('Show me flights to Paris');
      
      if (response.ui) {
        // Render the UI
        const renderer = new A2URenderer();
        const container = document.getElementById('agent-ui-output');
        if (container) {
          renderer.render(response.ui, container, {
            onAction: (action, componentId) => {
              console.log('Action triggered:', action, componentId);
              setAgentResponse(`Action triggered: ${action.type}`);
            },
          });
        }
      }

      setAgentResponse(response.text);
    } catch (error) {
      setAgentResponse(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🤖 Web Agent Framework</h1>
          <p className="subtitle">
            AI agents that control your UI dynamically using the A2U protocol
          </p>
        </header>

        <Tabs
          tabs={[
            {
              id: 'demo',
              label: '🎯 Live Demo',
              content: (
                <div className="tab-content">
                  <div className="demo-section">
                    <h2>Agent-Controlled UI Demo</h2>
                    <p>
                      Watch as the AI agent dynamically generates and renders UI components
                      using the A2U protocol. No manual UI code required!
                    </p>

                    <div className="controls">
                      <Dropdown
                        label={`Model: ${selectedModel}`}
                        options={[
                          { id: 'mock', label: 'Mock Agent (Demo)' },
                          { id: 'phi3', label: 'Phi-3 (Browser)' },
                          { id: 'llama', label: 'Llama 3 (Browser)' },
                        ]}
                        onSelect={(id) => setSelectedModel(id)}
                      />

                      <button
                        className="generate-btn"
                        onClick={handleGenerateUI}
                        disabled={isLoading}
                      >
                        {isLoading ? '🤔 Thinking...' : '✨ Generate UI'}
                      </button>

                      <button
                        className="info-btn"
                        onClick={() => setShowModal(true)}
                      >
                        ℹ️ How it works
                      </button>
                    </div>

                    {agentResponse && (
                      <div className="response-text">
                        <strong>Agent:</strong> {agentResponse}
                      </div>
                    )}

                    <div id="agent-ui-output" className="ui-output"></div>
                  </div>
                </div>
              ),
            },
            {
              id: 'features',
              label: '✨ Features',
              content: (
                <div className="tab-content">
                  <h2>Framework Features</h2>
                  <div className="features-grid">
                    <div className="feature-card">
                      <h3>🎨 Agent-Controlled UI</h3>
                      <p>Agents dynamically render UI components using the A2U protocol</p>
                    </div>
                    <div className="feature-card">
                      <h3>🌐 Browser-Based LLMs</h3>
                      <p>Run Phi-3, Llama, Mistral, Gemma entirely in the browser</p>
                    </div>
                    <div className="feature-card">
                      <h3>⚡ Zero Configuration</h3>
                      <p>Works out of the box with sensible defaults</p>
                    </div>
                    <div className="feature-card">
                      <h3>🔒 Secure by Default</h3>
                      <p>XSS prevention, input validation, and API proxying</p>
                    </div>
                    <div className="feature-card">
                      <h3>♿ Accessible</h3>
                      <p>WCAG 2.1 AA compliant with full ARIA support</p>
                    </div>
                    <div className="feature-card">
                      <h3>📦 9 UI Components</h3>
                      <p>Button, Card, Text, List, Input, Form, Modal, Tabs, Dropdown</p>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              id: 'code',
              label: '💻 Code Example',
              content: (
                <div className="tab-content">
                  <h2>Quick Start</h2>
                  <pre className="code-block">
{`// Create an agent
const agent = new Agent({
  model: new TransformersAdapter({
    modelPath: 'Xenova/Phi-3-mini-4k-instruct'
  }),
  instructions: 'Help users find flights',
  tools: [searchFlights, bookFlight]
});

// Agent generates UI automatically
const response = await agent.generate(
  "Show me flights to Paris"
);

// Render the agent-controlled UI
if (response.ui) {
  renderer.render(response.ui, container);
  // Agent just controlled your UI! 🎉
}`}
                  </pre>
                </div>
              ),
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <footer className="footer">
          <p>
            Built with ❤️ using the Web Agent Framework •{' '}
            <a href="https://github.com/your-org/web-agent-framework" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </p>
        </footer>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="How It Works"
      >
        <div className="modal-content">
          <h3>🎯 The A2U Protocol</h3>
          <p>
            The Agent-to-UI (A2U) protocol allows AI agents to dynamically generate
            and control UI components without writing manual UI code.
          </p>

          <h3>🔄 The Flow</h3>
          <ol>
            <li>User asks: "Show me flights to Paris"</li>
            <li>Agent calls the search tool</li>
            <li>Agent generates A2U JSON describing the UI</li>
            <li>Framework renders the UI components</li>
            <li>User interacts with the UI</li>
            <li>Actions trigger agent callbacks</li>
          </ol>

          <h3>✨ Benefits</h3>
          <ul>
            <li>No manual UI code required</li>
            <li>Dynamic, context-aware interfaces</li>
            <li>Consistent, accessible components</li>
            <li>Agent has full control</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
}

export default App;


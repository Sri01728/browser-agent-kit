/**
 * Transformers.js Chat Component
 * 
 * Demonstrates how simple it is to use Transformers.js with our framework.
 * 
 * How it works:
 * 1. Select a model (GPT-2, Gemma, etc.)
 * 2. Click "Load Model" - downloads and initializes the model
 * 3. Start chatting - send messages and get AI responses
 * 
 * All running entirely in your browser! No server needed.
 */

import { useState } from 'react';
import { useTransformersAgent, AVAILABLE_MODELS } from './transformers-chat/useTransformersAgent';
import { ModelSelector } from './transformers-chat/ModelSelector';
import { ModelStatus } from './transformers-chat/ModelStatus';
import { LoadModelButton } from './transformers-chat/LoadModelButton';
import { WelcomeMessage } from './transformers-chat/WelcomeMessage';
import { MessageList } from './transformers-chat/MessageList';
import { MessageInput } from './transformers-chat/MessageInput';

export function TransformersChat() {
  const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0].id);
  const [input, setInput] = useState('');

  // Use our custom hook - this handles all the Transformers.js logic
  const {
    agent,
    messages,
    isLoading,
    loadProgress,
    currentModel,
    loadModel,
    sendMessage,
    clearMessages,
  } = useTransformersAgent(selectedModel);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="transformers-chat" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      background: 'white',
    }}>
      {/* Header with model selector */}
      <div className="panel-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #e0e0e0',
        background: '#f5f5f5',
      }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>🤖 Transformers.js Chat</h2>
        <ModelSelector
          selectedModel={selectedModel}
          models={AVAILABLE_MODELS}
          onChange={(modelId) => setSelectedModel(modelId)}
          disabled={isLoading || (agent?.isGenerating ?? false)}
        />
      </div>

      {/* Model status indicator */}
      <ModelStatus
        isReady={agent?.isReady ?? false}
        isLoading={isLoading}
        loadProgress={loadProgress}
        modelName={currentModel?.name}
        error={agent?.error ?? null}
      />

      {/* Load model button (shown when model not loaded) */}
      {agent && !agent.isReady && (
        <LoadModelButton onClick={loadModel} isLoading={isLoading} />
      )}

      {/* Messages list */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 && agent?.isReady && currentModel && (
          <WelcomeMessage modelName={currentModel.name} />
        )}
        <MessageList messages={messages} isGenerating={agent?.isGenerating ?? false} />
      </div>

      {/* Message input (shown when model is ready) */}
      {agent?.isReady && (
        <MessageInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onReset={clearMessages}
          disabled={!agent.isReady}
          isGenerating={agent.isGenerating}
        />
      )}
    </div>
  );
}

/**
 * AgentChat Component
 *
 * Pre-built chat interface for agent interactions.
 *
 * @example Basic Usage
 * ```tsx
 * import { AgentChat } from '@web-agent/react';
 *
 * function App() {
 *   return <AgentChat agent={myAgent} title="AI Assistant" />;
 * }
 * ```
 *
 * @example With Custom Styling
 * ```tsx
 * <AgentChat
 *   agent={agent}
 *   className="my-chat"
 *   style={{ '--agent-chat-bg': '#1a1a2e' }}
 *   classNames={{
 *     message: 'custom-message',
 *     userMessage: 'user-bubble',
 *     assistantMessage: 'assistant-bubble'
 *   }}
 * />
 * ```
 *
 * @module components/AgentChat
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAgent } from '../hooks/use-agent';
import { useAgentStream } from '../hooks/use-agent-stream';
import { A2UComponent } from './A2UComponent';
import type { AgentChatProps, ChatMessage } from '../types';

/**
 * Default CSS styles as CSS custom properties.
 *
 * Users can override these by setting CSS variables:
 * - --agent-chat-bg: Background color
 * - --agent-chat-text: Text color
 * - --agent-chat-user-bg: User message background
 * - --agent-chat-assistant-bg: Assistant message background
 * - --agent-chat-input-bg: Input field background
 * - --agent-chat-input-border: Input field border color
 * - --agent-chat-button-bg: Send button background
 * - --agent-chat-button-text: Send button text color
 * - --agent-chat-radius: Border radius
 * - --agent-chat-spacing: Base spacing unit
 */
const defaultStyles = `
  .agent-chat {
    --agent-chat-bg: #ffffff;
    --agent-chat-text: #1a1a1a;
    --agent-chat-user-bg: #007bff;
    --agent-chat-user-text: #ffffff;
    --agent-chat-assistant-bg: #f0f0f0;
    --agent-chat-assistant-text: #1a1a1a;
    --agent-chat-input-bg: #ffffff;
    --agent-chat-input-border: #e0e0e0;
    --agent-chat-button-bg: #007bff;
    --agent-chat-button-text: #ffffff;
    --agent-chat-radius: 8px;
    --agent-chat-spacing: 1rem;

    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--agent-chat-bg);
    color: var(--agent-chat-text);
    font-family: system-ui, -apple-system, sans-serif;
  }

  .agent-chat__header {
    padding: var(--agent-chat-spacing);
    border-bottom: 1px solid var(--agent-chat-input-border);
    font-weight: 600;
    font-size: 1.125rem;
  }

  .agent-chat__messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--agent-chat-spacing);
    display: flex;
    flex-direction: column;
    gap: var(--agent-chat-spacing);
  }

  .agent-chat__message {
    max-width: 80%;
    padding: calc(var(--agent-chat-spacing) * 0.75) var(--agent-chat-spacing);
    border-radius: var(--agent-chat-radius);
    word-wrap: break-word;
  }

  .agent-chat__message--user {
    align-self: flex-end;
    background: var(--agent-chat-user-bg);
    color: var(--agent-chat-user-text);
  }

  .agent-chat__message--assistant {
    align-self: flex-start;
    background: var(--agent-chat-assistant-bg);
    color: var(--agent-chat-assistant-text);
  }

  .agent-chat__message-ui {
    margin-top: calc(var(--agent-chat-spacing) * 0.5);
  }

  .agent-chat__streaming {
    align-self: flex-start;
    background: var(--agent-chat-assistant-bg);
    color: var(--agent-chat-assistant-text);
    padding: calc(var(--agent-chat-spacing) * 0.75) var(--agent-chat-spacing);
    border-radius: var(--agent-chat-radius);
    max-width: 80%;
    opacity: 0.8;
  }

  .agent-chat__loading {
    align-self: flex-start;
    color: var(--agent-chat-text);
    opacity: 0.6;
    font-style: italic;
  }

  .agent-chat__error {
    padding: var(--agent-chat-spacing);
    background: #fee2e2;
    color: #dc2626;
    border-radius: var(--agent-chat-radius);
    margin: var(--agent-chat-spacing);
  }

  .agent-chat__input-container {
    display: flex;
    gap: calc(var(--agent-chat-spacing) * 0.5);
    padding: var(--agent-chat-spacing);
    border-top: 1px solid var(--agent-chat-input-border);
  }

  .agent-chat__input {
    flex: 1;
    padding: calc(var(--agent-chat-spacing) * 0.75) var(--agent-chat-spacing);
    border: 1px solid var(--agent-chat-input-border);
    border-radius: var(--agent-chat-radius);
    background: var(--agent-chat-input-bg);
    color: var(--agent-chat-text);
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
  }

  .agent-chat__input:focus {
    border-color: var(--agent-chat-button-bg);
  }

  .agent-chat__send {
    padding: calc(var(--agent-chat-spacing) * 0.75) var(--agent-chat-spacing);
    background: var(--agent-chat-button-bg);
    color: var(--agent-chat-button-text);
    border: none;
    border-radius: var(--agent-chat-radius);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .agent-chat__send:hover:not(:disabled) {
    opacity: 0.9;
  }

  .agent-chat__send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * Inject styles into document head (once).
 */
let stylesInjected = false;
function injectStyles(): void {
  if (stylesInjected || typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.setAttribute('data-agent-chat', 'true');
  style.textContent = defaultStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

/**
 * Default message renderer.
 */
function DefaultMessage({
  message,
  classNames,
}: {
  message: ChatMessage;
  classNames?: AgentChatProps['classNames'];
}): JSX.Element {
  const baseClass = 'agent-chat__message';
  const roleClass = message.role === 'user'
    ? 'agent-chat__message--user'
    : 'agent-chat__message--assistant';
  const customClass = message.role === 'user'
    ? classNames?.userMessage
    : classNames?.assistantMessage;

  return (
    <div
      className={`${baseClass} ${roleClass} ${classNames?.message || ''} ${customClass || ''}`}
      data-testid={`message-${message.role}`}
    >
      <div className="agent-chat__message-content">{message.content}</div>
      {message.ui && (
        <div className="agent-chat__message-ui">
          <A2UComponent component={message.ui} />
        </div>
      )}
    </div>
  );
}

/**
 * AgentChat component.
 *
 * A complete chat interface for agent interactions with built-in
 * message display, input handling, and A2U component rendering.
 *
 * @param props - Component props
 * @returns React element
 *
 * @example With All Options
 * ```tsx
 * <AgentChat
 *   agent={agent}
 *   title="Flight Assistant"
 *   placeholder="Ask about flights..."
 *   streaming={true}
 *   memory={{ resource: 'user-123', thread: 'chat-1' }}
 *   onSend={(msg) => analytics.track('message_sent')}
 *   onResponse={(msg) => analytics.track('response_received')}
 * />
 * ```
 */
export function AgentChat({
  agent,
  memory,
  initialMessages,
  placeholder = 'Type a message...',
  title,
  streaming = true,
  className,
  style,
  classNames,
  renderMessage,
  onSend,
  onResponse,
}: AgentChatProps): JSX.Element {
  // Inject default styles
  useEffect(() => {
    injectStyles();
  }, []);

  // State
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use streaming or non-streaming hook based on prop
  const streamHook = useAgentStream({
    agent,
    memory,
    initialMessages,
    onSend,
    onResponse,
  });

  const nonStreamHook = useAgent({
    agent,
    memory,
    initialMessages,
    onSend,
    onResponse,
  });

  const hook = streaming ? streamHook : nonStreamHook;
  const { messages, sendMessage, isLoading, error, clearError } = hook;
  const partialResponse = streaming ? streamHook.partialResponse : '';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    // Check if scrollIntoView is available (not available in some test environments)
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, partialResponse]);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      sendMessage(input);
      setInput('');
    },
    [input, isLoading, sendMessage]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    },
    []
  );

  // Handle key press (Enter to send)
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit]
  );

  return (
    <div
      className={`agent-chat ${classNames?.container || ''} ${className || ''}`}
      style={style}
      data-testid="agent-chat"
    >
      {title && (
        <div className={`agent-chat__header ${classNames?.header || ''}`}>
          {title}
        </div>
      )}

      <div className={`agent-chat__messages ${classNames?.messageList || ''}`}>
        {messages.map((message) =>
          renderMessage ? (
            <div key={message.id}>{renderMessage(message)}</div>
          ) : (
            <DefaultMessage
              key={message.id}
              message={message}
              classNames={classNames}
            />
          )
        )}

        {partialResponse && (
          <div className="agent-chat__streaming">{partialResponse}</div>
        )}

        {isLoading && !partialResponse && (
          <div className="agent-chat__loading">Thinking...</div>
        )}

        {error && (
          <div className="agent-chat__error" onClick={clearError}>
            Error: {error.message}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="agent-chat__input-container" onSubmit={handleSubmit}>
        <input
          type="text"
          className={`agent-chat__input ${classNames?.input || ''}`}
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isLoading}
          data-testid="chat-input"
        />
        <button
          type="submit"
          className={`agent-chat__send ${classNames?.sendButton || ''}`}
          disabled={isLoading || !input.trim()}
          data-testid="send-button"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default AgentChat;


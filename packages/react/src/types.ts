/**
 * React Integration Type Definitions
 *
 * Types for React hooks and components.
 *
 * @example
 * ```typescript
 * import { useAgent } from '@web-agent/react';
 * import type { ChatMessage, UseAgentReturn } from '@web-agent/react';
 *
 * function ChatApp() {
 *   const { messages, sendMessage, isLoading }: UseAgentReturn = useAgent({ agent });
 *
 *   return (
 *     <div>
 *       {messages.map((msg: ChatMessage) => (
 *         <div key={msg.id}>{msg.content}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @module react/types
 */

import type { A2UComponent, A2UAction } from '@web-agent/ui-protocol/a2u';
import type { Agent, AgentGenerateOptions, MemoryContext } from '@web-agent/core';

// =============================================================================
// Chat Message Types
// =============================================================================

/**
 * Role of a message sender.
 */
export type MessageRole = 'user' | 'assistant';

/**
 * Chat message in a conversation.
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** Message sender role */
  role: MessageRole;
  /** Text content */
  content: string;
  /** Rendered UI component (if any) */
  ui?: A2UComponent;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Tool calls made during this message (assistant only) */
  toolCalls?: Array<{
    tool: string;
    input: unknown;
    output: unknown;
  }>;
}

// =============================================================================
// Hook Return Types
// =============================================================================

/**
 * Return type for the useAgent hook.
 */
export interface UseAgentReturn {
  /** Message history */
  messages: ChatMessage[];
  /** Send a message to the agent */
  sendMessage: (message: string) => Promise<void>;
  /** Whether the agent is currently generating */
  isLoading: boolean;
  /** Error from the last operation */
  error: Error | null;
  /** Clear the error state */
  clearError: () => void;
  /** Clear all messages */
  clearMessages: () => void;
}

/**
 * Return type for the useAgentStream hook.
 */
export interface UseAgentStreamReturn extends UseAgentReturn {
  /** Current partial response (during streaming) */
  partialResponse: string;
  /** Stop the current generation */
  stop: () => void;
  /** Whether generation was stopped */
  isStopped: boolean;
}

// =============================================================================
// Hook Configuration Types
// =============================================================================

/**
 * Configuration for useAgent hook.
 */
export interface UseAgentConfig {
  /** Agent instance to use */
  agent: Agent;
  /** Initial messages (optional) */
  initialMessages?: ChatMessage[];
  /** Memory context for conversation */
  memory?: MemoryContext;
  /** Generation options */
  options?: Omit<AgentGenerateOptions, 'memory'>;
  /** Callback when a message is sent */
  onSend?: (message: ChatMessage) => void;
  /** Callback when a response is received */
  onResponse?: (message: ChatMessage) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Configuration for useAgentStream hook.
 */
export interface UseAgentStreamConfig extends UseAgentConfig {
  /** Callback for each streamed chunk */
  onChunk?: (chunk: string) => void;
  /** Callback when streaming completes */
  onComplete?: (message: ChatMessage) => void;
}

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * Props for AgentChat component.
 */
export interface AgentChatProps {
  /** Agent instance */
  agent: Agent;
  /** Memory context */
  memory?: MemoryContext;
  /** Initial messages */
  initialMessages?: ChatMessage[];
  /** Placeholder text for input */
  placeholder?: string;
  /** Title for the chat header */
  title?: string;
  /** Whether to use streaming */
  streaming?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Custom class names for sub-elements */
  classNames?: {
    container?: string;
    header?: string;
    messageList?: string;
    message?: string;
    userMessage?: string;
    assistantMessage?: string;
    input?: string;
    sendButton?: string;
  };
  /** Custom render for messages */
  renderMessage?: (message: ChatMessage) => React.ReactNode;
  /** Callback when a message is sent */
  onSend?: (message: ChatMessage) => void;
  /** Callback when a response is received */
  onResponse?: (message: ChatMessage) => void;
}

/**
 * Props for A2UComponent wrapper.
 */
export interface A2UComponentProps {
  /** A2U component to render */
  component: A2UComponent;
  /** Callback for actions */
  onAction?: (action: A2UAction, componentId?: string) => void;
  /** Custom class name */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

// Re-export A2U types for convenience
export type { A2UComponent, A2UAction } from '@web-agent/ui-protocol/a2u';


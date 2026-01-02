/**
 * useAgent Hook
 *
 * React hook for integrating agents with automatic state management.
 *
 * @example Basic Usage
 * ```typescript
 * import { useAgent } from '@web-agent/react';
 *
 * function ChatApp({ agent }) {
 *   const { messages, sendMessage, isLoading, error } = useAgent({ agent });
 *
 *   return (
 *     <div>
 *       {messages.map(msg => (
 *         <div key={msg.id}>{msg.content}</div>
 *       ))}
 *       {isLoading && <div>Loading...</div>}
 *       <button onClick={() => sendMessage('Hello!')}>Send</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @module hooks/use-agent
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ChatMessage,
  UseAgentReturn,
  UseAgentConfig,
} from '../types';

/**
 * Generate a unique message ID.
 */
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * React hook for agent integration.
 *
 * Provides state management for messages, loading state, and error handling.
 *
 * @param config - Hook configuration
 * @returns Hook state and methods
 *
 * @example With Memory Context
 * ```typescript
 * const { messages, sendMessage } = useAgent({
 *   agent,
 *   memory: { resource: 'user-123', thread: 'chat-1' },
 *   onResponse: (msg) => console.log('Agent responded:', msg.content)
 * });
 * ```
 */
export function useAgent(config: UseAgentConfig): UseAgentReturn {
  const { agent, initialMessages = [], memory, options, onSend, onResponse, onError } = config;

  // State
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Ref to track if component is mounted
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Send a message to the agent.
   */
  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim()) return;

      // Create user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      // Add user message to state
      setMessages((prev) => [...prev, userMessage]);
      setError(null);
      setIsLoading(true);

      // Notify callback
      onSend?.(userMessage);

      try {
        // Generate response from agent
        const result = await agent.generate(content, {
          memory,
          ...options,
        });

        // Check if still mounted
        if (!mountedRef.current) return;

        // Create assistant message
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: result.text,
          ui: result.ui,
          timestamp: Date.now(),
          toolCalls: result.toolCalls,
        };

        // Add assistant message to state
        setMessages((prev) => [...prev, assistantMessage]);

        // Notify callback
        onResponse?.(assistantMessage);
      } catch (err) {
        // Check if still mounted
        if (!mountedRef.current) return;

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [agent, memory, options, onSend, onResponse, onError]
  );

  /**
   * Clear the error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear all messages.
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearError,
    clearMessages,
  };
}


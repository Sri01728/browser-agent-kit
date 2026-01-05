/**
 * useAgentStream Hook
 *
 * React hook for streaming agent responses with requestAnimationFrame batching.
 *
 * @example Basic Usage
 * ```typescript
 * import { useAgentStream } from '@web-agent/react';
 *
 * function StreamingChat({ agent }) {
 *   const { messages, sendMessage, partialResponse, isLoading, stop } = useAgentStream({ agent });
 *
 *   return (
 *     <div>
 *       {messages.map(msg => <Message key={msg.id} {...msg} />)}
 *       {partialResponse && <div className="streaming">{partialResponse}</div>}
 *       {isLoading && <button onClick={stop}>Stop</button>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @module hooks/use-agent-stream
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ChatMessage,
  UseAgentStreamReturn,
  UseAgentStreamConfig,
} from '../types';

/**
 * Generate a unique message ID.
 */
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * React hook for streaming agent responses.
 *
 * Uses requestAnimationFrame batching for efficient DOM updates during streaming.
 *
 * @param config - Hook configuration
 * @returns Hook state and methods including stop() and partialResponse
 *
 * @example With Callbacks
 * ```typescript
 * const { messages, sendMessage, partialResponse } = useAgentStream({
 *   agent,
 *   onChunk: (chunk) => console.log('Received chunk:', chunk),
 *   onComplete: (msg) => console.log('Complete:', msg.content)
 * });
 * ```
 */
export function useAgentStream(config: UseAgentStreamConfig): UseAgentStreamReturn {
  const {
    agent,
    initialMessages = [],
    memory,
    options,
    onSend,
    onResponse,
    onError,
    onChunk,
    onComplete,
  } = config;

  // State
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [partialResponse, setPartialResponse] = useState('');
  const [isStopped, setIsStopped] = useState(false);

  // Refs
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingTextRef = useRef('');

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  /**
   * Batch update partial response using requestAnimationFrame.
   */
  const scheduleUpdate = useCallback(() => {
    if (rafIdRef.current !== null) return; // Already scheduled

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (mountedRef.current) {
        setPartialResponse(pendingTextRef.current);
      }
    });
  }, []);

  /**
   * Stop the current generation.
   */
  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStopped(true);
    setIsLoading(false);
  }, []);

  /**
   * Send a message and stream the response.
   */
  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim()) return;

      // Reset state
      setIsStopped(false);
      setPartialResponse('');
      pendingTextRef.current = '';

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

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

      let fullText = '';
      let ui: ChatMessage['ui'] = undefined;
      let toolCalls: ChatMessage['toolCalls'] = undefined;

      try {
        // Stream response from agent
        const stream = agent.stream(content, {
          memory,
          ...options,
        });

        for await (const chunk of stream) {
          // Check if stopped or unmounted
          if (!mountedRef.current || isStopped) break;

          if (chunk.type === 'text' && chunk.text) {
            fullText += chunk.text;
            pendingTextRef.current = fullText;

            // Batch update with requestAnimationFrame
            scheduleUpdate();

            // Notify chunk callback
            onChunk?.(chunk.text);
          }

          if (chunk.type === 'tool_call' && chunk.toolCall) {
            // Tool calls are handled internally by the agent
          }

          if (chunk.type === 'done' && chunk.done) {
            ui = chunk.done.ui;
            toolCalls = chunk.done.toolCalls;
          }
        }

        // Check if still mounted and not stopped
        if (!mountedRef.current || isStopped) return;

        // Create assistant message
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: fullText,
          ui,
          timestamp: Date.now(),
          toolCalls,
        };

        // Add assistant message to state
        setMessages((prev) => [...prev, assistantMessage]);
        setPartialResponse('');

        // Notify callbacks
        onResponse?.(assistantMessage);
        onComplete?.(assistantMessage);
      } catch (err) {
        // Check if it's an abort error
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        // Check if still mounted
        if (!mountedRef.current) return;

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          abortControllerRef.current = null;
        }
      }
    },
    [agent, memory, options, onSend, onResponse, onError, onChunk, onComplete, scheduleUpdate, isStopped]
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
    setPartialResponse('');
    pendingTextRef.current = '';
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearError,
    clearMessages,
    partialResponse,
    stop,
    isStopped,
  };
}


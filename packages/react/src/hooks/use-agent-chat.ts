/**
 * useAgentChat - AI SDK UI compatible chat hook
 *
 * Designed to work similarly to AI SDK's useChat() hook,
 * but runs entirely in the browser with local LLMs.
 *
 * @example Basic Usage
 * ```tsx
 * import { useAgentChat } from '@web-agent/react';
 *
 * function Chat() {
 *   const { messages, input, handleInputChange, handleSubmit, isLoading } = useAgentChat({
 *     persona: 'You are a helpful assistant.',
 *   });
 *
 *   return (
 *     <div>
 *       {messages.map(m => <div key={m.id}>{m.content}</div>)}
 *       <form onSubmit={handleSubmit}>
 *         <input value={input} onChange={handleInputChange} />
 *         <button type="submit" disabled={isLoading}>Send</button>
 *       </form>
 *     </div>
 *   );
 * }
 * ```
 *
 * @module hooks/use-agent-chat
 */

import { useState, useCallback, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import type { A2UResponse } from '@web-agent/ui-protocol/a2u';
import { useWebAgentContext } from '../context/WebAgentProvider';

// =============================================================================
// Types (AI SDK UI compatible)
// =============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt?: Date;
  ui?: A2UResponse;
}

export interface UseAgentChatOptions {
  /** System prompt / persona for the agent */
  persona: string;
  /** Initial messages */
  initialMessages?: Message[];
  /** Model path override */
  modelPath?: string;
  /** Called when a message is received */
  onFinish?: (message: Message) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Called when A2U UI is generated */
  onUI?: (ui: A2UResponse) => void;
  /** Custom headers (for API compatibility, not used locally) */
  headers?: Record<string, string>;
  /** Custom body (for API compatibility, not used locally) */
  body?: Record<string, unknown>;
}

export interface UseAgentChatReturn {
  /** Current messages */
  messages: Message[];
  /** Current input value */
  input: string;
  /** Set input value */
  setInput: (input: string) => void;
  /** Handle input change (for controlled inputs) */
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Handle form submission */
  handleSubmit: (e?: FormEvent<HTMLFormElement>) => void;
  /** Send a message programmatically */
  append: (message: Omit<Message, 'id' | 'createdAt'>) => Promise<void>;
  /** Is the agent currently generating */
  isLoading: boolean;
  /** Stop generation (not yet implemented for local LLMs) */
  stop: () => void;
  /** Reload the last message */
  reload: () => Promise<void>;
  /** Clear all messages */
  setMessages: (messages: Message[]) => void;
  /** Current error */
  error: Error | undefined;
  /** Model loading status */
  status: 'idle' | 'loading' | 'ready' | 'error';
  /** Load the model */
  loadModel: () => Promise<void>;
}

// =============================================================================
// Hook Implementation
// =============================================================================

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useAgentChat(options: UseAgentChatOptions): UseAgentChatReturn {
  const {
    persona,
    initialMessages = [],
    modelPath,
    onFinish,
    onError,
    onUI,
  } = options;

  const context = useWebAgentContext();

  // State
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  // Refs
  const llmRef = useRef<any>(null);
  const abortRef = useRef(false);

  // Build system prompt
  const systemPrompt = `${persona}

You respond with JSON in \`\`\`json blocks using this format:
{"version":"1.0","type":"ui","ui":{"type":"card","props":{"title":"Title"},"children":[{"type":"text","props":{"content":"Your message"}}]}}

Available components:
- card: {"type":"card","props":{"title":"Title"},"children":[...]}
- text: {"type":"text","props":{"content":"Message"}}
- button: {"type":"button","props":{"label":"Click"},"actions":[{"type":"call_tool","params":{"tool":"action"}}]}

Rules: Only output JSON in \`\`\`json blocks. Use double quotes. No trailing commas.`;

  // Parse A2U from response
  const parseA2U = (response: string): A2UResponse | null => {
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) return null;

      let jsonStr = jsonMatch[1]
        .replace(/\n/g, ' ')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/'/g, '"')
        .trim();

      return JSON.parse(jsonStr) as A2UResponse;
    } catch {
      return null;
    }
  };

  // Load model
  const loadModel = useCallback(async () => {
    if (status === 'loading' || status === 'ready') return;

    setStatus('loading');
    setError(undefined);

    try {
      if (!('gpu' in navigator)) {
        throw new Error('WebGPU not supported. Use Chrome 113+ or Edge 113+.');
      }

      const { FilesetResolver, LlmInference } = await import('@mediapipe/tasks-genai');

      const genaiFileset = await FilesetResolver.forGenAiTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
      );

      const resolvedPath = modelPath || context.config.defaultModel || '/models/gemma-2b-it-gpu-int4.bin';

      llmRef.current = await LlmInference.createFromOptions(genaiFileset, {
        baseOptions: { modelAssetPath: resolvedPath },
        maxTokens: 2048,
        topK: 40,
        temperature: 0.7,
        randomSeed: 101,
      });

      setStatus('ready');
      context.log('Model loaded successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setStatus('error');
      onError?.(error);
    }
  }, [status, modelPath, context, onError]);

  // Generate response
  const generateResponse = useCallback(async (userMessage: string): Promise<void> => {
    if (!llmRef.current) {
      await loadModel();
      if (!llmRef.current) {
        throw new Error('Failed to load model');
      }
    }

    setIsLoading(true);
    abortRef.current = false;

    // Add user message
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: userMessage,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Build prompt with history
      const historyStr = messages
        .slice(-20) // Keep last 20 messages for context
        .map((m) => `<start_of_turn>${m.role === 'user' ? 'user' : 'model'}\n${m.content}<end_of_turn>`)
        .join('\n');

      const prompt = `${systemPrompt}\n${historyStr}\n<start_of_turn>user\n${userMessage}<end_of_turn>\n<start_of_turn>model\n`;

      let fullResponse = '';

      await new Promise<void>((resolve, reject) => {
        llmRef.current.generateResponse(prompt, (partial: string, complete: boolean) => {
          if (abortRef.current) {
            resolve();
            return;
          }
          fullResponse += partial;
          if (complete) resolve();
        }).catch(reject);
      });

      // Parse A2U
      const ui = parseA2U(fullResponse);
      if (ui) {
        onUI?.(ui);
      }

      // Add assistant message
      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: fullResponse,
        createdAt: new Date(),
        ui: ui || undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      onFinish?.(assistantMsg);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [messages, systemPrompt, loadModel, onFinish, onError, onUI]);

  // Handle input change
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    (e?: FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      if (!input.trim() || isLoading) return;

      const message = input;
      setInput('');
      generateResponse(message);
    },
    [input, isLoading, generateResponse]
  );

  // Append message programmatically
  const append = useCallback(
    async (message: Omit<Message, 'id' | 'createdAt'>) => {
      if (message.role === 'user') {
        await generateResponse(message.content);
      } else {
        setMessages((prev) => [
          ...prev,
          { ...message, id: generateId(), createdAt: new Date() },
        ]);
      }
    },
    [generateResponse]
  );

  // Stop generation
  const stop = useCallback(() => {
    abortRef.current = true;
    setIsLoading(false);
  }, []);

  // Reload last message
  const reload = useCallback(async () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      // Remove last assistant message
      setMessages((prev) => {
        const lastAssistantIndex = prev.map((m) => m.role).lastIndexOf('assistant');
        if (lastAssistantIndex > -1) {
          return prev.slice(0, lastAssistantIndex);
        }
        return prev;
      });
      await generateResponse(lastUserMessage.content);
    }
  }, [messages, generateResponse]);

  return {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
    stop,
    reload,
    setMessages,
    error,
    status,
    loadModel,
  };
}


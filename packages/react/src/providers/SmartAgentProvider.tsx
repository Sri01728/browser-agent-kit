/**
 * SmartAgentProvider - Automatic context-aware AI for React apps
 * 
 * Wrap your components to give the AI automatic access to:
 * - Registered data from child components
 * - Visible DOM content (text, forms, tables)
 * 
 * @example
 * ```tsx
 * <SmartAgentProvider persona="Shopping assistant">
 *   <ProductList />
 *   <ShoppingCart />
 *   <AIChat />
 * </SmartAgentProvider>
 * ```
 */

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
  type ReactNode,
} from 'react';

// Types
export interface RegisteredData {
  [key: string]: any;
}

export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  ui?: any;
  timestamp?: number;
}

export interface SmartAgentContextValue {
  // Agent state
  isReady: boolean;
  isLoading: boolean;
  status: 'idle' | 'loading-model' | 'ready' | 'thinking' | 'error';
  messages: ChatMessage[];
  error: Error | null;

  // Actions
  send: (message: string) => Promise<void>;
  reset: () => void;

  // Data registration
  registerData: (key: string, data: any) => void;
  unregisterData: (key: string) => void;
  getData: () => RegisteredData;

  // Model info
  modelLoadProgress: number;
}

export interface SmartAgentProviderProps {
  children: ReactNode;
  
  // AI Configuration
  persona?: string;
  modelPath?: string;
  autoLoad?: boolean;

  // Context extraction options
  includeDOM?: boolean;
  includeForms?: boolean;
  includeTables?: boolean;
  maxContextLength?: number;

  // Callbacks
  onReady?: () => void;
  onError?: (error: Error) => void;
  onModelLoadProgress?: (progress: number) => void;
  onToolCall?: (tool: { name: string; args: any }) => Promise<any>;
}

// Default model paths for different deployment scenarios
export const MODEL_PATHS = {
  // Local development
  local: '/models/gemma-2b-it-gpu-int4.bin',
  
  // CDN hosted (you'd host this yourself)
  cdn: 'https://your-cdn.com/models/gemma-2b-it-gpu-int4.bin',
  
  // Hugging Face (if they host it)
  huggingface: 'https://huggingface.co/models/gemma-2b-it-gpu-int4.bin',
};

// Context
const SmartAgentContext = createContext<SmartAgentContextValue | null>(null);

// Check WebGPU support
function checkWebGPUSupport(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

// Provider Component
export function SmartAgentProvider({
  children,
  persona = 'You are a helpful assistant. Answer questions about the current page content.',
  modelPath = MODEL_PATHS.local,
  autoLoad = true,
  includeDOM = true,
  includeForms = true,
  includeTables = true,
  maxContextLength = 4000,
  onReady,
  onError,
  onModelLoadProgress,
  onToolCall,
}: SmartAgentProviderProps) {
  // State
  const [status, setStatus] = useState<SmartAgentContextValue['status']>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const [domSnapshot, setDomSnapshot] = useState('');

  // Refs
  const dataRegistry = useRef<Map<string, any>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const llmRef = useRef<any>(null);
  const chatHistoryRef = useRef<string[]>([]);

  // Data registration
  const registerData = useCallback((key: string, data: any) => {
    console.log('✅ registerData called:', key, data);
    dataRegistry.current.set(key, data);
    console.log('📦 Registry after set:', [...dataRegistry.current.entries()]);
  }, []);

  const unregisterData = useCallback((key: string) => {
    console.log('❌ unregisterData called:', key);
    dataRegistry.current.delete(key);
    console.log('📦 Registry after delete:', [...dataRegistry.current.entries()]);
  }, []);

  const getData = useCallback((): RegisteredData => {
    return Object.fromEntries(dataRegistry.current);
  }, []);

  // Extract DOM content
  const extractDOMContent = useCallback(() => {
    if (!containerRef.current || !includeDOM) return '';

    const content: string[] = [];

    // Text content
    containerRef.current
      .querySelectorAll('h1, h2, h3, h4, p, span, li, td, th, label, a')
      .forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 2 && text.length < 500) {
          content.push(text);
        }
      });

    // Form values
    if (includeForms) {
      containerRef.current
        .querySelectorAll('input, select, textarea')
        .forEach((el) => {
          const input = el as HTMLInputElement;
          const label =
            containerRef.current?.querySelector(`label[for="${input.id}"]`)?.textContent ||
            input.placeholder ||
            input.name ||
            input.id;
          if (input.value && input.type !== 'password' && input.type !== 'hidden') {
            content.push(`[Input: ${label}] ${input.value}`);
          }
        });
    }

    // Table data
    if (includeTables) {
      containerRef.current.querySelectorAll('table').forEach((table, i) => {
        const rows: string[] = [];
        table.querySelectorAll('tr').forEach((row) => {
          const cells = Array.from(row.querySelectorAll('td, th'))
            .map((c) => c.textContent?.trim())
            .filter(Boolean);
          if (cells.length) rows.push(cells.join(' | '));
        });
        if (rows.length) {
          content.push(`[Table ${i + 1}]\n${rows.slice(0, 15).join('\n')}`);
        }
      });
    }

    // Deduplicate and limit
    const unique = [...new Set(content)];
    return unique.join('\n').slice(0, maxContextLength);
  }, [includeDOM, includeForms, includeTables, maxContextLength]);

  // Observe DOM changes
  useEffect(() => {
    if (!containerRef.current || !includeDOM) return;

    const updateSnapshot = () => {
      setDomSnapshot(extractDOMContent());
    };

    updateSnapshot();

    const observer = new MutationObserver(() => {
      // Debounce updates
      setTimeout(updateSnapshot, 100);
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [extractDOMContent, includeDOM]);

  // Initialize LLM
  useEffect(() => {
    if (!autoLoad) return;

    const initLLM = async () => {
      // Check WebGPU
      if (!checkWebGPUSupport()) {
        const err = new Error('WebGPU not supported. Please use Chrome 113+ or Edge 113+.');
        setError(err);
        setStatus('error');
        onError?.(err);
        return;
      }

      setStatus('loading-model');
      setModelLoadProgress(0);

      try {
        // Dynamic import to avoid SSR issues
        const { FilesetResolver, LlmInference } = await import('@mediapipe/tasks-genai');

        onModelLoadProgress?.(10);
        setModelLoadProgress(10);

        const filesetResolver = await FilesetResolver.forGenAiTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm'
        );

        onModelLoadProgress?.(30);
        setModelLoadProgress(30);

        const llm = await LlmInference.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: modelPath,
          },
          maxTokens: 1024,
          topK: 40,
          temperature: 0.8,
          randomSeed: 42,
        });

        llmRef.current = llm;
        setModelLoadProgress(100);
        onModelLoadProgress?.(100);
        setStatus('ready');
        onReady?.();
      } catch (e: any) {
        console.error('Failed to load LLM:', e);
        setError(e);
        setStatus('error');
        onError?.(e);
      }
    };

    initLLM();

    return () => {
      if (llmRef.current) {
        llmRef.current.close?.();
      }
    };
  }, [autoLoad, modelPath, onReady, onError, onModelLoadProgress]);

  // Send message
  const send = useCallback(
    async (message: string) => {
      if (!llmRef.current || status !== 'ready') {
        console.warn('Agent not ready');
        return;
      }

      setStatus('thinking');

      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Build context INLINE - read fresh data directly from ref!
      let contextPrompt = '';
      
      // DEBUG: Log what's in the registry
      console.log('📦 dataRegistry.current:', [...dataRegistry.current.entries()]);
      
      const registeredData = Object.fromEntries(dataRegistry.current);
      console.log('📦 registeredData:', registeredData);
      
      if (Object.keys(registeredData).length > 0) {
        const parts: string[] = [];
        for (const [key, value] of Object.entries(registeredData)) {
          if (typeof value === 'string') {
            parts.push(`${key}: ${value}`);
          } else {
            try {
              parts.push(`${key}: ${JSON.stringify(value)}`);
            } catch {
              parts.push(`${key}: [data]`);
            }
          }
        }
        contextPrompt = `Data: ${parts.join('\n')}\n`;
      }
      
      // DEBUG: Log the context being sent
      console.log('📨 contextPrompt:', contextPrompt);

      // No chat history - each message is independent (saves tokens)
      const fullPrompt = `${persona}\n${contextPrompt}<start_of_turn>user\n${message}<end_of_turn>\n<start_of_turn>model\n`;
      
      // DEBUG: Log full prompt
      console.log('📝 fullPrompt:', fullPrompt);

      try {
        let response = '';

        // Generate response
        const result = await llmRef.current.generateResponse(fullPrompt);
        response = typeof result === 'string' ? result : result?.text || '';

        // Clean up response
        response = response.replace(/<end_of_turn>/g, '').trim();

        // Check for tool calls
        const toolMatch = response.match(/```tool\s*\n?({[\s\S]*?})\n?```/);
        if (toolMatch && onToolCall) {
          try {
            const toolCall = JSON.parse(toolMatch[1]);
            const toolResult = await onToolCall(toolCall);
            response = response.replace(toolMatch[0], `Tool result: ${JSON.stringify(toolResult)}`);
          } catch (e) {
            console.error('Tool call failed:', e);
          }
        }

        // Note: Not adding to chat history - each message is independent

        // Add agent message
        const agentMessage: ChatMessage = {
          role: 'agent',
          content: response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, agentMessage]);
      } catch (e: any) {
        console.error('Generation failed:', e);
        const errorMessage: ChatMessage = {
          role: 'agent',
          content: `Sorry, I encountered an error: ${e.message}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setStatus('ready');
      }
    },
    [status, persona, onToolCall]
  );

  // Reset conversation
  const reset = useCallback(() => {
    setMessages([]);
    chatHistoryRef.current = [];
  }, []);

  // Context value
  const contextValue = useMemo<SmartAgentContextValue>(
    () => ({
      isReady: status === 'ready',
      isLoading: status === 'loading-model' || status === 'thinking',
      status,
      messages,
      error,
      send,
      reset,
      registerData,
      unregisterData,
      getData,
      modelLoadProgress,
    }),
    [status, messages, error, send, reset, registerData, unregisterData, getData, modelLoadProgress]
  );

  return (
    <SmartAgentContext.Provider value={contextValue}>
      <div ref={containerRef} data-smart-agent-container="">
        {children}
      </div>
    </SmartAgentContext.Provider>
  );
}

/**
 * Hook to access the smart agent context
 * Must be used within a SmartAgentProvider
 */
export function useSmartAgent(): SmartAgentContextValue {
  const context = useContext(SmartAgentContext);
  if (!context) {
    throw new Error('useSmartAgent must be used within a SmartAgentProvider');
  }
  return context;
}

/**
 * Hook to auto-register component data with the AI
 * 
 * @example
 * ```tsx
 * function ProductList() {
 *   const [products, setProducts] = useState([]);
 *   useRegisterData('products', products);
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRegisterData(key: string, data: any): void {
  const { registerData, unregisterData } = useSmartAgent();

  useEffect(() => {
    registerData(key, data);
    return () => unregisterData(key);
  }, [key, data, registerData, unregisterData]);
}

/**
 * Hook to check if we're inside a SmartAgentProvider
 */
export function useIsSmartAgentAvailable(): boolean {
  const context = useContext(SmartAgentContext);
  return context !== null;
}


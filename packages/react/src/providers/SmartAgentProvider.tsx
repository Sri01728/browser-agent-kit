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

// Internal error/loading UI components
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      color: '#ef4444',
      background: '#fef2f2',
      borderRadius: '8px',
      margin: '1rem',
    }}>
      <h2 style={{ marginTop: 0 }}>⚠️ AI Agent Unavailable</h2>
      <p>{error.message}</p>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>
        Please use Chrome 113+ or Edge 113+ with WebGPU support.
      </p>
    </div>
  );
}

function LoadingFallback({ progress }: { progress: number }) {
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      color: '#6b7280',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #e5e7eb',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 1rem',
      }} />
      <p>Loading AI model... {progress}%</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Provider Component
export function SmartAgentProvider({
  children,
  persona = 'You are a helpful assistant. Answer questions about the current page content.',
  modelPath = MODEL_PATHS.local,
  autoLoad = true,
  includeDOM = false, // Default to false for minimal token usage
  includeForms = false,
  includeTables = false,
  maxContextLength = 500, // Optimized default for Gemma 2B
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
  const [webGPUSupported, setWebGPUSupported] = useState<boolean | null>(null);

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

  // Check WebGPU support on mount
  useEffect(() => {
    const supported = checkWebGPUSupport();
    setWebGPUSupported(supported);
    
    if (!supported && autoLoad) {
      const err = new Error('WebGPU not supported. Please use Chrome 113+ or Edge 113+.');
      setError(err);
      setStatus('error');
      onError?.(err);
    }
  }, [autoLoad, onError]);

  // Initialize LLM
  useEffect(() => {
    if (!autoLoad || webGPUSupported === false || webGPUSupported === null) return;

    const initLLM = async () => {
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
          topK: 30,        // Reduced from 40 for faster inference
          temperature: 0.6, // Reduced from 0.8 for better token efficiency
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
  }, [autoLoad, modelPath, onReady, onError, onModelLoadProgress, webGPUSupported]);

  // Format LLM response for better readability
  const formatLLMResponse = (text: string): string => {
    if (!text) return text;

    let formatted = text;

    // Clean up common LLM artifacts
    formatted = formatted.replace(/<end_of_turn>/g, '');
    formatted = formatted.replace(/<start_of_turn>/g, '');
    
    // Ensure numbered lists have proper line breaks
    // Pattern: "1. Item" should be on its own line
    formatted = formatted.replace(/(\d+)\.\s+([^\n\d]+?)(?=\s*\d+\.|$)/g, (match, num, content) => {
      return `\n${num}. ${content.trim()}`;
    });
    
    // Format bullet points
    formatted = formatted.replace(/-\s+([^\n-]+)/g, '\n• $1');
    
    // Add line break before lists
    formatted = formatted.replace(/([.!?])\s*(\d+\.|-|•)/g, '$1\n$2');
    
    // Format currency values consistently
    formatted = formatted.replace(/\$\s*(\d+[\d,]*\.?\d*)/g, '$$$1');
    
    // Ensure proper spacing after colons in lists
    formatted = formatted.replace(/:\s*([A-Z])/g, ': $1');
    
    // Clean up excessive whitespace but preserve intentional line breaks
    formatted = formatted.replace(/[ \t]+/g, ' ');
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    // Remove leading/trailing whitespace from each line
    formatted = formatted.split('\n').map(line => line.trim()).join('\n');
    
    return formatted.trim();
  };

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
          // Skip empty strings and null/undefined values
          if (value === null || value === undefined || value === '') {
            continue;
          }
          
          if (typeof value === 'string') {
            // Make API data more explicit - tell Gemma it's real-time data
            if (key === 'api_data') {
              // Check what type of data it is
              const lowerValue = value.toLowerCase();
              if (lowerValue.includes('cryptocurrency') || lowerValue.includes('bitcoin') || lowerValue.includes('btc') || lowerValue.includes('ethereum')) {
                parts.push(`Real-time Cryptocurrency Prices (from API): ${value}`);
              } else if (lowerValue.includes('weather') || lowerValue.includes('temperature') || lowerValue.includes('°c') || lowerValue.includes('°f')) {
                parts.push(`Current Weather Data (from API): ${value}`);
              } else if (lowerValue.includes('news headline') || lowerValue.includes('news') && (lowerValue.includes('headline') || lowerValue.includes('from'))) {
                parts.push(`Latest News Headlines (from API): ${value}`);
              } else {
                parts.push(`Real-time API Data: ${value}`);
              }
            } else if (key === 'products') {
              parts.push(`Product List: ${value}`);
            } else {
              parts.push(`${key}: ${value}`);
            }
          } else {
            try {
              parts.push(`${key}: ${JSON.stringify(value)}`);
            } catch {
              parts.push(`${key}: [data]`);
            }
          }
        }
        
        // Only add context if we have actual data
        if (parts.length > 0) {
          // Simple and direct instruction - be very explicit
          // Optimized: Minimal instruction, let data speak for itself
          contextPrompt = `Data:\n${parts.join('\n')}\n\n`;
        }
      }
      
      // DEBUG: Log the context being sent
      console.log('📨 contextPrompt:', contextPrompt);

      // No chat history - each message is independent (saves tokens)
      // Optimized prompt structure: Data → Persona → User message
      const fullPrompt = `${contextPrompt}${persona}\n<start_of_turn>user\n${message}<end_of_turn>\n<start_of_turn>model\n`;
      
      // DEBUG: Log full prompt
      console.log('📝 fullPrompt:', fullPrompt);

      try {
        let response = '';

        // Generate response
        const result = await llmRef.current.generateResponse(fullPrompt);
        response = typeof result === 'string' ? result : result?.text || '';
        
        // DEBUG: Log raw response
        console.log('📤 Raw LLM response:', response);

        // Clean up response
        response = response.replace(/<end_of_turn>/g, '').trim();
        
        // Format response for better readability
        response = formatLLMResponse(response);
        
        // DEBUG: Log cleaned response
        console.log('📥 Cleaned response:', response);
        
        // Handle empty or very short responses
        if (!response || response.length < 2) {
          console.warn('⚠️ LLM returned empty or very short response, retrying with simpler prompt...');
          // Retry with simpler prompt
          const simplePrompt = `${persona}\n<start_of_turn>user\n${message}<end_of_turn>\n<start_of_turn>model\n`;
          const retryResult = await llmRef.current.generateResponse(simplePrompt);
          response = typeof retryResult === 'string' ? retryResult : retryResult?.text || '';
          response = response.replace(/<end_of_turn>/g, '').trim();
        }

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

  // Show error UI if WebGPU not supported or model failed
  if (error && status === 'error') {
    return (
      <SmartAgentContext.Provider value={contextValue}>
        <div ref={containerRef} data-smart-agent-container="">
          <ErrorFallback error={error} />
          {children}
        </div>
      </SmartAgentContext.Provider>
    );
  }

  // Show loading UI while checking WebGPU or loading model
  if (webGPUSupported === null || status === 'loading-model') {
    return (
      <SmartAgentContext.Provider value={contextValue}>
        <div ref={containerRef} data-smart-agent-container="">
          {status === 'loading-model' && <LoadingFallback progress={modelLoadProgress} />}
          {children}
        </div>
      </SmartAgentContext.Provider>
    );
  }

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


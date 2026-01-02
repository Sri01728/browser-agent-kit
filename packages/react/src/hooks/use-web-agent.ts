/**
 * useWebAgent Hook - High-Level Agent Integration
 *
 * The EASY way to add browser-based AI agents to React apps.
 * Handles model loading, caching, A2U parsing, and state management.
 *
 * @example Minimal Setup
 * ```tsx
 * import { useWebAgent, WebAgentUI } from '@web-agent/react';
 *
 * function App() {
 *   const agent = useWebAgent({
 *     persona: 'You are a helpful assistant.'
 *   });
 *
 *   return (
 *     <div>
 *       <WebAgentUI agent={agent} />
 *       <input
 *         onKeyDown={(e) => e.key === 'Enter' && agent.send(e.currentTarget.value)}
 *         disabled={!agent.isReady}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @module hooks/use-web-agent
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { A2UResponse } from '@web-agent/ui-protocol/a2u';

// =============================================================================
// Types
// =============================================================================

export type ModelStatus = 'idle' | 'loading' | 'initializing' | 'ready' | 'error';

export interface WebAgentConfig {
  /** System prompt / persona for the agent */
  persona: string;
  /** Model path (default: /models/gemma-2b-it-gpu-int4.bin) */
  modelPath?: string;
  /** Auto-load model on mount (default: false) */
  autoLoad?: boolean;
  /** Max tokens for response (default: 2048) */
  maxTokens?: number;
  /** Temperature (default: 0.7) */
  temperature?: number;
  /** Callback when A2U UI is generated */
  onUI?: (ui: A2UResponse) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface WebAgentState {
  /** Current model loading status */
  status: ModelStatus;
  /** Loading progress message */
  progress: string;
  /** Is model ready to accept messages */
  isReady: boolean;
  /** Is currently generating a response */
  isGenerating: boolean;
  /** Current error if any */
  error: Error | null;
  /** Current agent thinking/response text */
  thinking: string;
  /** Current A2U UI response */
  ui: A2UResponse | null;
  /** Conversation history */
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface WebAgentActions {
  /** Load the model (call this or set autoLoad: true) */
  load: () => Promise<void>;
  /** Send a message to the agent */
  send: (message: string) => Promise<void>;
  /** Clear conversation history */
  clear: () => void;
}

export type UseWebAgentReturn = WebAgentState & WebAgentActions;

// =============================================================================
// IndexedDB Model Cache
// =============================================================================

const MODEL_CACHE_DB = 'web-agent-model-cache';
const MODEL_CACHE_STORE = 'models';
const MODEL_CACHE_KEY = 'gemma-2b';

async function openModelCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MODEL_CACHE_DB, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MODEL_CACHE_STORE)) {
        db.createObjectStore(MODEL_CACHE_STORE);
      }
    };
  });
}

async function getCachedModel(): Promise<Blob | null> {
  try {
    const db = await openModelCacheDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MODEL_CACHE_STORE, 'readonly');
      const store = tx.objectStore(MODEL_CACHE_STORE);
      const request = store.get(MODEL_CACHE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch {
    return null;
  }
}

async function cacheModel(blob: Blob): Promise<void> {
  try {
    const db = await openModelCacheDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MODEL_CACHE_STORE, 'readwrite');
      const store = tx.objectStore(MODEL_CACHE_STORE);
      const request = store.put(blob, MODEL_CACHE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (err) {
    console.warn('[WebAgent] Failed to cache model:', err);
  }
}

// =============================================================================
// A2U Parsing Helpers
// =============================================================================

function parseA2UFromResponse(response: string): A2UResponse | null {
  try {
    // Extract JSON from ```json blocks
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) return null;

    let jsonStr = jsonMatch[1]
      .replace(/\n/g, ' ')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/'/g, '"')
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
      .replace(/:\s*'([^']*)'/g, ': "$1"')
      .replace(/"\s*,\s*"/g, '","')
      .trim();

    return JSON.parse(jsonStr) as A2UResponse;
  } catch {
    return null;
  }
}

// =============================================================================
// Default Prompt Template
// =============================================================================

function buildSystemPrompt(persona: string): string {
  return `${persona}

You respond with JSON in \`\`\`json blocks using this format:
{"version":"1.0","type":"ui","ui":{"type":"card","props":{"title":"Title"},"children":[{"type":"text","props":{"content":"Your message"}}]}}

Available components:
- card: {"type":"card","props":{"title":"Title"},"children":[...]}
- text: {"type":"text","props":{"content":"Message"}}
- button: {"type":"button","props":{"label":"Click"},"actions":[{"type":"call_tool","params":{"tool":"action"}}]}

Rules: Only output JSON in \`\`\`json blocks. Use double quotes. No trailing commas.`;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useWebAgent(config: WebAgentConfig): UseWebAgentReturn {
  const {
    persona,
    modelPath = '/models/gemma-2b-it-gpu-int4.bin',
    autoLoad = false,
    maxTokens = 2048,
    temperature = 0.7,
    onUI,
    onError,
  } = config;

  // State
  const [status, setStatus] = useState<ModelStatus>('idle');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [thinking, setThinking] = useState('');
  const [ui, setUI] = useState<A2UResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Refs
  const llmRef = useRef<any>(null);
  const systemPromptRef = useRef(buildSystemPrompt(persona));

  // Update system prompt when persona changes
  useEffect(() => {
    systemPromptRef.current = buildSystemPrompt(persona);
  }, [persona]);

  // Load model
  const load = useCallback(async () => {
    if (status === 'loading' || status === 'initializing' || status === 'ready') {
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      // Check WebGPU
      if (!('gpu' in navigator)) {
        throw new Error('WebGPU not supported. Use Chrome 113+ or Edge 113+.');
      }

      setProgress('Checking GPU...');
      const gpu = (navigator as any).gpu;
      const adapter = await gpu.requestAdapter();
      if (!adapter) {
        throw new Error('No GPU adapter found.');
      }

      // Check cache
      setProgress('Checking model cache...');
      let modelBlobUrl: string | null = null;
      const cachedModel = await getCachedModel();

      if (cachedModel) {
        setProgress('Loading from cache (instant!)');
        modelBlobUrl = URL.createObjectURL(cachedModel);
      } else {
        // Fetch and cache
        setProgress('Downloading model...');
        try {
          const response = await fetch(modelPath);
          if (!response.ok) {
            throw new Error(`Model not found at ${modelPath}`);
          }
          const blob = await response.blob();
          setProgress('Caching model...');
          await cacheModel(blob);
          modelBlobUrl = URL.createObjectURL(blob);
        } catch {
          throw new Error(
            `Model not found. Download from Kaggle and place at: ${modelPath}`
          );
        }
      }

      // Load MediaPipe
      setProgress('Loading AI runtime...');
      const { FilesetResolver, LlmInference } = await import('@mediapipe/tasks-genai');

      const genaiFileset = await FilesetResolver.forGenAiTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
      );

      setProgress('Initializing model on GPU...');
      setStatus('initializing');

      const llm = await LlmInference.createFromOptions(genaiFileset, {
        baseOptions: { modelAssetPath: modelBlobUrl || modelPath },
        maxTokens,
        topK: 40,
        temperature,
        randomSeed: 101,
      });

      llmRef.current = llm;
      setStatus('ready');
      setProgress('');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setStatus('error');
      onError?.(error);
    }
  }, [status, modelPath, maxTokens, temperature, onError]);

  // Auto-load on mount if configured
  useEffect(() => {
    if (autoLoad && status === 'idle') {
      load();
    }
  }, [autoLoad, status, load]);

  // Send message
  const send = useCallback(async (message: string) => {
    if (!llmRef.current || isGenerating || status !== 'ready') {
      return;
    }

    setIsGenerating(true);
    setThinking('');
    setUI(null);

    // Build prompt with history
    const conversationHistory = history
      .map(h => `<start_of_turn>${h.role === 'user' ? 'user' : 'model'}\n${h.content}<end_of_turn>`)
      .join('\n');

    const prompt = `${systemPromptRef.current}\n${conversationHistory}\n<start_of_turn>user\n${message}<end_of_turn>\n<start_of_turn>model\n`;

    let fullResponse = '';

    try {
      await llmRef.current.generateResponse(prompt, (partialResult: string, complete: boolean) => {
        fullResponse += partialResult;
        setThinking(fullResponse);

        if (complete) {
          // Update history
          setHistory(prev => [
            ...prev,
            { role: 'user', content: message },
            { role: 'assistant', content: fullResponse },
          ]);

          // Parse A2U
          const a2u = parseA2UFromResponse(fullResponse);
          if (a2u) {
            setUI(a2u);
            onUI?.(a2u);
          }

          setIsGenerating(false);
        }
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsGenerating(false);
      onError?.(error);
    }
  }, [history, isGenerating, status, onUI, onError]);

  // Clear history
  const clear = useCallback(() => {
    setHistory([]);
    setThinking('');
    setUI(null);
    setError(null);
  }, []);

  return {
    // State
    status,
    progress,
    isReady: status === 'ready',
    isGenerating,
    error,
    thinking,
    ui,
    history,
    // Actions
    load,
    send,
    clear,
  };
}


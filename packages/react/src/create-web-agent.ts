/**
 * createWebAgent - Factory function for creating web agents
 *
 * Zero-config defaults with progressive disclosure for advanced options.
 * Inspired by Mastra's Agent class and AI SDK patterns.
 *
 * @example Minimal Setup
 * ```tsx
 * const agent = createWebAgent({
 *   persona: 'You are a helpful assistant.',
 * });
 * ```
 *
 * @example With Custom Model
 * ```tsx
 * const agent = createWebAgent({
 *   persona: 'You are a flight booking assistant.',
 *   model: {
 *     path: '/models/gemma-2b-it-gpu-int4.bin',
 *     maxTokens: 2048,
 *     temperature: 0.7,
 *   },
 *   memory: {
 *     enabled: true,
 *     maxMessages: 50,
 *   },
 * });
 * ```
 *
 * @module create-web-agent
 */

import type { A2UResponse } from '@web-agent/ui-protocol/a2u';

// =============================================================================
// Types
// =============================================================================

export type ModelProvider = 'mediapipe' | 'transformers' | 'custom';

export interface ModelConfig {
  /** Model provider (default: mediapipe) */
  provider?: ModelProvider;
  /** Path to model file */
  path?: string;
  /** Max tokens for response */
  maxTokens?: number;
  /** Temperature for sampling */
  temperature?: number;
  /** Top-K sampling */
  topK?: number;
}

export interface MemoryConfig {
  /** Enable conversation memory (default: true) */
  enabled?: boolean;
  /** Max messages to keep in history */
  maxMessages?: number;
  /** Persist to IndexedDB */
  persist?: boolean;
  /** Thread ID for multi-conversation support */
  threadId?: string;
}

export interface WebAgentOptions {
  /** Agent ID (auto-generated if not provided) */
  id?: string;
  /** Display name for the agent */
  name?: string;
  /** System prompt / persona */
  persona: string;
  /** Model configuration */
  model?: ModelConfig;
  /** Memory configuration */
  memory?: MemoryConfig;
  /** Auto-load model on creation */
  autoLoad?: boolean;
  /** Callback when A2U UI is generated */
  onUI?: (ui: A2UResponse) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Callback on status change */
  onStatusChange?: (status: AgentStatus) => void;
  /** Middleware functions */
  middleware?: AgentMiddleware[];
}

export type AgentStatus = 'idle' | 'loading' | 'ready' | 'generating' | 'error';

export interface AgentMiddleware {
  /** Called before sending a message */
  beforeSend?: (message: string) => string | Promise<string>;
  /** Called after receiving a response */
  afterReceive?: (response: string) => string | Promise<string>;
  /** Called when A2U is parsed */
  onA2U?: (ui: A2UResponse) => A2UResponse | Promise<A2UResponse>;
}

export interface WebAgentInstance {
  /** Unique agent ID */
  readonly id: string;
  /** Agent name */
  readonly name: string;
  /** Current status */
  readonly status: AgentStatus;
  /** Is model ready */
  readonly isReady: boolean;
  /** Is currently generating */
  readonly isGenerating: boolean;
  /** Current error if any */
  readonly error: Error | null;
  /** Load the model */
  load: () => Promise<void>;
  /** Send a message */
  send: (message: string) => Promise<string>;
  /** Clear conversation history */
  clear: () => void;
  /** Subscribe to status changes */
  onStatusChange: (callback: (status: AgentStatus) => void) => () => void;
  /** Subscribe to responses */
  onResponse: (callback: (response: string, ui: A2UResponse | null) => void) => () => void;
  /** Dispose agent and cleanup */
  dispose: () => void;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_MODEL_CONFIG: Required<ModelConfig> = {
  provider: 'mediapipe',
  path: '/models/gemma-2b-it-gpu-int4.bin',
  maxTokens: 2048,
  temperature: 0.7,
  topK: 40,
};

const DEFAULT_MEMORY_CONFIG: Required<MemoryConfig> = {
  enabled: true,
  maxMessages: 100,
  persist: true,
  threadId: 'default',
};

// =============================================================================
// Factory Implementation
// =============================================================================

let agentCounter = 0;

/**
 * Create a new web agent with zero-config defaults.
 *
 * @param options - Agent configuration options
 * @returns WebAgentInstance for controlling the agent
 */
export function createWebAgent(options: WebAgentOptions): WebAgentInstance {
  const {
    id = `agent-${++agentCounter}`,
    name = 'Web Agent',
    persona,
    model = {},
    memory = {},
    autoLoad = false,
    onUI,
    onError,
    onStatusChange: onStatusChangeProp,
    middleware = [],
  } = options;

  // Merge with defaults
  const modelConfig = { ...DEFAULT_MODEL_CONFIG, ...model };
  const memoryConfig = { ...DEFAULT_MEMORY_CONFIG, ...memory };

  // Internal state
  let status: AgentStatus = 'idle';
  let error: Error | null = null;
  let llmInstance: any = null;
  let history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  const statusListeners = new Set<(status: AgentStatus) => void>();
  const responseListeners = new Set<(response: string, ui: A2UResponse | null) => void>();

  // Helper to update status
  const setStatus = (newStatus: AgentStatus) => {
    status = newStatus;
    onStatusChangeProp?.(newStatus);
    statusListeners.forEach((listener) => listener(newStatus));
  };

  // Helper to set error
  const setError = (err: Error) => {
    error = err;
    setStatus('error');
    onError?.(err);
  };

  // Build system prompt with A2U instructions
  const buildSystemPrompt = () => {
    return `${persona}

You respond with JSON in \`\`\`json blocks using this format:
{"version":"1.0","type":"ui","ui":{"type":"card","props":{"title":"Title"},"children":[{"type":"text","props":{"content":"Your message"}}]}}

Available components:
- card: {"type":"card","props":{"title":"Title"},"children":[...]}
- text: {"type":"text","props":{"content":"Message"}}
- button: {"type":"button","props":{"label":"Click"},"actions":[{"type":"call_tool","params":{"tool":"action"}}]}

Rules: Only output JSON in \`\`\`json blocks. Use double quotes. No trailing commas.`;
  };

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

      let result = JSON.parse(jsonStr) as A2UResponse;

      // Apply middleware
      for (const mw of middleware) {
        if (mw.onA2U) {
          const transformed = mw.onA2U(result);
          result = transformed instanceof Promise ? result : transformed;
        }
      }

      return result;
    } catch {
      return null;
    }
  };

  // Load model
  const load = async (): Promise<void> => {
    if (status === 'loading' || status === 'ready') return;

    setStatus('loading');
    error = null;

    try {
      // Check WebGPU
      if (!('gpu' in navigator)) {
        throw new Error('WebGPU not supported. Use Chrome 113+ or Edge 113+.');
      }

      // Dynamic import based on provider
      if (modelConfig.provider === 'mediapipe') {
        const { FilesetResolver, LlmInference } = await import('@mediapipe/tasks-genai');

        const genaiFileset = await FilesetResolver.forGenAiTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
        );

        llmInstance = await LlmInference.createFromOptions(genaiFileset, {
          baseOptions: { modelAssetPath: modelConfig.path },
          maxTokens: modelConfig.maxTokens,
          topK: modelConfig.topK,
          temperature: modelConfig.temperature,
          randomSeed: 101,
        });
      } else {
        throw new Error(`Provider '${modelConfig.provider}' not yet supported`);
      }

      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // Send message
  const send = async (message: string): Promise<string> => {
    if (!llmInstance || status !== 'ready') {
      throw new Error('Agent not ready. Call load() first.');
    }

    setStatus('generating');

    try {
      // Apply beforeSend middleware
      let processedMessage = message;
      for (const mw of middleware) {
        if (mw.beforeSend) {
          processedMessage = await mw.beforeSend(processedMessage);
        }
      }

      // Build prompt with history
      const historyStr = history
        .slice(-memoryConfig.maxMessages)
        .map((h) => `<start_of_turn>${h.role === 'user' ? 'user' : 'model'}\n${h.content}<end_of_turn>`)
        .join('\n');

      const prompt = `${buildSystemPrompt()}\n${historyStr}\n<start_of_turn>user\n${processedMessage}<end_of_turn>\n<start_of_turn>model\n`;

      // Generate response
      let fullResponse = '';

      await new Promise<void>((resolve, reject) => {
        llmInstance.generateResponse(prompt, (partial: string, complete: boolean) => {
          fullResponse += partial;
          if (complete) resolve();
        }).catch(reject);
      });

      // Apply afterReceive middleware
      let processedResponse = fullResponse;
      for (const mw of middleware) {
        if (mw.afterReceive) {
          processedResponse = await mw.afterReceive(processedResponse);
        }
      }

      // Update history
      if (memoryConfig.enabled) {
        history.push({ role: 'user', content: processedMessage });
        history.push({ role: 'assistant', content: processedResponse });
      }

      // Parse A2U and notify
      const a2u = parseA2U(processedResponse);
      if (a2u) {
        onUI?.(a2u);
      }

      // Notify listeners
      responseListeners.forEach((listener) => listener(processedResponse, a2u));

      setStatus('ready');
      return processedResponse;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };

  // Clear history
  const clear = () => {
    history = [];
    error = null;
  };

  // Subscribe to status changes
  const onStatusChangeMethod = (callback: (status: AgentStatus) => void) => {
    statusListeners.add(callback);
    return () => statusListeners.delete(callback);
  };

  // Subscribe to responses
  const onResponse = (callback: (response: string, ui: A2UResponse | null) => void) => {
    responseListeners.add(callback);
    return () => responseListeners.delete(callback);
  };

  // Cleanup
  const dispose = () => {
    statusListeners.clear();
    responseListeners.clear();
    history = [];
    llmInstance = null;
    setStatus('idle');
  };

  // Auto-load if configured
  if (autoLoad) {
    load();
  }

  // Return instance
  return {
    get id() { return id; },
    get name() { return name; },
    get status() { return status; },
    get isReady() { return status === 'ready'; },
    get isGenerating() { return status === 'generating'; },
    get error() { return error; },
    load,
    send,
    clear,
    onStatusChange: onStatusChangeMethod,
    onResponse,
    dispose,
  };
}


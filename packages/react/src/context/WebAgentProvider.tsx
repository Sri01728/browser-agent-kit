/**
 * WebAgentProvider - App-wide configuration for web agents
 *
 * Provides shared configuration, model caching, and agent registry
 * across your entire React application.
 *
 * @example Basic Usage
 * ```tsx
 * import { WebAgentProvider, useWebAgent } from '@web-agent/react';
 *
 * function App() {
 *   return (
 *     <WebAgentProvider>
 *       <MyChat />
 *     </WebAgentProvider>
 *   );
 * }
 *
 * function MyChat() {
 *   const agent = useWebAgent({ persona: 'You are helpful.' });
 *   // ...
 * }
 * ```
 *
 * @example With Custom Config
 * ```tsx
 * <WebAgentProvider
 *   config={{
 *     defaultModel: '/models/gemma-2b.bin',
 *     enableCache: true,
 *     onError: (err) => console.error(err),
 *   }}
 * >
 *   <App />
 * </WebAgentProvider>
 * ```
 *
 * @module context/WebAgentProvider
 */

import React, { createContext, useContext, useRef, useCallback, type ReactNode } from 'react';
import type { WebAgentInstance, ModelConfig, AgentMiddleware } from '../create-web-agent';

// =============================================================================
// Types
// =============================================================================

export interface WebAgentProviderConfig {
  /** Default model path */
  defaultModel?: string;
  /** Default model config */
  modelConfig?: ModelConfig;
  /** Enable IndexedDB model caching */
  enableCache?: boolean;
  /** Global middleware applied to all agents */
  middleware?: AgentMiddleware[];
  /** Global error handler */
  onError?: (error: Error, agentId: string) => void;
  /** Enable debug logging */
  debug?: boolean;
}

export interface WebAgentContextValue {
  /** Provider configuration */
  config: WebAgentProviderConfig;
  /** Register an agent instance */
  registerAgent: (agent: WebAgentInstance) => void;
  /** Unregister an agent instance */
  unregisterAgent: (agentId: string) => void;
  /** Get an agent by ID */
  getAgent: (agentId: string) => WebAgentInstance | undefined;
  /** Get all registered agents */
  getAllAgents: () => WebAgentInstance[];
  /** Check if model is cached */
  isModelCached: (modelPath: string) => Promise<boolean>;
  /** Log debug message */
  log: (message: string, ...args: unknown[]) => void;
}

// =============================================================================
// Default Config
// =============================================================================

const DEFAULT_CONFIG: WebAgentProviderConfig = {
  defaultModel: '/models/gemma-2b-it-gpu-int4.bin',
  enableCache: true,
  debug: false,
};

// =============================================================================
// Context
// =============================================================================

const WebAgentContext = createContext<WebAgentContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

export interface WebAgentProviderProps {
  children: ReactNode;
  config?: WebAgentProviderConfig;
}

export function WebAgentProvider({ children, config: userConfig }: WebAgentProviderProps) {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const agentsRef = useRef<Map<string, WebAgentInstance>>(new Map());

  // Debug logging
  const log = useCallback(
    (message: string, ...args: unknown[]) => {
      if (config.debug) {
        console.log(`[WebAgent] ${message}`, ...args);
      }
    },
    [config.debug]
  );

  // Register agent
  const registerAgent = useCallback(
    (agent: WebAgentInstance) => {
      agentsRef.current.set(agent.id, agent);
      log(`Registered agent: ${agent.id}`);
    },
    [log]
  );

  // Unregister agent
  const unregisterAgent = useCallback(
    (agentId: string) => {
      agentsRef.current.delete(agentId);
      log(`Unregistered agent: ${agentId}`);
    },
    [log]
  );

  // Get agent by ID
  const getAgent = useCallback((agentId: string) => {
    return agentsRef.current.get(agentId);
  }, []);

  // Get all agents
  const getAllAgents = useCallback(() => {
    return Array.from(agentsRef.current.values());
  }, []);

  // Check if model is cached in IndexedDB
  const isModelCached = useCallback(async (modelPath: string): Promise<boolean> => {
    if (!config.enableCache) return false;

    try {
      const db = await openModelCacheDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('models', 'readonly');
        const store = tx.objectStore('models');
        const request = store.get(modelPath);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(!!request.result);
      });
    } catch {
      return false;
    }
  }, [config.enableCache]);

  const value: WebAgentContextValue = {
    config,
    registerAgent,
    unregisterAgent,
    getAgent,
    getAllAgents,
    isModelCached,
    log,
  };

  return (
    <WebAgentContext.Provider value={value}>
      {children}
    </WebAgentContext.Provider>
  );
}

// =============================================================================
// Hook to access context
// =============================================================================

export function useWebAgentContext(): WebAgentContextValue {
  const context = useContext(WebAgentContext);
  if (!context) {
    // Return a default context if not wrapped in provider
    return {
      config: DEFAULT_CONFIG,
      registerAgent: () => {},
      unregisterAgent: () => {},
      getAgent: () => undefined,
      getAllAgents: () => [],
      isModelCached: async () => false,
      log: () => {},
    };
  }
  return context;
}

// =============================================================================
// Helper: IndexedDB Model Cache
// =============================================================================

async function openModelCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('web-agent-model-cache', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('models')) {
        db.createObjectStore('models');
      }
    };
  });
}


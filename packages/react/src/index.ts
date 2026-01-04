/**
 * @web-agent/react
 *
 * React hooks and components for browser-based AI agents.
 * Runs entirely in the browser using WebGPU and local LLMs.
 *
 * @example Quick Start (Recommended)
 * ```tsx
 * import { useWebAgent, WebAgentUI } from '@web-agent/react';
 *
 * function App() {
 *   const agent = useWebAgent({
 *     persona: 'You are a helpful assistant.',
 *   });
 *
 *   return (
 *     <div>
 *       <WebAgentUI agent={agent} />
 *       <input
 *         onKeyDown={(e) => {
 *           if (e.key === 'Enter') agent.send(e.currentTarget.value);
 *         }}
 *         disabled={!agent.isReady}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example AI SDK UI Compatible
 * ```tsx
 * import { useAgentChat } from '@web-agent/react';
 *
 * function Chat() {
 *   const { messages, input, handleInputChange, handleSubmit, isLoading } = useAgentChat({
 *     persona: 'You are helpful.',
 *   });
 *
 *   return (
 *     <div>
 *       {messages.map(m => <div key={m.id}>{m.content}</div>)}
 *       <form onSubmit={handleSubmit}>
 *         <input value={input} onChange={handleInputChange} />
 *         <button disabled={isLoading}>Send</button>
 *       </form>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Factory Pattern
 * ```tsx
 * import { createWebAgent } from '@web-agent/react';
 *
 * const agent = createWebAgent({
 *   persona: 'You are a coding assistant.',
 *   autoLoad: true,
 *   middleware: [{
 *     beforeSend: (msg) => msg.toLowerCase(),
 *   }],
 * });
 *
 * agent.onResponse((response, ui) => {
 *   console.log('Response:', response);
 * });
 *
 * await agent.send('Hello!');
 * ```
 *
 * @module @web-agent/react
 */

// =============================================================================
// Types
// =============================================================================
export * from './types';

// =============================================================================
// High-Level API (Recommended for most use cases)
// =============================================================================

// Hook: useWebAgent - State-based hook with auto model loading
export { useWebAgent } from './hooks/use-web-agent';
export type {
  WebAgentConfig,
  WebAgentState,
  WebAgentActions,
  UseWebAgentReturn,
  ModelStatus,
} from './hooks/use-web-agent';

// Hook: useAgentChat - AI SDK UI compatible chat hook
export { useAgentChat } from './hooks/use-agent-chat';
export type {
  UseAgentChatOptions,
  UseAgentChatReturn,
  Message,
  MessageRole,
} from './hooks/use-agent-chat';

// Component: WebAgentUI - Auto-rendering UI component
export { WebAgentUI } from './components/WebAgentUI';
export type { WebAgentUIProps } from './components/WebAgentUI';

// =============================================================================
// Factory API (For advanced use cases)
// =============================================================================

// Factory: createWebAgent - Create agent instances programmatically
export { 
  createWebAgent, 
  TRANSFORMERS_MODELS, 
  TRANSLATION_MODELS,
  TEXT_CLASSIFICATION_MODELS,
  IMAGE_CLASSIFICATION_MODELS,
  OBJECT_DETECTION_MODELS,
  NER_MODELS,
  SUMMARIZATION_MODELS,
} from './create-web-agent';
export type {
  WebAgentOptions,
  WebAgentInstance,
  AgentMiddleware,
  AgentStatus,
  ModelConfig,
  MemoryConfig,
  ModelProvider,
} from './create-web-agent';

// =============================================================================
// Context API (For app-wide configuration)
// =============================================================================

// Provider: WebAgentProvider - App-wide configuration context
export { WebAgentProvider, useWebAgentContext } from './context/WebAgentProvider';
export type {
  WebAgentProviderConfig,
  WebAgentProviderProps,
  WebAgentContextValue,
} from './context/WebAgentProvider';

// =============================================================================
// Smart Agent Provider (Auto-context for existing React apps)
// =============================================================================

// Provider: SmartAgentProvider - Automatically captures page data for AI
export {
  SmartAgentProvider,
  useSmartAgent,
  useRegisterData,
  useIsSmartAgentAvailable,
  MODEL_PATHS,
} from './providers/SmartAgentProvider';
export type {
  SmartAgentProviderProps,
  SmartAgentContextValue,
  RegisteredData,
} from './providers/SmartAgentProvider';

// =============================================================================
// Low-Level Hooks (For custom implementations)
// =============================================================================

export { useAgent } from './hooks/use-agent';
export { useAgentStream } from './hooks/use-agent-stream';

// =============================================================================
// Components
// =============================================================================

export { A2UComponent } from './components/A2UComponent';
export { AgentChat } from './components/AgentChat';

// =============================================================================
// Utilities
// =============================================================================

// Pre-built Personas
export { personas } from './personas';
export type { PersonaName } from './personas';

// Model Loading Utilities
export {
  modelCache,
  isModelCached,
  getModelInfo,
  downloadModel,
  clearModelCache,
  MODEL_SOURCES,
  getModelSource,
  checkWebGPUSupport,
  estimateDownloadTime,
} from './utils/model-loader';
export type { ModelLoadOptions, ModelInfo } from './utils/model-loader';

// =============================================================================
// MCP Integration (Model Context Protocol)
// =============================================================================

// Browser MCP Client - Connect to MCP servers from the browser
export {
  BrowserMCPClient,
  MCP_SERVERS,
  useMCP,
} from './mcp/browser-mcp-client';
export type {
  BrowserMCPClientConfig,
  MCPServerConfig,
  MCPTool,
  MCPResource,
  MCPPrompt,
  UseMCPOptions,
  UseMCPReturn,
} from './mcp/browser-mcp-client';

// =============================================================================
// Re-exports from @web-agent/ui-protocol
// =============================================================================

export type {
  A2UComponent as A2UComponentType,
  A2UAction,
  A2UResponse,
  AGUIEvent,
  EventType,
} from '@web-agent/ui-protocol';


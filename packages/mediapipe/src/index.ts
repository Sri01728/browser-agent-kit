/**
 * @web-agent/mediapipe
 * 
 * MediaPipe LLM Inference adapter for browser-based AI agents.
 * Enables running Gemma and compatible models locally in the browser
 * with WebGPU acceleration and WASM fallback.
 * 
 * @packageDocumentation
 * 
 * @example Quick Start
 * ```typescript
 * import { MediaPipeAdapter } from '@web-agent/mediapipe';
 * import { Agent } from '@web-agent/core';
 * 
 * // Create the adapter
 * const adapter = new MediaPipeAdapter({
 *   modelPath: '/models/gemma-2b-it-gpu-int4.bin',
 * });
 * 
 * // Initialize (downloads model, loads into WebGPU)
 * await adapter.initialize();
 * 
 * // Use with an agent
 * const agent = new Agent({
 *   id: 'my-agent',
 *   name: 'My Agent',
 *   model: adapter,
 *   instructions: 'You are a helpful assistant.',
 * });
 * 
 * const response = await agent.generate('Hello!');
 * console.log(response.text);
 * ```
 * 
 * @example With Streaming
 * ```typescript
 * for await (const chunk of adapter.stream({
 *   messages: [{ role: 'user', content: 'Tell me a story' }]
 * })) {
 *   if (chunk.type === 'text') {
 *     process.stdout.write(chunk.text);
 *   }
 * }
 * ```
 * 
 * @example WebGPU Feature Detection
 * ```typescript
 * const adapter = new MediaPipeAdapter({
 *   modelPath: '/models/gemma-2b-it-gpu-int4.bin',
 *   useWebGPU: true, // Falls back to WASM if unavailable
 * });
 * 
 * try {
 *   await adapter.initialize();
 * } catch (error) {
 *   if (error instanceof WebGPUNotAvailableError) {
 *     console.log('WebGPU not available, using WASM fallback');
 *   }
 * }
 * ```
 */

// Main adapter
export { MediaPipeAdapter } from './adapter';

// Types
export {
  mediaPipeConfigSchema,
  type MediaPipeConfig,
  type MediaPipeConfigResolved,
  functionCallSchema,
  type FunctionCall,
  toolDefinitionSchema,
  type ToolDefinitionInput,
  type WebGPUStatus,
} from './types';

// Errors
export {
  MediaPipeError,
  ModelInitializationError,
  WebGPUNotAvailableError,
  InferenceError,
  ModelNotInitializedError,
  ModelLoadError,
  ResponseParseError,
  ConfigurationError,
} from './errors';

// Re-export core types for convenience
export type {
  LLMAdapter,
  GenerateOptions,
  GenerateResult,
  StreamChunk,
  Message,
} from '@web-agent/core';


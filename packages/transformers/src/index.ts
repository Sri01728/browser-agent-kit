/**
 * @web-agent/transformers
 * 
 * Transformers.js adapter for browser-based AI agents.
 * Enables running Hugging Face models like Phi-3, Llama, Mistral, Gemma locally
 * in the browser with WebGPU acceleration and WASM fallback.
 * 
 * @packageDocumentation
 * 
 * @example Quick Start
 * ```typescript
 * import { TransformersAdapter } from '@web-agent/transformers';
 * import { Agent } from '@web-agent/core';
 * 
 * // Create the adapter
 * const adapter = new TransformersAdapter({
 *   modelPath: 'Xenova/Phi-3-mini-4k-instruct',
 *   modelConfig: {
 *     maxTokens: 2048,
 *     temperature: 0.7,
 *   },
 * });
 * 
 * // Initialize (downloads model, loads into WebGPU/WASM)
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
 * @example With Function Calling
 * ```typescript
 * import { createTool } from '@web-agent/core';
 * import { z } from 'zod';
 * 
 * const weatherTool = createTool({
 *   id: 'get_weather',
 *   description: 'Get weather for a location',
 *   inputSchema: z.object({
 *     location: z.string(),
 *   }),
 *   execute: async ({ location }) => {
 *     // Fetch weather data
 *     return { temperature: 72, condition: 'sunny' };
 *   },
 * });
 * 
 * const result = await adapter.generate({
 *   messages: [{ role: 'user', content: 'What is the weather in Paris?' }],
 *   tools: [weatherTool],
 * });
 * 
 * if (result.toolCalls) {
 *   console.log('Tool calls:', result.toolCalls);
 * }
 * ```
 * 
 * @example Model-Specific Usage
 * ```typescript
 * // Phi-3
 * const phiAdapter = new TransformersAdapter({
 *   modelPath: 'Xenova/Phi-3-mini-4k-instruct',
 * });
 * 
 * // Llama
 * const llamaAdapter = new TransformersAdapter({
 *   modelPath: 'Xenova/llama-2-7b-chat',
 * });
 * 
 * // Mistral
 * const mistralAdapter = new TransformersAdapter({
 *   modelPath: 'Xenova/Mistral-7B-Instruct-v0.2',
 * });
 * 
 * // Gemma
 * const gemmaAdapter = new TransformersAdapter({
 *   modelPath: 'Xenova/gemma-2b-it',
 * });
 * ```
 */

// Main adapter
export { TransformersAdapter } from './adapter';

// Types
export {
  transformersConfigSchema,
  type TransformersConfig,
  type TransformersConfigResolved,
  type ModelFamily,
  type ToolDefinitionForTemplate,
  MODEL_CONTEXT_WINDOWS,
  MODEL_FAMILIES,
} from './types';

// Errors
export {
  TransformersError,
  ModelInitializationError,
  ModelNotInitializedError,
  InferenceError,
  ConfigurationError,
  WebGPUNotAvailableError,
  UnsupportedModelError,
} from './errors';

// Chat templates (advanced usage)
export {
  formatPhiChat,
  formatLlamaChat,
  formatMistralChat,
  formatGemmaChat,
  formatSimpleChat,
  parseToolCalls,
  detectModelFamily,
} from './chat-templates';


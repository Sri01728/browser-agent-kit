import { z } from 'zod';

/**
 * Configuration schema for MediaPipe LLM adapter
 */
export const mediaPipeConfigSchema = z.object({
  /**
   * Path to the model file (.bin) or URL
   * Can be a local path or a CDN URL to the Gemma model
   */
  modelPath: z.string().min(1, 'Model path is required'),

  /**
   * Maximum number of tokens to generate
   * @default 1024
   */
  maxTokens: z.number().int().positive().default(1024),

  /**
   * Sampling temperature (0.0 to 2.0)
   * Higher values = more random, lower = more deterministic
   * @default 0.7
   */
  temperature: z.number().min(0).max(2).default(0.7),

  /**
   * Top-P (nucleus) sampling threshold
   * @default 0.95
   */
  topP: z.number().min(0).max(1).default(0.95),

  /**
   * Top-K sampling - number of top tokens to consider
   * @default 40
   */
  topK: z.number().int().positive().default(40),

  /**
   * Random seed for reproducible outputs
   * @default undefined (random)
   */
  seed: z.number().int().optional(),

  /**
   * Enable WebGPU acceleration
   * Falls back to WASM if WebGPU unavailable
   * @default true
   */
  useWebGPU: z.boolean().default(true),

  /**
   * Number of LoRA ranks (for fine-tuned models)
   * @default 0 (disabled)
   */
  loraRanks: z.number().int().min(0).default(0),

  /**
   * Path to LoRA model file (optional)
   */
  loraPath: z.string().optional(),
});

export type MediaPipeConfig = z.input<typeof mediaPipeConfigSchema>;
export type MediaPipeConfigResolved = z.output<typeof mediaPipeConfigSchema>;

/**
 * Schema for parsed function calls from model output
 */
export const functionCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.unknown()),
});

export type FunctionCall = z.infer<typeof functionCallSchema>;

/**
 * Schema for tool/function call format in prompts
 */
export const toolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.unknown()),
});

export type ToolDefinitionInput = z.infer<typeof toolDefinitionSchema>;

/**
 * WebGPU availability status
 */
export const webGPUStatusSchema = z.enum(['available', 'unavailable', 'unknown']);
export type WebGPUStatus = z.infer<typeof webGPUStatusSchema>;


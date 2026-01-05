/**
 * Type definitions for Transformers.js adapter
 */

import { z } from 'zod';

/**
 * Configuration schema for Transformers adapter
 */
export const transformersConfigSchema = z.object({
  /** Hugging Face model identifier (e.g., 'Xenova/gemma-2b-it') or local path */
  modelPath: z.string().min(1, 'Model path cannot be empty'),
  
  /** Optional model configuration */
  modelConfig: z.object({
    maxTokens: z.number().min(1).max(32768).optional(),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().min(0).optional(),
    repetitionPenalty: z.number().min(0).optional(),
  }).optional(),
  
  /** Use WebGPU if available (default: true) */
  useWebGPU: z.boolean().optional().default(true),
  
  /** Use WebAssembly fallback (default: true) */
  useWASM: z.boolean().optional().default(true),
  
  /** Progress callback for model loading */
  onProgress: z.function()
    .args(z.object({ loaded: z.number(), total: z.number() }))
    .returns(z.void())
    .optional(),
});

export type TransformersConfig = z.input<typeof transformersConfigSchema>;
export type TransformersConfigResolved = z.output<typeof transformersConfigSchema>;

/**
 * Model-specific chat template types
 */
export type ModelFamily = 'phi' | 'llama' | 'mistral' | 'gemma' | 'gpt2' | 'qwen' | 'unknown';

/**
 * Function calling tool definition for chat templates
 */
export interface ToolDefinitionForTemplate {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

/**
 * Model-specific context window sizes
 */
export const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  'gpt2': 1024,
  'gpt2-medium': 1024,
  'gpt2-large': 1024,
  'gpt2-xl': 1024,
  'gemma': 8192,
  'gemma-2b': 8192,
  'gemma-2b-it': 8192,
  'gemma-7b': 8192,
  'gemma-7b-it': 8192,
  'llama': 4096,
  'llama-2': 4096,
  'llama-3': 8192,
  'mistral': 8192,
  'mistral-7b': 8192,
  'phi': 2048,
  'phi-2': 2048,
  'phi-3': 4096,
  'qwen': 32768,
  'qwen-2': 32768,
};

/**
 * Model families and their identifiers
 */
export const MODEL_FAMILIES: Record<ModelFamily, string[]> = {
  'phi': ['phi', 'phi-2', 'phi-3'],
  'llama': ['llama', 'llama-2', 'llama-3'],
  'mistral': ['mistral'],
  'gemma': ['gemma'],
  'gpt2': ['gpt2', 'gpt'],
  'qwen': ['qwen'],
  'unknown': [],
};


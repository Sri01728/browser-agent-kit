/**
 * Transformers.js LLM Adapter
 * 
 * Integrates @xenova/transformers for running Hugging Face models in the browser.
 * Supports text generation models like Phi-3, Llama, Mistral, Gemma, etc.
 * 
 * @example Basic Usage
 * ```typescript
 * import { TransformersAdapter } from '@web-agent/transformers';
 * 
 * const adapter = new TransformersAdapter({
 *   modelPath: 'Xenova/Phi-3-mini-4k-instruct',
 *   modelConfig: {
 *     maxTokens: 2048,
 *     temperature: 0.7,
 *   },
 * });
 * 
 * await adapter.initialize();
 * const result = await adapter.generate({
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * ```
 * 
 * @example With Function Calling
 * ```typescript
 * const result = await adapter.generate({
 *   messages: [{ role: 'user', content: 'What is the weather?' }],
 *   tools: [{
 *     name: 'get_weather',
 *     description: 'Get weather for a location',
 *     inputSchema: z.object({ location: z.string() }),
 *   }],
 * });
 * ```
 */

import type {
  LLMAdapter,
  GenerateOptions,
  GenerateResult,
  StreamChunk,
  Message,
  ToolDefinition,
} from '@web-agent/core';

import {
  transformersConfigSchema,
  type TransformersConfig,
  type TransformersConfigResolved,
  type ModelFamily,
  MODEL_CONTEXT_WINDOWS,
} from './types';

import {
  ModelInitializationError,
  ModelNotInitializedError,
  InferenceError,
  ConfigurationError,
  UnsupportedModelError,
} from './errors';

import {
  formatPhiChat,
  formatLlamaChat,
  formatMistralChat,
  formatGemmaChat,
  formatSimpleChat,
  parseToolCalls,
  detectModelFamily,
} from './chat-templates';

/**
 * Transformers.js adapter for browser-based LLM inference
 */
export class TransformersAdapter implements LLMAdapter {
  readonly id = 'transformers';
  readonly name = 'Transformers.js';
  
  private config: TransformersConfigResolved;
  private pipeline: any = null;
  private tokenizer: any = null;
  private model: any = null;
  private initialized = false;
  private modelFamily: ModelFamily = 'unknown';
  
  constructor(config: TransformersConfig) {
    // Validate config with Zod
    const result = transformersConfigSchema.safeParse(config);
    if (!result.success) {
      throw new ConfigurationError(
        `Invalid configuration: ${result.error.message}`,
        result.error
      );
    }
    
    this.config = result.data;
    this.modelFamily = detectModelFamily(this.config.modelPath);
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Dynamic import to avoid bundling transformers.js in all builds
      const { pipeline, env } = await import('@xenova/transformers');
      
      // Configure transformers.js environment
      env.allowLocalModels = true;
      env.allowRemoteModels = true;
      
      // Configure backend preference
      if (this.config.useWebGPU && 'gpu' in navigator) {
        try {
          // Try to use WebGPU if available
          env.backends.onnx.wasm.proxy = false;
        } catch {
          // WebGPU not available, fallback to WASM
        }
      }
      
      // Validate model type
      const modelId = this.config.modelPath;
      if (!this.isTextGenerationModel(modelId)) {
        throw new UnsupportedModelError(
          `Model ${modelId} is not a text generation model. ` +
          `Use models like 'Xenova/Phi-3-mini-4k-instruct', 'Xenova/gemma-2b-it', etc.`,
          modelId
        );
      }
      
      // Create pipeline with progress callback
      const progressCallback = this.config.onProgress
        ? (progress: { loaded: number; total: number }) => {
            this.config.onProgress?.(progress);
          }
        : undefined;
      
      // Create text-generation pipeline
      this.pipeline = await pipeline(
        'text-generation',
        modelId,
        {
          progress_callback: progressCallback,
        }
      );
      
      // Extract tokenizer and model from pipeline
      this.tokenizer = this.pipeline.tokenizer;
      this.model = this.pipeline.model;
      
      this.initialized = true;
    } catch (error) {
      throw new ModelInitializationError(
        `Failed to initialize Transformers.js adapter: ${error instanceof Error ? error.message : String(error)}`,
        this.config.modelPath,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  isReady(): boolean {
    return this.initialized;
  }
  
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    this.ensureInitialized();
    
    const prompt = this.formatMessages(options.messages, options.tools);
    const config = this.config.modelConfig || {};
    
    try {
      const result = await this.pipeline(prompt, {
        max_new_tokens: config.maxTokens ?? options.maxTokens ?? 512,
        temperature: config.temperature ?? options.temperature ?? 0.7,
        top_p: config.topP ?? options.topP,
        top_k: config.topK,
        repetition_penalty: config.repetitionPenalty ?? options.frequencyPenalty ?? 1.0,
        do_sample: true,
        return_full_text: false,
      });
      
      // Extract generated text from transformers.js result
      let generatedText = this.extractGeneratedText(result);
      
      // Remove the original prompt if it's included
      if (generatedText.startsWith(prompt)) {
        generatedText = generatedText.slice(prompt.length).trim();
      }
      
      // Parse tool calls if tools were provided
      const toolCalls = options.tools 
        ? parseToolCalls(generatedText, this.modelFamily)
        : undefined;
      
      // Calculate token usage (approximate)
      const promptTokens = this.estimateTokens(prompt);
      const completionTokens = this.estimateTokens(generatedText);
      
      return {
        text: generatedText,
        finishReason: toolCalls ? 'tool_calls' : 'stop',
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        toolCalls,
      };
    } catch (error) {
      throw new InferenceError(
        `Generation failed: ${error instanceof Error ? error.message : String(error)}`,
        prompt,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  async *stream(options: GenerateOptions): AsyncGenerator<StreamChunk, void, unknown> {
    this.ensureInitialized();
    
    const prompt = this.formatMessages(options.messages, options.tools);
    const config = this.config.modelConfig || {};
    
    try {
      // Transformers.js doesn't have built-in streaming for text-generation
      // We generate the full response and simulate streaming
      const result = await this.pipeline(prompt, {
        max_new_tokens: config.maxTokens ?? options.maxTokens ?? 512,
        temperature: config.temperature ?? options.temperature ?? 0.7,
        top_p: config.topP ?? options.topP,
        top_k: config.topK,
        repetition_penalty: config.repetitionPenalty ?? options.frequencyPenalty ?? 1.0,
        do_sample: true,
        return_full_text: false,
      });
      
      // Extract generated text
      let generatedText = this.extractGeneratedText(result);
      
      // Remove the original prompt if included
      if (generatedText.startsWith(prompt)) {
        generatedText = generatedText.slice(prompt.length).trim();
      }
      
      // Simulate streaming by yielding word by word
      const words = generatedText.split(/(\s+)/);
      for (const word of words) {
        if (word) {
          yield {
            type: 'text',
            text: word,
          };
        }
      }
      
      // Parse tool calls if tools were provided
      const toolCalls = options.tools 
        ? parseToolCalls(generatedText, this.modelFamily)
        : undefined;
      
      // Yield tool calls if present
      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          yield {
            type: 'tool_call',
            toolCall,
          };
        }
      }
      
      // Calculate token usage
      const promptTokens = this.estimateTokens(prompt);
      const completionTokens = this.estimateTokens(generatedText);
      
      // Final done chunk
      yield {
        type: 'done',
        finishReason: toolCalls ? 'tool_calls' : 'stop',
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
      };
    } catch (error) {
      throw new InferenceError(
        `Streaming failed: ${error instanceof Error ? error.message : String(error)}`,
        prompt,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  supportsTools(): boolean {
    // All models support tools via chat templates
    return true;
  }
  
  getContextWindow(): number {
    const modelId = this.config.modelPath.toLowerCase();
    
    // Try to match model name
    for (const [key, size] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
      if (modelId.includes(key)) {
        return size;
      }
    }
    
    // Default context window
    return 2048;
  }
  
  dispose(): void {
    this.pipeline = null;
    this.tokenizer = null;
    this.model = null;
    this.initialized = false;
  }
  
  /**
   * Ensure model is initialized before use
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new ModelNotInitializedError();
    }
  }
  
  /**
   * Format messages for the specific model family
   */
  private formatMessages(messages: Message[], tools?: ToolDefinition[]): string {
    switch (this.modelFamily) {
      case 'phi':
        return formatPhiChat(messages, tools);
      case 'llama':
        return formatLlamaChat(messages, tools);
      case 'mistral':
        return formatMistralChat(messages, tools);
      case 'gemma':
        return formatGemmaChat(messages, tools);
      case 'gpt2':
      case 'qwen':
      case 'unknown':
      default:
        return formatSimpleChat(messages, tools);
    }
  }
  
  /**
   * Extract generated text from transformers.js result
   */
  private extractGeneratedText(result: any): string {
    // Result can be an array or object depending on model
    if (Array.isArray(result)) {
      // Array format: [{ generated_text: "..." }]
      return result[0]?.generated_text ?? '';
    } else if (result && typeof result === 'object') {
      // Object format: { generated_text: "..." } or { text: "..." }
      return result.generated_text ?? result.text ?? '';
    } else if (typeof result === 'string') {
      // String format (some models return directly)
      return result;
    }
    
    return '';
  }
  
  /**
   * Check if model is a text generation model
   */
  private isTextGenerationModel(modelId: string): boolean {
    const textGenModels = [
      'gpt2',
      'gpt',
      'gemma',
      'llama',
      'mistral',
      'phi',
      'qwen',
      't5',
      'flan',
    ];
    
    const lowerId = modelId.toLowerCase();
    return textGenModels.some((model) => lowerId.includes(model));
  }
  
  /**
   * Estimate token count for text
   */
  private estimateTokens(text: string): number {
    // Use tokenizer if available for accurate counting
    if (this.tokenizer) {
      try {
        const tokens = this.tokenizer.encode(text);
        return Array.isArray(tokens) ? tokens.length : tokens.input_ids?.length ?? 0;
      } catch {
        // Fallback to estimation
      }
    }
    
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}


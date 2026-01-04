/**
 * Transformers.js LLM Adapter
 * 
 * Integrates @xenova/transformers for running Hugging Face models in the browser.
 * Supports text generation models like GPT-2, Llama, Mistral, Gemma, etc.
 * 
 * @example
 * ```ts
 * const adapter = new TransformersAdapter({
 *   modelPath: 'Xenova/gemma-2b-it',
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
 */

import { BaseLLMAdapter } from '../base-adapter';
import type {
  LLMAdapterConfig,
  GenerateOptions,
  GenerateResult,
  StreamChunk,
  Message,
} from '../types';

export interface TransformersAdapterConfig extends LLMAdapterConfig {
  /** Hugging Face model identifier (e.g., 'Xenova/gemma-2b-it') or local path */
  modelPath: string;
  
  /** Optional model configuration */
  modelConfig?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    repetitionPenalty?: number;
  };
  
  /** Use WebGPU if available (default: true) */
  useWebGPU?: boolean;
  
  /** Use WebAssembly fallback (default: true) */
  useWASM?: boolean;
  
  /** Progress callback for model loading */
  onProgress?: (progress: { loaded: number; total: number }) => void;
}

export class TransformersAdapter extends BaseLLMAdapter {
  id = 'transformers';
  name = 'Transformers.js';
  
  private pipeline: any = null;
  private tokenizer: any = null;
  private model: any = null;
  protected config: TransformersAdapterConfig;
  
  // Model-specific context windows
  private readonly contextWindows: Record<string, number> = {
    'gpt2': 1024,
    'gpt2-medium': 1024,
    'gpt2-large': 1024,
    'gpt2-xl': 1024,
    'gemma': 8192,
    'gemma-2b': 8192,
    'gemma-2b-it': 8192,
    'llama': 4096,
    'mistral': 8192,
    'phi': 2048,
    'qwen': 32768,
  };
  
  constructor(config: TransformersAdapterConfig) {
    super(config);
    this.config = config; // Store the extended config
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
      // Note: WebGPU support depends on browser and model compatibility
      if (this.config.useWebGPU !== false && 'gpu' in navigator) {
        try {
          env.backends.onnx.wasm.proxy = false;
        } catch {
          // WebGPU not available, fallback to WASM
        }
      }
      
      // Determine model type from path
      const modelId = this.config.modelPath;
      const isTextGeneration = this.isTextGenerationModel(modelId);
      
      if (!isTextGeneration) {
        throw new Error(
          `Model ${modelId} is not a text generation model. ` +
          `Use models like 'Xenova/gpt2', 'Xenova/gemma-2b-it', etc.`
        );
      }
      
      // Create pipeline with progress callback
      const progressCallback = this.config.onProgress
        ? (progress: { loaded: number; total: number }) => {
            this.config.onProgress?.(progress);
          }
        : undefined;
      
      // Create text-generation pipeline
      // Note: device selection is handled automatically by transformers.js
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
      throw new Error(
        `Failed to initialize Transformers.js adapter: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    this.ensureInitialized();
    
    const prompt = this.formatMessages(options.messages);
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
      // Result can be an array or object depending on model
      let generatedText = '';
      if (Array.isArray(result)) {
        // Array format: [{ generated_text: "..." }]
        generatedText = result[0]?.generated_text ?? '';
      } else if (result && typeof result === 'object') {
        // Object format: { generated_text: "..." } or { text: "..." }
        generatedText = result.generated_text ?? result.text ?? '';
      } else if (typeof result === 'string') {
        // String format (some models return directly)
        generatedText = result;
      }
      
      // Remove the original prompt if it's included
      if (generatedText.startsWith(prompt)) {
        generatedText = generatedText.slice(prompt.length).trim();
      }
      
      // Calculate token usage (approximate)
      const promptTokens = this.estimateTokens(prompt);
      const completionTokens = this.estimateTokens(generatedText);
      
      return {
        text: generatedText,
        finishReason: 'stop',
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
      };
    } catch (error) {
      throw new Error(
        `Generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  async *stream(options: GenerateOptions): AsyncGenerator<StreamChunk, void, unknown> {
    this.ensureInitialized();
    
    const prompt = this.formatMessages(options.messages);
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
      let generatedText = '';
      if (Array.isArray(result)) {
        generatedText = result[0]?.generated_text ?? '';
      } else if (result && typeof result === 'object') {
        generatedText = result.generated_text ?? result.text ?? '';
      } else if (typeof result === 'string') {
        generatedText = result;
      }
      
      // Remove the original prompt if included
      if (generatedText.startsWith(prompt)) {
        generatedText = generatedText.slice(prompt.length).trim();
      }
      
      // Simulate streaming by yielding token by token (word by word for better UX)
      // In production, you might want to use actual token streaming if available
      const words = generatedText.split(/(\s+)/);
      for (const word of words) {
        if (word.trim()) {
          yield {
            type: 'text',
            text: word,
          };
        } else if (word) {
          // Preserve whitespace
          yield {
            type: 'text',
            text: word,
          };
        }
      }
      
      const promptTokens = this.estimateTokens(prompt);
      const completionTokens = this.estimateTokens(generatedText);
      
      yield {
        type: 'done',
        finishReason: 'stop',
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
      };
    } catch (error) {
      throw new Error(
        `Streaming failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  getContextWindow(): number {
    const modelId = this.config.modelPath.toLowerCase();
    
    // Try to match model name
    for (const [key, size] of Object.entries(this.contextWindows)) {
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
  
  protected formatMessages(messages: Message[]): string {
    // Format messages based on model type
    const modelId = this.config.modelPath.toLowerCase();
    
    if (modelId.includes('gemma') || modelId.includes('llama')) {
      // Chat template format for Gemma/Llama
      return this.formatChatTemplate(messages);
    } else if (modelId.includes('mistral')) {
      // Mistral chat format
      return this.formatMistralChat(messages);
    } else {
      // Simple format for GPT-2 and others
      return this.formatSimple(messages);
    }
  }
  
  private formatChatTemplate(messages: Message[]): string {
    // Gemma/Llama style chat template
    let prompt = '';
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        prompt += `<start_of_turn>system\n${msg.content}<end_of_turn>\n`;
      } else if (msg.role === 'user') {
        prompt += `<start_of_turn>user\n${msg.content}<end_of_turn>\n`;
      } else if (msg.role === 'assistant') {
        prompt += `<start_of_turn>model\n${msg.content}<end_of_turn>\n`;
      }
    }
    
    prompt += `<start_of_turn>model\n`;
    return prompt;
  }
  
  private formatMistralChat(messages: Message[]): string {
    // Mistral uses [INST] tags
    let prompt = '';
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        prompt += `<s>[INST] ${msg.content} [/INST]`;
      } else if (msg.role === 'user') {
        prompt += `[INST] ${msg.content} [/INST]`;
      } else if (msg.role === 'assistant') {
        prompt += ` ${msg.content}</s>`;
      }
    }
    
    return prompt;
  }
  
  private formatSimple(messages: Message[]): string {
    // Simple format: concatenate messages
    return messages
      .map((msg) => {
        if (msg.role === 'system') {
          return `System: ${msg.content}`;
        } else if (msg.role === 'user') {
          return `User: ${msg.content}`;
        } else if (msg.role === 'assistant') {
          return `Assistant: ${msg.content}`;
        }
        return msg.content;
      })
      .join('\n\n') + '\n\nAssistant:';
  }
  
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
  
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    // For accurate counting, use the tokenizer if available
    if (this.tokenizer) {
      try {
        const tokens = this.tokenizer.encode(text);
        return Array.isArray(tokens) ? tokens.length : tokens.input_ids?.length ?? 0;
      } catch {
        // Fallback to estimation
      }
    }
    
    return Math.ceil(text.length / 4);
  }
}


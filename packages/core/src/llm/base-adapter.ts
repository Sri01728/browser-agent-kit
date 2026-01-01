import type {
  LLMAdapter,
  LLMAdapterConfig,
  GenerateOptions,
  GenerateResult,
  StreamChunk,
} from './types';

/**
 * Base class for LLM adapters with common functionality
 */
export abstract class BaseLLMAdapter implements LLMAdapter {
  abstract id: string;
  abstract name: string;
  
  protected config: LLMAdapterConfig;
  protected initialized = false;
  
  constructor(config: LLMAdapterConfig) {
    this.config = config;
  }
  
  abstract initialize(): Promise<void>;
  
  isReady(): boolean {
    return this.initialized;
  }
  
  abstract generate(options: GenerateOptions): Promise<GenerateResult>;
  
  abstract stream(options: GenerateOptions): AsyncGenerator<StreamChunk, void, unknown>;
  
  supportsTools(): boolean {
    return false; // Override in subclass if supported
  }
  
  getContextWindow(): number {
    return 4096; // Default, override in subclass
  }
  
  abstract dispose(): void;
  
  /**
   * Ensure model is initialized before use
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`${this.name} adapter not initialized. Call initialize() first.`);
    }
  }
  
  /**
   * Format messages for the specific model
   */
  protected abstract formatMessages(messages: GenerateOptions['messages']): string;
  
  /**
   * Parse tool calls from model output
   */
  protected parseToolCalls(text: string): GenerateResult['toolCalls'] | undefined {
    // Default implementation - override in subclass
    return undefined;
  }
}


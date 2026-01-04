/**
 * Transformers.js Summarization Adapter
 * 
 * Integrates @xenova/transformers for running summarization models in the browser.
 * Supports abstractive and extractive text summarization.
 * 
 * @example
 * ```ts
 * const adapter = new SummarizationAdapter({
 *   modelPath: 'Xenova/distilbart-cnn-12-6',
 * });
 * 
 * await adapter.initialize();
 * const result = await adapter.summarize('Long text to summarize...');
 * console.log(result); // { summary: 'Short summary...', length: 50 }
 * ```
 */

export interface SummarizationAdapterConfig {
  /** Hugging Face model identifier */
  modelPath: string;
  
  /** Maximum length of summary (default: 130) */
  maxLength?: number;
  
  /** Minimum length of summary (default: 30) */
  minLength?: number;
  
  /** Use WebGPU if available (default: true) */
  useWebGPU?: boolean;
  
  /** Progress callback for model loading */
  onProgress?: (progress: { loaded: number; total: number }) => void;
}

export interface SummarizationResult {
  /** Generated summary text */
  summary: string;
  
  /** Length of the summary */
  length: number;
}

export class SummarizationAdapter {
  id = 'summarization';
  name = 'Summarization';
  
  private pipeline: any = null;
  private config: SummarizationAdapterConfig;
  private initialized = false;
  
  constructor(config: SummarizationAdapterConfig) {
    this.config = {
      maxLength: 130,
      minLength: 30,
      ...config,
    };
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      const { pipeline, env } = await import('@xenova/transformers');
      
      env.allowLocalModels = true;
      env.allowRemoteModels = true;
      
      if (this.config.useWebGPU !== false && 'gpu' in navigator) {
        try {
          env.backends.onnx.wasm.proxy = false;
        } catch {
          // WebGPU not available
        }
      }
      
      const progressCallback = this.config.onProgress
        ? (progress: { loaded: number; total: number }) => {
            this.config.onProgress?.(progress);
          }
        : undefined;
      
      this.pipeline = await pipeline(
        'summarization',
        this.config.modelPath,
        {
          progress_callback: progressCallback,
        }
      );
      
      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Summarization adapter: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  async summarize(text: string): Promise<SummarizationResult> {
    this.ensureInitialized();
    
    if (!text || !text.trim()) {
      throw new Error('Text to summarize cannot be empty');
    }
    
    try {
      const result = await this.pipeline(text, {
        max_length: this.config.maxLength,
        min_length: this.config.minLength,
      });
      
      // Result format: [{ summary_text: "..." }] or { summary_text: "..." }
      let summary = '';
      
      if (Array.isArray(result)) {
        summary = result[0]?.summary_text ?? result[0]?.summary ?? '';
      } else if (result && typeof result === 'object') {
        summary = result.summary_text ?? result.summary ?? '';
      } else if (typeof result === 'string') {
        summary = result;
      }
      
      return {
        summary: summary.trim(),
        length: summary.length,
      };
    } catch (error) {
      throw new Error(
        `Summarization failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  async summarizeBatch(texts: string[]): Promise<SummarizationResult[]> {
    this.ensureInitialized();
    
    const results: SummarizationResult[] = [];
    for (const text of texts) {
      const result = await this.summarize(text);
      results.push(result);
    }
    
    return results;
  }
  
  isReady(): boolean {
    return this.initialized;
  }
  
  dispose(): void {
    this.pipeline = null;
    this.initialized = false;
  }
  
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Summarization adapter not initialized. Call initialize() first.');
    }
  }
}


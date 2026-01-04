/**
 * Transformers.js Text Classification Adapter
 * 
 * Integrates @xenova/transformers for running text classification models in the browser.
 * Supports sentiment analysis, topic classification, and other text classification tasks.
 * 
 * @example
 * ```ts
 * const adapter = new TextClassificationAdapter({
 *   modelPath: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
 * });
 * 
 * await adapter.initialize();
 * const result = await adapter.classify('I love this product!');
 * console.log(result); // { label: 'POSITIVE', score: 0.9998 }
 * ```
 */

export interface TextClassificationAdapterConfig {
  /** Hugging Face model identifier */
  modelPath: string;
  
  /** Use WebGPU if available (default: true) */
  useWebGPU?: boolean;
  
  /** Progress callback for model loading */
  onProgress?: (progress: { loaded: number; total: number }) => void;
}

export interface ClassificationResult {
  /** Classification label */
  label: string;
  
  /** Confidence score (0-1) */
  score: number;
}

export interface ClassificationResults {
  /** Top classification result */
  top: ClassificationResult;
  
  /** All classification results */
  all: ClassificationResult[];
}

export class TextClassificationAdapter {
  id = 'text-classification';
  name = 'Text Classification';
  
  private pipeline: any = null;
  private config: TextClassificationAdapterConfig;
  private initialized = false;
  
  constructor(config: TextClassificationAdapterConfig) {
    this.config = config;
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
        'text-classification',
        this.config.modelPath,
        {
          progress_callback: progressCallback,
        }
      );
      
      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Text Classification adapter: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  async classify(text: string): Promise<ClassificationResults> {
    this.ensureInitialized();
    
    if (!text || !text.trim()) {
      throw new Error('Text to classify cannot be empty');
    }
    
    try {
      const result = await this.pipeline(text);
      
      // Result format: [{ label: "...", score: 0.99 }] or { label: "...", score: 0.99 }
      let results: ClassificationResult[] = [];
      
      if (Array.isArray(result)) {
        results = result.map((r: any) => ({
          label: r.label || r.label_name || '',
          score: r.score || 0,
        }));
      } else if (result && typeof result === 'object') {
        results = [{
          label: result.label || result.label_name || '',
          score: result.score || 0,
        }];
      }
      
      // Sort by score descending
      results.sort((a, b) => b.score - a.score);
      
      return {
        top: results[0] || { label: 'UNKNOWN', score: 0 },
        all: results,
      };
    } catch (error) {
      throw new Error(
        `Classification failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  async classifyBatch(texts: string[]): Promise<ClassificationResults[]> {
    this.ensureInitialized();
    
    const results: ClassificationResults[] = [];
    for (const text of texts) {
      const result = await this.classify(text);
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
      throw new Error('Text Classification adapter not initialized. Call initialize() first.');
    }
  }
}


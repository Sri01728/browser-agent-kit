/**
 * Transformers.js Image Classification Adapter
 * 
 * Integrates @xenova/transformers for running image classification models in the browser.
 * Supports image recognition, object identification, and scene classification.
 * 
 * @example
 * ```ts
 * const adapter = new ImageClassificationAdapter({
 *   modelPath: 'Xenova/vit-base-patch16-224',
 * });
 * 
 * await adapter.initialize();
 * const image = await loadImage('path/to/image.jpg');
 * const result = await adapter.classify(image);
 * console.log(result); // { label: 'golden retriever', score: 0.95 }
 * ```
 */

export interface ImageClassificationAdapterConfig {
  /** Hugging Face model identifier */
  modelPath: string;
  
  /** Use WebGPU if available (default: true) */
  useWebGPU?: boolean;
  
  /** Progress callback for model loading */
  onProgress?: (progress: { loaded: number; total: number }) => void;
}

export interface ImageClassificationResult {
  /** Classification label */
  label: string;
  
  /** Confidence score (0-1) */
  score: number;
}

export interface ImageClassificationResults {
  /** Top classification result */
  top: ImageClassificationResult;
  
  /** All classification results */
  all: ImageClassificationResult[];
}

export class ImageClassificationAdapter {
  id = 'image-classification';
  name = 'Image Classification';
  
  private pipeline: any = null;
  private config: ImageClassificationAdapterConfig;
  private initialized = false;
  
  constructor(config: ImageClassificationAdapterConfig) {
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
        'image-classification',
        this.config.modelPath,
        {
          progress_callback: progressCallback,
        }
      );
      
      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Image Classification adapter: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  async classify(image: HTMLImageElement | HTMLCanvasElement | ImageData | string | Blob): Promise<ImageClassificationResults> {
    this.ensureInitialized();
    
    if (!image) {
      throw new Error('Image to classify cannot be empty');
    }
    
    try {
      const result = await this.pipeline(image);
      
      // Result format: [{ label: "...", score: 0.99 }] or { label: "...", score: 0.99 }
      let results: ImageClassificationResult[] = [];
      
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
        `Image classification failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  async classifyBatch(images: (HTMLImageElement | HTMLCanvasElement | ImageData | string | Blob)[]): Promise<ImageClassificationResults[]> {
    this.ensureInitialized();
    
    const results: ImageClassificationResults[] = [];
    for (const image of images) {
      const result = await this.classify(image);
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
      throw new Error('Image Classification adapter not initialized. Call initialize() first.');
    }
  }
}


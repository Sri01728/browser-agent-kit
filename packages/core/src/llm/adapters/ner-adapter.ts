/**
 * Transformers.js Named Entity Recognition (NER) Adapter
 * 
 * Integrates @xenova/transformers for running NER models in the browser.
 * Supports identifying and classifying named entities in text (persons, organizations, locations, etc.).
 * 
 * @example
 * ```ts
 * const adapter = new NamedEntityRecognitionAdapter({
 *   modelPath: 'Xenova/bert-base-NER',
 * });
 * 
 * await adapter.initialize();
 * const result = await adapter.recognize('Apple is headquartered in Cupertino, California.');
 * console.log(result); // [{ entity: 'ORG', word: 'Apple', ... }, { entity: 'LOC', word: 'Cupertino', ... }]
 * ```
 */

export interface NamedEntityRecognitionAdapterConfig {
  /** Hugging Face model identifier */
  modelPath: string;
  
  /** Use WebGPU if available (default: true) */
  useWebGPU?: boolean;
  
  /** Progress callback for model loading */
  onProgress?: (progress: { loaded: number; total: number }) => void;
}

export interface NamedEntity {
  /** Entity label (e.g., 'PER', 'ORG', 'LOC') */
  entity: string;
  
  /** Entity group (e.g., 'person', 'organization', 'location') */
  entity_group?: string;
  
  /** The word/phrase that is the entity */
  word: string;
  
  /** Confidence score (0-1) */
  score: number;
  
  /** Start position in the text */
  start: number;
  
  /** End position in the text */
  end: number;
}

export class NamedEntityRecognitionAdapter {
  id = 'named-entity-recognition';
  name = 'Named Entity Recognition';
  
  private pipeline: any = null;
  private config: NamedEntityRecognitionAdapterConfig;
  private initialized = false;
  
  constructor(config: NamedEntityRecognitionAdapterConfig) {
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
        'token-classification',
        this.config.modelPath,
        {
          progress_callback: progressCallback,
        }
      );
      
      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize NER adapter: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  async recognize(text: string): Promise<NamedEntity[]> {
    this.ensureInitialized();
    
    if (!text || !text.trim()) {
      throw new Error('Text to analyze cannot be empty');
    }
    
    try {
      const result = await this.pipeline(text);
      
      // Result format: [{ entity: "...", word: "...", score: 0.99, start: 0, end: 5 }]
      let entities: NamedEntity[] = [];
      
      if (Array.isArray(result)) {
        entities = result.map((r: any) => ({
          entity: r.entity || r.label || '',
          entity_group: r.entity_group || r.group || undefined,
          word: r.word || r.text || '',
          score: r.score || 0,
          start: r.start || 0,
          end: r.end || 0,
        }));
      } else if (result && typeof result === 'object') {
        entities = [{
          entity: result.entity || result.label || '',
          entity_group: result.entity_group || result.group || undefined,
          word: result.word || result.text || '',
          score: result.score || 0,
          start: result.start || 0,
          end: result.end || 0,
        }];
      }
      
      // Sort by start position
      entities.sort((a, b) => a.start - b.start);
      
      return entities;
    } catch (error) {
      throw new Error(
        `NER failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  async recognizeBatch(texts: string[]): Promise<NamedEntity[][]> {
    this.ensureInitialized();
    
    const results: NamedEntity[][] = [];
    for (const text of texts) {
      const result = await this.recognize(text);
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
      throw new Error('NER adapter not initialized. Call initialize() first.');
    }
  }
}


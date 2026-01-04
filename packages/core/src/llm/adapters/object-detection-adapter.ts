/**
 * Transformers.js Object Detection Adapter
 * 
 * Integrates @xenova/transformers for running object detection models in the browser.
 * Supports detecting and localizing objects in images with bounding boxes.
 * 
 * @example
 * ```ts
 * const adapter = new ObjectDetectionAdapter({
 *   modelPath: 'Xenova/detr-resnet-50',
 * });
 * 
 * await adapter.initialize();
 * const image = await loadImage('path/to/image.jpg');
 * const result = await adapter.detect(image);
 * console.log(result); // [{ label: 'person', score: 0.95, box: {...} }]
 * ```
 */

export interface ObjectDetectionAdapterConfig {
  /** Hugging Face model identifier */
  modelPath: string;
  
  /** Confidence threshold (0-1, default: 0.5) */
  threshold?: number;
  
  /** Use WebGPU if available (default: true) */
  useWebGPU?: boolean;
  
  /** Progress callback for model loading */
  onProgress?: (progress: { loaded: number; total: number }) => void;
}

export interface BoundingBox {
  /** X coordinate of top-left corner */
  xmin: number;
  /** Y coordinate of top-left corner */
  ymin: number;
  /** X coordinate of bottom-right corner */
  xmax: number;
  /** Y coordinate of bottom-right corner */
  ymax: number;
}

export interface DetectedObject {
  /** Object label */
  label: string;
  
  /** Confidence score (0-1) */
  score: number;
  
  /** Bounding box coordinates */
  box: BoundingBox;
}

export class ObjectDetectionAdapter {
  id = 'object-detection';
  name = 'Object Detection';
  
  private pipeline: any = null;
  private config: ObjectDetectionAdapterConfig;
  private initialized = false;
  
  constructor(config: ObjectDetectionAdapterConfig) {
    this.config = {
      threshold: 0.5,
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
        'object-detection',
        this.config.modelPath,
        {
          progress_callback: progressCallback,
        }
      );
      
      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Object Detection adapter: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  async detect(image: HTMLImageElement | HTMLCanvasElement | ImageData | string | Blob): Promise<DetectedObject[]> {
    this.ensureInitialized();
    
    if (!image) {
      throw new Error('Image to detect objects in cannot be empty');
    }
    
    try {
      const result = await this.pipeline(image, {
        threshold: this.config.threshold,
      });
      
      // Result format: [{ label: "...", score: 0.99, box: {...} }]
      let detections: DetectedObject[] = [];
      
      if (Array.isArray(result)) {
        detections = result
          .filter((r: any) => (r.score || 0) >= (this.config.threshold || 0.5))
          .map((r: any) => ({
            label: r.label || r.label_name || '',
            score: r.score || 0,
            box: this.normalizeBox(r.box || r.bbox || {}),
          }));
      } else if (result && typeof result === 'object') {
        if (result.score >= (this.config.threshold || 0.5)) {
          detections = [{
            label: result.label || result.label_name || '',
            score: result.score || 0,
            box: this.normalizeBox(result.box || result.bbox || {}),
          }];
        }
      }
      
      // Sort by score descending
      detections.sort((a, b) => b.score - a.score);
      
      return detections;
    } catch (error) {
      throw new Error(
        `Object detection failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  async detectBatch(images: (HTMLImageElement | HTMLCanvasElement | ImageData | string | Blob)[]): Promise<DetectedObject[][]> {
    this.ensureInitialized();
    
    const results: DetectedObject[][] = [];
    for (const image of images) {
      const result = await this.detect(image);
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
      throw new Error('Object Detection adapter not initialized. Call initialize() first.');
    }
  }
  
  private normalizeBox(box: any): BoundingBox {
    // Handle different box formats
    if (box.xmin !== undefined && box.ymin !== undefined && box.xmax !== undefined && box.ymax !== undefined) {
      return {
        xmin: box.xmin,
        ymin: box.ymin,
        xmax: box.xmax,
        ymax: box.ymax,
      };
    }
    
    // Handle [xmin, ymin, xmax, ymax] format
    if (Array.isArray(box) && box.length >= 4) {
      return {
        xmin: box[0],
        ymin: box[1],
        xmax: box[2],
        ymax: box[3],
      };
    }
    
    // Default empty box
    return { xmin: 0, ymin: 0, xmax: 0, ymax: 0 };
  }
}


/**
 * Model Loading Utilities for Production Deployment
 * 
 * This module provides utilities for loading the Gemma model in production
 * with support for various hosting options, caching, and progress tracking.
 */

// =============================================================================
// Types
// =============================================================================

export interface ModelLoadOptions {
  /** Path or URL to the model file */
  modelPath: string;
  
  /** Enable IndexedDB caching (default: true) */
  enableCache?: boolean;
  
  /** Cache key for IndexedDB (default: 'gemma-2b-model') */
  cacheKey?: string;
  
  /** Progress callback */
  onProgress?: (progress: number, status: string) => void;
  
  /** Force re-download even if cached */
  forceDownload?: boolean;
}

export interface ModelInfo {
  /** Total size in bytes */
  size: number;
  
  /** Whether model is cached */
  isCached: boolean;
  
  /** Cache timestamp if cached */
  cachedAt?: number;
  
  /** Source URL */
  source: string;
}

// =============================================================================
// IndexedDB Cache for Model Storage
// =============================================================================

const DB_NAME = 'web-agent-models';
const DB_VERSION = 1;
const STORE_NAME = 'models';

class ModelCache {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
    });
  }

  async set(key: string, data: ArrayBuffer): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
        size: data.byteLength,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  async getInfo(key: string): Promise<{ timestamp: number; size: number } | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? { timestamp: result.timestamp, size: result.size } : null);
      };
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Singleton instance
export const modelCache = new ModelCache();

// =============================================================================
// Model Loading Functions
// =============================================================================

/**
 * Check if the model is cached locally
 */
export async function isModelCached(cacheKey = 'gemma-2b-model'): Promise<boolean> {
  try {
    return await modelCache.has(cacheKey);
  } catch {
    return false;
  }
}

/**
 * Get information about a cached model
 */
export async function getModelInfo(cacheKey = 'gemma-2b-model'): Promise<ModelInfo | null> {
  try {
    const info = await modelCache.getInfo(cacheKey);
    if (!info) return null;

    return {
      size: info.size,
      isCached: true,
      cachedAt: info.timestamp,
      source: 'cache',
    };
  } catch {
    return null;
  }
}

/**
 * Download model with progress tracking and caching
 */
export async function downloadModel(options: ModelLoadOptions): Promise<ArrayBuffer> {
  const {
    modelPath,
    enableCache = true,
    cacheKey = 'gemma-2b-model',
    onProgress,
    forceDownload = false,
  } = options;

  // Check cache first
  if (enableCache && !forceDownload) {
    onProgress?.(0, 'Checking cache...');
    const cached = await modelCache.get(cacheKey);
    if (cached) {
      onProgress?.(100, 'Loaded from cache');
      return cached;
    }
  }

  // Download model
  onProgress?.(0, 'Starting download...');

  const response = await fetch(modelPath);
  if (!response.ok) {
    throw new Error(`Failed to download model: ${response.status} ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to get response body reader');
  }

  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    received += value.length;

    if (total > 0) {
      const progress = Math.round((received / total) * 100);
      const mb = (received / 1024 / 1024).toFixed(1);
      const totalMb = (total / 1024 / 1024).toFixed(1);
      onProgress?.(progress, `Downloading: ${mb}MB / ${totalMb}MB`);
    } else {
      const mb = (received / 1024 / 1024).toFixed(1);
      onProgress?.(50, `Downloading: ${mb}MB`);
    }
  }

  // Combine chunks
  const data = new Uint8Array(received);
  let position = 0;
  for (const chunk of chunks) {
    data.set(chunk, position);
    position += chunk.length;
  }

  const arrayBuffer = data.buffer;

  // Cache the model
  if (enableCache) {
    onProgress?.(100, 'Caching model...');
    try {
      await modelCache.set(cacheKey, arrayBuffer);
      onProgress?.(100, 'Model cached successfully');
    } catch (e) {
      console.warn('Failed to cache model:', e);
    }
  }

  return arrayBuffer;
}

/**
 * Clear cached models
 */
export async function clearModelCache(): Promise<void> {
  await modelCache.clear();
}

// =============================================================================
// Model Hosting Configurations
// =============================================================================

/**
 * Pre-configured model sources for different deployment scenarios
 */
export const MODEL_SOURCES = {
  /**
   * Local development - model served from public folder
   * Place model at: public/models/gemma-2b-it-gpu-int4.bin
   */
  local: '/models/gemma-2b-it-gpu-int4.bin',

  /**
   * Vercel deployment
   * 1. Add model to public/models/
   * 2. Configure vercel.json for large files
   * 3. Use Edge Functions for serving
   */
  vercel: '/models/gemma-2b-it-gpu-int4.bin',

  /**
   * AWS S3 / CloudFront
   * 1. Upload model to S3 bucket
   * 2. Configure CORS for your domain
   * 3. Use CloudFront for CDN delivery
   */
  awsS3: (bucket: string, region = 'us-east-1') =>
    `https://${bucket}.s3.${region}.amazonaws.com/models/gemma-2b-it-gpu-int4.bin`,

  /**
   * Google Cloud Storage
   * 1. Upload model to GCS bucket
   * 2. Make bucket public or configure signed URLs
   * 3. Enable CDN for performance
   */
  gcs: (bucket: string) =>
    `https://storage.googleapis.com/${bucket}/models/gemma-2b-it-gpu-int4.bin`,

  /**
   * Azure Blob Storage
   * 1. Upload model to Blob container
   * 2. Configure CORS
   * 3. Use Azure CDN
   */
  azure: (account: string, container: string) =>
    `https://${account}.blob.core.windows.net/${container}/models/gemma-2b-it-gpu-int4.bin`,

  /**
   * Cloudflare R2
   * 1. Upload model to R2 bucket
   * 2. Configure public access or Workers
   * 3. Automatic CDN via Cloudflare
   */
  cloudflareR2: (accountId: string, bucket: string) =>
    `https://${bucket}.${accountId}.r2.cloudflarestorage.com/models/gemma-2b-it-gpu-int4.bin`,

  /**
   * Self-hosted CDN
   * Use your own CDN or origin server
   */
  custom: (baseUrl: string) => `${baseUrl}/models/gemma-2b-it-gpu-int4.bin`,
};

// =============================================================================
// Deployment Helpers
// =============================================================================

/**
 * Get the best model source based on environment
 */
export function getModelSource(): string {
  // Check for environment variable
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_MODEL_URL) {
    return process.env.NEXT_PUBLIC_MODEL_URL;
  }

  // Check for Vite environment variable
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MODEL_URL) {
    return (import.meta as any).env.VITE_MODEL_URL;
  }

  // Default to local
  return MODEL_SOURCES.local;
}

/**
 * Verify WebGPU support
 */
export function checkWebGPUSupport(): {
  supported: boolean;
  reason?: string;
} {
  if (typeof navigator === 'undefined') {
    return { supported: false, reason: 'Not running in browser' };
  }

  if (!('gpu' in navigator)) {
    return {
      supported: false,
      reason: 'WebGPU not supported. Please use Chrome 113+, Edge 113+, or a browser with WebGPU enabled.',
    };
  }

  return { supported: true };
}

/**
 * Estimate download time based on connection speed
 */
export async function estimateDownloadTime(modelSizeBytes = 2_000_000_000): Promise<{
  estimatedSeconds: number;
  connectionType: string;
}> {
  // Try to use Network Information API
  const connection = (navigator as any).connection;

  if (connection?.downlink) {
    // downlink is in Mbps
    const bytesPerSecond = (connection.downlink * 1_000_000) / 8;
    return {
      estimatedSeconds: Math.ceil(modelSizeBytes / bytesPerSecond),
      connectionType: connection.effectiveType || 'unknown',
    };
  }

  // Fallback estimate (assume 10 Mbps)
  return {
    estimatedSeconds: Math.ceil(modelSizeBytes / (10 * 125_000)),
    connectionType: 'unknown',
  };
}


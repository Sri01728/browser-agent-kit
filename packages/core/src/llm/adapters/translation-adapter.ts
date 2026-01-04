/**
 * Transformers.js Translation Adapter
 * 
 * Integrates @xenova/transformers for running translation models in the browser.
 * Supports multilingual translation models like Opus-MT, M2M100, T5, NLLB, etc.
 * 
 * @example Basic usage
 * ```ts
 * const adapter = new TranslationAdapter({
 *   modelPath: 'Xenova/opus-mt-en-fr',
 * });
 * 
 * await adapter.initialize();
 * const result = await adapter.translate('Hello, how are you?');
 * console.log(result.text); // "Bonjour, comment allez-vous?"
 * ```
 * 
 * @example Multilingual NLLB model
 * ```ts
 * const adapter = new TranslationAdapter({
 *   modelPath: 'Xenova/nllb-200-distilled-600M',
 *   sourceLanguage: 'eng_Latn',
 *   targetLanguage: 'fra_Latn',
 * });
 * 
 * await adapter.initialize();
 * const result = await adapter.translate('Hello', {
 *   src_lang: 'eng_Latn',
 *   tgt_lang: 'spa_Latn', // Change target language dynamically
 * });
 * console.log(result.text); // "Hola"
 * ```
 */

// Common languages with NLLB language codes for multilingual models
export const NLLB_LANGUAGES = [
  { code: 'eng_Latn', name: 'English' },
  { code: 'fra_Latn', name: 'French' },
  { code: 'deu_Latn', name: 'German' },
  { code: 'spa_Latn', name: 'Spanish' },
  { code: 'ita_Latn', name: 'Italian' },
  { code: 'por_Latn', name: 'Portuguese' },
  { code: 'rus_Cyrl', name: 'Russian' },
  { code: 'zho_Hans', name: 'Chinese (Simplified)' },
  { code: 'zho_Hant', name: 'Chinese (Traditional)' },
  { code: 'jpn_Jpan', name: 'Japanese' },
  { code: 'kor_Hang', name: 'Korean' },
  { code: 'ara_Arab', name: 'Arabic' },
  { code: 'hin_Deva', name: 'Hindi' },
  { code: 'ben_Beng', name: 'Bengali' },
  { code: 'nld_Latn', name: 'Dutch' },
  { code: 'pol_Latn', name: 'Polish' },
  { code: 'tur_Latn', name: 'Turkish' },
  { code: 'vie_Latn', name: 'Vietnamese' },
  { code: 'tha_Thai', name: 'Thai' },
  { code: 'ind_Latn', name: 'Indonesian' },
  { code: 'ukr_Cyrl', name: 'Ukrainian' },
  { code: 'ces_Latn', name: 'Czech' },
  { code: 'ron_Latn', name: 'Romanian' },
  { code: 'swe_Latn', name: 'Swedish' },
  { code: 'nor_Latn', name: 'Norwegian' },
] as const;

export interface TranslationAdapterConfig {
  /** Hugging Face model identifier (e.g., 'Xenova/opus-mt-en-fr') or local path */
  modelPath: string;
  
  /** Source language code (optional, some models auto-detect) */
  sourceLanguage?: string;
  
  /** Target language code (optional, some models auto-detect) */
  targetLanguage?: string;
  
  /** Use WebGPU if available (default: true) */
  useWebGPU?: boolean;
  
  /** Use WebAssembly fallback (default: true) */
  useWASM?: boolean;
  
  /** Progress callback for model loading */
  onProgress?: (progress: { loaded: number; total: number }) => void;
}

export interface TranslationResult {
  /** Translated text */
  text: string;
  
  /** Source language (if detected) */
  sourceLanguage?: string;
  
  /** Target language */
  targetLanguage?: string;
  
  /** Model used for translation */
  model: string;
}

export class TranslationAdapter {
  id = 'translation';
  name = 'Translation';
  
  private pipeline: any = null;
  private config: TranslationAdapterConfig;
  private initialized = false;
  
  constructor(config: TranslationAdapterConfig) {
    this.config = config;
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      console.log(`[TranslationAdapter] Step 1: Starting initialization...`);
      console.log(`[TranslationAdapter] Model path: ${this.config.modelPath}`);
      
      // Step 1: Import transformers.js
      console.log(`[TranslationAdapter] Step 2: Importing @xenova/transformers...`);
      let pipeline: any;
      let env: any;
      
      try {
        const transformersModule = await import('@xenova/transformers');
        pipeline = transformersModule.pipeline;
        env = transformersModule.env;
        console.log(`[TranslationAdapter] ✅ Transformers.js imported successfully`);
      } catch (importError) {
        console.error(`[TranslationAdapter] ❌ Failed to import transformers.js:`, importError);
        throw new Error(`Failed to import @xenova/transformers: ${importError instanceof Error ? importError.message : String(importError)}`);
      }
      
      // Step 2: Configure environment (based on working TranslationTest)
      console.log(`[TranslationAdapter] Step 3: Configuring environment...`);
      env.allowLocalModels = false; // Changed to false - prefer remote models
      env.allowRemoteModels = true;
      
      // Configure WASM paths - use unpkg CDN (more reliable than jsDelivr)
      // This helps avoid QUIC timeout issues
      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.wasmPaths = 'https://unpkg.com/@xenova/transformers@2.17.2/dist/';
        console.log(`[TranslationAdapter] Configured WASM path:`, env.backends.onnx.wasm.wasmPaths);
      }
      
      // Prefer WebGPU if available (faster and doesn't need WASM)
      if (this.config.useWebGPU !== false && typeof navigator !== 'undefined' && 'gpu' in navigator) {
        console.log('[TranslationAdapter] WebGPU available - will try to use it');
        try {
          env.backends.onnx.wasm.proxy = false; // Disable WASM proxy for WebGPU
          console.log(`[TranslationAdapter] WebGPU enabled`);
        } catch (e) {
          console.log(`[TranslationAdapter] Could not configure WebGPU, will use WASM`);
        }
      }
      
      console.log(`[TranslationAdapter] ✅ Environment configured`);
      console.log(`[TranslationAdapter] Allow local models:`, env.allowLocalModels);
      console.log(`[TranslationAdapter] Allow remote models:`, env.allowRemoteModels);
      
      // Step 3: Create progress callback
      const progressCallback = this.config.onProgress
        ? (progress: { loaded: number; total: number }) => {
            this.config.onProgress?.(progress);
          }
        : undefined;
      
      // Step 4: Create pipeline - THIS is where it will try to fetch the model
      console.log(`[TranslationAdapter] Step 4: Creating translation pipeline...`);
      console.log(`[TranslationAdapter] Task: translation`);
      console.log(`[TranslationAdapter] Model: ${this.config.modelPath}`);
      console.log(`[TranslationAdapter] Expected URL: https://huggingface.co/${this.config.modelPath}`);
      console.log(`[TranslationAdapter] ⚠️  If this fails, check Network tab for requests to:`);
      console.log(`[TranslationAdapter]    - huggingface.co/${this.config.modelPath}/...`);
      console.log(`[TranslationAdapter]    - cdn.jsdelivr.net/npm/@xenova/transformers/... (for WASM files)`);
      
      this.pipeline = await pipeline(
        'translation',
        this.config.modelPath,
        {
          progress_callback: progressCallback,
        }
      );
      
      console.log(`[TranslationAdapter] ✅ Pipeline created successfully!`);
      console.log(`[TranslationAdapter] Model loaded: ${this.config.modelPath}`);
      this.initialized = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error(`[TranslationAdapter] ❌ FAILED at some step during initialization`);
      console.error(`[TranslationAdapter] Error message:`, errorMessage);
      console.error(`[TranslationAdapter] Error stack:`, errorStack);
      console.error(`[TranslationAdapter] Full error object:`, error);
      
      // Check what type of error this is
      if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('not valid JSON')) {
        console.error(`[TranslationAdapter] 🔍 HTML/JSON Parse Error Detected`);
        console.error(`[TranslationAdapter] This means transformers.js received HTML instead of JSON`);
        console.error(`[TranslationAdapter] Possible causes:`);
        console.error(`  1. WASM files not loading from CDN (check Network tab for cdn.jsdelivr.net requests)`);
        console.error(`  2. Model config not found (check Network tab for huggingface.co requests)`);
        console.error(`  3. CORS issue blocking requests`);
        console.error(`  4. Wrong URL being requested`);
        console.error(`\n💡 ACTION: Open Browser DevTools → Network tab and look for:`);
        console.error(`  - Failed requests (red)`);
        console.error(`  - Requests returning HTML instead of JSON`);
        console.error(`  - CORS errors`);
        
        throw new Error(
          `Model loading failed: Received HTML instead of JSON. ` +
          `\n\nThis usually means transformers.js is trying to load files but getting HTML error pages. ` +
          `\n\n🔍 Debug steps:` +
          `\n1. Open Browser DevTools → Network tab` +
          `\n2. Click "Load Model" again` +
          `\n3. Look for failed requests (red entries)` +
          `\n4. Check what URLs are being requested` +
          `\n5. See if requests are being blocked (CORS)` +
          `\n\nModel URL: https://huggingface.co/${this.config.modelPath}` +
          `\n\nCommon issues:` +
          `\n- WASM files not loading from CDN` +
          `\n- Model config.json not found` +
          `\n- Network/CORS blocking requests`
        );
      }
      
      // Generic error
      throw new Error(
        `Failed to initialize Translation adapter: ${errorMessage}` +
        `\n\nCheck browser console and Network tab for more details.`
      );
    }
  }
  
  async translate(text: string, options?: { src_lang?: string; tgt_lang?: string }): Promise<TranslationResult> {
    this.ensureInitialized();
    
    if (!text || !text.trim()) {
      throw new Error('Text to translate cannot be empty');
    }
    
    try {
      // Build translation options - some models (like NLLB) support src_lang and tgt_lang
      // Based on official example: https://github.com/huggingface/transformers.js/blob/main/examples/react-translator/src/worker.js
      const translationOptions: any = {};
      if (options?.src_lang) {
        translationOptions.src_lang = options.src_lang;
      }
      if (options?.tgt_lang) {
        translationOptions.tgt_lang = options.tgt_lang;
      }
      
      // Call the pipeline with optional language parameters
      const result = await this.pipeline(text, Object.keys(translationOptions).length > 0 ? translationOptions : undefined);
      
      // Extract translated text from result
      // Result format: [{ translation_text: "..." }] or { translation_text: "..." }
      let translatedText = '';
      if (Array.isArray(result)) {
        translatedText = result[0]?.translation_text ?? result[0]?.text ?? '';
      } else if (result && typeof result === 'object') {
        translatedText = result.translation_text ?? result.text ?? '';
      } else if (typeof result === 'string') {
        translatedText = result;
      }
      
      return {
        text: translatedText,
        sourceLanguage: options?.src_lang || this.config.sourceLanguage,
        targetLanguage: options?.tgt_lang || this.config.targetLanguage,
        model: this.config.modelPath,
      };
    } catch (error) {
      throw new Error(
        `Translation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  async translateBatch(texts: string[]): Promise<TranslationResult[]> {
    this.ensureInitialized();
    
    const results: TranslationResult[] = [];
    for (const text of texts) {
      const result = await this.translate(text);
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
      throw new Error('Translation adapter not initialized. Call initialize() first.');
    }
  }
  
  /**
   * Get supported language pairs for common models
   */
  static getSupportedLanguages(): Record<string, { from: string[]; to: string[] }> {
    return {
      'opus-mt-en-fr': { from: ['en'], to: ['fr'] },
      'opus-mt-fr-en': { from: ['fr'], to: ['en'] },
      'opus-mt-en-de': { from: ['en'], to: ['de'] },
      'opus-mt-de-en': { from: ['de'], to: ['en'] },
      'opus-mt-en-es': { from: ['en'], to: ['es'] },
      'opus-mt-es-en': { from: ['es'], to: ['en'] },
      'opus-mt-en-it': { from: ['en'], to: ['it'] },
      'opus-mt-it-en': { from: ['it'], to: ['en'] },
      'opus-mt-en-zh': { from: ['en'], to: ['zh'] },
      'opus-mt-zh-en': { from: ['zh'], to: ['en'] },
      'opus-mt-en-ja': { from: ['en'], to: ['ja'] },
      'opus-mt-ja-en': { from: ['ja'], to: ['en'] },
      'm2m100': { from: ['*'], to: ['*'] }, // Multilingual
      't5': { from: ['*'], to: ['*'] }, // Multilingual
    };
  }
}


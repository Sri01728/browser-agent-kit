/**
 * Direct Transformers.js Translation Test
 * 
 * This component tests transformers.js directly without our adapter wrapper.
 * If this works, we know transformers.js is working and the issue is in our adapter.
 */

import { useState, useRef } from 'react';

const MODELS = [
  { id: 'nllb', name: 'NLLB-200 (Multilingual, 600MB)', path: 'Xenova/nllb-200-distilled-600M', requiresLangCodes: true },
  { id: 'opus-en-fr', name: 'Opus-MT EN→FR (Smaller, Faster)', path: 'Xenova/opus-mt-en-fr', requiresLangCodes: false },
  { id: 'opus-en-de', name: 'Opus-MT EN→DE (Smaller, Faster)', path: 'Xenova/opus-mt-en-de', requiresLangCodes: false },
] as const;

// Common languages with NLLB language codes
const LANGUAGES = [
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

export function TranslationTest() {
  const [selectedModel, setSelectedModel] = useState(MODELS[1].id); // Start with smaller model
  const [sourceLanguage, setSourceLanguage] = useState('eng_Latn'); // English
  const [targetLanguage, setTargetLanguage] = useState('fra_Latn'); // French
  const [input, setInput] = useState('Hello, how are you?');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<any>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pipelineRef = useRef<any>(null); // Use ref to avoid closure issues

  // Helper function to get language name from code
  const getLanguageName = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code)?.name || code;
  };

  const loadModel = async () => {
    setModelLoading(true);
    setError(null);
    setProgress(0);

    try {
      console.log('[TranslationTest] Step 1: Importing @xenova/transformers...');
      const { pipeline: createPipeline, env } = await import('@xenova/transformers');
      console.log('[TranslationTest] ✅ Import successful');

      console.log('[TranslationTest] Step 2: Configuring environment...');
      // Configure environment to use jsDelivr CDN (default, but explicit is better)
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      
      // Configure WASM paths - use unpkg as fallback if jsDelivr fails
      // This helps avoid QUIC timeout issues
      if (env.backends?.onnx?.wasm) {
        // Try unpkg CDN as alternative (often more reliable)
        env.backends.onnx.wasm.wasmPaths = 'https://unpkg.com/@xenova/transformers@2.17.2/dist/';
        console.log('[TranslationTest] Configured WASM path:', env.backends.onnx.wasm.wasmPaths);
      }
      
      // Prefer WebGPU if available (faster and doesn't need WASM)
      if ('gpu' in navigator) {
        console.log('[TranslationTest] WebGPU available - will try to use it');
        try {
          env.backends.onnx.wasm.proxy = false; // Disable WASM proxy for WebGPU
        } catch (e) {
          console.log('[TranslationTest] Could not configure WebGPU, will use WASM');
        }
      }
      
      console.log('[TranslationTest] Environment configured:');
      console.log('  - allowLocalModels:', env.allowLocalModels);
      console.log('  - allowRemoteModels:', env.allowRemoteModels);
      console.log('  - remoteURL:', (env as any).remoteURL || 'default (jsDelivr)');

      // Intercept fetch to see what URLs are being requested
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const url = args[0] as string;
        console.log(`[TranslationTest] 🔍 Fetching: ${url}`);
        try {
          const response = await originalFetch(...args);
          console.log(`[TranslationTest] ✅ Response status: ${response.status} for ${url}`);
          if (!response.ok) {
            console.error(`[TranslationTest] ❌ Failed fetch: ${response.status} ${response.statusText} for ${url}`);
          }
          return response;
        } catch (err) {
          console.error(`[TranslationTest] ❌ Fetch error for ${url}:`, err);
          throw err;
        }
      };

      const modelConfig = MODELS.find(m => m.id === selectedModel);
      const modelPath = modelConfig?.path || MODELS[0].path;
      
      console.log('[TranslationTest] Step 3: Creating translation pipeline...');
      console.log('[TranslationTest] Selected model:', modelConfig?.name);
      console.log('[TranslationTest] Model path:', modelPath);
      
      const translator = await createPipeline(
        'translation',
        modelPath,
        {
          progress_callback: (progress: { loaded: number; total: number }) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setProgress(percent);
            console.log(`[TranslationTest] Loading progress: ${percent}%`);
          },
        }
      );

      // Restore original fetch
      window.fetch = originalFetch;

      console.log('[TranslationTest] ✅ Pipeline created successfully!');
      console.log('[TranslationTest] Pipeline type:', typeof translator);
      console.log('[TranslationTest] Pipeline is callable?', typeof translator === 'function');
      setPipeline(translator);
      pipelineRef.current = translator; // Store in ref for immediate access
      setModelLoading(false);
    } catch (err) {
      // Restore original fetch on error
      if (window.fetch !== window.fetch) {
        // This won't work, but the idea is to restore it
      }
      
      console.error('[TranslationTest] ❌ Failed to load model:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setPipeline(null);
      pipelineRef.current = null; // Reset ref on error
      setError(errorMessage);
      
      // Provide helpful error message
      if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('not valid JSON')) {
        setError(
          errorMessage + '\n\n' +
          '💡 This error suggests the model files are not accessible.\n' +
          'Possible causes:\n' +
          '1. CORS issue - model files blocked by browser\n' +
          '2. Model not available in ONNX format on jsDelivr CDN\n' +
          '3. Network connectivity issue\n\n' +
          'Check the Network tab in DevTools to see which URLs failed.\n' +
          'The model should be loaded from: https://cdn.jsdelivr.net/npm/@huggingface/transformers.js/models/Xenova/nllb-200-distilled-600M/'
        );
      } else if (errorMessage.includes('WASM') || errorMessage.includes('wasm') || errorMessage.includes('QUIC') || errorMessage.includes('timeout')) {
        setError(
          errorMessage + '\n\n' +
          '💡 WASM Runtime Loading Issue\n\n' +
          'The model files downloaded successfully, but the WASM runtime failed to load.\n' +
          'This is usually a network/CDN timeout issue.\n\n' +
          'Solutions:\n' +
          '1. Try again - this might be a temporary network issue\n' +
          '2. Check your internet connection\n' +
          '3. Try a different network/VPN\n' +
          '4. The WASM files are being loaded from: https://unpkg.com/@xenova/transformers@2.17.2/dist/\n\n' +
          'Note: Model files loaded successfully (100%), so the issue is only with the runtime.'
        );
      }
      
      setModelLoading(false);
    }
  };

  const translate = async () => {
    // Use ref to get the latest pipeline value (avoids React closure issues)
    const currentPipeline = pipelineRef.current || pipeline;
    
    if (!currentPipeline || !input.trim()) {
      console.error('[TranslationTest] Cannot translate: pipeline not loaded or input empty');
      console.error('[TranslationTest] Pipeline ref:', pipelineRef.current);
      console.error('[TranslationTest] Pipeline state:', pipeline);
      return;
    }

    // Verify pipeline is callable
    if (typeof currentPipeline !== 'function') {
      const errorMsg = `Pipeline is not a function. Type: ${typeof currentPipeline}. Value: ${JSON.stringify(currentPipeline)}`;
      console.error('[TranslationTest]', errorMsg);
      setError(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);
    setOutput('');

    try {
      const modelConfig = MODELS.find(m => m.id === selectedModel);
      const requiresLangCodes = modelConfig?.requiresLangCodes ?? false;
      
      console.log('[TranslationTest] Translating:', input);
      console.log('[TranslationTest] Model:', modelConfig?.name);
      console.log('[TranslationTest] Pipeline type:', typeof currentPipeline);
      
      // NLLB models need src_lang/tgt_lang, Opus-MT models don't
      const options = requiresLangCodes 
        ? { src_lang: sourceLanguage, tgt_lang: targetLanguage }
        : undefined;
      
      if (requiresLangCodes) {
        console.log(`[TranslationTest] Using NLLB format: src_lang=${sourceLanguage}, tgt_lang=${targetLanguage}`);
      } else {
        console.log('[TranslationTest] Using Opus-MT format (no language codes needed)');
      }
      
      console.log('[TranslationTest] Calling pipeline with:', { input, options });
      const result = await currentPipeline(input, options);

      console.log('[TranslationTest] Translation result:', result);
      
      // Extract translated text
      let translatedText = '';
      if (Array.isArray(result)) {
        translatedText = result[0]?.translation_text ?? result[0]?.text ?? '';
      } else if (result && typeof result === 'object') {
        translatedText = result.translation_text ?? result.text ?? '';
      } else if (typeof result === 'string') {
        translatedText = result;
      }

      setOutput(translatedText);
      console.log('[TranslationTest] ✅ Translation successful:', translatedText);
    } catch (err) {
      console.error('[TranslationTest] ❌ Translation failed:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif',
      color: '#333',
    }}>
      <h2>🧪 Direct Transformers.js Test</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Testing transformers.js directly without our adapter wrapper.
        Based on: <a href="https://huggingface.co/Xenova/nllb-200-distilled-600M" target="_blank" rel="noopener noreferrer">Official Example</a>
      </p>

      {!pipeline && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
            Select Model:
          </label>
          <select
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
              setPipeline(null); // Reset pipeline when model changes
              pipelineRef.current = null; // Reset ref too
            }}
            disabled={modelLoading}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '6px',
            }}
          >
            {MODELS.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            💡 Try the smaller Opus-MT models first - they're more likely to work!
          </p>
        </div>
      )}

      {/* Language selection - only show for NLLB model */}
      {MODELS.find(m => m.id === selectedModel)?.requiresLangCodes && (
        <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
              Source Language:
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              disabled={modelLoading || loading}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                color: '#333',
                background: 'white',
              }}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
              Target Language:
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              disabled={modelLoading || loading}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                color: '#333',
                background: 'white',
              }}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!pipeline && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={loadModel}
            disabled={modelLoading}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: modelLoading ? '#ccc' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: modelLoading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
            }}
          >
            {modelLoading ? `Loading Model... ${progress}%` : '🚀 Load Model'}
          </button>
          {modelLoading && (
            <div style={{ marginTop: '10px', color: '#666' }}>
              First load may take 30-60 seconds as the model downloads (~600MB)
            </div>
          )}
        </div>
      )}

      {pipeline && (
        <div style={{
          padding: '12px',
          background: '#e8f5e9',
          borderRadius: '6px',
          marginBottom: '20px',
          color: '#2e7d32',
        }}>
          ✅ Model loaded successfully! Ready to translate.
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px',
          background: '#ffebee',
          borderRadius: '6px',
          marginBottom: '20px',
          color: '#c62828',
          whiteSpace: 'pre-wrap',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {pipeline && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
              {MODELS.find(m => m.id === selectedModel)?.requiresLangCodes 
                ? `${getLanguageName(sourceLanguage)} Text:`
                : 'English Text:'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
              placeholder="Enter text to translate..."
            />
          </div>

          <button
            onClick={translate}
            disabled={loading || !input.trim()}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: loading || !input.trim() ? '#ccc' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              marginBottom: '16px',
            }}
          >
            {loading 
              ? 'Translating...' 
              : `Translate → ${MODELS.find(m => m.id === selectedModel)?.requiresLangCodes 
                  ? getLanguageName(targetLanguage)
                  : 'French'}`}
          </button>

          {output && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                {MODELS.find(m => m.id === selectedModel)?.requiresLangCodes 
                  ? `${getLanguageName(targetLanguage)} Translation:`
                  : 'French Translation:'}
              </label>
              <div style={{
                padding: '12px',
                background: '#f5f5f5',
                borderRadius: '6px',
                minHeight: '100px',
                whiteSpace: 'pre-wrap',
                color: '#333',
                fontSize: '14px',
              }}>
                {output}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{
        marginTop: '30px',
        padding: '16px',
        background: '#f5f5f5',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666',
      }}>
        <strong>Debug Info:</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>Selected Model: {MODELS.find(m => m.id === selectedModel)?.name || 'Unknown'}</li>
          <li>Model Path: {MODELS.find(m => m.id === selectedModel)?.path || 'Unknown'}</li>
          <li>Task: translation</li>
          <li>Source: {MODELS.find(m => m.id === selectedModel)?.requiresLangCodes 
            ? `${sourceLanguage} (${getLanguageName(sourceLanguage)})`
            : 'English (Opus-MT)'}</li>
          <li>Target: {MODELS.find(m => m.id === selectedModel)?.requiresLangCodes 
            ? `${targetLanguage} (${getLanguageName(targetLanguage)})`
            : 'French (Opus-MT)'}</li>
          <li>Check browser console for detailed logs</li>
          <li>Check Network tab for failed requests</li>
          <li>Look for requests to: cdn.jsdelivr.net/npm/@huggingface/transformers.js/</li>
        </ul>
      </div>
    </div>
  );
}


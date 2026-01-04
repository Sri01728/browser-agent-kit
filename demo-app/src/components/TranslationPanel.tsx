/**
 * Translation Panel Component
 * 
 * Demonstrates how to use Transformers.js translation models in the browser.
 * Supports multiple language pairs using Opus-MT and other translation models.
 */

import { useState, useEffect } from 'react';
import { TranslationAdapter } from '@web-agent/core';
import { TRANSLATION_MODELS } from '@web-agent/react';

interface TranslationHistory {
  id: number;
  source: string;
  translated: string;
  model: string;
  timestamp: number;
}

// Language pairs using NLLB model (supports 200+ languages)
// Model is available at: https://huggingface.co/Xenova/nllb-200-distilled-600M
// Based on official example: https://github.com/huggingface/transformers.js/tree/main/examples/react-translator
// NLLB uses language codes like: eng_Latn, fra_Latn, deu_Latn, spa_Latn, etc.
const LANGUAGE_PAIRS = [
  { id: 'en-fr', name: 'English → French', model: TRANSLATION_MODELS.nllb, src_lang: 'eng_Latn', tgt_lang: 'fra_Latn' },
  { id: 'fr-en', name: 'French → English', model: TRANSLATION_MODELS.nllb, src_lang: 'fra_Latn', tgt_lang: 'eng_Latn' },
  { id: 'en-de', name: 'English → German', model: TRANSLATION_MODELS.nllb, src_lang: 'eng_Latn', tgt_lang: 'deu_Latn' },
  { id: 'de-en', name: 'German → English', model: TRANSLATION_MODELS.nllb, src_lang: 'deu_Latn', tgt_lang: 'eng_Latn' },
  { id: 'en-es', name: 'English → Spanish', model: TRANSLATION_MODELS.nllb, src_lang: 'eng_Latn', tgt_lang: 'spa_Latn' },
  { id: 'es-en', name: 'Spanish → English', model: TRANSLATION_MODELS.nllb, src_lang: 'spa_Latn', tgt_lang: 'eng_Latn' },
  // Fallback to simpler models if NLLB doesn't work
  { id: 'en-de-simple', name: 'English → German (Simple)', model: TRANSLATION_MODELS.enDe },
  { id: 'en-fr-simple', name: 'English → French (Simple)', model: TRANSLATION_MODELS.enFr },
  { id: 'en-es-simple', name: 'English → Spanish (Simple)', model: TRANSLATION_MODELS.enEs },
] as const;

export function TranslationPanel() {
  const [adapter, setAdapter] = useState<TranslationAdapter | null>(null);
  // Start with English → German as it's more likely to be available
  const [selectedPair, setSelectedPair] = useState(LANGUAGE_PAIRS[0].id); // en-de
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [history, setHistory] = useState<TranslationHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize adapter when language pair changes
  useEffect(() => {
    const pair = LANGUAGE_PAIRS.find(p => p.id === selectedPair);
    if (!pair) return;

    const newAdapter = new TranslationAdapter({
      modelPath: pair.model,
      onProgress: (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        setLoadProgress(percent);
      },
    });

    setAdapter(newAdapter);
    setTranslatedText('');
    setError(null);
    setLoadProgress(0);

    return () => {
      newAdapter.dispose();
    };
  }, [selectedPair]);

  const handleLoadModel = async () => {
    if (!adapter || adapter.isReady()) return;

    setIsModelLoading(true);
    setError(null);
    setLoadProgress(0);

    try {
      const pair = LANGUAGE_PAIRS.find(p => p.id === selectedPair);
      console.log('[TranslationPanel] Loading model:', pair?.model);
      console.log('[TranslationPanel] Language pair:', pair?.name);
      console.log('[TranslationPanel] Model URL: https://huggingface.co/' + pair?.model);
      console.log('[TranslationPanel] 💡 If loading fails, check Browser Network tab for failed requests');
      
      await adapter.initialize();
      
      console.log('[TranslationPanel] ✅ Model loaded successfully!');
    } catch (err) {
      console.error('[TranslationPanel] ❌ Failed to load model:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
      setError(
        errorMessage + 
        '\n\n💡 Debugging tips:' +
        '\n1. Open Browser DevTools → Network tab' +
        '\n2. Look for failed requests to huggingface.co' +
        '\n3. Check if requests are being blocked (CORS)' +
        '\n4. Try a different language pair' +
        '\n5. Model URL: https://huggingface.co/Xenova/nllb-200-distilled-600M'
      );
      
      // Show helpful error message in UI
      if (errorMessage.includes('not found') || errorMessage.includes('not available') || errorMessage.includes('<!DOCTYPE')) {
        console.warn('[TranslationPanel] 💡 This might be a CORS or network issue. Check the Network tab.');
        console.warn('[TranslationPanel] 💡 The model exists at: https://huggingface.co/Xenova/nllb-200-distilled-600M');
      }
    } finally {
      setIsModelLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!adapter || !adapter.isReady() || !inputText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const pair = LANGUAGE_PAIRS.find(p => p.id === selectedPair);
      console.log('Translating:', inputText);
      console.log('Language pair:', pair?.name);
      
      // Pass language codes only if using NLLB model (has src_lang/tgt_lang)
      const translationOptions = pair?.src_lang && pair?.tgt_lang
        ? { src_lang: pair.src_lang, tgt_lang: pair.tgt_lang }
        : undefined;
      
      const result = await adapter.translate(inputText, translationOptions);
      
      console.log('Translation result:', result);
      setTranslatedText(result.text);

      // Add to history
      setHistory(prev => [{
        id: Date.now(),
        source: inputText,
        translated: result.text,
        model: pair?.name || selectedPair,
        timestamp: Date.now(),
      }, ...prev].slice(0, 10)); // Keep last 10 translations
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
    setError(null);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const currentPair = LANGUAGE_PAIRS.find(p => p.id === selectedPair);

  return (
    <div className="translation-panel">
      <div className="panel-header">
        <h2>🌍 Translation</h2>
        <div className="language-selector">
          <label htmlFor="lang-select">Language Pair:</label>
          <select
            id="lang-select"
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value as typeof selectedPair)}
            disabled={isModelLoading || isLoading}
          >
            {LANGUAGE_PAIRS.map(pair => (
              <option key={pair.id} value={pair.id}>
                {pair.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="model-status">
        {!adapter ? (
          <div className="status-info">Initializing...</div>
        ) : adapter.isReady() ? (
          <div className="status-info status-ready">
            ✅ Model loaded: {currentPair?.name}
          </div>
        ) : isModelLoading ? (
          <div className="status-info status-loading">
            ⏳ Loading model... {loadProgress > 0 && `${loadProgress}%`}
          </div>
        ) : (
          <div className="status-info status-idle">
            ⚠️ Model not loaded. Click "Load Model" to start.
          </div>
        )}
      </div>

      {adapter && !adapter.isReady() && (
        <div className="load-section">
          <button
            className="load-btn"
            onClick={handleLoadModel}
            disabled={isModelLoading}
          >
            {isModelLoading ? 'Loading...' : '🚀 Load Model'}
          </button>
          <p className="load-note">
            First load downloads the translation model (~50-200MB).
            Models are cached in your browser for faster subsequent loads.
          </p>
        </div>
      )}

      {adapter?.isReady() && (
        <div className="translation-section">
          <div className="input-area">
            <label htmlFor="source-text">Source Text:</label>
            <textarea
              id="source-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to translate..."
              rows={6}
              disabled={isLoading}
              className="translation-input"
            />
            <div className="input-actions">
              <button
                onClick={handleTranslate}
                disabled={!inputText.trim() || isLoading}
                className="translate-btn"
              >
                {isLoading ? 'Translating...' : 'Translate →'}
              </button>
              <button
                onClick={handleClear}
                className="clear-btn"
                disabled={isLoading}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="output-area">
            <label htmlFor="translated-text">Translated Text:</label>
            <textarea
              id="translated-text"
              value={translatedText}
              readOnly
              placeholder="Translation will appear here..."
              rows={6}
              className="translation-output"
            />
            {translatedText && (
              <button
                onClick={() => navigator.clipboard.writeText(translatedText)}
                className="copy-btn"
                title="Copy to clipboard"
              >
                📋 Copy
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {history.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <h3>Translation History</h3>
            <button onClick={handleClearHistory} className="clear-history-btn">
              Clear History
            </button>
          </div>
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-source">
                  <strong>{item.model}:</strong> {item.source}
                </div>
                <div className="history-translated">
                  → {item.translated}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .translation-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: white;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
          background: #f5f5f5;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 18px;
        }

        .language-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .language-selector label {
          font-size: 14px;
          color: #666;
        }

        .language-selector select {
          padding: 6px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }

        .model-status {
          padding: 12px 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .status-info {
          font-size: 14px;
          padding: 8px;
          border-radius: 4px;
        }

        .status-ready {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .status-loading {
          background: #fff3e0;
          color: #e65100;
        }

        .status-idle {
          background: #f5f5f5;
          color: #666;
        }

        .load-section {
          padding: 16px;
          text-align: center;
          border-bottom: 1px solid #e0e0e0;
        }

        .load-btn {
          padding: 12px 24px;
          font-size: 16px;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .load-btn:hover:not(:disabled) {
          background: #1565c0;
        }

        .load-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .load-note {
          margin-top: 12px;
          font-size: 12px;
          color: #666;
          line-height: 1.5;
        }

        .translation-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 16px;
          flex: 1;
          overflow-y: auto;
        }

        .input-area,
        .output-area {
          display: flex;
          flex-direction: column;
        }

        .input-area label,
        .output-area label {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #333;
        }

        .translation-input,
        .translation-output {
          flex: 1;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          resize: none;
        }

        .translation-input:focus {
          outline: none;
          border-color: #1976d2;
        }

        .translation-output {
          background: #f9f9f9;
          color: #333;
        }

        .input-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .translate-btn,
        .clear-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .translate-btn {
          background: #1976d2;
          color: white;
        }

        .translate-btn:hover:not(:disabled) {
          background: #1565c0;
        }

        .translate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .clear-btn {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ccc;
        }

        .clear-btn:hover:not(:disabled) {
          background: #e0e0e0;
        }

        .copy-btn {
          margin-top: 8px;
          padding: 6px 12px;
          background: #f5f5f5;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .copy-btn:hover {
          background: #e0e0e0;
        }

        .error-message {
          padding: 12px 16px;
          background: #ffebee;
          color: #c62828;
          border-top: 1px solid #e0e0e0;
          font-size: 14px;
        }

        .history-section {
          padding: 16px;
          border-top: 1px solid #e0e0e0;
          background: #fafafa;
          max-height: 200px;
          overflow-y: auto;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .history-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .clear-history-btn {
          padding: 4px 8px;
          font-size: 12px;
          background: #f5f5f5;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
        }

        .clear-history-btn:hover {
          background: #e0e0e0;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-item {
          padding: 8px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 12px;
        }

        .history-source {
          margin-bottom: 4px;
          color: #666;
        }

        .history-translated {
          color: #333;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}


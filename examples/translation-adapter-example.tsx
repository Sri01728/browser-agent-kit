/**
 * Translation Adapter Example
 * 
 * This example shows how to use the TranslationAdapter in any React app.
 * The adapter handles all the complexity of loading and using transformers.js models.
 */

import { useState } from 'react';
import { TranslationAdapter, NLLB_LANGUAGES, TRANSLATION_MODELS } from '@web-agent/core';

export function TranslationExample() {
  const [adapter, setAdapter] = useState<TranslationAdapter | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState('eng_Latn');
  const [targetLanguage, setTargetLanguage] = useState('fra_Latn');
  const [input, setInput] = useState('Hello, how are you?');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Step 1: Initialize the adapter
  const initializeAdapter = async () => {
    setLoading(true);
    
    // Create adapter with NLLB multilingual model (200+ languages)
    const translationAdapter = new TranslationAdapter({
      modelPath: TRANSLATION_MODELS.nllb, // 'Xenova/nllb-200-distilled-600M'
      sourceLanguage,
      targetLanguage,
      onProgress: (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        setProgress(percent);
      },
    });

    try {
      await translationAdapter.initialize();
      setAdapter(translationAdapter);
      console.log('✅ Translation adapter ready!');
    } catch (error) {
      console.error('Failed to initialize adapter:', error);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Translate text
  const handleTranslate = async () => {
    if (!adapter || !input.trim()) return;

    setLoading(true);
    try {
      const result = await adapter.translate(input, {
        src_lang: sourceLanguage,
        tgt_lang: targetLanguage,
      });
      setOutput(result.text);
      console.log('Translation result:', result);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🌍 Translation Adapter Example</h2>
      
      {!adapter && (
        <div>
          <p>This example uses the TranslationAdapter to translate between 200+ languages.</p>
          <button onClick={initializeAdapter} disabled={loading}>
            {loading ? `Loading Model... ${progress}%` : 'Initialize Translator'}
          </button>
        </div>
      )}

      {adapter && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label>Source Language:</label>
              <select 
                value={sourceLanguage} 
                onChange={(e) => setSourceLanguage(e.target.value)}
              >
                {NLLB_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Target Language:</label>
              <select 
                value={targetLanguage} 
                onChange={(e) => setTargetLanguage(e.target.value)}
              >
                {NLLB_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label>Text to translate:</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ width: '100%', minHeight: '100px', padding: '8px' }}
            />
          </div>

          <button onClick={handleTranslate} disabled={loading || !input.trim()}>
            {loading ? 'Translating...' : 'Translate'}
          </button>

          {output && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
              <strong>Translation:</strong>
              <p>{output}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Alternative: Using Opus-MT models (smaller, faster, language-pair specific)
// ============================================================================

export function OpusMTExample() {
  const [adapter, setAdapter] = useState<TranslationAdapter | null>(null);
  const [input, setInput] = useState('Hello, how are you?');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const initializeAdapter = async () => {
    setLoading(true);
    
    // Create adapter with Opus-MT model (English to French)
    const translationAdapter = new TranslationAdapter({
      modelPath: TRANSLATION_MODELS.enFr, // 'Xenova/opus-mt-en-fr'
    });

    try {
      await translationAdapter.initialize();
      setAdapter(translationAdapter);
    } catch (error) {
      console.error('Failed to initialize adapter:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!adapter || !input.trim()) return;

    setLoading(true);
    try {
      // Opus-MT models don't need src_lang/tgt_lang parameters
      const result = await adapter.translate(input);
      setOutput(result.text);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🚀 Opus-MT Example (English → French)</h2>
      
      {!adapter && (
        <button onClick={initializeAdapter} disabled={loading}>
          {loading ? 'Loading Model...' : 'Initialize Translator'}
        </button>
      )}

      {adapter && (
        <div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ width: '100%', minHeight: '100px', padding: '8px', marginBottom: '16px' }}
          />
          <button onClick={handleTranslate} disabled={loading || !input.trim()}>
            {loading ? 'Translating...' : 'Translate to French'}
          </button>
          {output && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5' }}>
              <strong>French:</strong> {output}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


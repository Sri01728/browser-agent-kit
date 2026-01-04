# Translation Adapter Guide

The `TranslationAdapter` makes it easy to add translation capabilities to any web application using transformers.js models that run entirely in the browser.

## Features

- 🌍 **200+ Languages** - Support for multilingual translation with NLLB models
- 🚀 **Browser-based** - No server required, runs entirely in the browser
- ⚡ **WebGPU/WASM** - Automatic backend selection for optimal performance
- 📦 **Easy Integration** - Simple API, works with any React app
- 🔄 **Multiple Models** - Support for NLLB, Opus-MT, M2M100, and more

## Quick Start

### Installation

```bash
pnpm add @web-agent/core @xenova/transformers
```

### Basic Usage

```typescript
import { TranslationAdapter, TRANSLATION_MODELS } from '@web-agent/core';

// Create adapter
const adapter = new TranslationAdapter({
  modelPath: TRANSLATION_MODELS.enFr, // English → French
});

// Initialize (downloads model on first use)
await adapter.initialize();

// Translate
const result = await adapter.translate('Hello, how are you?');
console.log(result.text); // "Bonjour, comment allez-vous?"
```

## Multilingual Translation (NLLB)

The NLLB model supports 200+ languages:

```typescript
import { TranslationAdapter, TRANSLATION_MODELS, NLLB_LANGUAGES } from '@web-agent/core';

const adapter = new TranslationAdapter({
  modelPath: TRANSLATION_MODELS.nllb, // 'Xenova/nllb-200-distilled-600M'
  sourceLanguage: 'eng_Latn', // English
  targetLanguage: 'fra_Latn', // French
  onProgress: (progress) => {
    const percent = Math.round((progress.loaded / progress.total) * 100);
    console.log(`Loading: ${percent}%`);
  },
});

await adapter.initialize();

// Translate with dynamic language selection
const result = await adapter.translate('Hello', {
  src_lang: 'eng_Latn', // English
  tgt_lang: 'spa_Latn', // Spanish
});
console.log(result.text); // "Hola"
```

## Available Models

### Multilingual Models

```typescript
import { TRANSLATION_MODELS } from '@web-agent/core';

// NLLB - 200+ languages (recommended for multilingual)
TRANSLATION_MODELS.nllb // 'Xenova/nllb-200-distilled-600M' (~600MB)

// M2M100 - 100+ languages
TRANSLATION_MODELS.m2m100 // 'Xenova/m2m100_418M'

// T5 - Multilingual
TRANSLATION_MODELS.t5Small // 'Xenova/t5-small'
```

### Language-Pair Specific Models (Opus-MT)

Smaller and faster, but only work for specific language pairs:

```typescript
// English to other languages
TRANSLATION_MODELS.enFr  // English → French
TRANSLATION_MODELS.enDe  // English → German
TRANSLATION_MODELS.enEs  // English → Spanish
TRANSLATION_MODELS.enIt  // English → Italian
TRANSLATION_MODELS.enRu  // English → Russian
TRANSLATION_MODELS.enZh  // English → Chinese
TRANSLATION_MODELS.enJa  // English → Japanese
TRANSLATION_MODELS.enPt  // English → Portuguese

// Other languages to English
TRANSLATION_MODELS.frEn  // French → English
TRANSLATION_MODELS.deEn  // German → English
TRANSLATION_MODELS.esEn  // Spanish → English
// ... and more
```

## Language Codes (NLLB)

```typescript
import { NLLB_LANGUAGES } from '@web-agent/core';

// Common language codes:
'eng_Latn' // English
'fra_Latn' // French
'deu_Latn' // German
'spa_Latn' // Spanish
'ita_Latn' // Italian
'por_Latn' // Portuguese
'rus_Cyrl' // Russian
'zho_Hans' // Chinese (Simplified)
'zho_Hant' // Chinese (Traditional)
'jpn_Jpan' // Japanese
'kor_Hang' // Korean
'ara_Arab' // Arabic
'hin_Deva' // Hindi
// ... 200+ more

// Access all languages
NLLB_LANGUAGES.forEach(lang => {
  console.log(lang.code, lang.name);
});
```

Full list: [NLLB Language Codes](https://github.com/facebookresearch/flores/blob/main/flores200/README.md#languages-in-flores-200)

## API Reference

### TranslationAdapter

#### Constructor

```typescript
new TranslationAdapter(config: TranslationAdapterConfig)
```

**Config Options:**

```typescript
interface TranslationAdapterConfig {
  /** Hugging Face model identifier (e.g., 'Xenova/opus-mt-en-fr') */
  modelPath: string;
  
  /** Source language code (optional, for NLLB models) */
  sourceLanguage?: string;
  
  /** Target language code (optional, for NLLB models) */
  targetLanguage?: string;
  
  /** Use WebGPU if available (default: true) */
  useWebGPU?: boolean;
  
  /** Use WebAssembly fallback (default: true) */
  useWASM?: boolean;
  
  /** Progress callback for model loading */
  onProgress?: (progress: { loaded: number; total: number }) => void;
}
```

#### Methods

##### `initialize(): Promise<void>`

Downloads and initializes the model. Must be called before translation.

```typescript
await adapter.initialize();
```

##### `translate(text: string, options?): Promise<TranslationResult>`

Translates text.

```typescript
// Simple translation
const result = await adapter.translate('Hello');

// With language options (NLLB models)
const result = await adapter.translate('Hello', {
  src_lang: 'eng_Latn',
  tgt_lang: 'fra_Latn',
});
```

**Options:**
- `src_lang?: string` - Source language code (NLLB only)
- `tgt_lang?: string` - Target language code (NLLB only)

**Returns:**

```typescript
interface TranslationResult {
  text: string;              // Translated text
  sourceLanguage?: string;   // Source language
  targetLanguage?: string;   // Target language
  model: string;             // Model used
}
```

##### `translateBatch(texts: string[]): Promise<TranslationResult[]>`

Translates multiple texts.

```typescript
const results = await adapter.translateBatch([
  'Hello',
  'How are you?',
  'Goodbye',
]);
```

##### `isReady(): boolean`

Checks if the adapter is initialized.

```typescript
if (adapter.isReady()) {
  // Ready to translate
}
```

##### `dispose(): void`

Cleans up resources.

```typescript
adapter.dispose();
```

## React Integration

### Simple Component

```tsx
import { useState } from 'react';
import { TranslationAdapter, TRANSLATION_MODELS } from '@web-agent/core';

export function Translator() {
  const [adapter, setAdapter] = useState<TranslationAdapter | null>(null);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const initialize = async () => {
    const newAdapter = new TranslationAdapter({
      modelPath: TRANSLATION_MODELS.enFr,
    });
    await newAdapter.initialize();
    setAdapter(newAdapter);
  };

  const translate = async () => {
    if (!adapter) return;
    const result = await adapter.translate(input);
    setOutput(result.text);
  };

  return (
    <div>
      {!adapter && <button onClick={initialize}>Load Translator</button>}
      {adapter && (
        <>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} />
          <button onClick={translate}>Translate</button>
          <p>{output}</p>
        </>
      )}
    </div>
  );
}
```

### With Language Selection

```tsx
import { useState } from 'react';
import { TranslationAdapter, TRANSLATION_MODELS, NLLB_LANGUAGES } from '@web-agent/core';

export function MultilingualTranslator() {
  const [adapter, setAdapter] = useState<TranslationAdapter | null>(null);
  const [sourceLang, setSourceLang] = useState('eng_Latn');
  const [targetLang, setTargetLang] = useState('fra_Latn');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const initialize = async () => {
    const newAdapter = new TranslationAdapter({
      modelPath: TRANSLATION_MODELS.nllb,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
    });
    await newAdapter.initialize();
    setAdapter(newAdapter);
  };

  const translate = async () => {
    if (!adapter) return;
    const result = await adapter.translate(input, {
      src_lang: sourceLang,
      tgt_lang: targetLang,
    });
    setOutput(result.text);
  };

  return (
    <div>
      <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
        {NLLB_LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>{lang.name}</option>
        ))}
      </select>
      
      <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
        {NLLB_LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>{lang.name}</option>
        ))}
      </select>

      {!adapter && <button onClick={initialize}>Load Translator</button>}
      {adapter && (
        <>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} />
          <button onClick={translate}>Translate</button>
          <p>{output}</p>
        </>
      )}
    </div>
  );
}
```

## Performance Tips

1. **Model Size**: Smaller models load faster
   - Opus-MT: ~50-100MB (fast, language-pair specific)
   - NLLB: ~600MB (slower, but supports 200+ languages)

2. **WebGPU**: Enable for 2-3x faster inference (Chrome 113+)
   ```typescript
   new TranslationAdapter({
     modelPath: '...',
     useWebGPU: true, // Default
   });
   ```

3. **Caching**: Models are cached in IndexedDB after first load

4. **Batch Translation**: More efficient for multiple texts
   ```typescript
   await adapter.translateBatch(['text1', 'text2', 'text3']);
   ```

## Browser Requirements

- **WebGPU**: Chrome 113+, Edge 113+ (recommended)
- **WASM**: All modern browsers (fallback)
- **Memory**: 500MB-1GB RAM depending on model size

## Troubleshooting

### Model fails to load

1. Check browser console for network errors
2. Verify model path is correct
3. Check Network tab for failed requests
4. Try a smaller model (Opus-MT instead of NLLB)

### Slow performance

1. Enable WebGPU if available
2. Use smaller models for faster inference
3. Check if model is cached (subsequent loads are faster)

### Translation quality issues

1. Try different models
2. Verify language codes are correct (NLLB)
3. Check input text formatting

## Examples

See full examples in:
- `examples/translation-adapter-example.tsx` - Complete React examples
- `demo-app/src/components/TranslationTest.tsx` - Working demo

## Resources

- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [NLLB Model Card](https://huggingface.co/Xenova/nllb-200-distilled-600M)
- [Opus-MT Models](https://huggingface.co/models?search=opus-mt)
- [Language Codes](https://github.com/facebookresearch/flores/blob/main/flores200/README.md)


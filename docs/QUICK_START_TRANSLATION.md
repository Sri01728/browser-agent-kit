# Quick Start: Translation Adapter

Add translation to your app in 3 simple steps using the TranslationAdapter.

## Installation

```bash
pnpm add @web-agent/core @xenova/transformers
```

## 3-Step Integration

### Step 1: Create the Adapter

```typescript
import { TranslationAdapter, TRANSLATION_MODELS } from '@web-agent/core';

const adapter = new TranslationAdapter({
  modelPath: TRANSLATION_MODELS.enFr, // English → French
  onProgress: (progress) => {
    const percent = Math.round((progress.loaded / progress.total) * 100);
    console.log(`Loading: ${percent}%`);
  },
});
```

### Step 2: Initialize (Load the Model)

```typescript
await adapter.initialize();
// Model is now ready! (cached for next time)
```

### Step 3: Translate

```typescript
const result = await adapter.translate('Hello, how are you?');
console.log(result.text); // "Bonjour, comment allez-vous?"
```

## That's it! 🎉

The adapter handles:
- ✅ Model downloading and caching
- ✅ WebGPU/WASM backend selection
- ✅ Progress tracking
- ✅ Error handling
- ✅ Browser compatibility

## Multilingual (200+ Languages)

Want to translate between any languages? Use the NLLB model:

```typescript
import { TranslationAdapter, TRANSLATION_MODELS, NLLB_LANGUAGES } from '@web-agent/core';

const adapter = new TranslationAdapter({
  modelPath: TRANSLATION_MODELS.nllb, // 200+ languages
});

await adapter.initialize();

// Translate English → Spanish
const result = await adapter.translate('Hello', {
  src_lang: 'eng_Latn',
  tgt_lang: 'spa_Latn',
});
console.log(result.text); // "Hola"

// Change languages dynamically
const result2 = await adapter.translate('Hello', {
  src_lang: 'eng_Latn',
  tgt_lang: 'jpn_Jpan', // Japanese
});
console.log(result2.text); // "こんにちは"
```

## React Example

```tsx
import { useState } from 'react';
import { TranslationAdapter, TRANSLATION_MODELS } from '@web-agent/core';

export function Translator() {
  const [adapter, setAdapter] = useState<TranslationAdapter | null>(null);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const init = async () => {
    setLoading(true);
    const newAdapter = new TranslationAdapter({
      modelPath: TRANSLATION_MODELS.enFr,
    });
    await newAdapter.initialize();
    setAdapter(newAdapter);
    setLoading(false);
  };

  const translate = async () => {
    if (!adapter) return;
    setLoading(true);
    const result = await adapter.translate(input);
    setOutput(result.text);
    setLoading(false);
  };

  return (
    <div>
      <h2>Translator</h2>
      {!adapter ? (
        <button onClick={init} disabled={loading}>
          {loading ? 'Loading...' : 'Load Translator'}
        </button>
      ) : (
        <>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text..."
          />
          <button onClick={translate} disabled={loading}>
            {loading ? 'Translating...' : 'Translate'}
          </button>
          {output && <p><strong>Translation:</strong> {output}</p>}
        </>
      )}
    </div>
  );
}
```

## Available Models

```typescript
import { TRANSLATION_MODELS } from '@web-agent/core';

// Multilingual (200+ languages)
TRANSLATION_MODELS.nllb    // NLLB-200 (~600MB)
TRANSLATION_MODELS.m2m100  // M2M100 (100+ languages)

// English to other languages (smaller, faster)
TRANSLATION_MODELS.enFr    // English → French
TRANSLATION_MODELS.enDe    // English → German
TRANSLATION_MODELS.enEs    // English → Spanish
TRANSLATION_MODELS.enIt    // English → Italian
TRANSLATION_MODELS.enRu    // English → Russian
TRANSLATION_MODELS.enZh    // English → Chinese
TRANSLATION_MODELS.enJa    // English → Japanese

// Other languages to English
TRANSLATION_MODELS.frEn    // French → English
TRANSLATION_MODELS.deEn    // German → English
TRANSLATION_MODELS.esEn    // Spanish → English
// ... and more
```

## Language Codes (NLLB)

```typescript
import { NLLB_LANGUAGES } from '@web-agent/core';

// Common codes:
'eng_Latn' // English
'fra_Latn' // French
'deu_Latn' // German
'spa_Latn' // Spanish
'ita_Latn' // Italian
'por_Latn' // Portuguese
'rus_Cyrl' // Russian
'zho_Hans' // Chinese (Simplified)
'jpn_Jpan' // Japanese
'kor_Hang' // Korean
'ara_Arab' // Arabic
'hin_Deva' // Hindi
// ... 200+ more

// Get all languages
NLLB_LANGUAGES // Array of { code, name }
```

## Next Steps

- See full documentation: [TRANSLATION_ADAPTER.md](./TRANSLATION_ADAPTER.md)
- View complete examples: [examples/translation-adapter-example.tsx](../examples/translation-adapter-example.tsx)
- Try the demo: `demo-app/src/components/TranslationTest.tsx`

## Key Features

- 🌍 **200+ Languages** with NLLB
- 🚀 **Runs in Browser** - No server needed
- ⚡ **Fast** - WebGPU acceleration
- 📦 **Easy** - 3 lines of code
- 🔄 **Cached** - Fast subsequent loads
- 🎯 **Type-safe** - Full TypeScript support


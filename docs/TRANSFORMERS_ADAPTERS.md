# Transformers.js Adapters Guide

This guide covers all available Transformers.js adapters in the web-agent framework.

## Available Adapters

### 1. Text Generation (`TransformersAdapter`)
Generate text using language models like GPT-2, Gemma, Llama, etc.

**Models**: See `TRANSFORMERS_MODELS`

### 2. Translation (`TranslationAdapter`)
Translate text between languages using Opus-MT and other translation models.

**Models**: See `TRANSLATION_MODELS`

### 3. Text Classification (`TextClassificationAdapter`)
Classify text into categories (sentiment, emotion, toxicity, etc.).

**Models**: See `TEXT_CLASSIFICATION_MODELS`

### 4. Image Classification (`ImageClassificationAdapter`)
Classify images into categories (objects, scenes, etc.).

**Models**: See `IMAGE_CLASSIFICATION_MODELS`

### 5. Object Detection (`ObjectDetectionAdapter`)
Detect and locate objects in images with bounding boxes.

**Models**: See `OBJECT_DETECTION_MODELS`

### 6. Named Entity Recognition (`NamedEntityRecognitionAdapter`)
Identify and classify named entities in text (persons, organizations, locations, etc.).

**Models**: See `NER_MODELS`

### 7. Summarization (`SummarizationAdapter`)
Summarize long texts into shorter summaries.

**Models**: See `SUMMARIZATION_MODELS`

## Usage Examples

### Text Classification

```typescript
import { TextClassificationAdapter, TEXT_CLASSIFICATION_MODELS } from '@web-agent/core';

const classifier = new TextClassificationAdapter({
  modelPath: TEXT_CLASSIFICATION_MODELS.sentiment,
});

await classifier.initialize();
const result = await classifier.classify('I love this product!');
console.log(result.top); // { label: 'POSITIVE', score: 0.9998 }
```

### Image Classification

```typescript
import { ImageClassificationAdapter, IMAGE_CLASSIFICATION_MODELS } from '@web-agent/core';

const classifier = new ImageClassificationAdapter({
  modelPath: IMAGE_CLASSIFICATION_MODELS.vit,
});

await classifier.initialize();
const image = document.getElementById('myImage') as HTMLImageElement;
const result = await classifier.classify(image);
console.log(result.top); // { label: 'golden retriever', score: 0.95 }
```

### Object Detection

```typescript
import { ObjectDetectionAdapter, OBJECT_DETECTION_MODELS } from '@web-agent/core';

const detector = new ObjectDetectionAdapter({
  modelPath: OBJECT_DETECTION_MODELS.detr,
  threshold: 0.5,
});

await detector.initialize();
const image = document.getElementById('myImage') as HTMLImageElement;
const objects = await detector.detect(image);
console.log(objects); // [{ label: 'person', score: 0.95, box: {...} }]
```

### Named Entity Recognition

```typescript
import { NamedEntityRecognitionAdapter, NER_MODELS } from '@web-agent/core';

const ner = new NamedEntityRecognitionAdapter({
  modelPath: NER_MODELS.bert,
});

await ner.initialize();
const entities = await ner.recognize('Apple is headquartered in Cupertino, California.');
console.log(entities);
// [
//   { entity: 'ORG', word: 'Apple', score: 0.99, start: 0, end: 5 },
//   { entity: 'LOC', word: 'Cupertino', score: 0.98, start: 30, end: 40 },
//   { entity: 'LOC', word: 'California', score: 0.97, start: 42, end: 52 }
// ]
```

### Summarization

```typescript
import { SummarizationAdapter, SUMMARIZATION_MODELS } from '@web-agent/core';

const summarizer = new SummarizationAdapter({
  modelPath: SUMMARIZATION_MODELS.bart,
  maxLength: 130,
  minLength: 30,
});

await summarizer.initialize();
const longText = 'Very long article text...';
const result = await summarizer.summarize(longText);
console.log(result.summary); // Short summary
```

## Model Constants

All model constants are exported from `@web-agent/react`:

```typescript
import {
  TRANSFORMERS_MODELS,
  TRANSLATION_MODELS,
  TEXT_CLASSIFICATION_MODELS,
  IMAGE_CLASSIFICATION_MODELS,
  OBJECT_DETECTION_MODELS,
  NER_MODELS,
  SUMMARIZATION_MODELS,
} from '@web-agent/react';
```

## Common Patterns

### Error Handling

```typescript
try {
  await adapter.initialize();
  const result = await adapter.process(input);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Progress Tracking

```typescript
const adapter = new SomeAdapter({
  modelPath: 'Xenova/model-name',
  onProgress: (progress) => {
    const percent = Math.round((progress.loaded / progress.total) * 100);
    console.log(`Loading: ${percent}%`);
  },
});
```

### Batch Processing

Most adapters support batch processing:

```typescript
// Translation
const results = await translator.translateBatch(['Hello', 'World']);

// Text Classification
const results = await classifier.classifyBatch(['Text 1', 'Text 2']);

// Image Classification
const results = await classifier.classifyBatch([image1, image2]);
```

### Cleanup

Always dispose adapters when done:

```typescript
adapter.dispose();
```

## Performance Tips

1. **Use WebGPU**: Enable WebGPU for faster inference (requires Chrome 113+)
2. **Model Size**: Smaller models load faster but may have lower accuracy
3. **Caching**: Models are cached in IndexedDB after first load
4. **Batch Processing**: Process multiple items together for better performance

## Browser Requirements

- **WebGPU**: Recommended for best performance (Chrome 113+, Edge 113+)
- **WASM**: Fallback for broader compatibility
- **Memory**: Models typically require 100MB-2GB RAM depending on size

## Resources

- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [Hugging Face Models](https://huggingface.co/models)
- [Model Hub](https://huggingface.co/models?library=transformers.js)


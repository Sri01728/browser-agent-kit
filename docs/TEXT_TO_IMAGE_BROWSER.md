# Text-to-Image Models in the Browser

## Current Status

**Transformers.js does NOT natively support text-to-image models.** The library focuses on:
- Text generation (GPT-2, Gemma, Llama, etc.)
- Text classification
- Image classification
- Object detection
- Named entity recognition
- Translation
- Summarization

## Alternative Solutions

### 1. Web-Txt2Img (Recommended)

A project that enables Stable Diffusion models to run in the browser using ONNX Runtime.

**GitHub**: https://github.com/lacerbi/web-txt2img

**Features**:
- SD-Turbo (single-step generation, fast)
- Janus-Pro-1B (autoregressive unified multimodal)
- WebGPU acceleration with WASM fallback
- Quantized models (q4f16) for better performance

**Example Usage**:
```typescript
// This would require integrating web-txt2img separately
// It's not part of Transformers.js but uses similar technology
```

### 2. ONNX Runtime Web

Direct integration with ONNX Runtime Web for running converted Stable Diffusion models.

**Requirements**:
- Convert models to ONNX format
- Use ONNX Runtime Web directly
- More complex setup but more control

### 3. TensorFlow.js

Some text-to-image models have been ported to TensorFlow.js, but support is limited.

## Integration Options for Our Framework

### Option 1: Create a Separate Image Generation Adapter

We could create an adapter similar to `TransformersAdapter` but for image generation:

```typescript
// packages/core/src/llm/adapters/image-generation-adapter.ts
export class ImageGenerationAdapter {
  async generate(prompt: string): Promise<ImageResult> {
    // Use web-txt2img or ONNX Runtime directly
  }
}
```

### Option 2: Use External Service

For production apps, consider:
- Replicate API
- Stability AI API
- Hugging Face Inference API
- Self-hosted server

### Option 3: Hybrid Approach

- Use browser models for quick previews
- Fall back to API for high-quality generation

## Browser Requirements

For browser-based text-to-image generation:

1. **WebGPU Support** (recommended):
   - Chrome 113+ or Edge 113+
   - Firefox (experimental)
   - Safari (not yet supported)

2. **Memory Requirements**:
   - SD-Turbo: ~2-4GB RAM
   - Full Stable Diffusion: ~8-16GB RAM
   - Quantized models reduce memory usage

3. **Performance**:
   - First generation: 10-30 seconds
   - Subsequent generations: 2-10 seconds (cached)
   - Quality depends on model size and quantization

## Recommended Approach

For our framework, I recommend:

1. **Short-term**: Document how to use web-txt2img alongside our framework
2. **Long-term**: Create an image generation adapter if there's demand

### Example Integration Pattern

```typescript
// User can use both text and image generation
import { createWebAgent } from '@web-agent/react';
import { ImageGenerator } from '@web-agent/image'; // Future package

const textAgent = createWebAgent({
  model: { provider: 'transformers', path: 'Xenova/gpt2' }
});

const imageGen = new ImageGenerator({
  model: 'sd-turbo',
  useWebGPU: true,
});

// Generate text
const text = await textAgent.send('Describe an image');

// Generate image
const image = await imageGen.generate(text);
```

## Resources

- [web-txt2img GitHub](https://github.com/lacerbi/web-txt2img)
- [Transformers.js Tasks](https://huggingface.co/docs/transformers.js/supported_tasks)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)
- [Stable Diffusion Models](https://huggingface.co/models?pipeline_tag=text-to-image)

## Conclusion

While Transformers.js doesn't support text-to-image natively, you can:
1. Use web-txt2img as a separate solution
2. Wait for Transformers.js to add support (if planned)
3. Use server-side APIs for production
4. Create a custom adapter using ONNX Runtime Web

Would you like me to create an image generation adapter for the framework?


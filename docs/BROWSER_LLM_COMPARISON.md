# Browser-Based LLM Libraries Comparison

## Overview
This document compares different JavaScript libraries for running LLMs (like Gemma 2B) in the browser, focusing on context window capabilities and implementation details.

---

## 1. MediaPipe Web LLM (Current Implementation)

### Context Window
- **Current Limit**: 1,024 tokens (input + output combined)
- **Model Capability**: 8,192 tokens (limited by MediaPipe browser implementation)
- **Reason**: WebGPU memory constraints and conservative defaults

### Pros
- ✅ Optimized for browser (WebGPU acceleration)
- ✅ Small model size (~2GB for Gemma 2B INT4)
- ✅ Good performance with hardware acceleration
- ✅ Easy to use API
- ✅ Built-in caching support

### Cons
- ❌ Limited context window (1,024 tokens)
- ❌ Cannot easily increase beyond 1,024 tokens
- ❌ Requires specific model format (.bin files)

### Code Example
```typescript
const llm = await LlmInference.createFromOptions(filesetResolver, {
  baseOptions: { modelAssetPath: modelPath },
  maxTokens: 1024, // Hard limit in browser
  temperature: 0.8,
});
```

---

## 2. Transformers.js (@xenova/transformers)

### Context Window
- **Theoretical Limit**: Up to model's native context window (8,192 for Gemma 2B)
- **Practical Limit**: Depends on browser memory and model quantization
- **Configurable**: Yes, via `max_length` parameter

### Pros
- ✅ **Larger context window support** (can use full 8,192 tokens)
- ✅ Supports multiple model formats (ONNX, safetensors)
- ✅ WebGPU acceleration via ONNX Runtime Web
- ✅ Active development and good documentation
- ✅ Supports many models (Gemma, Llama, Mistral, etc.)
- ✅ Quantized models available (INT8, INT4)

### Cons
- ⚠️ Larger bundle size (~5-10MB for transformers.js)
- ⚠️ Model loading can be slower
- ⚠️ Memory usage scales with context length
- ⚠️ Requires ONNX Runtime Web dependency

### Code Example
```typescript
import { pipeline } from '@xenova/transformers';

const generator = await pipeline('text-generation', 'Xenova/gemma-2b-it', {
  device: 'webgpu', // or 'cpu'
  dtype: 'q8', // quantization
});

const output = await generator('Your prompt here', {
  max_new_tokens: 512,
  max_length: 8192, // Full context window!
  temperature: 0.8,
});
```

### Implementation Notes
- Uses ONNX Runtime Web for inference
- Supports streaming responses
- Can use WebGPU or CPU fallback
- Model files are downloaded on-demand or pre-cached

---

## 3. TensorFlow.js

### Context Window
- **Theoretical Limit**: Model-dependent (8,192 for Gemma 2B)
- **Practical Limit**: Browser memory constraints
- **Configurable**: Yes, but requires custom implementation

### Pros
- ✅ Mature library with extensive ecosystem
- ✅ WebGL/WebGPU acceleration
- ✅ Can load TensorFlow SavedModel or Keras models
- ✅ Good for custom model implementations

### Cons
- ❌ **No built-in LLM support** (requires custom implementation)
- ❌ Larger bundle size
- ❌ More complex setup for LLMs
- ❌ Not optimized specifically for LLM inference
- ❌ Would need to implement attention mechanisms manually

### Code Example
```typescript
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';

// Would require custom implementation
// Not recommended for LLM inference
```

### Recommendation
**Not recommended** for LLM inference. TensorFlow.js is better suited for other ML tasks (image classification, object detection, etc.).

---

## 4. LiteRT.js (If Available)

### Context Window
- **Status**: Need to verify if this library exists
- **Note**: May be confused with other libraries

### Research Needed
- Check if LiteRT.js is a real library or a typo
- If it exists, research its capabilities
- Compare with other options

---

## 5. ONNX Runtime Web

### Context Window
- **Theoretical Limit**: Model-dependent (8,192 for Gemma 2B)
- **Practical Limit**: Browser memory
- **Configurable**: Yes

### Pros
- ✅ Used by Transformers.js under the hood
- ✅ WebGPU acceleration
- ✅ Optimized for inference
- ✅ Supports quantized models

### Cons
- ⚠️ Lower-level API (more complex)
- ⚠️ Requires ONNX model format
- ⚠️ Less developer-friendly than Transformers.js

### Recommendation
Use via **Transformers.js** wrapper rather than directly.

---

## 6. WebLLM (by mlc-ai)

### Context Window
- **Theoretical Limit**: Model-dependent (8,192 for Gemma 2B)
- **Practical Limit**: Browser memory
- **Configurable**: Yes

### Pros
- ✅ Optimized for browser LLM inference
- ✅ WebGPU acceleration
- ✅ Supports streaming
- ✅ Good performance

### Cons
- ⚠️ Requires specific model format (MLC format)
- ⚠️ May not support Gemma 2B directly
- ⚠️ Less popular than Transformers.js

### Code Example
```typescript
import { CreateWebLLMEngine } from '@mlc-ai/web-llm';

const engine = await CreateWebLLMEngine('gemma-2b', {
  initProgressCallback: (report) => {
    console.log(report.text);
  },
});

const response = await engine.chat.completions.create({
  messages: [{ role: 'user', content: 'Your prompt' }],
  max_tokens: 512,
  // Context window depends on model
});
```

---

## Comparison Table

| Library | Context Window | WebGPU | Ease of Use | Bundle Size | Gemma 2B Support |
|---------|---------------|--------|-------------|-------------|------------------|
| **MediaPipe** | 1,024 tokens | ✅ | ⭐⭐⭐⭐⭐ | Small (~2GB model) | ✅ Native |
| **Transformers.js** | 8,192 tokens | ✅ | ⭐⭐⭐⭐ | Medium (~5-10MB) | ✅ Yes |
| **TensorFlow.js** | Custom | ✅ | ⭐⭐ | Large | ❌ Manual |
| **ONNX Runtime Web** | 8,192 tokens | ✅ | ⭐⭐ | Medium | ⚠️ Via ONNX |
| **WebLLM** | 8,192 tokens | ✅ | ⭐⭐⭐ | Medium | ⚠️ Check support |

---

## Recommendations

### For Maximum Context Window (8,192 tokens)
**Use Transformers.js** - Best balance of features, ease of use, and context window support.

### For Current Setup (1,024 tokens is enough)
**Keep MediaPipe** - Already integrated, optimized, and working well.

### Migration Path
1. **Phase 1**: Keep MediaPipe for current use cases
2. **Phase 2**: Add Transformers.js adapter as alternative
3. **Phase 3**: Let users choose based on context needs

---

## Implementation Strategy

### Option 1: Add Transformers.js Adapter
Create `@web-agent/transformers` package similar to `@web-agent/mediapipe`:

```typescript
// packages/transformers/src/adapter.ts
import { pipeline, Pipeline } from '@xenova/transformers';

export class TransformersAdapter implements LLMAdapter {
  private generator: Pipeline | null = null;
  
  async loadModel(modelPath: string): Promise<void> {
    this.generator = await pipeline('text-generation', modelPath, {
      device: 'webgpu',
      dtype: 'q8', // Quantized
    });
  }
  
  async generate(prompt: string, options: GenerateOptions): Promise<string> {
    const result = await this.generator!(prompt, {
      max_new_tokens: options.maxTokens || 512,
      max_length: 8192, // Full context!
      temperature: options.temperature || 0.8,
    });
    return result[0].generated_text;
  }
}
```

### Option 2: Hybrid Approach
- Use MediaPipe for quick responses (< 1,024 tokens)
- Use Transformers.js for longer context needs (> 1,024 tokens)
- Auto-switch based on context length

---

## Next Steps

1. **Research Transformers.js integration**
   - Test Gemma 2B support
   - Measure performance vs MediaPipe
   - Check bundle size impact

2. **Create adapter package**
   - `@web-agent/transformers` package
   - Implement `LLMAdapter` interface
   - Add configuration options

3. **Update framework**
   - Add adapter selection in `SmartAgentProvider`
   - Support both MediaPipe and Transformers.js
   - Document migration path

4. **Benchmark**
   - Compare context window usage
   - Measure inference speed
   - Test memory consumption

---

## References

- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [MediaPipe Web LLM](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/web_js)
- [WebLLM](https://webllm.mlc.ai/)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)


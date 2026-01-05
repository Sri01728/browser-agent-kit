# Transformers.js Supported Models

## Issue with Phi-3

The error `Unsupported model type: phi3` indicates that Phi-3 models are not yet fully supported by the current version of `@xenova/transformers` (v2.17.2).

## Recommended Models for Web Agent Framework

### ✅ Well-Supported Text Generation Models

1. **TinyLlama-1.1B-Chat-v1.0** (Recommended for demos)
   - Model ID: `Xenova/TinyLlama-1.1B-Chat-v1.0`
   - Size: ~637MB
   - Speed: Fast
   - Quality: Good for chat and tool calling
   - **Best for**: Quick demos, testing

2. **Qwen2.5-0.5B-Instruct**
   - Model ID: `Xenova/Qwen2.5-0.5B-Instruct`
   - Size: ~316MB
   - Speed: Very fast
   - Quality: Good for simple tasks
   - **Best for**: Lightweight applications

3. **Gemma-2B-it**
   - Model ID: `Xenova/gemma-2b-it`
   - Size: ~1.4GB
   - Speed: Moderate
   - Quality: Excellent
   - **Best for**: Production applications

4. **Llama-3.2-1B-Instruct**
   - Model ID: `Xenova/Llama-3.2-1B-Instruct`
   - Size: ~1.2GB
   - Speed: Moderate
   - Quality: Very good
   - **Best for**: Balanced performance

### ❌ Not Yet Supported

- **Phi-3** models (all variants)
  - `Xenova/Phi-3-mini-4k-instruct` ❌
  - `Xenova/Phi-3-small-8k-instruct` ❌
  - Reason: Model architecture not yet implemented in Transformers.js

## How to Change Models

Edit the `modelPath` in your agent setup:

```typescript
const adapter = new TransformersAdapter({
  modelPath: 'Xenova/TinyLlama-1.1B-Chat-v1.0', // Change this
  onProgress,
});
```

## Model Selection Guide

| Use Case | Recommended Model | Size | Speed |
|----------|-------------------|------|-------|
| Quick demo | TinyLlama-1.1B | 637MB | ⚡⚡⚡ |
| Lightweight | Qwen2.5-0.5B | 316MB | ⚡⚡⚡⚡ |
| Production | Gemma-2B | 1.4GB | ⚡⚡ |
| Balanced | Llama-3.2-1B | 1.2GB | ⚡⚡ |

## Checking Model Support

To verify if a model is supported:

1. Check the [Transformers.js Model Hub](https://huggingface.co/models?library=transformers.js)
2. Look for models with the `transformers.js` tag
3. Ensure the model type is listed in our adapter's `isTextGenerationModel()` check

## Future Updates

As Transformers.js adds support for more models, update the adapter's model list:

```typescript
// In packages/transformers/src/adapter.ts
private isTextGenerationModel(modelId: string): boolean {
  const textGenModels = [
    'gpt2', 'gpt', 'gemma', 'llama', 'mistral',
    'phi',    // ⚠️ Currently not working despite being listed
    'qwen', 't5', 'flan',
    // Add new models here as Transformers.js adds support
  ];
  // ...
}
```

## Troubleshooting

### Error: "Unsupported model type"
**Solution**: Switch to a well-supported model like TinyLlama or Qwen2.5

### Error: "Model download failed"
**Solution**: Check internet connection and try a smaller model

### Error: "Out of memory"
**Solution**: Use a smaller model (Qwen2.5-0.5B) or close other tabs

## References

- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [Supported Models List](https://huggingface.co/models?library=transformers.js)
- [Model Hub](https://huggingface.co/Xenova)


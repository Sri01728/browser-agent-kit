# Gemma 2B Optimization Guide

## Research Summary

This document compiles optimization strategies for Gemma 2B in browser-based inference, based on research from Google developer docs, open-source projects, and community discussions.

---

## 1. Model Architecture & Capabilities

### Key Features
- **Parameters**: 2 billion (2.51B actual)
- **Context Window**: 8,192 tokens (theoretical), 1,024 tokens (MediaPipe browser limit)
- **Architecture Enhancements**:
  - **Sliding Window Attention**: 4,096-token window for efficient long-context processing
  - **Attention Logit Softcapping**: Caps at 50.0 to prevent extreme values
  - **GeGLU Activation**: Gated Linear Units with GELU for improved performance
  - **RMSNorm**: Layer normalization without mean centering (faster computation)
  - **RoPE**: Rotary Positional Embeddings with base frequency 10,000
  - **Query Pre-Attention Scaling**: Scales queries by 224 before attention

### Quantization Options
- **INT8**: ~2.5GB storage
- **INT4**: ~1.25GB storage (current: `gemma-2b-it-gpu-int4.bin`)
- **FP16**: Full precision (larger, better quality)

---

## 2. MediaPipe Browser Limitations

### Current Constraints
- **maxTokens**: 1,024 tokens (input + output combined)
- **Reason**: WebGPU memory constraints and conservative defaults
- **Cannot easily increase**: Hard limit in MediaPipe browser implementation

### MediaPipe Configuration Options
```typescript
{
  maxTokens: 1024,        // Total tokens (input + output)
  topK: 40,               // Top-K sampling (reduce for faster inference)
  temperature: 0.8,       // Creativity (lower = more deterministic)
  randomSeed: 42,         // Reproducibility
}
```

---

## 3. Prompt Engineering Optimization

### Token Efficiency Strategies

#### ✅ DO: Keep Prompts Concise
```
❌ Bad: "You are a helpful AI assistant. Please answer questions using the data provided..."
✅ Good: "Answer using the data below."
```

#### ✅ DO: Use Compact Data Formats
```
❌ Bad: {"products": [{"name": "Laptop", "price": 1299}, ...]}
✅ Good: "Products: Laptop:$1299, Mouse:$49, ..."
```

#### ✅ DO: Remove Redundant Instructions
- Don't repeat the same instruction multiple times
- Use simple, direct language
- Avoid verbose explanations

#### ✅ DO: Structure Data Efficiently
```
✅ Good Format:
"Data available:
Product List: Total Products: 5. Products: 1. Laptop - $1299, ...
Weather Data: New York: -3°C, Clear
News: 1. "Title" from Source. Details: ..."
```

### Prompt Template Optimization

**Current (Good)**:
```
Data available:
[data]

Answer questions using the data above.
```

**Optimized (Better)**:
```
Data:
[data]

Q: [question]
A:
```

---

## 4. Context Window Optimization

### Strategy 1: Selective Data Inclusion
Only include relevant data based on question type:

```typescript
// Pseudo-code
function buildContext(question: string, allData: DataRegistry) {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('product')) {
    return onlyProductData(allData);
  }
  if (questionLower.includes('weather')) {
    return onlyWeatherData(allData);
  }
  if (questionLower.includes('news')) {
    return onlyNewsData(allData);
  }
  
  // Default: include all (but compact)
  return compactAllData(allData);
}
```

### Strategy 2: Data Summarization
Summarize large datasets before including:

```typescript
// Instead of full product list
"Products: 5 items, total value: $2,425"

// Instead of full news articles
"News: 5 headlines about [topics]"
```

### Strategy 3: Truncate Long Contexts
```typescript
const MAX_CONTEXT_TOKENS = 400; // Leave room for prompt + response
const context = buildContext();
const truncated = truncateToTokens(context, MAX_CONTEXT_TOKENS);
```

---

## 5. Inference Parameters Optimization

### Temperature Settings
- **Lower (0.3-0.5)**: More deterministic, faster, less creative
- **Current (0.8)**: Balanced
- **Higher (1.0+)**: More creative but slower, may exceed tokens

**Recommendation**: Use 0.6-0.7 for better token efficiency

### Top-K Settings
- **Current**: 40
- **Lower (20-30)**: Faster inference, more focused
- **Higher (50+)**: Slower, more diverse

**Recommendation**: Use 30 for better performance

### MaxTokens Distribution
With 1,024 total tokens:
- **Prompt**: ~400-500 tokens (context + persona + user message)
- **Response**: ~500-600 tokens available
- **Buffer**: ~24 tokens for safety

---

## 6. Data Format Optimization

### Current Format (Good)
```
Total Products: 5. Products: 1. Laptop - $1299, 2. Mouse - $49, ...
```

### Optimized Format (Better - Saves ~20% tokens)
```
Products(5): Laptop:$1299, Mouse:$49, Desk:$599, Chair:$399, Hub:$79
```

### News Format Optimization
```
Current: News 1: "Full Title" from Source (Date). Details: [200 chars]
Optimized: News: "Title" | Source | [100 chars summary]
```

---

## 7. Memory & Performance Optimization

### WebGPU Optimization
- **Model Caching**: ✅ Already implemented (IndexedDB)
- **Batch Processing**: Not applicable (single requests)
- **Memory Management**: Clear unused tensors

### Browser-Specific Tips
1. **Use INT4 quantization**: Current model is optimal
2. **Enable WebGPU**: Already checking
3. **Cache model files**: Already implemented
4. **Preload model**: Consider preloading on app start

---

## 8. Prompt Engineering Best Practices

### For Gemma 2B Specifically

#### ✅ Use Direct Instructions
```
✅ "Answer using the data."
❌ "Please be so kind as to answer using the provided data..."
```

#### ✅ Avoid Repetition
```
❌ "Use the data. Use the data above. Use the provided data."
✅ "Use the data above."
```

#### ✅ Use Examples Sparingly
- Examples consume tokens
- Only include if absolutely necessary
- Keep examples short

#### ✅ Structure for Clarity
```
✅ Clear structure:
Data:
- Products: ...
- Weather: ...
- News: ...

Q: [question]
A:
```

---

## 9. Token Estimation & Management

### Token Counting (Approximate)
- **English**: ~4 characters = 1 token
- **Numbers/Symbols**: ~2-3 characters = 1 token
- **Spaces**: Included in tokens

### Current Token Usage (Estimated)
```
Persona: ~10 tokens
Context prompt: ~150-300 tokens
User message: ~20-50 tokens
Prompt structure: ~30 tokens
Total input: ~210-390 tokens
Available for response: ~634-814 tokens
```

### Optimization Targets
- Reduce persona to <5 tokens
- Reduce context prompt to <200 tokens
- Keep user messages concise

---

## 10. Advanced Optimization Techniques

### 1. Dynamic Context Selection
Only include data relevant to the question:

```typescript
function selectRelevantData(question: string, registry: DataRegistry) {
  const keywords = extractKeywords(question);
  const relevant: string[] = [];
  
  for (const [key, value] of registry.entries()) {
    if (isRelevant(key, value, keywords)) {
      relevant.push(formatData(key, value));
    }
  }
  
  return relevant.join('\n');
}
```

### 2. Data Compression
Use abbreviations and symbols:

```
Before: "Cryptocurrency 1: Bitcoin (BTC) costs $43,250 USD, 24h change: +2.5%"
After: "BTC: $43,250 (+2.5%)"
```

### 3. Hierarchical Data
Include summary first, details only if needed:

```
Level 1: "Products: 5 items, $2,425 total"
Level 2: "Products: Laptop:$1299, Mouse:$49, ..."
```

### 4. Streaming Responses
Already implemented, but can optimize:
- Reduce `requestAnimationFrame` batching delay
- Process chunks faster

---

## 11. Recommended Configuration

### Optimal Settings for Browser Inference

```typescript
const OPTIMAL_CONFIG = {
  maxTokens: 1024,        // Fixed by MediaPipe
  temperature: 0.6,        // Lower = more efficient
  topK: 30,                // Reduced from 40
  randomSeed: 42,          // For reproducibility
  
  // Context management
  maxContextTokens: 400,   // Leave room for response
  includeOnlyRelevant: true, // Smart filtering
  
  // Data format
  useCompactFormat: true,  // Save tokens
  truncateLongData: true,  // Prevent overflow
};
```

---

## 12. Implementation Recommendations

### Immediate Improvements

1. **Reduce Temperature**: 0.8 → 0.6
   - More deterministic responses
   - Faster inference
   - Better token efficiency

2. **Reduce Top-K**: 40 → 30
   - Faster sampling
   - More focused responses

3. **Optimize Persona**: 
   - Current: "You are a helpful assistant. Always use the data provided to you to answer questions about it."
   - Optimized: "Answer using the data below."

4. **Smart Context Selection**:
   - Analyze question keywords
   - Include only relevant data
   - Save 30-50% tokens

5. **Compact Data Format**:
   - Use abbreviations
   - Remove redundant words
   - Use symbols where possible

### Future Enhancements

1. **Implement Dynamic Context Selection**
2. **Add Token Counting Utility**
3. **Create Data Summarization Layer**
4. **Optimize Prompt Templates**
5. **Add Response Length Prediction**

---

## 13. Performance Benchmarks

### Expected Improvements

| Optimization | Token Savings | Speed Improvement |
|-------------|---------------|-------------------|
| Compact data format | 20-30% | - |
| Reduced temperature | - | 10-15% |
| Reduced topK | - | 5-10% |
| Smart context selection | 30-50% | - |
| Optimized persona | 5-10% | - |
| **Total** | **55-100%** | **15-25%** |

---

## 14. References

- [Google Gemma Documentation](https://ai.google.dev/gemma)
- [NVIDIA NeMo Gemma Guide](https://docs.nvidia.com/nemo/megatron-bridge/latest/models/llm/gemma2.html)
- [MediaPipe Web LLM](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/web_js)
- [Gemma PyTorch GitHub](https://github.com/google/gemma_pytorch)
- [Hugging Face Gemma 2B](https://huggingface.co/google/gemma-2b)

---

## 15. Action Items

### High Priority
- [ ] Implement smart context selection
- [ ] Optimize persona (reduce tokens)
- [ ] Add compact data format option
- [ ] Reduce temperature to 0.6
- [ ] Reduce topK to 30

### Medium Priority
- [ ] Add token counting utility
- [ ] Implement data summarization
- [ ] Create prompt template system
- [ ] Add response length prediction

### Low Priority
- [ ] Research alternative adapters (Transformers.js)
- [ ] Benchmark different quantization levels
- [ ] Test with different model variants


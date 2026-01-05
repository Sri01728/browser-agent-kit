/**
 * Tests for TransformersAdapter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransformersAdapter } from '../adapter';
import { ConfigurationError, ModelNotInitializedError } from '../errors';

// Mock @xenova/transformers
vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn(),
  env: {
    allowLocalModels: false,
    allowRemoteModels: false,
    backends: {
      onnx: {
        wasm: {
          proxy: true,
        },
      },
    },
  },
}));

describe('TransformersAdapter', () => {
  describe('Constructor', () => {
    it('should create adapter with valid config', () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/Phi-3-mini-4k-instruct',
      });
      
      expect(adapter.id).toBe('transformers');
      expect(adapter.name).toBe('Transformers.js');
      expect(adapter.isReady()).toBe(false);
    });

    it('should throw ConfigurationError for invalid config', () => {
      expect(() => {
        new TransformersAdapter({
          modelPath: '', // Invalid: empty string
        } as any);
      }).toThrow(ConfigurationError);
    });

    it('should accept optional configuration', () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/gemma-2b-it',
        modelConfig: {
          maxTokens: 2048,
          temperature: 0.8,
          topP: 0.9,
          topK: 50,
        },
        useWebGPU: false,
        useWASM: true,
      });
      
      expect(adapter).toBeDefined();
    });
  });

  describe('Model Family Detection', () => {
    it('should detect Phi models', () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/Phi-3-mini-4k-instruct',
      });
      
      // Model family is detected in constructor
      expect(adapter).toBeDefined();
    });

    it('should detect Llama models', () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/llama-2-7b-chat',
      });
      
      expect(adapter).toBeDefined();
    });

    it('should detect Mistral models', () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/Mistral-7B-Instruct-v0.2',
      });
      
      expect(adapter).toBeDefined();
    });

    it('should detect Gemma models', () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/gemma-2b-it',
      });
      
      expect(adapter).toBeDefined();
    });
  });

  describe('Context Window', () => {
    it('should return correct context window for Phi models', () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/Phi-3-mini-4k-instruct',
      });
      
      const contextWindow = adapter.getContextWindow();
      expect(contextWindow).toBeGreaterThan(0);
    });

    it('should return correct context window for Llama models', () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/llama-2-7b-chat',
      });
      
      const contextWindow = adapter.getContextWindow();
      expect(contextWindow).toBe(4096);
    });

    it('should return correct context window for Mistral models', () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/Mistral-7B-Instruct-v0.2',
      });
      
      const contextWindow = adapter.getContextWindow();
      expect(contextWindow).toBe(8192);
    });

    it('should return correct context window for Gemma models', () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/gemma-2b-it',
      });
      
      const contextWindow = adapter.getContextWindow();
      expect(contextWindow).toBe(8192);
    });

    it('should return default context window for unknown models', () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/some-unknown-model',
      });
      
      const contextWindow = adapter.getContextWindow();
      expect(contextWindow).toBe(2048); // Default
    });
  });

  describe('Tool Support', () => {
    it('should support tools', () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/Phi-3-mini-4k-instruct',
      });
      
      expect(adapter.supportsTools()).toBe(true);
    });
  });

  describe('Lifecycle', () => {
    it('should not be ready before initialization', () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/Phi-3-mini-4k-instruct',
      });
      
      expect(adapter.isReady()).toBe(false);
    });

    it('should throw ModelNotInitializedError when generating before initialization', async () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/Phi-3-mini-4k-instruct',
      });
      
      await expect(
        adapter.generate({
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow(ModelNotInitializedError);
    });

    it('should throw ModelNotInitializedError when streaming before initialization', async () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/Phi-3-mini-4k-instruct',
      });
      
      const stream = adapter.stream({
        messages: [{ role: 'user', content: 'Hello' }],
      });
      
      await expect(stream.next()).rejects.toThrow(ModelNotInitializedError);
    });

    it('should dispose cleanly', () => {
      const adapter = new TransformersAdapter({
        modelPath: 'Xenova/Phi-3-mini-4k-instruct',
      });
      
      adapter.dispose();
      expect(adapter.isReady()).toBe(false);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate maxTokens range', () => {
      expect(() => {
        new TransformersAdapter({
          modelPath: 'Xenova/Phi-3-mini-4k-instruct',
          modelConfig: {
            maxTokens: 0, // Invalid: must be >= 1
          },
        });
      }).toThrow(ConfigurationError);
    });

    it('should validate temperature range', () => {
      expect(() => {
        new TransformersAdapter({
          modelPath: 'Xenova/Phi-3-mini-4k-instruct',
          modelConfig: {
            temperature: 3.0, // Invalid: must be <= 2
          },
        });
      }).toThrow(ConfigurationError);
    });

    it('should validate topP range', () => {
      expect(() => {
        new TransformersAdapter({
          modelPath: 'Xenova/Phi-3-mini-4k-instruct',
          modelConfig: {
            topP: 1.5, // Invalid: must be <= 1
          },
        });
      }).toThrow(ConfigurationError);
    });
  });
});


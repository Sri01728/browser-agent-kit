/**
 * Basic Transformers.js Example
 * 
 * Demonstrates how to use Transformers.js models with the web-agent framework.
 * 
 * Run this example:
 * 1. Install dependencies: pnpm install
 * 2. Build packages: pnpm build
 * 3. Run demo: cd demo-app && pnpm dev
 */

import { createWebAgent, TRANSFORMERS_MODELS } from '@web-agent/react';

/**
 * Example 1: Using GPT-2 (small, fast model)
 */
export async function exampleGPT2() {
  const agent = createWebAgent({
    persona: 'You are a helpful assistant.',
    model: {
      provider: 'transformers',
      path: TRANSFORMERS_MODELS.gpt2,
      maxTokens: 100,
      temperature: 0.7,
    },
  });

  console.log('Loading GPT-2 model...');
  await agent.load();
  console.log('Model loaded!');

  const response = await agent.send('Write a haiku about coding.');
  console.log('Response:', response);
}

/**
 * Example 2: Using Gemma 2B (better quality, slower)
 */
export async function exampleGemma() {
  const agent = createWebAgent({
    persona: 'You are a coding assistant.',
    model: {
      provider: 'transformers',
      path: TRANSFORMERS_MODELS.gemma2b,
      maxTokens: 512,
      temperature: 0.8,
    },
    autoLoad: true, // Auto-load on creation
  });

  // Wait for model to load
  await new Promise((resolve) => {
    const unsubscribe = agent.onStatusChange((status) => {
      if (status === 'ready') {
        unsubscribe();
        resolve(undefined);
      }
    });
  });

  const response = await agent.send('Explain React hooks in one sentence.');
  console.log('Response:', response);
}

/**
 * Example 3: Using custom Hugging Face model
 */
export async function exampleCustomModel() {
  const agent = createWebAgent({
    persona: 'You are a creative writer.',
    model: {
      provider: 'transformers',
      path: 'Xenova/Phi-3-mini-4k-instruct', // Custom model
      maxTokens: 256,
    },
  });

  await agent.load();
  
  agent.onResponse((response, ui) => {
    console.log('Response:', response);
    if (ui) {
      console.log('UI generated:', ui);
    }
  });

  await agent.send('Write a short story about a robot.');
}

/**
 * Example 4: React Component Usage
 */
export function TransformersExample() {
  const agent = createWebAgent({
    persona: 'You are a helpful assistant.',
    model: {
      provider: 'transformers',
      path: TRANSFORMERS_MODELS.gpt2,
    },
  });

  const handleClick = async () => {
    if (!agent.isReady) {
      await agent.load();
    }
    await agent.send('Hello!');
  };

  return (
    <div>
      <button onClick={handleClick} disabled={agent.isGenerating}>
        {agent.isReady ? 'Send Message' : 'Load Model'}
      </button>
      {agent.status === 'loading' && <p>Loading model...</p>}
      {agent.error && <p>Error: {agent.error.message}</p>}
    </div>
  );
}


'use client';

import { AgentChat } from '@web-agent/react';
import { Agent } from '@web-agent/core';
import { TransformersAdapter } from '@web-agent/transformers';
import { weatherTool } from '@/agents/tools/weather';

export default function Home() {
  // Create agent with Transformers.js adapter
  const agent = new Agent({
    id: 'assistant',
    name: 'Assistant',
    instructions: 'You are a helpful assistant. Help users with their questions.',
    model: new TransformersAdapter({
      modelPath: 'Xenova/Phi-3-mini-4k-instruct',
    }),
    tools: [weatherTool],
  });

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Web Agent Framework</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <AgentChat
            agent={agent}
            placeholder="Ask me anything..."
            className="h-[600px]"
          />
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <p>
            This is a Web Agent Framework app. The agent runs entirely in your browser
            using WebGPU/WASM - no server required!
          </p>
        </div>
      </div>
    </main>
  );
}


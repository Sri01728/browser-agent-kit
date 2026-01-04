/**
 * Custom Hook: useTransformersAgent
 * 
 * This hook demonstrates how simple it is to use Transformers.js with our framework.
 * Just 3 steps:
 * 1. Create agent with model path
 * 2. Load the model
 * 3. Send messages
 */

import { useState, useEffect } from 'react';
import { createWebAgent, TRANSFORMERS_MODELS, type WebAgentInstance } from '@web-agent/react';

export const AVAILABLE_MODELS = [
  { id: 'gpt2', name: 'GPT-2 (Small, Fast)', path: TRANSFORMERS_MODELS.gpt2 },
  { id: 'gpt2-medium', name: 'GPT-2 Medium', path: TRANSFORMERS_MODELS.gpt2Medium },
  { id: 'gemma2b', name: 'Gemma 2B (Balanced)', path: TRANSFORMERS_MODELS.gemma2b },
  { id: 'phi2', name: 'Phi-3 Mini (Coding)', path: TRANSFORMERS_MODELS.phi2 },
] as const;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function useTransformersAgent(selectedModelId: string) {
  const [agent, setAgent] = useState<WebAgentInstance | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Step 1: Create agent when model changes
  useEffect(() => {
    const modelConfig = AVAILABLE_MODELS.find(m => m.id === selectedModelId);
    if (!modelConfig) return;

    // Create agent with Transformers.js provider
    const newAgent = createWebAgent({
      persona: 'You are a helpful AI assistant running in the browser using Transformers.js.',
      model: {
        provider: 'transformers', // Use Transformers.js
        path: modelConfig.path,   // Model path from Hugging Face
        maxTokens: 256,
        temperature: 0.7,
      },
      autoLoad: false, // We'll load manually
    });

    // Listen to status changes
    const unsubscribe = newAgent.onStatusChange((status) => {
      if (status === 'loading') {
        setIsLoading(true);
      } else if (status === 'ready') {
        setIsLoading(false);
        setLoadProgress(100);
      } else if (status === 'error') {
        setIsLoading(false);
      }
    });

    // Listen to responses
    newAgent.onResponse((response) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }]);
    });

    setAgent(newAgent);
    setMessages([]);
    setLoadProgress(0);

    return () => {
      unsubscribe();
      newAgent.dispose();
    };
  }, [selectedModelId]);

  // Step 2: Load model function
  const loadModel = async () => {
    if (!agent || agent.isReady) return;
    
    setIsLoading(true);
    setLoadProgress(0);
    
    try {
      await agent.load(); // This downloads and initializes the model
    } catch (error) {
      console.error('Failed to load model:', error);
      setIsLoading(false);
    }
  };

  // Step 3: Send message function
  const sendMessage = async (text: string) => {
    if (!agent || !agent.isReady || !text.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      await agent.send(text); // Send message and get response
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to generate response'}`,
        timestamp: Date.now(),
      }]);
    }
  };

  const clearMessages = () => {
    agent?.clear();
    setMessages([]);
  };

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId);

  return {
    agent,
    messages,
    isLoading,
    loadProgress,
    currentModel,
    loadModel,
    sendMessage,
    clearMessages,
  };
}


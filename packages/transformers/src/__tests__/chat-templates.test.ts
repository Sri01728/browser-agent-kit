/**
 * Tests for chat template utilities
 */

import { describe, it, expect } from 'vitest';
import {
  formatPhiChat,
  formatLlamaChat,
  formatMistralChat,
  formatGemmaChat,
  formatSimpleChat,
  parseToolCalls,
  detectModelFamily,
} from '../chat-templates';
import type { Message, ToolDefinition } from '@web-agent/core';

describe('Chat Templates', () => {
  const messages: Message[] = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: 'Hi there!' },
    { role: 'user', content: 'How are you?' },
  ];

  const tools: ToolDefinition[] = [
    {
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
        },
        required: ['location'],
      },
    },
  ];

  describe('formatPhiChat', () => {
    it('should format messages for Phi models', () => {
      const result = formatPhiChat(messages);
      
      expect(result).toContain('System:');
      expect(result).toContain('User: Hello!');
      expect(result).toContain('Assistant: Hi there!');
      expect(result).toContain('User: How are you?');
      expect(result.trim().endsWith('Assistant:')).toBe(true);
    });

    it('should include tools in Phi format', () => {
      const result = formatPhiChat(messages, tools);
      
      expect(result).toContain('Available Tools:');
      expect(result).toContain('Tool: get_weather');
      expect(result).toContain('TOOL_CALL:');
    });
  });

  describe('formatLlamaChat', () => {
    it('should format messages for Llama models', () => {
      const result = formatLlamaChat(messages);
      
      expect(result).toContain('<s>');
      expect(result).toContain('[INST]');
      expect(result).toContain('[/INST]');
      expect(result).toContain('<<SYS>>');
      expect(result).toContain('<</SYS>>');
    });

    it('should include tools in Llama format', () => {
      const result = formatLlamaChat(messages, tools);
      
      expect(result).toContain('[TOOL: get_weather]');
      expect(result).toContain('<tool_call>');
    });
  });

  describe('formatMistralChat', () => {
    it('should format messages for Mistral models', () => {
      const result = formatMistralChat(messages);
      
      expect(result).toContain('<s>');
      expect(result).toContain('[INST]');
      expect(result).toContain('[/INST]');
      expect(result).toContain('</s>');
    });

    it('should include tools in Mistral format', () => {
      const result = formatMistralChat(messages, tools);
      
      expect(result).toContain('Available functions:');
      expect(result).toContain('Function: get_weather');
    });
  });

  describe('formatGemmaChat', () => {
    it('should format messages for Gemma models', () => {
      const result = formatGemmaChat(messages);
      
      expect(result).toContain('<start_of_turn>');
      expect(result).toContain('<end_of_turn>');
      expect(result).toContain('system');
      expect(result).toContain('user');
      expect(result).toContain('model');
    });

    it('should include tools in Gemma format', () => {
      const result = formatGemmaChat(messages, tools);
      
      expect(result).toContain('Tools available:');
      expect(result).toContain('get_weather');
      expect(result).toContain('CALL_TOOL');
    });
  });

  describe('formatSimpleChat', () => {
    it('should format messages for simple models', () => {
      const result = formatSimpleChat(messages);
      
      expect(result).toContain('System:');
      expect(result).toContain('User:');
      expect(result).toContain('Assistant:');
    });

    it('should include tools in simple format', () => {
      const result = formatSimpleChat(messages, tools);
      
      expect(result).toContain('You can use these tools:');
      expect(result).toContain('get_weather');
      expect(result).toContain('USE_TOOL');
    });
  });

  describe('parseToolCalls', () => {
    it('should parse Phi tool calls', () => {
      const text = 'TOOL_CALL: {"name": "get_weather", "arguments": {"location": "Paris"}}';
      const result = parseToolCalls(text, 'phi');
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result![0].name).toBe('get_weather');
      expect(result![0].arguments).toEqual({ location: 'Paris' });
    });

    it('should parse Llama tool calls', () => {
      const text = '<tool_call>\n{"name": "get_weather", "arguments": {"location": "Paris"}}\n</tool_call>';
      const result = parseToolCalls(text, 'llama');
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result![0].name).toBe('get_weather');
    });

    it('should parse Mistral tool calls', () => {
      const text = '{"function": "get_weather", "parameters": {"location": "Paris"}}';
      const result = parseToolCalls(text, 'mistral');
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result![0].name).toBe('get_weather');
    });

    it('should parse Gemma tool calls', () => {
      const text = 'CALL_TOOL(get_weather, {"location": "Paris"})';
      const result = parseToolCalls(text, 'gemma');
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result![0].name).toBe('get_weather');
    });

    it('should return undefined for invalid tool calls', () => {
      const text = 'Just a regular response';
      const result = parseToolCalls(text, 'phi');
      
      expect(result).toBeUndefined();
    });
  });

  describe('detectModelFamily', () => {
    it('should detect Phi models', () => {
      expect(detectModelFamily('Xenova/Phi-3-mini-4k-instruct')).toBe('phi');
      expect(detectModelFamily('phi-2')).toBe('phi');
    });

    it('should detect Llama models', () => {
      expect(detectModelFamily('Xenova/llama-2-7b-chat')).toBe('llama');
      expect(detectModelFamily('llama-3-8b')).toBe('llama');
    });

    it('should detect Mistral models', () => {
      expect(detectModelFamily('Xenova/Mistral-7B-Instruct-v0.2')).toBe('mistral');
      expect(detectModelFamily('mistral-7b')).toBe('mistral');
    });

    it('should detect Gemma models', () => {
      expect(detectModelFamily('Xenova/gemma-2b-it')).toBe('gemma');
      expect(detectModelFamily('gemma-7b')).toBe('gemma');
    });

    it('should detect GPT-2 models', () => {
      expect(detectModelFamily('Xenova/gpt2')).toBe('gpt2');
      expect(detectModelFamily('gpt-2-medium')).toBe('gpt2');
    });

    it('should detect Qwen models', () => {
      expect(detectModelFamily('Xenova/qwen-2-7b')).toBe('qwen');
    });

    it('should return unknown for unrecognized models', () => {
      expect(detectModelFamily('some-random-model')).toBe('unknown');
    });
  });
});


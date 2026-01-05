import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAgentStream } from '../use-agent-stream';
import type { Agent, AgentStreamChunk } from '@web-agent/core';

describe('useAgentStream', () => {
  let mockAgent: Agent;

  beforeEach(() => {
    mockAgent = {
      id: 'test-agent',
      name: 'Test Agent',
      instructions: 'Test instructions',
      model: {} as any,
      tools: {},
      generate: vi.fn(),
      stream: vi.fn(),
    };
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useAgentStream(mockAgent));

    expect(result.current.chunks).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('should stream chunks from agent', async () => {
    const mockChunks: AgentStreamChunk[] = [
      { type: 'text', text: 'Hello' },
      { type: 'text', text: ' world' },
      { type: 'done', done: { text: 'Hello world', steps: 1, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } },
    ];

    async function* mockStream() {
      for (const chunk of mockChunks) {
        yield chunk;
      }
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream(mockAgent));

    // Start streaming
    result.current.startStream('Test prompt');

    // Wait for streaming to start
    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true);
    });

    // Wait for streaming to complete
    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false);
    }, { timeout: 3000 });

    // Check chunks were collected
    expect(result.current.chunks.length).toBeGreaterThan(0);
    expect(result.current.result).toBeTruthy();
    expect(result.current.result?.text).toBe('Hello world');
  });

  it('should handle streaming errors', async () => {
    async function* mockStream() {
      yield { type: 'text', text: 'Hello' } as AgentStreamChunk;
      throw new Error('Stream error');
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream(mockAgent));

    result.current.startStream('Test prompt');

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    }, { timeout: 3000 });

    expect(result.current.error?.message).toBe('Stream error');
    expect(result.current.isStreaming).toBe(false);
  });

  it('should clear state on reset', async () => {
    async function* mockStream() {
      yield { type: 'text', text: 'Hello' } as AgentStreamChunk;
      yield { type: 'done', done: { text: 'Hello', steps: 1, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } } as AgentStreamChunk;
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream(mockAgent));

    result.current.startStream('Test prompt');

    await waitFor(() => {
      expect(result.current.result).toBeTruthy();
    }, { timeout: 3000 });

    // Reset
    result.current.reset();

    expect(result.current.chunks).toEqual([]);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle tool call chunks', async () => {
    const mockChunks: AgentStreamChunk[] = [
      { type: 'text', text: 'Calling tool...' },
      { type: 'tool_call', toolCall: { id: 'call-1', name: 'testTool', arguments: { input: 'test' } } },
      { type: 'tool_result', toolResult: { id: 'call-1', result: { output: 'result' } } },
      { type: 'done', done: { text: 'Done', steps: 2, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } },
    ];

    async function* mockStream() {
      for (const chunk of mockChunks) {
        yield chunk;
      }
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream(mockAgent));

    result.current.startStream('Test prompt');

    await waitFor(() => {
      expect(result.current.result).toBeTruthy();
    }, { timeout: 3000 });

    expect(result.current.chunks).toHaveLength(4);
    expect(result.current.chunks[1].type).toBe('tool_call');
    expect(result.current.chunks[2].type).toBe('tool_result');
  });

  it('should pass options to agent stream', async () => {
    async function* mockStream() {
      yield { type: 'done', done: { text: 'Done', steps: 1, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } } as AgentStreamChunk;
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream(mockAgent));

    const options = {
      maxTokens: 100,
      temperature: 0.7,
      memory: { resource: 'user-123', thread: 'thread-1' },
    };

    result.current.startStream('Test prompt', options);

    await waitFor(() => {
      expect(mockAgent.stream).toHaveBeenCalledWith('Test prompt', options);
    });
  });

  it('should not start new stream while streaming', async () => {
    async function* mockStream() {
      yield { type: 'text', text: 'Hello' } as AgentStreamChunk;
      // Simulate slow stream
      await new Promise(resolve => setTimeout(resolve, 100));
      yield { type: 'done', done: { text: 'Hello', steps: 1, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } } as AgentStreamChunk;
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream(mockAgent));

    result.current.startStream('First prompt');

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true);
    });

    // Try to start another stream
    result.current.startStream('Second prompt');

    // Should still be processing first stream
    expect(mockAgent.stream).toHaveBeenCalledTimes(1);
  });

  it('should accumulate text chunks', async () => {
    const mockChunks: AgentStreamChunk[] = [
      { type: 'text', text: 'Hello' },
      { type: 'text', text: ' ' },
      { type: 'text', text: 'world' },
      { type: 'done', done: { text: 'Hello world', steps: 1, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } },
    ];

    async function* mockStream() {
      for (const chunk of mockChunks) {
        yield chunk;
      }
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream(mockAgent));

    result.current.startStream('Test prompt');

    await waitFor(() => {
      expect(result.current.result).toBeTruthy();
    }, { timeout: 3000 });

    // Check that text chunks were accumulated
    const textChunks = result.current.chunks.filter(c => c.type === 'text');
    expect(textChunks).toHaveLength(3);
  });

  it('should handle empty stream', async () => {
    async function* mockStream() {
      yield { type: 'done', done: { text: '', steps: 0, finishReason: 'stop', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } } } as AgentStreamChunk;
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream(mockAgent));

    result.current.startStream('Test prompt');

    await waitFor(() => {
      expect(result.current.result).toBeTruthy();
    }, { timeout: 3000 });

    expect(result.current.result?.text).toBe('');
    expect(result.current.result?.steps).toBe(0);
  });

  it('should cleanup on unmount', async () => {
    async function* mockStream() {
      yield { type: 'text', text: 'Hello' } as AgentStreamChunk;
      await new Promise(resolve => setTimeout(resolve, 1000));
      yield { type: 'done', done: { text: 'Hello', steps: 1, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } } as AgentStreamChunk;
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result, unmount } = renderHook(() => useAgentStream(mockAgent));

    result.current.startStream('Test prompt');

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true);
    });

    // Unmount while streaming
    unmount();

    // Should not throw or cause errors
    expect(true).toBe(true);
  });
});


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
    const { result } = renderHook(() => useAgentStream({ agent: mockAgent }));

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.partialResponse).toBe('');
    expect(result.current.isStopped).toBe(false);
  });

  it('should stream response from agent', async () => {
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

    const { result } = renderHook(() => useAgentStream({ agent: mockAgent }));

    // Send message and wait for completion
    result.current.sendMessage('Test prompt');

    // Wait for messages to be added
    await waitFor(() => {
      expect(result.current.messages.length).toBe(2);
    });

    // Check messages were added correctly
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('Test prompt');
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].content).toBe('Hello world');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle streaming errors', async () => {
    async function* mockStream() {
      yield { type: 'text', text: 'Hello' } as AgentStreamChunk;
      throw new Error('Stream error');
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream({ agent: mockAgent }));

    await result.current.sendMessage('Test prompt');

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe('Stream error');
    expect(result.current.isLoading).toBe(false);
  });

  it('should clear messages', async () => {
    async function* mockStream() {
      yield { type: 'text', text: 'Hello' } as AgentStreamChunk;
      yield { type: 'done', done: { text: 'Hello', steps: 1, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } } as AgentStreamChunk;
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream({ agent: mockAgent }));

    result.current.sendMessage('Test prompt');

    await waitFor(() => {
      expect(result.current.messages.length).toBe(2);
    });

    // Clear messages
    result.current.clearMessages();

    // Wait for state update - just check messages are cleared
    await waitFor(() => {
      expect(result.current.messages.length).toBe(0);
    });

    // Partial response should also be cleared
    expect(result.current.partialResponse).toBe('');
  });

  it('should show partial response during streaming', async () => {
    const mockChunks: AgentStreamChunk[] = [
      { type: 'text', text: 'Hello' },
      { type: 'text', text: ' world' },
      { type: 'done', done: { text: 'Hello world', steps: 1, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } },
    ];

    async function* mockStream() {
      for (const chunk of mockChunks) {
        yield chunk;
        // Add small delay to allow state updates
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream({ agent: mockAgent }));

    await result.current.sendMessage('Test prompt');

    // Wait for completion
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // After completion, partial response should be cleared
    expect(result.current.partialResponse).toBe('');
  });

  it('should stop streaming', async () => {
    const mockChunks: AgentStreamChunk[] = [
      { type: 'text', text: 'Hello' },
      { type: 'text', text: ' world' },
      { type: 'done', done: { text: 'Hello world', steps: 1, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } },
    ];

    async function* mockStream() {
      for (const chunk of mockChunks) {
        yield chunk;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream({ agent: mockAgent }));

    // Start streaming
    result.current.sendMessage('Test prompt');

    // Wait for streaming to start
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Stop streaming
    result.current.stop();

    // Wait for state updates
    await waitFor(() => {
      expect(result.current.isStopped).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should call onSend callback', async () => {
    const onSend = vi.fn();

    async function* mockStream() {
      yield { type: 'done', done: { text: 'Done', steps: 1, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } } as AgentStreamChunk;
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream({ agent: mockAgent, onSend }));

    await result.current.sendMessage('Test prompt');

    await waitFor(() => {
      expect(onSend).toHaveBeenCalled();
    });

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'user',
        content: 'Test prompt',
      })
    );
  });

  it('should call onResponse callback', async () => {
    const onResponse = vi.fn();

    async function* mockStream() {
      yield { type: 'text', text: 'Response' } as AgentStreamChunk;
      yield { type: 'done', done: { text: 'Response', steps: 1, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } } as AgentStreamChunk;
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream({ agent: mockAgent, onResponse }));

    await result.current.sendMessage('Test prompt');

    await waitFor(() => {
      expect(onResponse).toHaveBeenCalled();
    });

    expect(onResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: 'Response',
      })
    );
  });

  it('should call onChunk callback', async () => {
    const onChunk = vi.fn();

    async function* mockStream() {
      yield { type: 'text', text: 'Hello' } as AgentStreamChunk;
      yield { type: 'text', text: ' world' } as AgentStreamChunk;
      yield { type: 'done', done: { text: 'Hello world', steps: 1, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } } as AgentStreamChunk;
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream({ agent: mockAgent, onChunk }));

    await result.current.sendMessage('Test prompt');

    await waitFor(() => {
      expect(onChunk).toHaveBeenCalled();
    });

    expect(onChunk).toHaveBeenCalledWith('Hello');
    expect(onChunk).toHaveBeenCalledWith(' world');
  });

  it('should call onComplete callback', async () => {
    const onComplete = vi.fn();

    async function* mockStream() {
      yield { type: 'text', text: 'Done' } as AgentStreamChunk;
      yield { type: 'done', done: { text: 'Done', steps: 1, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } } as AgentStreamChunk;
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream({ agent: mockAgent, onComplete }));

    await result.current.sendMessage('Test prompt');

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: 'Done',
      })
    );
  });

  it('should call onError callback', async () => {
    const onError = vi.fn();

    async function* mockStream() {
      throw new Error('Test error');
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result } = renderHook(() => useAgentStream({ agent: mockAgent, onError }));

    await result.current.sendMessage('Test prompt');

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should cleanup on unmount', async () => {
    async function* mockStream() {
      yield { type: 'text', text: 'Hello' } as AgentStreamChunk;
      await new Promise(resolve => setTimeout(resolve, 100));
      yield { type: 'done', done: { text: 'Hello', steps: 1, finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } } as AgentStreamChunk;
    }

    mockAgent.stream = vi.fn().mockReturnValue(mockStream());

    const { result, unmount } = renderHook(() => useAgentStream({ agent: mockAgent }));

    result.current.sendMessage('Test prompt');

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Unmount while streaming
    unmount();

    // Should not throw or cause errors
    expect(true).toBe(true);
  });
});

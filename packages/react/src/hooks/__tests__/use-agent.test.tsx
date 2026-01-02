/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAgent } from '../use-agent';
import type { UseAgentConfig } from '../../types';

// Mock agent
const createMockAgent = () => ({
  id: 'test-agent',
  name: 'Test Agent',
  instructions: 'Test instructions',
  model: {} as any,
  tools: {},
  generate: vi.fn(),
  stream: vi.fn(),
});

describe('useAgent', () => {
  let mockAgent: ReturnType<typeof createMockAgent>;

  beforeEach(() => {
    mockAgent = createMockAgent();
    vi.clearAllMocks();
  });

  it('should initialize with empty messages', () => {
    const { result } = renderHook(() =>
      useAgent({ agent: mockAgent as any })
    );

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should initialize with provided messages', () => {
    const initialMessages = [
      { id: '1', role: 'user' as const, content: 'Hello', timestamp: Date.now() },
    ];

    const { result } = renderHook(() =>
      useAgent({ agent: mockAgent as any, initialMessages })
    );

    expect(result.current.messages).toEqual(initialMessages);
  });

  it('should send message and receive response', async () => {
    mockAgent.generate.mockResolvedValueOnce({
      text: 'Hello back!',
      steps: 1,
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });

    const { result } = renderHook(() =>
      useAgent({ agent: mockAgent as any })
    );

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].content).toBe('Hello back!');
  });

  it('should set isLoading while generating', async () => {
    let resolveGenerate: (value: any) => void;
    mockAgent.generate.mockImplementationOnce(
      () => new Promise((resolve) => { resolveGenerate = resolve; })
    );

    const { result } = renderHook(() =>
      useAgent({ agent: mockAgent as any })
    );

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.sendMessage('Hello');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveGenerate!({
        text: 'Response',
        steps: 1,
        finishReason: 'stop',
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle errors', async () => {
    const error = new Error('Generation failed');
    mockAgent.generate.mockRejectedValueOnce(error);

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAgent({ agent: mockAgent as any, onError })
    );

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.error).toEqual(error);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should clear error', async () => {
    mockAgent.generate.mockRejectedValueOnce(new Error('Error'));

    const { result } = renderHook(() =>
      useAgent({ agent: mockAgent as any })
    );

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should clear messages', async () => {
    mockAgent.generate.mockResolvedValueOnce({
      text: 'Response',
      steps: 1,
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    const { result } = renderHook(() =>
      useAgent({ agent: mockAgent as any })
    );

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.messages.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });

  it('should call onSend callback', async () => {
    mockAgent.generate.mockResolvedValueOnce({
      text: 'Response',
      steps: 1,
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    const onSend = vi.fn();
    const { result } = renderHook(() =>
      useAgent({ agent: mockAgent as any, onSend })
    );

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'user',
        content: 'Hello',
      })
    );
  });

  it('should call onResponse callback', async () => {
    mockAgent.generate.mockResolvedValueOnce({
      text: 'Response',
      steps: 1,
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    const onResponse = vi.fn();
    const { result } = renderHook(() =>
      useAgent({ agent: mockAgent as any, onResponse })
    );

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(onResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: 'Response',
      })
    );
  });

  it('should pass memory context to agent', async () => {
    mockAgent.generate.mockResolvedValueOnce({
      text: 'Response',
      steps: 1,
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    const memory = { resource: 'user-123', thread: 'chat-1' };
    const { result } = renderHook(() =>
      useAgent({ agent: mockAgent as any, memory })
    );

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(mockAgent.generate).toHaveBeenCalledWith('Hello', expect.objectContaining({
      memory,
    }));
  });

  it('should not send empty messages', async () => {
    const { result } = renderHook(() =>
      useAgent({ agent: mockAgent as any })
    );

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(mockAgent.generate).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });
});


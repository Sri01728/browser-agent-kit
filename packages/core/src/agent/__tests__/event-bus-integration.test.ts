import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agent } from '../agent';
import type { EventBus } from '../types';
import type { LLMAdapter, GenerateResult } from '../../llm/types';

describe('Agent Event Bus Integration', () => {
  let mockLLM: LLMAdapter;
  let mockEventBus: EventBus;
  let emittedEvents: Array<{ type: string; payload: any }>;

  beforeEach(() => {
    emittedEvents = [];

    // Mock LLM
    mockLLM = {
      id: 'mock-llm',
      name: 'Mock LLM',
      initialize: vi.fn().mockResolvedValue(undefined),
      isReady: vi.fn().mockReturnValue(true),
      generate: vi.fn().mockResolvedValue({
        text: 'Test response',
        finishReason: 'stop',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      } as GenerateResult),
      stream: vi.fn(),
      supportsTools: vi.fn().mockReturnValue(false),
      dispose: vi.fn(),
    };

    // Mock Event Bus
    mockEventBus = {
      emit: vi.fn((event) => {
        emittedEvents.push({ type: event.type, payload: event.payload });
      }),
      on: vi.fn().mockReturnValue(() => {}),
      dispose: vi.fn(),
    };
  });

  it('should emit generation:start event', async () => {
    const agent = new Agent({
      id: 'test-agent',
      name: 'Test Agent',
      instructions: 'You are a test agent',
      model: mockLLM,
      eventBus: mockEventBus,
    });

    await agent.generate('Hello');

    const startEvent = emittedEvents.find((e) => e.type === 'generation:start');
    expect(startEvent).toBeTruthy();
    expect(startEvent?.payload).toMatchObject({
      agentId: 'test-agent',
      prompt: 'Hello',
    });
    expect(startEvent?.payload.requestId).toBeTruthy();
  });

  it('should emit generation:end event', async () => {
    const agent = new Agent({
      id: 'test-agent',
      name: 'Test Agent',
      instructions: 'You are a test agent',
      model: mockLLM,
      eventBus: mockEventBus,
    });

    await agent.generate('Hello');

    const endEvent = emittedEvents.find((e) => e.type === 'generation:end');
    expect(endEvent).toBeTruthy();
    expect(endEvent?.payload).toMatchObject({
      agentId: 'test-agent',
      text: 'Test response',
      steps: 1,
      finishReason: 'stop',
    });
    expect(endEvent?.payload.requestId).toBeTruthy();
  });

  it('should emit error event on failure', async () => {
    mockLLM.generate = vi.fn().mockRejectedValue(new Error('Generation failed'));

    const agent = new Agent({
      id: 'test-agent',
      name: 'Test Agent',
      instructions: 'You are a test agent',
      model: mockLLM,
      eventBus: mockEventBus,
    });

    await expect(agent.generate('Hello')).rejects.toThrow('Generation failed');

    const errorEvent = emittedEvents.find((e) => e.type === 'error');
    expect(errorEvent).toBeTruthy();
    expect(errorEvent?.payload).toMatchObject({
      agentId: 'test-agent',
      message: 'Generation failed',
      code: 'ERR_GENERATION',
    });
  });

  it('should emit tool:call and tool:result events', async () => {
    const mockTool = {
      id: 'test-tool',
      description: 'A test tool',
      inputSchema: {},
      outputSchema: {},
      execute: vi.fn().mockResolvedValue({ result: 'tool output' }),
      toJSONSchema: vi.fn().mockReturnValue({
        type: 'function',
        function: {
          name: 'test-tool',
          description: 'A test tool',
          parameters: {},
        },
      }),
    };

    mockLLM.supportsTools = vi.fn().mockReturnValue(true);
    mockLLM.generate = vi
      .fn()
      .mockResolvedValueOnce({
        text: '',
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        toolCalls: [
          {
            id: 'call-1',
            name: 'test-tool',
            arguments: { input: 'test' },
          },
        ],
      } as GenerateResult)
      .mockResolvedValueOnce({
        text: 'Final response',
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      } as GenerateResult);

    const agent = new Agent({
      id: 'test-agent',
      name: 'Test Agent',
      instructions: 'You are a test agent',
      model: mockLLM,
      tools: { 'test-tool': mockTool },
      eventBus: mockEventBus,
    });

    await agent.generate('Hello');

    const toolCallEvent = emittedEvents.find((e) => e.type === 'tool:call');
    expect(toolCallEvent).toBeTruthy();
    expect(toolCallEvent?.payload).toMatchObject({
      tool: 'test-tool',
      args: { input: 'test' },
    });

    const toolResultEvent = emittedEvents.find((e) => e.type === 'tool:result');
    expect(toolResultEvent).toBeTruthy();
    expect(toolResultEvent?.payload).toMatchObject({
      tool: 'test-tool',
      result: { result: 'tool output' },
    });
  });

  it('should work without event bus (optional)', async () => {
    const agent = new Agent({
      id: 'test-agent',
      name: 'Test Agent',
      instructions: 'You are a test agent',
      model: mockLLM,
      // No eventBus provided
    });

    // Should not throw
    await expect(agent.generate('Hello')).resolves.toBeTruthy();
  });

  it('should include same requestId across all events', async () => {
    const agent = new Agent({
      id: 'test-agent',
      name: 'Test Agent',
      instructions: 'You are a test agent',
      model: mockLLM,
      eventBus: mockEventBus,
    });

    await agent.generate('Hello');

    const startEvent = emittedEvents.find((e) => e.type === 'generation:start');
    const endEvent = emittedEvents.find((e) => e.type === 'generation:end');

    expect(startEvent?.payload.requestId).toBe(endEvent?.payload.requestId);
  });

  it('should emit events in correct order', async () => {
    const agent = new Agent({
      id: 'test-agent',
      name: 'Test Agent',
      instructions: 'You are a test agent',
      model: mockLLM,
      eventBus: mockEventBus,
    });

    await agent.generate('Hello');

    const eventTypes = emittedEvents.map((e) => e.type);
    expect(eventTypes[0]).toBe('generation:start');
    expect(eventTypes[eventTypes.length - 1]).toBe('generation:end');
  });
});


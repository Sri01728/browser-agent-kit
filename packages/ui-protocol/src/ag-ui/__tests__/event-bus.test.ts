import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AGUIEventBus, createEventBus } from '../event-bus';
import { EventBusDisposedError } from '../errors';
import type { GenerationStartPayload, ToolCallPayload } from '../types';

describe('AGUIEventBus', () => {
  let bus: AGUIEventBus;

  beforeEach(() => {
    bus = new AGUIEventBus();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(bus.isDisposed()).toBe(false);
      expect(bus.getSubscriberCount()).toBe(0);
    });

    it('should accept custom config', () => {
      const customBus = new AGUIEventBus({
        logLevel: 'debug',
        logEvents: true,
        catchHandlerErrors: false,
      });

      expect(customBus.isDisposed()).toBe(false);
    });
  });

  describe('on', () => {
    it('should subscribe to events', () => {
      const handler = vi.fn();
      bus.on('generation:start', handler);

      expect(bus.getSubscriberCountForType('generation:start')).toBe(1);
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = bus.on('generation:start', handler);

      expect(bus.getSubscriberCountForType('generation:start')).toBe(1);

      unsubscribe();

      expect(bus.getSubscriberCountForType('generation:start')).toBe(0);
    });

    it('should throw when disposed', () => {
      bus.dispose();

      expect(() => bus.on('generation:start', vi.fn())).toThrow(EventBusDisposedError);
    });

    it('should allow multiple handlers for same event', () => {
      bus.on('generation:start', vi.fn());
      bus.on('generation:start', vi.fn());

      expect(bus.getSubscriberCountForType('generation:start')).toBe(2);
    });
  });

  describe('off', () => {
    it('should unsubscribe handler', () => {
      const handler = vi.fn();
      bus.on('generation:start', handler);
      bus.off('generation:start', handler);

      expect(bus.getSubscriberCountForType('generation:start')).toBe(0);
    });

    it('should not throw for unregistered handler', () => {
      expect(() => bus.off('generation:start', vi.fn())).not.toThrow();
    });

    it('should throw when disposed', () => {
      bus.dispose();

      expect(() => bus.off('generation:start', vi.fn())).toThrow(EventBusDisposedError);
    });
  });

  describe('emit', () => {
    it('should call subscribed handlers', () => {
      const handler = vi.fn();
      bus.on('generation:start', handler);

      const payload: GenerationStartPayload = {
        requestId: '123',
        prompt: 'test prompt',
      };

      bus.emit('generation:start', payload);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'generation:start',
          payload,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should call handlers in registration order', () => {
      const order: number[] = [];

      bus.on('generation:start', () => order.push(1));
      bus.on('generation:start', () => order.push(2));
      bus.on('generation:start', () => order.push(3));

      bus.emit('generation:start', { requestId: '1', prompt: 'test' });

      expect(order).toEqual([1, 2, 3]);
    });

    it('should not throw when no handlers', () => {
      expect(() =>
        bus.emit('generation:start', { requestId: '1', prompt: 'test' })
      ).not.toThrow();
    });

    it('should catch handler errors by default', () => {
      const throwingHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();

      bus.on('generation:start', throwingHandler);
      bus.on('generation:start', normalHandler);

      expect(() =>
        bus.emit('generation:start', { requestId: '1', prompt: 'test' })
      ).not.toThrow();

      expect(normalHandler).toHaveBeenCalled();
    });

    it('should throw handler errors when catchHandlerErrors is false', () => {
      const strictBus = new AGUIEventBus({ catchHandlerErrors: false });

      strictBus.on('generation:start', () => {
        throw new Error('Handler error');
      });

      expect(() =>
        strictBus.emit('generation:start', { requestId: '1', prompt: 'test' })
      ).toThrow();
    });

    it('should throw when disposed', () => {
      bus.dispose();

      expect(() =>
        bus.emit('generation:start', { requestId: '1', prompt: 'test' })
      ).toThrow(EventBusDisposedError);
    });

    it('should emit typed events correctly', () => {
      const toolHandler = vi.fn();
      bus.on('tool:call', toolHandler);

      const payload: ToolCallPayload = {
        callId: 'call-1',
        toolId: 'search',
        args: { query: 'test' },
      };

      bus.emit('tool:call', payload);

      expect(toolHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tool:call',
          payload: expect.objectContaining({
            toolId: 'search',
          }),
        })
      );
    });
  });

  describe('dispose', () => {
    it('should clear all handlers', () => {
      bus.on('generation:start', vi.fn());
      bus.on('tool:call', vi.fn());

      expect(bus.getSubscriberCount()).toBe(2);

      bus.dispose();

      expect(bus.getSubscriberCount()).toBe(0);
      expect(bus.isDisposed()).toBe(true);
    });
  });

  describe('getSubscribedTypes', () => {
    it('should return empty array when no subscriptions', () => {
      expect(bus.getSubscribedTypes()).toEqual([]);
    });

    it('should return subscribed event types', () => {
      bus.on('generation:start', vi.fn());
      bus.on('tool:call', vi.fn());

      const types = bus.getSubscribedTypes();
      expect(types).toContain('generation:start');
      expect(types).toContain('tool:call');
    });
  });

  describe('async handlers', () => {
    it('should handle async handlers', async () => {
      const asyncHandler = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      bus.on('generation:start', asyncHandler);
      bus.emit('generation:start', { requestId: '1', prompt: 'test' });

      expect(asyncHandler).toHaveBeenCalled();
    });
  });
});

describe('createEventBus', () => {
  it('should create AGUIEventBus instance', () => {
    const bus = createEventBus();
    expect(bus).toBeInstanceOf(AGUIEventBus);
  });

  it('should accept config', () => {
    const bus = createEventBus({ logLevel: 'debug' });
    expect(bus).toBeInstanceOf(AGUIEventBus);
  });
});


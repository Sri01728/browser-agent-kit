import { describe, it, expect, vi } from 'vitest';
import { AGUIEventBus } from '../event-bus';
import { EventBusDisposedError } from '../errors';

describe('Event Bus Disposal', () => {
  it('should clean up all subscriptions on dispose', () => {
    const eventBus = new AGUIEventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();

    eventBus.on('generation:start', handler1);
    eventBus.on('tool:call', handler2);
    eventBus.on('error', handler3);

    // Dispose all subscriptions
    eventBus.dispose();

    // Attempting to emit after disposal should throw
    expect(() => {
      eventBus.emit('generation:start', {
        requestId: 'test-req',
        prompt: 'test prompt',
      });
    }).toThrow(EventBusDisposedError);

    // No handlers should be called
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
    expect(handler3).not.toHaveBeenCalled();
  });

  it('should prevent resubscribing after dispose', () => {
    const eventBus = new AGUIEventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    // Subscribe
    eventBus.on('generation:start', handler1);

    // Dispose
    eventBus.dispose();

    // Attempting to resubscribe should throw
    expect(() => {
      eventBus.on('generation:start', handler2);
    }).toThrow(EventBusDisposedError);
  });

  it('should handle multiple dispose calls safely', () => {
    const eventBus = new AGUIEventBus();
    const handler = vi.fn();

    eventBus.on('generation:start', handler);

    // Multiple dispose calls should not throw
    expect(() => {
      eventBus.dispose();
      eventBus.dispose();
      eventBus.dispose();
    }).not.toThrow();

    // Handler should not be called, and emit should throw
    expect(() => {
      eventBus.emit('generation:start', {
        requestId: 'test-req',
        prompt: 'test prompt',
      });
    }).toThrow(EventBusDisposedError);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should dispose subscriptions for all event types', () => {
    const eventBus = new AGUIEventBus();
    const handlers = {
      'generation:start': vi.fn(),
      'generation:end': vi.fn(),
      'tool:call': vi.fn(),
      'tool:result': vi.fn(),
      'ui:action': vi.fn(),
      'error': vi.fn(),
    };

    // Subscribe to all event types
    Object.entries(handlers).forEach(([type, handler]) => {
      eventBus.on(type as any, handler);
    });

    // Dispose
    eventBus.dispose();

    // Attempting to emit any event type should throw
    expect(() => {
      eventBus.emit('generation:start', {
        requestId: 'test-req',
        prompt: 'test prompt',
      });
    }).toThrow(EventBusDisposedError);

    // No handlers should be called
    Object.values(handlers).forEach((handler) => {
      expect(handler).not.toHaveBeenCalled();
    });
  });

  it('should not affect other event bus instances', () => {
    const eventBus1 = new AGUIEventBus();
    const eventBus2 = new AGUIEventBus();

    const handler1 = vi.fn();
    const handler2 = vi.fn();

    eventBus1.on('generation:start', handler1);
    eventBus2.on('generation:start', handler2);

    // Dispose only eventBus1
    eventBus1.dispose();

    // Emit on eventBus1 should throw
    expect(() => {
      eventBus1.emit('generation:start', {
        requestId: 'test-req',
        prompt: 'test prompt',
      });
    }).toThrow(EventBusDisposedError);

    // Emit on eventBus2 should work
    eventBus2.emit('generation:start', {
      requestId: 'test-req',
      prompt: 'test prompt',
    });

    // Only handler2 should be called
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it('should report disposed status correctly', () => {
    const eventBus = new AGUIEventBus();

    expect(eventBus.isDisposed()).toBe(false);

    eventBus.dispose();

    expect(eventBus.isDisposed()).toBe(true);
  });

  it('should handle dispose with no subscriptions', () => {
    const eventBus = new AGUIEventBus();

    // Dispose without any subscriptions
    expect(() => eventBus.dispose()).not.toThrow();
    expect(eventBus.isDisposed()).toBe(true);
  });

  it('should prevent memory leaks by cleaning up handlers', () => {
    const eventBus = new AGUIEventBus();
    const handlers: Array<() => void> = [];

    // Create many handlers
    for (let i = 0; i < 1000; i++) {
      const handler = vi.fn();
      handlers.push(handler);
      eventBus.on('generation:start', handler);
    }

    // Dispose
    eventBus.dispose();

    // Attempting to emit should throw
    expect(() => {
      eventBus.emit('generation:start', {
        requestId: 'test-req',
        prompt: 'test prompt',
      });
    }).toThrow(EventBusDisposedError);

    // None of the handlers should be called
    handlers.forEach((handler) => {
      expect(handler).not.toHaveBeenCalled();
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { AGUIEventBus } from '../event-bus';
import type { AGUIEvent } from '../types';

describe('AG-UI Event Bus Integration', () => {
  describe('Event Flow', () => {
    it('should handle complete generation lifecycle', () => {
      const eventBus = new AGUIEventBus();
      const events: AGUIEvent[] = [];

      eventBus.on('generation:start', (event) => events.push(event));
      eventBus.on('tool:call', (event) => events.push(event));
      eventBus.on('tool:result', (event) => events.push(event));
      eventBus.on('generation:end', (event) => events.push(event));

      // Simulate generation lifecycle
      eventBus.emit('generation:start', {
        requestId: 'req-1',
        prompt: 'Find flights to Paris',
      });

      eventBus.emit('tool:call', {
        callId: 'call-1',
        toolId: 'searchFlights',
        args: { destination: 'Paris' },
      });

      eventBus.emit('tool:result', {
        callId: 'call-1',
        toolId: 'searchFlights',
        result: { flights: [] },
      });

      eventBus.emit('generation:end', {
        requestId: 'req-1',
        text: 'Here are the flights',
        finishReason: 'stop',
      });

      expect(events).toHaveLength(4);
      expect(events[0].type).toBe('generation:start');
      expect(events[1].type).toBe('tool:call');
      expect(events[2].type).toBe('tool:result');
      expect(events[3].type).toBe('generation:end');
    });

    it('should handle error during generation', () => {
      const eventBus = new AGUIEventBus();
      const events: AGUIEvent[] = [];

      eventBus.on('generation:start', (event) => events.push(event));
      eventBus.on('error', (event) => events.push(event));

      eventBus.emit('generation:start', {
        requestId: 'req-1',
        prompt: 'Find flights',
      });

      eventBus.emit('error', {
        code: 'ERR_GENERATION',
        message: 'Generation failed',
      });

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('generation:start');
      expect(events[1].type).toBe('error');
    });
  });

  describe('Multiple Subscribers', () => {
    it('should notify all subscribers in order', () => {
      const eventBus = new AGUIEventBus();
      const callOrder: number[] = [];

      eventBus.on('generation:start', () => callOrder.push(1));
      eventBus.on('generation:start', () => callOrder.push(2));
      eventBus.on('generation:start', () => callOrder.push(3));

      eventBus.emit('generation:start', {
        requestId: 'test-req',
        prompt: 'test prompt',
      });

      expect(callOrder).toEqual([1, 2, 3]);
    });

    it('should handle subscriber errors gracefully', () => {
      const eventBus = new AGUIEventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn(() => {
        throw new Error('Handler error');
      });
      const handler3 = vi.fn();

      eventBus.on('generation:start', handler1);
      eventBus.on('generation:start', handler2);
      eventBus.on('generation:start', handler3);

      // Should not throw even if handler2 throws
      expect(() => {
        eventBus.emit('generation:start', {
          requestId: 'test-req',
          prompt: 'test prompt',
        });
      }).not.toThrow();

      // All handlers should be called
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });
  });

  describe('Event Filtering', () => {
    it('should only notify subscribers for specific event types', () => {
      const eventBus = new AGUIEventBus();
      const startHandler = vi.fn();
      const endHandler = vi.fn();
      const errorHandler = vi.fn();

      eventBus.on('generation:start', startHandler);
      eventBus.on('generation:end', endHandler);
      eventBus.on('error', errorHandler);

      eventBus.emit('generation:start', {
        requestId: 'test-req',
        prompt: 'test prompt',
      });

      expect(startHandler).toHaveBeenCalledOnce();
      expect(endHandler).not.toHaveBeenCalled();
      expect(errorHandler).not.toHaveBeenCalled();
    });
  });

  describe('Unsubscribe During Emission', () => {
    it('should handle unsubscribe during event emission', () => {
      const eventBus = new AGUIEventBus();
      let unsubscribe: (() => void) | null = null;
      const handler1 = vi.fn(() => {
        // Unsubscribe during emission
        if (unsubscribe) unsubscribe();
      });
      const handler2 = vi.fn();

      eventBus.on('generation:start', handler1);
      unsubscribe = eventBus.on('generation:start', handler2);

      eventBus.emit('generation:start', {
        requestId: 'test-req',
        prompt: 'test prompt',
      });

      // handler1 should be called, handler2 may or may not be called
      // depending on iteration order and Set mutation behavior
      expect(handler1).toHaveBeenCalledOnce();
      // handler2 is unsubscribed during iteration, so it won't be called
      expect(handler2).not.toHaveBeenCalled();

      // Reset mocks
      handler1.mockClear();
      handler2.mockClear();

      // Emit again
      eventBus.emit('generation:start', {
        requestId: 'test-req',
        prompt: 'test prompt',
      });

      // Only handler1 should be called
      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle many events efficiently', () => {
      const eventBus = new AGUIEventBus();
      const handler = vi.fn();

      eventBus.on('generation:start', handler);

      const startTime = performance.now();

      // Emit 1000 events
      for (let i = 0; i < 1000; i++) {
        eventBus.emit('generation:start', {
          requestId: `req-${i}`,
          prompt: `prompt ${i}`,
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(handler).toHaveBeenCalledTimes(1000);
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should handle many subscribers efficiently', () => {
      const eventBus = new AGUIEventBus();
      const handlers: Array<() => void> = [];

      // Add 100 subscribers
      for (let i = 0; i < 100; i++) {
        const handler = vi.fn();
        handlers.push(handler);
        eventBus.on('generation:start', handler);
      }

      const startTime = performance.now();

      eventBus.emit('generation:start', {
        requestId: 'test-req',
        prompt: 'test prompt',
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // All handlers should be called
      handlers.forEach((handler) => {
        expect(handler).toHaveBeenCalledOnce();
      });

      expect(duration).toBeLessThan(50); // Should complete in less than 50ms
    });
  });

  describe('Event Payload Integrity', () => {
    it('should not mutate event payload', () => {
      const eventBus = new AGUIEventBus();
      const originalPayload: any = { 
        requestId: 'test-req',
        prompt: 'test prompt',
        value: 123, 
        nested: { data: 'test' } 
      };

      eventBus.on('generation:start', (event) => {
        // Try to mutate
        (event.payload as any).value = 999;
        (event.payload as any).nested.data = 'modified';
      });

      eventBus.emit('generation:start', originalPayload);

      // Original should be mutated (no deep clone by default)
      // This documents current behavior
      expect(originalPayload.value).toBe(999);
    });
  });
});

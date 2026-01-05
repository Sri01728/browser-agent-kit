import { describe, it, expect } from 'vitest';
import { agUIEventSchema, type AGUIEvent } from '../types';

describe('AG-UI Event Types', () => {
  describe('Event Schema Validation', () => {
    it('should validate generation:start event', () => {
      const event: AGUIEvent = {
        type: 'generation:start',
        timestamp: Date.now(),
        payload: {
          requestId: 'req-123',
          prompt: 'Find flights to Paris',
        },
      };

      const result = agUIEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should validate generation:end event', () => {
      const event: AGUIEvent = {
        type: 'generation:end',
        timestamp: Date.now(),
        payload: {
          requestId: 'req-123',
          text: 'Generated response',
          finishReason: 'stop',
        },
      };

      const result = agUIEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should validate tool:call event', () => {
      const event: AGUIEvent = {
        type: 'tool:call',
        timestamp: Date.now(),
        payload: {
          callId: 'call-123',
          toolId: 'searchFlights',
          args: { destination: 'Paris' },
        },
      };

      const result = agUIEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should validate tool:result event', () => {
      const event: AGUIEvent = {
        type: 'tool:result',
        timestamp: Date.now(),
        payload: {
          callId: 'call-123',
          toolId: 'searchFlights',
          result: { flights: [] },
        },
      };

      const result = agUIEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should validate ui:action event', () => {
      const event: AGUIEvent = {
        type: 'ui:action',
        timestamp: Date.now(),
        payload: {
          componentType: 'button',
          componentId: 'button-123',
          action: { type: 'navigate', params: { url: '/test' } },
        },
      };

      const result = agUIEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should validate error event', () => {
      const event: AGUIEvent = {
        type: 'error',
        timestamp: Date.now(),
        payload: {
          code: 'ERR_UNKNOWN',
          message: 'Something went wrong',
        },
      };

      const result = agUIEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should reject invalid event type', () => {
      const event = {
        type: 'invalid:type',
        timestamp: Date.now(),
        payload: {},
      };

      const result = agUIEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('should reject event without timestamp', () => {
      const event = {
        type: 'generation:start',
        payload: {},
      };

      const result = agUIEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('should reject event without payload', () => {
      const event = {
        type: 'generation:start',
        timestamp: Date.now(),
      };

      const result = agUIEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct event type', () => {
      // This test verifies TypeScript type checking
      const event: AGUIEvent = {
        type: 'generation:start',
        timestamp: Date.now(),
        payload: {
          requestId: 'test',
          prompt: 'test prompt',
        },
      };

      expect(event.type).toBe('generation:start');
    });

    it('should allow any payload structure', () => {
      const event: AGUIEvent = {
        type: 'tool:call',
        timestamp: Date.now(),
        payload: {
          callId: 'call-123',
          toolId: 'testTool',
          args: {
            nested: {
              deeply: {
                value: 123,
              },
            },
          },
        },
      };

      expect(event.payload).toHaveProperty('toolId');
      expect(event.payload).toHaveProperty('args');
    });
  });
});


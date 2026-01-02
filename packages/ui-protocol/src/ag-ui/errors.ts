/**
 * AG-UI Event Bus Error Types
 *
 * Custom error classes for event bus operations.
 *
 * @example
 * ```typescript
 * import { EventBusError, EventBusDisposedError } from '@web-agent/ui-protocol/ag-ui';
 *
 * try {
 *   eventBus.emit('generation:start', payload);
 * } catch (error) {
 *   if (error instanceof EventBusDisposedError) {
 *     console.error('Event bus has been disposed');
 *   }
 * }
 * ```
 *
 * @module ag-ui/errors
 */

import type { EventType } from './types';

/**
 * Base error for all event bus-related errors.
 */
export class EventBusError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'EventBusError';
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

/**
 * Error thrown when attempting to use a disposed event bus.
 *
 * @example
 * ```typescript
 * throw new EventBusDisposedError('emit');
 * ```
 */
export class EventBusDisposedError extends EventBusError {
  constructor(
    /** The operation that was attempted */
    public operation: 'on' | 'off' | 'emit'
  ) {
    super(`Cannot ${operation}: EventBus has been disposed`);
    this.name = 'EventBusDisposedError';
  }
}

/**
 * Error thrown when an event handler throws.
 *
 * @example
 * ```typescript
 * throw new EventHandlerError(
 *   'generation:start',
 *   new Error('Handler crashed')
 * );
 * ```
 */
export class EventHandlerError extends EventBusError {
  constructor(
    /** The event type that was being handled */
    public eventType: EventType,
    /** The error thrown by the handler */
    cause: Error
  ) {
    super(`Handler for "${eventType}" threw an error: ${cause.message}`, cause);
    this.name = 'EventHandlerError';
  }
}

/**
 * Error thrown when event payload validation fails.
 */
export class EventPayloadError extends EventBusError {
  constructor(
    /** The event type */
    public eventType: EventType,
    /** Validation message */
    message: string,
    cause?: Error
  ) {
    super(`Invalid payload for "${eventType}": ${message}`, cause);
    this.name = 'EventPayloadError';
  }
}


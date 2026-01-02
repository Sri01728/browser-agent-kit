/**
 * AG-UI Event Bus
 *
 * Real-time event-based communication between agents and UI.
 *
 * @example Basic Usage
 * ```typescript
 * import { AGUIEventBus } from '@web-agent/ui-protocol';
 *
 * const bus = new AGUIEventBus();
 *
 * // Subscribe to events
 * bus.on('generation:start', (event) => {
 *   console.log('Generation started:', event.payload.prompt);
 * });
 *
 * bus.on('tool:call', (event) => {
 *   console.log('Tool called:', event.payload.toolId);
 * });
 *
 * // Emit events
 * bus.emit('generation:start', {
 *   requestId: '123',
 *   prompt: 'Find flights to Paris'
 * });
 *
 * // Cleanup
 * bus.dispose();
 * ```
 *
 * @module ag-ui/event-bus
 */

import { createLogger, setLogLevel, type LogLevel } from '../logger';
import type {
  EventType,
  EventPayloadMap,
  EventHandler,
  AGUIEvent,
  AGUIEventBusInterface,
  EventBusConfig,
} from './types';
import { eventBusConfigSchema } from './types';
import {
  EventBusDisposedError,
  EventHandlerError,
} from './errors';

const logger = createLogger('AGUIEventBus');

/**
 * AG-UI Event Bus implementation.
 *
 * Provides typed event subscription and emission for agent-UI communication.
 */
export class AGUIEventBus implements AGUIEventBusInterface {
  private config: EventBusConfig;
  private handlers: Map<EventType, Set<EventHandler<EventType>>>;
  private disposed: boolean = false;

  /**
   * Creates a new AGUIEventBus instance.
   *
   * @param config - Event bus configuration
   *
   * @example
   * ```typescript
   * const bus = new AGUIEventBus({
   *   logLevel: 'debug',
   *   logEvents: true,
   *   catchHandlerErrors: true
   * });
   * ```
   */
  constructor(config: Partial<EventBusConfig> = {}) {
    this.config = eventBusConfigSchema.parse(config);
    this.handlers = new Map();

    // Set log level
    setLogLevel(this.config.logLevel as LogLevel);

    logger.debug('AGUIEventBus initialized', { config: this.config });
  }

  /**
   * Subscribe to an event type.
   *
   * @param type - Event type to subscribe to
   * @param handler - Handler function to call when event fires
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = bus.on('generation:end', (event) => {
   *   console.log('Response:', event.payload.text);
   * });
   *
   * // Later: unsubscribe
   * unsubscribe();
   * ```
   */
  on<T extends EventType>(type: T, handler: EventHandler<T>): () => void {
    if (this.disposed) {
      throw new EventBusDisposedError('on');
    }

    logger.debug('Subscribing to event', { type });

    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    const handlers = this.handlers.get(type)!;
    handlers.add(handler as EventHandler<EventType>);

    // Return unsubscribe function
    return () => {
      this.off(type, handler);
    };
  }

  /**
   * Unsubscribe a handler from an event type.
   *
   * @param type - Event type
   * @param handler - Handler to remove
   *
   * @example
   * ```typescript
   * const handler = (event) => console.log(event);
   * bus.on('error', handler);
   *
   * // Later
   * bus.off('error', handler);
   * ```
   */
  off<T extends EventType>(type: T, handler: EventHandler<T>): void {
    if (this.disposed) {
      throw new EventBusDisposedError('off');
    }

    logger.debug('Unsubscribing from event', { type });

    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler as EventHandler<EventType>);

      // Clean up empty sets
      if (handlers.size === 0) {
        this.handlers.delete(type);
      }
    }
  }

  /**
   * Emit an event to all subscribers.
   *
   * Handlers are called in registration order. If a handler throws
   * and `catchHandlerErrors` is true (default), the error is logged
   * but doesn't prevent other handlers from executing.
   *
   * @param type - Event type
   * @param payload - Event payload (type-safe per event type)
   *
   * @example
   * ```typescript
   * bus.emit('tool:call', {
   *   callId: 'call-1',
   *   toolId: 'search-flights',
   *   args: { destination: 'Paris' }
   * });
   * ```
   */
  emit<T extends EventType>(type: T, payload: EventPayloadMap[T]): void {
    if (this.disposed) {
      throw new EventBusDisposedError('emit');
    }

    const event: AGUIEvent<T> = {
      type,
      timestamp: Date.now(),
      payload,
    };

    if (this.config.logEvents) {
      logger.info('Emitting event', { type, payload });
    } else {
      logger.debug('Emitting event', { type });
    }

    const handlers = this.handlers.get(type);
    if (!handlers || handlers.size === 0) {
      logger.debug('No handlers for event', { type });
      return;
    }

    // Call handlers in registration order
    for (const handler of handlers) {
      try {
        const result = (handler as EventHandler<T>)(event);

        // Handle async handlers
        if (result instanceof Promise) {
          result.catch((error) => {
            if (this.config.catchHandlerErrors) {
              logger.error('Async handler error', new EventHandlerError(type, error));
            } else {
              throw new EventHandlerError(type, error);
            }
          });
        }
      } catch (error) {
        if (this.config.catchHandlerErrors) {
          logger.error('Handler error', new EventHandlerError(type, error as Error));
        } else {
          throw new EventHandlerError(type, error as Error);
        }
      }
    }
  }

  /**
   * Dispose all subscriptions and prevent further use.
   *
   * After calling dispose(), any attempt to use the event bus
   * will throw EventBusDisposedError.
   *
   * @example
   * ```typescript
   * // Clean up when component unmounts
   * useEffect(() => {
   *   const bus = new AGUIEventBus();
   *   // ... setup subscriptions
   *
   *   return () => bus.dispose();
   * }, []);
   * ```
   */
  dispose(): void {
    logger.debug('Disposing event bus', {
      subscriberCount: this.getSubscriberCount(),
    });

    this.handlers.clear();
    this.disposed = true;
  }

  /**
   * Check if the event bus has been disposed.
   */
  isDisposed(): boolean {
    return this.disposed;
  }

  /**
   * Get the total number of subscribers across all event types.
   */
  getSubscriberCount(): number {
    let count = 0;
    for (const handlers of this.handlers.values()) {
      count += handlers.size;
    }
    return count;
  }

  /**
   * Get the number of subscribers for a specific event type.
   *
   * @param type - Event type to check
   */
  getSubscriberCountForType(type: EventType): number {
    return this.handlers.get(type)?.size ?? 0;
  }

  /**
   * Get all subscribed event types.
   */
  getSubscribedTypes(): EventType[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Update the event bus configuration.
   *
   * @param config - New configuration values
   */
  updateConfig(config: Partial<EventBusConfig>): void {
    this.config = eventBusConfigSchema.parse({ ...this.config, ...config });
    setLogLevel(this.config.logLevel as LogLevel);
    logger.debug('Config updated', this.config);
  }
}

// Export factory function for convenience
/**
 * Creates a new AGUIEventBus instance.
 *
 * @param config - Optional configuration
 * @returns New AGUIEventBus instance
 */
export function createEventBus(config?: Partial<EventBusConfig>): AGUIEventBus {
  return new AGUIEventBus(config);
}


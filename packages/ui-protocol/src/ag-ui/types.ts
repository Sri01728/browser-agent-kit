/**
 * AG-UI Event Bus Type Definitions
 *
 * Types for the AG-UI (Agent-to-UI) event system.
 * Enables real-time communication between agents and UI.
 *
 * @example
 * ```typescript
 * import { AGUIEventBus, type EventHandler } from '@web-agent/ui-protocol/ag-ui';
 *
 * const bus = new AGUIEventBus();
 *
 * // Subscribe to generation events
 * bus.on('generation:start', (event) => {
 *   console.log('Generation started:', event.payload.prompt);
 * });
 *
 * // Emit an event
 * bus.emit('tool:call', {
 *   callId: 'call-1',
 *   toolId: 'search-flights',
 *   args: { destination: 'Paris' }
 * });
 * ```
 *
 * @module ag-ui/types
 */

import { z } from 'zod';
import type { A2UAction, A2UComponent } from '../a2u/types';

// =============================================================================
// Event Type Definitions
// =============================================================================

/**
 * Supported event types.
 *
 * - `generation:start` - Agent started generating a response
 * - `generation:end` - Agent finished generating
 * - `tool:call` - Tool invocation started
 * - `tool:result` - Tool returned result
 * - `ui:action` - User triggered UI action
 * - `error` - Error occurred
 */
export const eventTypeSchema = z.enum([
  'generation:start',
  'generation:end',
  'tool:call',
  'tool:result',
  'ui:action',
  'error',
]);

export type EventType = z.infer<typeof eventTypeSchema>;

// =============================================================================
// Event Payload Schemas
// =============================================================================

/** Payload for generation:start event */
export const generationStartPayloadSchema = z.object({
  /** Unique request identifier */
  requestId: z.string(),
  /** User prompt that triggered generation */
  prompt: z.string(),
  /** Optional memory context */
  memoryContext: z
    .object({
      resource: z.string(),
      thread: z.string(),
    })
    .optional(),
});

export type GenerationStartPayload = z.infer<typeof generationStartPayloadSchema>;

/** Payload for generation:end event */
export const generationEndPayloadSchema = z.object({
  /** Unique request identifier (matches start) */
  requestId: z.string(),
  /** Generated text response */
  text: z.string(),
  /** Parsed UI component (if present) */
  ui: z.custom<A2UComponent>().optional(),
  /** Tool calls made during generation */
  toolCalls: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        arguments: z.record(z.unknown()),
      })
    )
    .optional(),
  /** Generation finish reason */
  finishReason: z.enum(['stop', 'length', 'tool_calls', 'content_filter']),
});

export type GenerationEndPayload = z.infer<typeof generationEndPayloadSchema>;

/** Payload for tool:call event */
export const toolCallPayloadSchema = z.object({
  /** Tool call identifier */
  callId: z.string(),
  /** Tool name */
  toolId: z.string(),
  /** Tool arguments */
  args: z.record(z.unknown()),
});

export type ToolCallPayload = z.infer<typeof toolCallPayloadSchema>;

/** Payload for tool:result event */
export const toolResultPayloadSchema = z.object({
  /** Tool call identifier (matches call) */
  callId: z.string(),
  /** Tool name */
  toolId: z.string(),
  /** Tool result (on success) */
  result: z.unknown().optional(),
  /** Error message (on failure) */
  error: z.string().optional(),
  /** Execution duration in ms */
  durationMs: z.number().optional(),
});

export type ToolResultPayload = z.infer<typeof toolResultPayloadSchema>;

/** Payload for ui:action event */
export const uiActionPayloadSchema = z.object({
  /** Component that triggered the action */
  componentId: z.string().optional(),
  /** Component type */
  componentType: z.string(),
  /** Action that was triggered */
  action: z.custom<A2UAction>(),
});

export type UIActionPayload = z.infer<typeof uiActionPayloadSchema>;

/** Payload for error event */
export const errorPayloadSchema = z.object({
  /** Error code */
  code: z.string(),
  /** Human-readable error message */
  message: z.string(),
  /** Additional context */
  context: z.record(z.unknown()).optional(),
  /** Original error (if available) */
  cause: z.unknown().optional(),
});

export type ErrorPayload = z.infer<typeof errorPayloadSchema>;

// =============================================================================
// Event Type to Payload Mapping
// =============================================================================

/**
 * Type map from event type to payload type.
 */
export interface EventPayloadMap {
  'generation:start': GenerationStartPayload;
  'generation:end': GenerationEndPayload;
  'tool:call': ToolCallPayload;
  'tool:result': ToolResultPayload;
  'ui:action': UIActionPayload;
  error: ErrorPayload;
}

// =============================================================================
// Generic Event Structure
// =============================================================================

/**
 * AG-UI Event schema for validation.
 */
export const agUIEventSchema = z.object({
  type: eventTypeSchema,
  timestamp: z.number(),
  payload: z.union([
    generationStartPayloadSchema,
    generationEndPayloadSchema,
    toolCallPayloadSchema,
    toolResultPayloadSchema,
    uiActionPayloadSchema,
    errorPayloadSchema,
  ]),
});

/**
 * AG-UI Event - typed event with payload.
 */
export interface AGUIEvent<T extends EventType = EventType> {
  /** Event type identifier */
  type: T;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Type-specific payload */
  payload: EventPayloadMap[T];
}

// =============================================================================
// Event Handler Types
// =============================================================================

/**
 * Event handler function type.
 */
export type EventHandler<T extends EventType> = (
  event: AGUIEvent<T>
) => void | Promise<void>;

/**
 * Generic event handler for any event type.
 */
export type AnyEventHandler = EventHandler<EventType>;

// =============================================================================
// Event Bus Interface
// =============================================================================

/**
 * AG-UI Event Bus interface.
 */
export interface AGUIEventBusInterface {
  /**
   * Subscribe to an event type.
   * @param type - Event type to subscribe to
   * @param handler - Handler function
   * @returns Unsubscribe function
   */
  on<T extends EventType>(type: T, handler: EventHandler<T>): () => void;

  /**
   * Unsubscribe a handler from an event type.
   * @param type - Event type
   * @param handler - Handler to remove
   */
  off<T extends EventType>(type: T, handler: EventHandler<T>): void;

  /**
   * Emit an event to all subscribers.
   * @param type - Event type
   * @param payload - Event payload
   */
  emit<T extends EventType>(type: T, payload: EventPayloadMap[T]): void;

  /**
   * Dispose all subscriptions and prevent further use.
   */
  dispose(): void;

  /**
   * Check if the event bus has been disposed.
   */
  isDisposed(): boolean;
}

// =============================================================================
// Event Bus Configuration
// =============================================================================

/**
 * Event bus configuration options.
 */
export const eventBusConfigSchema = z.object({
  /** Log level for event bus operations */
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('warn'),
  /** Whether to log all emitted events */
  logEvents: z.boolean().default(false),
  /** Whether to catch and log handler errors */
  catchHandlerErrors: z.boolean().default(true),
});

export type EventBusConfig = z.infer<typeof eventBusConfigSchema>;


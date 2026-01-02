/**
 * AG-UI Event Bus Schema Contracts
 * 
 * These types define the AG-UI event system structure.
 * Implementation MUST match these contracts exactly.
 */

import { z } from 'zod';
import type { A2UAction, A2UComponent, A2UResponse } from './a2u-schema';

// =============================================================================
// Event Type Definitions
// =============================================================================

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

export const generationStartPayloadSchema = z.object({
  /** Unique request identifier */
  requestId: z.string(),
  /** User prompt that triggered generation */
  prompt: z.string(),
  /** Optional memory context */
  memoryContext: z.object({
    resource: z.string(),
    thread: z.string(),
  }).optional(),
});

export type GenerationStartPayload = z.infer<typeof generationStartPayloadSchema>;

export const generationEndPayloadSchema = z.object({
  /** Unique request identifier (matches start) */
  requestId: z.string(),
  /** Generated text response */
  text: z.string(),
  /** Parsed UI component (if present) */
  ui: z.custom<A2UComponent>().optional(),
  /** Tool calls made during generation */
  toolCalls: z.array(z.object({
    id: z.string(),
    name: z.string(),
    arguments: z.record(z.unknown()),
  })).optional(),
  /** Generation finish reason */
  finishReason: z.enum(['stop', 'length', 'tool_calls', 'content_filter']),
});

export type GenerationEndPayload = z.infer<typeof generationEndPayloadSchema>;

export const toolCallPayloadSchema = z.object({
  /** Tool call identifier */
  callId: z.string(),
  /** Tool name */
  toolId: z.string(),
  /** Tool arguments */
  args: z.record(z.unknown()),
});

export type ToolCallPayload = z.infer<typeof toolCallPayloadSchema>;

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

export const uiActionPayloadSchema = z.object({
  /** Component that triggered the action */
  componentId: z.string().optional(),
  /** Component type */
  componentType: z.string(),
  /** Action that was triggered */
  action: z.custom<A2UAction>(),
});

export type UIActionPayload = z.infer<typeof uiActionPayloadSchema>;

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

export type EventPayloadMap = {
  'generation:start': GenerationStartPayload;
  'generation:end': GenerationEndPayload;
  'tool:call': ToolCallPayload;
  'tool:result': ToolResultPayload;
  'ui:action': UIActionPayload;
  'error': ErrorPayload;
};

// =============================================================================
// Generic Event Structure
// =============================================================================

export type AGUIEvent<T extends EventType = EventType> = {
  /** Event type identifier */
  type: T;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Type-specific payload */
  payload: EventPayloadMap[T];
};

// =============================================================================
// Event Handler Types
// =============================================================================

export type EventHandler<T extends EventType> = (
  event: AGUIEvent<T>
) => void | Promise<void>;

export type AnyEventHandler = EventHandler<EventType>;

// =============================================================================
// Event Bus Interface
// =============================================================================

export interface AGUIEventBusInterface {
  /**
   * Subscribe to an event type
   * @returns Unsubscribe function
   */
  on<T extends EventType>(
    type: T,
    handler: EventHandler<T>
  ): () => void;

  /**
   * Unsubscribe a handler from an event type
   */
  off<T extends EventType>(
    type: T,
    handler: EventHandler<T>
  ): void;

  /**
   * Emit an event to all subscribers
   */
  emit<T extends EventType>(
    type: T,
    payload: EventPayloadMap[T]
  ): void;

  /**
   * Dispose all subscriptions and prevent further use
   */
  dispose(): void;

  /**
   * Check if the event bus has been disposed
   */
  isDisposed(): boolean;
}

// =============================================================================
// Event Bus Configuration
// =============================================================================

export const eventBusConfigSchema = z.object({
  /** Log level for event bus operations */
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('warn'),
  /** Whether to log all emitted events */
  logEvents: z.boolean().default(false),
  /** Whether to catch and log handler errors */
  catchHandlerErrors: z.boolean().default(true),
});

export type EventBusConfig = z.infer<typeof eventBusConfigSchema>;


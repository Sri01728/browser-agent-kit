/**
 * A2U Error Types
 *
 * Custom error classes for A2U parsing and rendering failures.
 *
 * @example
 * ```typescript
 * import { A2UParseError, ComponentRenderError } from '@web-agent/ui-protocol/a2u';
 *
 * try {
 *   const response = parseA2UResponse(input);
 * } catch (error) {
 *   if (error instanceof A2UParseError) {
 *     console.error('Failed to parse A2U:', error.input);
 *   }
 * }
 * ```
 *
 * @module a2u/errors
 */

import type { A2UComponent } from './types';

/**
 * Base error for all A2U-related errors.
 */
export class A2UError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'A2UError';
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

/**
 * Error thrown when A2U JSON parsing fails.
 *
 * @example
 * ```typescript
 * throw new A2UParseError(
 *   'Invalid JSON structure',
 *   '{ invalid json }',
 *   new SyntaxError('Unexpected token')
 * );
 * ```
 */
export class A2UParseError extends A2UError {
  constructor(
    message: string,
    /** The raw input that failed to parse */
    public input: string,
    cause?: Error
  ) {
    super(`A2U parse error: ${message}`, cause);
    this.name = 'A2UParseError';
  }
}

/**
 * Error thrown when A2U response validation fails.
 */
export class A2UValidationError extends A2UError {
  constructor(
    message: string,
    /** Zod validation issues */
    public issues: Array<{ path: (string | number)[]; message: string }>,
    cause?: Error
  ) {
    super(`A2U validation error: ${message}`, cause);
    this.name = 'A2UValidationError';
  }
}

/**
 * Error thrown when component rendering fails.
 *
 * @example
 * ```typescript
 * throw new ComponentRenderError(
 *   'Unknown component type',
 *   { type: 'custom-widget', id: 'w1' },
 *   'custom-widget'
 * );
 * ```
 */
export class ComponentRenderError extends A2UError {
  constructor(
    message: string,
    /** The component that failed to render */
    public component: A2UComponent,
    /** The component type that caused the error */
    public componentType: string,
    cause?: Error
  ) {
    super(
      `Failed to render component "${componentType}"${component.id ? ` (id: ${component.id})` : ''}: ${message}`,
      cause
    );
    this.name = 'ComponentRenderError';
  }
}

/**
 * Error thrown when component props validation fails.
 */
export class ComponentPropsError extends A2UError {
  constructor(
    message: string,
    /** The component type */
    public componentType: string,
    /** The invalid props */
    public props: Record<string, unknown>,
    cause?: Error
  ) {
    super(`Invalid props for "${componentType}": ${message}`, cause);
    this.name = 'ComponentPropsError';
  }
}

/**
 * Error thrown when component depth limit is exceeded.
 */
export class DepthLimitError extends A2UError {
  constructor(
    /** Current depth */
    public depth: number,
    /** Maximum allowed depth */
    public maxDepth: number
  ) {
    super(`Component nesting depth ${depth} exceeds maximum of ${maxDepth}`);
    this.name = 'DepthLimitError';
  }
}

/**
 * Error thrown when component count limit is exceeded.
 */
export class ComponentLimitError extends A2UError {
  constructor(
    /** Current count */
    public count: number,
    /** Maximum allowed count */
    public maxComponents: number
  ) {
    super(`Component count ${count} exceeds maximum of ${maxComponents}`);
    this.name = 'ComponentLimitError';
  }
}

/**
 * Error thrown when an action handler fails.
 */
export class ActionError extends A2UError {
  constructor(
    message: string,
    /** The action type */
    public actionType: string,
    /** The component ID that triggered the action */
    public componentId?: string,
    cause?: Error
  ) {
    super(
      `Action "${actionType}" failed${componentId ? ` (component: ${componentId})` : ''}: ${message}`,
      cause
    );
    this.name = 'ActionError';
  }
}


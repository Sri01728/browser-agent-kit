/**
 * A2U Parser
 *
 * Parses and validates A2U JSON responses from agent output.
 *
 * @example
 * ```typescript
 * import { parseA2UResponse } from '@web-agent/ui-protocol/a2u';
 *
 * try {
 *   const response = parseA2UResponse(jsonString);
 *   if (response.type === 'ui') {
 *     console.log('UI component:', response.ui);
 *   }
 * } catch (error) {
 *   if (error instanceof A2UParseError) {
 *     console.error('Parse failed:', error.message);
 *   }
 * }
 * ```
 *
 * @module a2u/parser
 */

import { createLogger } from '../logger';
import { a2uResponseSchema, type A2UResponse, type A2UComponent } from './types';
import { A2UParseError, A2UValidationError } from './errors';

const logger = createLogger('A2UParser');

/**
 * Parses and validates an A2U JSON string.
 *
 * @param input - Raw JSON string from agent output
 * @returns Validated A2UResponse object
 * @throws {A2UParseError} If JSON parsing fails
 * @throws {A2UValidationError} If schema validation fails
 *
 * @example
 * ```typescript
 * const response = parseA2UResponse(`{
 *   "version": "1.0",
 *   "type": "ui",
 *   "ui": { "type": "card", "props": { "title": "Hello" } }
 * }`);
 * ```
 */
export function parseA2UResponse(input: string): A2UResponse {
  logger.debug('Parsing A2U response', { inputLength: input.length });

  // Step 1: Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    logger.error('JSON parse error', error as Error);
    throw new A2UParseError('Invalid JSON syntax', input, error as Error);
  }

  // Step 2: Validate schema
  const result = a2uResponseSchema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
    }));
    logger.error('Schema validation failed', { issues });
    throw new A2UValidationError('Schema validation failed', issues);
  }

  logger.debug('A2U response parsed successfully', {
    version: result.data.version,
    type: result.data.type,
  });

  return result.data;
}

/**
 * Safely parses an A2U response, returning null on failure.
 *
 * @param input - Raw JSON string from agent output
 * @returns A2UResponse or null if parsing fails
 *
 * @example
 * ```typescript
 * const response = safeParseA2UResponse(maybeJson);
 * if (response) {
 *   // Handle valid response
 * }
 * ```
 */
export function safeParseA2UResponse(input: string): A2UResponse | null {
  try {
    return parseA2UResponse(input);
  } catch {
    return null;
  }
}

/**
 * Counts total components in a component tree.
 *
 * @param component - Root component
 * @returns Total count including all nested children
 */
export function countComponents(component: A2UComponent): number {
  let count = 1;
  if (component.children) {
    for (const child of component.children) {
      count += countComponents(child);
    }
  }
  return count;
}

/**
 * Calculates the maximum depth of a component tree.
 *
 * @param component - Root component
 * @returns Maximum nesting depth (1 for a component with no children)
 */
export function getMaxDepth(component: A2UComponent): number {
  if (!component.children || component.children.length === 0) {
    return 1;
  }
  const childDepths = component.children.map(getMaxDepth);
  return 1 + Math.max(...childDepths);
}

/**
 * Validates component tree against depth and count limits.
 *
 * @param component - Root component to validate
 * @param maxDepth - Maximum allowed nesting depth
 * @param maxComponents - Maximum allowed total components
 * @returns Object with isValid flag and any error message
 */
export function validateComponentLimits(
  component: A2UComponent,
  maxDepth: number = 10,
  maxComponents: number = 100
): { isValid: boolean; error?: string } {
  const depth = getMaxDepth(component);
  if (depth > maxDepth) {
    return {
      isValid: false,
      error: `Component nesting depth ${depth} exceeds maximum of ${maxDepth}`,
    };
  }

  const count = countComponents(component);
  if (count > maxComponents) {
    return {
      isValid: false,
      error: `Component count ${count} exceeds maximum of ${maxComponents}`,
    };
  }

  return { isValid: true };
}


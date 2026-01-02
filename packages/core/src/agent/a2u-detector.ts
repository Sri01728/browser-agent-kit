/**
 * A2U Detector - Extracts A2U JSON from LLM text output.
 *
 * This module provides utilities to detect and parse A2U protocol
 * responses embedded in agent text output.
 *
 * @example
 * ```typescript
 * import { parseA2UFromText } from '@web-agent/core/agent';
 *
 * const llmOutput = `
 * Here are the flights I found:
 * \`\`\`json
 * {
 *   "version": "1.0",
 *   "type": "ui",
 *   "ui": { "type": "card", "props": { "title": "Flight to Paris" } }
 * }
 * \`\`\`
 * `;
 *
 * const result = parseA2UFromText(llmOutput);
 * if (result) {
 *   console.log('Found A2U component:', result.ui);
 * }
 * ```
 *
 * @module agent/a2u-detector
 */

import type { A2UComponent } from './types';

/**
 * Result of A2U parsing attempt.
 */
export interface A2UParseResult {
  /** Parsed A2U response */
  version: string;
  type: 'ui' | 'text';
  ui?: A2UComponent;
  text?: string;
}

/**
 * Patterns to detect A2U JSON in LLM output.
 */
const A2U_PATTERNS = [
  // JSON code block: ```json { ... } ```
  /```json\s*([\s\S]*?)\s*```/g,
  // Plain JSON code block: ``` { ... } ```
  /```\s*(\{[\s\S]*?"version"\s*:\s*"[\d.]+"\s*[\s\S]*?\})\s*```/g,
  // Raw JSON object with A2U markers
  /(\{\s*"version"\s*:\s*"[\d.]+"\s*,\s*"type"\s*:\s*"(?:ui|text)"[\s\S]*?\})/g,
];

/**
 * Validates that an object is a valid A2U response.
 */
function isValidA2UResponse(obj: unknown): obj is A2UParseResult {
  if (typeof obj !== 'object' || obj === null) return false;

  const response = obj as Record<string, unknown>;

  // Check required fields
  if (typeof response.version !== 'string') return false;
  if (!/^\d+\.\d+$/.test(response.version)) return false;
  if (response.type !== 'ui' && response.type !== 'text') return false;

  // Check type-specific fields
  if (response.type === 'ui') {
    if (!response.ui || typeof response.ui !== 'object') return false;
    const ui = response.ui as Record<string, unknown>;
    if (typeof ui.type !== 'string') return false;
  }

  if (response.type === 'text') {
    if (typeof response.text !== 'string') return false;
  }

  return true;
}

/**
 * Attempts to parse a JSON string as A2U response.
 */
function tryParseA2U(jsonString: string): A2UParseResult | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (isValidA2UResponse(parsed)) {
      return parsed;
    }
  } catch {
    // Not valid JSON, continue
  }
  return null;
}

/**
 * Extracts A2U JSON from LLM text output.
 *
 * Searches for A2U-formatted JSON in the text using multiple patterns:
 * 1. JSON code blocks (```json ... ```)
 * 2. Plain code blocks containing JSON (``` ... ```)
 * 3. Raw JSON objects with A2U version/type markers
 *
 * @param text - The LLM output text to search
 * @returns The parsed A2U response, or null if none found
 *
 * @example Detecting A2U in a code block
 * ```typescript
 * const text = 'Here are the results:\n```json\n{"version":"1.0","type":"ui","ui":{"type":"card"}}\n```';
 * const result = parseA2UFromText(text);
 * // result = { version: "1.0", type: "ui", ui: { type: "card" } }
 * ```
 *
 * @example Detecting raw A2U JSON
 * ```typescript
 * const text = 'Found this: {"version":"1.0","type":"text","text":"Hello!"}';
 * const result = parseA2UFromText(text);
 * // result = { version: "1.0", type: "text", text: "Hello!" }
 * ```
 *
 * @example No A2U found
 * ```typescript
 * const text = 'Just a plain text response with no JSON.';
 * const result = parseA2UFromText(text);
 * // result = null
 * ```
 */
export function parseA2UFromText(text: string): A2UParseResult | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Try each pattern
  for (const pattern of A2U_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const jsonCandidate = match[1]?.trim();
      if (jsonCandidate) {
        const result = tryParseA2U(jsonCandidate);
        if (result) {
          return result;
        }
      }
    }
  }

  // Try parsing the entire text as JSON (for responses that are purely A2U)
  const trimmedText = text.trim();
  if (trimmedText.startsWith('{') && trimmedText.endsWith('}')) {
    const result = tryParseA2U(trimmedText);
    if (result) {
      return result;
    }
  }

  return null;
}

/**
 * Extracts just the A2U component from text, if present.
 *
 * @param text - The LLM output text to search
 * @returns The A2U component, or undefined if none found
 */
export function extractA2UComponent(text: string): A2UComponent | undefined {
  const result = parseA2UFromText(text);
  return result?.type === 'ui' ? result.ui : undefined;
}

/**
 * Checks if text contains an A2U response.
 *
 * @param text - The text to check
 * @returns True if the text contains a valid A2U response
 */
export function containsA2U(text: string): boolean {
  return parseA2UFromText(text) !== null;
}


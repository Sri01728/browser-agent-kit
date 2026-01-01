import type { z } from 'zod';

/**
 * Tool execution context
 */
export interface ToolContext {
  /** Request-specific context */
  requestContext?: Record<string, unknown>;
  
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Tool configuration
 */
export interface ToolConfig<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType
> {
  /** Unique tool identifier */
  id: string;
  
  /** Human-readable description for the LLM */
  description: string;
  
  /** Zod schema for input validation */
  inputSchema: TInput;
  
  /** Zod schema for output validation */
  outputSchema: TOutput;
  
  /** Tool execution function */
  execute: (
    input: z.infer<TInput>,
    context?: ToolContext
  ) => Promise<z.infer<TOutput>> | z.infer<TOutput>;
  
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Tool instance
 */
export interface Tool<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType
> {
  id: string;
  description: string;
  inputSchema: TInput;
  outputSchema: TOutput;
  execute: (
    input: z.infer<TInput>,
    context?: ToolContext
  ) => Promise<z.infer<TOutput>>;
  
  /** Convert tool to JSON Schema for LLM */
  toJSONSchema(): ToolJSONSchema;
}

/**
 * JSON Schema representation for LLM function calling
 */
export interface ToolJSONSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Tool execution result
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}


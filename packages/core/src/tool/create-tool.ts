import type { z } from 'zod';
import type { Tool, ToolConfig, ToolContext, ToolJSONSchema } from './types';
import { zodToJsonSchema } from './zod-to-json-schema';

/**
 * Create a new tool with type-safe input/output schemas
 */
export function createTool<
  TInput extends z.ZodType,
  TOutput extends z.ZodType
>(config: ToolConfig<TInput, TOutput>): Tool<TInput, TOutput> {
  const { id, description, inputSchema, outputSchema, execute, metadata } = config;
  
  return {
    id,
    description,
    inputSchema,
    outputSchema,
    
    async execute(input: z.infer<TInput>, context?: ToolContext) {
      // Validate input
      const validatedInput = inputSchema.parse(input);
      
      try {
        // Execute tool
        const result = await execute(validatedInput, context);
        
        // Validate output
        const validatedOutput = outputSchema.parse(result);
        
        return validatedOutput;
      } catch (error) {
        throw new ToolExecutionError(
          `Tool "${id}" execution failed: ${error instanceof Error ? error.message : String(error)}`,
          id,
          error
        );
      }
    },
    
    toJSONSchema(): ToolJSONSchema {
      return {
        name: id,
        description,
        parameters: zodToJsonSchema(inputSchema),
      };
    },
  };
}

/**
 * Tool execution error
 */
export class ToolExecutionError extends Error {
  constructor(
    message: string,
    public toolId: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}


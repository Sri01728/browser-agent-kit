import type { z } from 'zod';

/**
 * Convert Zod schema to JSON Schema for LLM function calling
 * Simplified implementation - can be enhanced later
 */
export function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  // This is a simplified implementation
  // In production, use a library like zod-to-json-schema
  
  const zodType = schema._def.typeName;
  
  switch (zodType) {
    case 'ZodObject': {
      const shape = (schema as z.ZodObject<any>).shape;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = zodToJsonSchema(value as z.ZodType);
        
        // Check if field is required
        if (!(value as any).isOptional()) {
          required.push(key);
        }
      }
      
      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }
    
    case 'ZodString':
      return { type: 'string' };
    
    case 'ZodNumber':
      return { type: 'number' };
    
    case 'ZodBoolean':
      return { type: 'boolean' };
    
    case 'ZodArray': {
      const items = zodToJsonSchema((schema as z.ZodArray<any>).element);
      return {
        type: 'array',
        items,
      };
    }
    
    case 'ZodEnum': {
      const values = (schema as z.ZodEnum<any>).options;
      return {
        type: 'string',
        enum: values,
      };
    }
    
    case 'ZodOptional':
    case 'ZodNullable': {
      return zodToJsonSchema((schema as any)._def.innerType);
    }
    
    default:
      // Fallback for unsupported types
      return { type: 'string' };
  }
}


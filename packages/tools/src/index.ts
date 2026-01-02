/**
 * @web-agent/tools
 *
 * Tool system for browser-based AI agents.
 * Enables agents to take actions: call APIs, manipulate DOM, access storage, etc.
 *
 * @example Creating a Tool
 * ```typescript
 * import { createTool } from '@web-agent/tools';
 * import { z } from 'zod';
 *
 * const weatherTool = createTool({
 *   id: 'get-weather',
 *   description: 'Get current weather for a location',
 *   inputSchema: z.object({
 *     location: z.string().describe('City name'),
 *   }),
 *   execute: async ({ location }) => {
 *     const res = await fetch(`https://api.weather.com/${location}`);
 *     return res.json();
 *   },
 * });
 * ```
 *
 * @module @web-agent/tools
 */

import { z, type ZodType, type ZodTypeDef } from 'zod';

// =============================================================================
// Types
// =============================================================================

export interface ToolDefinition<
  TInput extends ZodType<any, ZodTypeDef, any> = ZodType<any>,
  TOutput = any
> {
  /** Unique identifier for the tool */
  id: string;
  /** Human-readable description (used by LLM to decide when to use tool) */
  description: string;
  /** Zod schema for input validation */
  inputSchema: TInput;
  /** Optional Zod schema for output validation */
  outputSchema?: ZodType<TOutput>;
  /** Execute the tool */
  execute: (input: z.infer<TInput>, context: ToolContext) => Promise<TOutput>;
  /** Tool category for organization */
  category?: 'browser' | 'api' | 'mcp' | 'custom';
  /** Whether tool requires user confirmation */
  requiresConfirmation?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

export interface ToolContext {
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Request additional data from user */
  requestInput?: (prompt: string) => Promise<string>;
  /** Log messages */
  log?: (message: string) => void;
  /** Access to other tools */
  tools?: ToolRegistry;
  /** Custom context data */
  data?: Record<string, unknown>;
}

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  duration?: number;
}

export interface ToolCall {
  toolId: string;
  input: unknown;
  timestamp: number;
}

export interface ToolRegistry {
  tools: Map<string, ToolDefinition>;
  register: (tool: ToolDefinition) => void;
  unregister: (toolId: string) => void;
  get: (toolId: string) => ToolDefinition | undefined;
  list: () => ToolDefinition[];
  execute: (toolId: string, input: unknown, context?: ToolContext) => Promise<ToolResult>;
  getSchemaForLLM: () => string;
}

// =============================================================================
// Tool Creation
// =============================================================================

/**
 * Create a new tool definition with type safety.
 */
export function createTool<
  TInput extends ZodType<any, ZodTypeDef, any>,
  TOutput = any
>(definition: ToolDefinition<TInput, TOutput>): ToolDefinition<TInput, TOutput> {
  return {
    category: 'custom',
    timeout: 30000,
    ...definition,
  };
}

// =============================================================================
// Tool Registry
// =============================================================================

/**
 * Create a tool registry to manage multiple tools.
 */
export function createToolRegistry(initialTools: ToolDefinition[] = []): ToolRegistry {
  const tools = new Map<string, ToolDefinition>();

  // Register initial tools
  initialTools.forEach((tool) => tools.set(tool.id, tool));

  const registry: ToolRegistry = {
    tools,

    register(tool: ToolDefinition) {
      tools.set(tool.id, tool);
    },

    unregister(toolId: string) {
      tools.delete(toolId);
    },

    get(toolId: string) {
      return tools.get(toolId);
    },

    list() {
      return Array.from(tools.values());
    },

    async execute(toolId: string, input: unknown, context: ToolContext = {}): Promise<ToolResult> {
      const tool = tools.get(toolId);
      if (!tool) {
        return { success: false, error: `Tool '${toolId}' not found` };
      }

      const startTime = Date.now();

      try {
        // Validate input
        const validatedInput = tool.inputSchema.parse(input);

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Tool execution timeout')), tool.timeout || 30000);
        });

        // Execute with timeout
        const result = await Promise.race([
          tool.execute(validatedInput, { ...context, tools: registry }),
          timeoutPromise,
        ]);

        // Validate output if schema provided
        if (tool.outputSchema) {
          tool.outputSchema.parse(result);
        }

        return {
          success: true,
          data: result,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        };
      }
    },

    /**
     * Generate schema description for LLM function calling.
     */
    getSchemaForLLM(): string {
      const toolDescriptions = Array.from(tools.values()).map((tool) => {
        const schema = zodToJsonSchema(tool.inputSchema);
        return `Tool: ${tool.id}
Description: ${tool.description}
Parameters: ${JSON.stringify(schema, null, 2)}`;
      });

      return `Available tools:

${toolDescriptions.join('\n\n')}

To use a tool, respond with JSON:
\`\`\`json
{"tool": "tool-id", "input": {...parameters}}
\`\`\``;
    },
  };

  return registry;
}

// =============================================================================
// Built-in Browser Tools
// =============================================================================

/**
 * DOM manipulation tools for browser agents.
 */
export const browserTools = {
  /**
   * Get text content from an element.
   */
  getText: createTool({
    id: 'browser-get-text',
    description: 'Get text content from a DOM element',
    category: 'browser',
    inputSchema: z.object({
      selector: z.string().describe('CSS selector for the element'),
    }),
    execute: async ({ selector }) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Element not found: ${selector}`);
      return { text: element.textContent?.trim() || '' };
    },
  }),

  /**
   * Set input value.
   */
  setInput: createTool({
    id: 'browser-set-input',
    description: 'Set the value of an input element',
    category: 'browser',
    inputSchema: z.object({
      selector: z.string().describe('CSS selector for the input'),
      value: z.string().describe('Value to set'),
    }),
    execute: async ({ selector, value }) => {
      const element = document.querySelector(selector) as HTMLInputElement;
      if (!element) throw new Error(`Element not found: ${selector}`);
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return { success: true };
    },
  }),

  /**
   * Click an element.
   */
  click: createTool({
    id: 'browser-click',
    description: 'Click a DOM element',
    category: 'browser',
    inputSchema: z.object({
      selector: z.string().describe('CSS selector for the element'),
    }),
    execute: async ({ selector }) => {
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) throw new Error(`Element not found: ${selector}`);
      element.click();
      return { success: true };
    },
  }),

  /**
   * Get form data.
   */
  getFormData: createTool({
    id: 'browser-get-form-data',
    description: 'Get all form field values',
    category: 'browser',
    inputSchema: z.object({
      selector: z.string().describe('CSS selector for the form'),
    }),
    execute: async ({ selector }) => {
      const form = document.querySelector(selector) as HTMLFormElement;
      if (!form) throw new Error(`Form not found: ${selector}`);
      const formData = new FormData(form);
      return Object.fromEntries(formData.entries());
    },
  }),

  /**
   * Store data in localStorage.
   */
  setStorage: createTool({
    id: 'browser-set-storage',
    description: 'Save data to localStorage',
    category: 'browser',
    inputSchema: z.object({
      key: z.string().describe('Storage key'),
      value: z.any().describe('Value to store (will be JSON stringified)'),
    }),
    execute: async ({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
      return { success: true };
    },
  }),

  /**
   * Get data from localStorage.
   */
  getStorage: createTool({
    id: 'browser-get-storage',
    description: 'Get data from localStorage',
    category: 'browser',
    inputSchema: z.object({
      key: z.string().describe('Storage key'),
    }),
    execute: async ({ key }) => {
      const value = localStorage.getItem(key);
      return { value: value ? JSON.parse(value) : null };
    },
  }),

  /**
   * Get current URL and page info.
   */
  getPageInfo: createTool({
    id: 'browser-get-page-info',
    description: 'Get current page URL and metadata',
    category: 'browser',
    inputSchema: z.object({}),
    execute: async () => {
      return {
        url: window.location.href,
        title: document.title,
        pathname: window.location.pathname,
        hostname: window.location.hostname,
      };
    },
  }),

  /**
   * Scroll to element.
   */
  scrollTo: createTool({
    id: 'browser-scroll-to',
    description: 'Scroll to a DOM element',
    category: 'browser',
    inputSchema: z.object({
      selector: z.string().describe('CSS selector for the element'),
      behavior: z.enum(['smooth', 'instant']).optional().default('smooth'),
    }),
    execute: async ({ selector, behavior }) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Element not found: ${selector}`);
      element.scrollIntoView({ behavior, block: 'center' });
      return { success: true };
    },
  }),
};

// =============================================================================
// API Tools Factory
// =============================================================================

export interface ApiToolOptions {
  /** Tool ID */
  id: string;
  /** Description for LLM */
  description: string;
  /** API endpoint URL (can include {param} placeholders) */
  url: string;
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Input schema */
  inputSchema: ZodType<any>;
  /** Transform input to request body/params */
  transformInput?: (input: any) => any;
  /** Transform response */
  transformOutput?: (response: any) => any;
  /** Request headers */
  headers?: Record<string, string>;
  /** Use proxy for CORS-blocked APIs */
  useProxy?: boolean;
  /** Proxy URL */
  proxyUrl?: string;
}

/**
 * Create an API tool that calls external HTTP endpoints.
 */
export function createApiTool(options: ApiToolOptions): ToolDefinition {
  const {
    id,
    description,
    url,
    method = 'GET',
    inputSchema,
    transformInput = (x) => x,
    transformOutput = (x) => x,
    headers = {},
    useProxy = false,
    proxyUrl = '/api/proxy',
  } = options;

  return createTool({
    id,
    description,
    category: 'api',
    inputSchema,
    execute: async (input) => {
      const transformedInput = transformInput(input);

      // Build URL with path params
      let finalUrl = url;
      if (typeof transformedInput === 'object') {
        Object.entries(transformedInput).forEach(([key, value]) => {
          finalUrl = finalUrl.replace(`{${key}}`, encodeURIComponent(String(value)));
        });
      }

      // Use proxy if needed
      const requestUrl = useProxy
        ? `${proxyUrl}?url=${encodeURIComponent(finalUrl)}`
        : finalUrl;

      // Build request options
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      // Add body for non-GET requests
      if (method !== 'GET' && transformedInput) {
        requestOptions.body = JSON.stringify(transformedInput);
      }

      // Make request
      const response = await fetch(requestUrl, requestOptions);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return transformOutput(data);
    },
  });
}

// =============================================================================
// Pre-built API Tools
// =============================================================================

export const apiTools = {
  /**
   * Wikipedia search tool.
   */
  wikipediaSearch: createApiTool({
    id: 'api-wikipedia-search',
    description: 'Search Wikipedia for information',
    url: 'https://en.wikipedia.org/api/rest_v1/page/summary/{query}',
    inputSchema: z.object({
      query: z.string().describe('Search query'),
    }),
    transformOutput: (data) => ({
      title: data.title,
      extract: data.extract,
      url: data.content_urls?.desktop?.page,
    }),
  }),

  /**
   * Open-Meteo weather API (free, no key needed).
   */
  weather: createApiTool({
    id: 'api-weather',
    description: 'Get current weather for coordinates',
    url: 'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current_weather=true',
    inputSchema: z.object({
      lat: z.number().describe('Latitude'),
      lng: z.number().describe('Longitude'),
    }),
    transformOutput: (data) => ({
      temperature: data.current_weather?.temperature,
      windSpeed: data.current_weather?.windspeed,
      weatherCode: data.current_weather?.weathercode,
    }),
  }),

  /**
   * JSONPlaceholder test API.
   */
  testApi: createApiTool({
    id: 'api-test',
    description: 'Test API endpoint (JSONPlaceholder)',
    url: 'https://jsonplaceholder.typicode.com/posts/{id}',
    inputSchema: z.object({
      id: z.number().describe('Post ID'),
    }),
  }),
};

// =============================================================================
// Utility: Zod to JSON Schema (simplified)
// =============================================================================

function zodToJsonSchema(schema: z.ZodTypeAny): object {
  // Simplified conversion - in production use zod-to-json-schema package
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = schema._def as any;
  const typeName = def.typeName as string | undefined;

  if (typeName === 'ZodObject') {
    const shape = (schema as z.ZodObject<z.ZodRawShape>).shape;
    const properties: Record<string, object> = {};
    const required: string[] = [];

    Object.entries(shape).forEach(([key, value]) => {
      properties[key] = zodToJsonSchema(value as z.ZodTypeAny);
      if (!value.isOptional()) {
        required.push(key);
      }
    });

    return { type: 'object', properties, required };
  }

  if (typeName === 'ZodString') {
    return { type: 'string', description: def.description };
  }

  if (typeName === 'ZodNumber') {
    return { type: 'number', description: def.description };
  }

  if (typeName === 'ZodBoolean') {
    return { type: 'boolean', description: def.description };
  }

  if (typeName === 'ZodArray') {
    return {
      type: 'array',
      items: zodToJsonSchema(def.type),
    };
  }

  if (typeName === 'ZodEnum') {
    return {
      type: 'string',
      enum: def.values,
    };
  }

  if (typeName === 'ZodOptional') {
    return zodToJsonSchema(def.innerType);
  }

  return { type: 'any' };
}

// =============================================================================
// Exports
// =============================================================================

export type { ZodType, ZodTypeDef };


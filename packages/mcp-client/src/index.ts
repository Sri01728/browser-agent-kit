/**
 * @web-agent/mcp-client
 *
 * Browser-based MCP (Model Context Protocol) client.
 * Connects browser agents to MCP servers via WebSocket or HTTP.
 *
 * @example Connect to MCP Server
 * ```typescript
 * import { createMCPClient } from '@web-agent/mcp-client';
 *
 * const client = createMCPClient({
 *   url: 'ws://localhost:3001/mcp',
 *   // or HTTP: 'http://localhost:3001/mcp'
 * });
 *
 * await client.connect();
 * const tools = await client.listTools();
 * const result = await client.callTool('github-search', { query: 'react' });
 * ```
 *
 * @module @web-agent/mcp-client
 */

import { z } from 'zod';
import { createTool, type ToolDefinition, type ToolRegistry, createToolRegistry } from '@web-agent/tools';

// =============================================================================
// MCP Protocol Types
// =============================================================================

export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPToolInfo {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPResourceInfo {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPromptInfo {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

// =============================================================================
// MCP Client Types
// =============================================================================

export type MCPTransport = 'websocket' | 'http' | 'sse';

export interface MCPClientOptions {
  /** Server URL (ws:// for WebSocket, http:// for HTTP) */
  url: string;
  /** Transport type (auto-detected from URL if not specified) */
  transport?: MCPTransport;
  /** Reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect interval in ms */
  reconnectInterval?: number;
  /** Request timeout in ms */
  timeout?: number;
  /** Authentication token */
  authToken?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Called when connected */
  onConnect?: () => void;
  /** Called when disconnected */
  onDisconnect?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

export interface MCPClient {
  /** Connection status */
  readonly status: 'disconnected' | 'connecting' | 'connected' | 'error';
  /** Server info after connection */
  readonly serverInfo: MCPServerInfo | null;
  /** Connect to MCP server */
  connect: () => Promise<void>;
  /** Disconnect from server */
  disconnect: () => void;
  /** List available tools */
  listTools: () => Promise<MCPToolInfo[]>;
  /** Call a tool */
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  /** List available resources */
  listResources: () => Promise<MCPResourceInfo[]>;
  /** Read a resource */
  readResource: (uri: string) => Promise<unknown>;
  /** List available prompts */
  listPrompts: () => Promise<MCPPromptInfo[]>;
  /** Get a prompt */
  getPrompt: (name: string, args?: Record<string, unknown>) => Promise<string>;
  /** Get tools as ToolRegistry */
  getToolRegistry: () => Promise<ToolRegistry>;
  /** Subscribe to notifications */
  onNotification: (callback: (method: string, params: unknown) => void) => () => void;
}

export interface MCPServerInfo {
  name: string;
  version: string;
  capabilities: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
  };
}

// =============================================================================
// MCP Client Implementation
// =============================================================================

/**
 * Create an MCP client to connect to MCP servers from the browser.
 */
export function createMCPClient(options: MCPClientOptions): MCPClient {
  const {
    url,
    transport = detectTransport(url),
    autoReconnect = true,
    reconnectInterval = 5000,
    timeout = 30000,
    authToken,
    headers = {},
    onConnect,
    onDisconnect,
    onError,
  } = options;

  let status: MCPClient['status'] = 'disconnected';
  let serverInfo: MCPServerInfo | null = null;
  let ws: WebSocket | null = null;
  let messageId = 0;
  const pendingRequests = new Map<string | number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>();
  const notificationListeners = new Set<(method: string, params: unknown) => void>();

  // Generate unique message ID
  const nextId = () => ++messageId;

  // Send JSON-RPC request
  const sendRequest = async (method: string, params?: unknown): Promise<unknown> => {
    const id = nextId();
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, timeout);

      pendingRequests.set(id, { resolve, reject, timeout: timeoutHandle });

      if (transport === 'websocket' && ws) {
        ws.send(JSON.stringify(message));
      } else if (transport === 'http') {
        httpRequest(message).then(resolve).catch(reject);
        clearTimeout(timeoutHandle);
        pendingRequests.delete(id);
      }
    });
  };

  // HTTP transport request
  const httpRequest = async (message: MCPMessage): Promise<unknown> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const result = await response.json() as MCPMessage;
    if (result.error) {
      throw new Error(result.error.message);
    }
    return result.result;
  };

  // Handle incoming WebSocket message
  const handleMessage = (data: string) => {
    try {
      const message = JSON.parse(data) as MCPMessage;

      // Handle response
      if (message.id !== undefined) {
        const pending = pendingRequests.get(message.id);
        if (pending) {
          clearTimeout(pending.timeout);
          pendingRequests.delete(message.id);

          if (message.error) {
            pending.reject(new Error(message.error.message));
          } else {
            pending.resolve(message.result);
          }
        }
      }

      // Handle notification
      if (message.method && message.id === undefined) {
        notificationListeners.forEach((listener) => {
          listener(message.method!, message.params);
        });
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };

  // Connect via WebSocket
  const connectWebSocket = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      status = 'connecting';

      const wsUrl = new URL(url);
      if (authToken) {
        wsUrl.searchParams.set('token', authToken);
      }

      ws = new WebSocket(wsUrl.toString());

      ws.onopen = async () => {
        status = 'connected';
        try {
          // Initialize connection
          const initResult = await sendRequest('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: '@web-agent/mcp-client',
              version: '0.1.0',
            },
          }) as { serverInfo: MCPServerInfo };

          serverInfo = initResult.serverInfo;
          onConnect?.();
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      ws.onmessage = (event) => handleMessage(event.data);

      ws.onclose = () => {
        status = 'disconnected';
        onDisconnect?.();

        if (autoReconnect) {
          setTimeout(() => connectWebSocket(), reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        status = 'error';
        const error = new Error('WebSocket error');
        onError?.(error);
        reject(error);
      };
    });
  };

  // Connect via HTTP (simple request/response)
  const connectHttp = async (): Promise<void> => {
    status = 'connecting';
    try {
      const result = await httpRequest({
        jsonrpc: '2.0',
        id: nextId(),
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: '@web-agent/mcp-client',
            version: '0.1.0',
          },
        },
      }) as { serverInfo: MCPServerInfo };

      serverInfo = result.serverInfo;
      status = 'connected';
      onConnect?.();
    } catch (error) {
      status = 'error';
      throw error;
    }
  };

  // Convert MCP tools to ToolRegistry
  const getToolRegistry = async (): Promise<ToolRegistry> => {
    const mcpTools = await sendRequest('tools/list') as { tools: MCPToolInfo[] };
    const tools: ToolDefinition[] = mcpTools.tools.map((tool) => {
      // Convert JSON Schema to Zod (simplified)
      const inputSchema = jsonSchemaToZod(tool.inputSchema);

      return createTool({
        id: `mcp-${tool.name}`,
        description: tool.description,
        category: 'mcp',
        inputSchema,
        execute: async (input) => {
          return sendRequest('tools/call', {
            name: tool.name,
            arguments: input,
          });
        },
      });
    });

    return createToolRegistry(tools);
  };

  // Client implementation
  const client: MCPClient = {
    get status() {
      return status;
    },

    get serverInfo() {
      return serverInfo;
    },

    async connect() {
      if (transport === 'websocket') {
        await connectWebSocket();
      } else {
        await connectHttp();
      }
    },

    disconnect() {
      if (ws) {
        ws.close();
        ws = null;
      }
      status = 'disconnected';
    },

    async listTools() {
      const result = await sendRequest('tools/list') as { tools: MCPToolInfo[] };
      return result.tools;
    },

    async callTool(name: string, args: Record<string, unknown>) {
      const result = await sendRequest('tools/call', { name, arguments: args });
      return result;
    },

    async listResources() {
      const result = await sendRequest('resources/list') as { resources: MCPResourceInfo[] };
      return result.resources;
    },

    async readResource(uri: string) {
      const result = await sendRequest('resources/read', { uri });
      return result;
    },

    async listPrompts() {
      const result = await sendRequest('prompts/list') as { prompts: MCPPromptInfo[] };
      return result.prompts;
    },

    async getPrompt(name: string, args?: Record<string, unknown>) {
      const result = await sendRequest('prompts/get', { name, arguments: args }) as { 
        messages: Array<{ content: { text: string } }>;
      };
      return result.messages.map((m) => m.content.text).join('\n');
    },

    getToolRegistry,

    onNotification(callback) {
      notificationListeners.add(callback);
      return () => notificationListeners.delete(callback);
    },
  };

  return client;
}

// =============================================================================
// Utilities
// =============================================================================

function detectTransport(url: string): MCPTransport {
  if (url.startsWith('ws://') || url.startsWith('wss://')) {
    return 'websocket';
  }
  return 'http';
}

/**
 * Convert JSON Schema to Zod schema (simplified).
 */
function jsonSchemaToZod(schema: MCPToolInfo['inputSchema']): z.ZodType<any> {
  const properties: Record<string, z.ZodType<any>> = {};

  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, value]) => {
      const prop = value as { type?: string; description?: string; enum?: string[] };
      let zodType: z.ZodType<any>;

      switch (prop.type) {
        case 'string':
          zodType = prop.enum ? z.enum(prop.enum as [string, ...string[]]) : z.string();
          break;
        case 'number':
        case 'integer':
          zodType = z.number();
          break;
        case 'boolean':
          zodType = z.boolean();
          break;
        case 'array':
          zodType = z.array(z.any());
          break;
        default:
          zodType = z.any();
      }

      if (prop.description) {
        zodType = zodType.describe(prop.description);
      }

      if (!schema.required?.includes(key)) {
        zodType = zodType.optional();
      }

      properties[key] = zodType;
    });
  }

  return z.object(properties);
}

// =============================================================================
// Pre-configured MCP Server Connectors
// =============================================================================

/**
 * Create a client for common MCP servers.
 */
export const mcpServers = {
  /**
   * Connect to a local MCP server.
   */
  local: (port: number = 3001) =>
    createMCPClient({ url: `ws://localhost:${port}/mcp` }),

  /**
   * Connect to an MCP server with HTTP transport.
   */
  http: (baseUrl: string, authToken?: string) =>
    createMCPClient({ url: `${baseUrl}/mcp`, transport: 'http', authToken }),

  /**
   * Connect via a proxy (for CORS-blocked servers).
   */
  proxy: (proxyUrl: string, targetUrl: string) =>
    createMCPClient({ url: `${proxyUrl}?target=${encodeURIComponent(targetUrl)}` }),
};

// =============================================================================
// MCP Server Bridge (for running MCP tools via a proxy)
// =============================================================================

export interface MCPBridgeOptions {
  /** Proxy server URL */
  proxyUrl: string;
  /** MCP servers to connect through proxy */
  servers: Array<{
    id: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
}

/**
 * Create a bridge to MCP servers via a proxy.
 * The proxy server runs MCP servers and exposes them via HTTP.
 */
export function createMCPBridge(options: MCPBridgeOptions) {
  const { proxyUrl, servers } = options;

  return {
    /**
     * List all tools from all connected MCP servers.
     */
    async listAllTools(): Promise<Array<MCPToolInfo & { server: string }>> {
      const allTools: Array<MCPToolInfo & { server: string }> = [];

      for (const server of servers) {
        const response = await fetch(`${proxyUrl}/mcp/${server.id}/tools`);
        const data = await response.json() as { tools: MCPToolInfo[] };
        allTools.push(...data.tools.map((t) => ({ ...t, server: server.id })));
      }

      return allTools;
    },

    /**
     * Call a tool on a specific MCP server.
     */
    async callTool(serverId: string, toolName: string, args: Record<string, unknown>) {
      const response = await fetch(`${proxyUrl}/mcp/${serverId}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: toolName, arguments: args }),
      });
      return response.json();
    },

    /**
     * Get combined ToolRegistry from all servers.
     */
    async getToolRegistry(): Promise<ToolRegistry> {
      const allTools = await this.listAllTools();
      const tools: ToolDefinition[] = allTools.map((tool) => {
        const inputSchema = jsonSchemaToZod(tool.inputSchema as any);

        return createTool({
          id: `mcp-${tool.server}-${tool.name}`,
          description: `[${tool.server}] ${tool.description}`,
          category: 'mcp',
          inputSchema,
          execute: async (input) => {
            return this.callTool(tool.server, tool.name, input);
          },
        });
      });

      return createToolRegistry(tools);
    },
  };
}


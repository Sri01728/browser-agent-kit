/**
 * Browser MCP Client - Connect to MCP servers from the browser
 * 
 * Similar to Mastra's MCPClient but designed for browser environments.
 * Only supports HTTP/SSE transports (not stdio which requires Node.js).
 * 
 * @example
 * ```tsx
 * import { BrowserMCPClient } from '@web-agent/react';
 * 
 * const mcp = new BrowserMCPClient({
 *   servers: {
 *     weather: {
 *       url: 'https://weather-mcp.example.com/sse',
 *     },
 *     github: {
 *       url: 'https://github-mcp.example.com/mcp',
 *       headers: { Authorization: 'Bearer token' },
 *     },
 *   },
 * });
 * 
 * // Get tools for use with agent
 * const tools = await mcp.getTools();
 * ```
 */

// Tool type for MCP integration
export interface Tool {
  id: string;
  name: string;
  description: string;
  inputSchema: any;
  execute: (args: any) => Promise<any>;
}

// =============================================================================
// Types
// =============================================================================

export interface MCPServerConfig {
  /** URL of the MCP server (HTTP or SSE endpoint) */
  url: string;
  
  /** Custom headers for authentication */
  headers?: Record<string, string>;
  
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  
  /** Whether to use SSE transport (auto-detected if URL ends with /sse) */
  useSSE?: boolean;
}

export interface BrowserMCPClientConfig {
  /** Map of server names to their configurations */
  servers: Record<string, MCPServerConfig>;
  
  /** Global timeout for all servers (default: 30000ms) */
  timeout?: number;
  
  /** Enable debug logging */
  debug?: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// =============================================================================
// Browser MCP Client
// =============================================================================

export class BrowserMCPClient {
  private servers: Record<string, MCPServerConfig>;
  private timeout: number;
  private debug: boolean;
  private requestId: number = 0;
  private sseConnections: Map<string, EventSource> = new Map();

  constructor(config: BrowserMCPClientConfig) {
    this.servers = config.servers;
    this.timeout = config.timeout ?? 30000;
    this.debug = config.debug ?? false;
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log('[BrowserMCPClient]', ...args);
    }
  }

  private async sendRequest(serverName: string, method: string, params?: any): Promise<any> {
    const server = this.servers[serverName];
    if (!server) {
      throw new Error(`MCP server "${serverName}" not found`);
    }

    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params,
    };

    this.log(`Sending request to ${serverName}:`, request);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), server.timeout ?? this.timeout);

    try {
      const response = await fetch(server.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...server.headers,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const data: MCPResponse = await response.json();
      
      if (data.error) {
        throw new Error(`MCP error: ${data.error.message} (code: ${data.error.code})`);
      }

      this.log(`Response from ${serverName}:`, data.result);
      return data.result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${serverName} timed out`);
      }
      throw error;
    }
  }

  // ===========================================================================
  // Tool Methods
  // ===========================================================================

  /**
   * List all tools from a specific server
   */
  async listToolsFromServer(serverName: string): Promise<MCPTool[]> {
    const result = await this.sendRequest(serverName, 'tools/list');
    return result.tools ?? [];
  }

  /**
   * List all tools from all configured servers
   * Returns a flat object with tools namespaced by server name
   */
  async listTools(): Promise<Record<string, Tool>> {
    const allTools: Record<string, Tool> = {};

    for (const serverName of Object.keys(this.servers)) {
      try {
        const tools = await this.listToolsFromServer(serverName);
        
        for (const mcpTool of tools) {
          const toolId = `${serverName}_${mcpTool.name}`;
          allTools[toolId] = this.convertMCPToolToTool(serverName, mcpTool);
        }
      } catch (error) {
        this.log(`Failed to list tools from ${serverName}:`, error);
      }
    }

    return allTools;
  }

  /**
   * Get tools grouped by server (for use with toolsets)
   */
  async getToolsets(): Promise<Record<string, Record<string, Tool>>> {
    const toolsets: Record<string, Record<string, Tool>> = {};

    for (const serverName of Object.keys(this.servers)) {
      try {
        const tools = await this.listToolsFromServer(serverName);
        toolsets[serverName] = {};
        
        for (const mcpTool of tools) {
          toolsets[serverName][mcpTool.name] = this.convertMCPToolToTool(serverName, mcpTool);
        }
      } catch (error) {
        this.log(`Failed to list tools from ${serverName}:`, error);
      }
    }

    return toolsets;
  }

  /**
   * Call a tool on a specific server
   */
  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    const result = await this.sendRequest(serverName, 'tools/call', {
      name: toolName,
      arguments: args,
    });
    return result;
  }

  private convertMCPToolToTool(serverName: string, mcpTool: MCPTool): Tool {
    return {
      id: `${serverName}_${mcpTool.name}`,
      name: mcpTool.name,
      description: mcpTool.description,
      inputSchema: mcpTool.inputSchema,
      execute: async (args: any) => {
        return this.callTool(serverName, mcpTool.name, args);
      },
    };
  }

  // ===========================================================================
  // Resource Methods
  // ===========================================================================

  /**
   * List resources from all servers
   */
  async listResources(): Promise<Record<string, MCPResource[]>> {
    const resources: Record<string, MCPResource[]> = {};

    for (const serverName of Object.keys(this.servers)) {
      try {
        const result = await this.sendRequest(serverName, 'resources/list');
        resources[serverName] = result.resources ?? [];
      } catch (error) {
        this.log(`Failed to list resources from ${serverName}:`, error);
      }
    }

    return resources;
  }

  /**
   * Read a resource from a server
   */
  async readResource(serverName: string, uri: string): Promise<any> {
    const result = await this.sendRequest(serverName, 'resources/read', { uri });
    return result;
  }

  // ===========================================================================
  // Prompt Methods
  // ===========================================================================

  /**
   * List prompts from all servers
   */
  async listPrompts(): Promise<Record<string, MCPPrompt[]>> {
    const prompts: Record<string, MCPPrompt[]> = {};

    for (const serverName of Object.keys(this.servers)) {
      try {
        const result = await this.sendRequest(serverName, 'prompts/list');
        prompts[serverName] = result.prompts ?? [];
      } catch (error) {
        this.log(`Failed to list prompts from ${serverName}:`, error);
      }
    }

    return prompts;
  }

  /**
   * Get a prompt from a server
   */
  async getPrompt(serverName: string, name: string, args?: any): Promise<any> {
    const result = await this.sendRequest(serverName, 'prompts/get', {
      name,
      arguments: args,
    });
    return result;
  }

  // ===========================================================================
  // Connection Management
  // ===========================================================================

  /**
   * Disconnect from all servers
   */
  async disconnect(): Promise<void> {
    for (const [serverName, eventSource] of this.sseConnections) {
      eventSource.close();
      this.log(`Disconnected SSE from ${serverName}`);
    }
    this.sseConnections.clear();
  }
}

// =============================================================================
// Pre-configured MCP Servers
// =============================================================================

/**
 * Pre-configured MCP server URLs for popular services
 */
export const MCP_SERVERS = {
  /** Mastra Studio local MCP server */
  mastraLocal: (port = 4111) => ({
    url: `http://localhost:${port}/api/mcp`,
  }),

  /** Smithery.ai hosted MCP servers */
  smithery: (serverPath: string, apiKey?: string) => ({
    url: `https://server.smithery.ai/${serverPath}/mcp`,
    headers: apiKey ? { 'x-api-key': apiKey } : undefined,
  }),

  /** Composio.dev MCP servers */
  composio: (service: string, path: string) => ({
    url: `https://mcp.composio.dev/${service}/${path}`,
  }),

  /** Custom MCP server */
  custom: (url: string, headers?: Record<string, string>) => ({
    url,
    headers,
  }),
};

// =============================================================================
// React Hook
// =============================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';

export interface UseMCPOptions {
  /** MCP client configuration */
  config: BrowserMCPClientConfig;
  
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
}

export interface UseMCPReturn {
  /** MCP client instance */
  client: BrowserMCPClient;
  
  /** All tools from all servers */
  tools: Record<string, Tool>;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error if any */
  error: Error | null;
  
  /** Refresh tools from servers */
  refresh: () => Promise<void>;
  
  /** Disconnect from all servers */
  disconnect: () => Promise<void>;
}

/**
 * React hook for using MCP servers
 * 
 * @example
 * ```tsx
 * const { tools, isLoading, error } = useMCP({
 *   config: {
 *     servers: {
 *       weather: { url: 'https://weather-mcp.example.com/mcp' },
 *     },
 *   },
 * });
 * 
 * // Use tools with agent
 * const agent = useWebAgent({
 *   persona: 'Weather assistant',
 *   tools,
 * });
 * ```
 */
export function useMCP(options: UseMCPOptions): UseMCPReturn {
  const { config, autoConnect = true } = options;
  
  const client = useMemo(() => new BrowserMCPClient(config), [config]);
  const [tools, setTools] = useState<Record<string, Tool>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedTools = await client.listTools();
      setTools(loadedTools);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const disconnect = useCallback(async () => {
    await client.disconnect();
  }, [client]);

  useEffect(() => {
    if (autoConnect) {
      refresh();
    }
    
    return () => {
      client.disconnect();
    };
  }, [autoConnect, refresh, client]);

  return {
    client,
    tools,
    isLoading,
    error,
    refresh,
    disconnect,
  };
}


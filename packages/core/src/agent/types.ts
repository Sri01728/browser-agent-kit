import type { LLMAdapter, Message } from '../llm/types';
import type { Tool } from '../tool/types';
import type { MemoryStore, MemoryContext } from '../memory/types';

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Unique agent identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** System instructions/prompt */
  instructions: string;
  
  /** LLM adapter instance */
  model: LLMAdapter;
  
  /** Available tools */
  tools?: Record<string, Tool>;
  
  /** Memory store for conversation history */
  memory?: MemoryStore | boolean; // true = auto-configure IndexedDB
  
  /** Default generation options */
  defaultOptions?: {
    maxTokens?: number;
    temperature?: number;
    maxSteps?: number; // Max tool calling iterations
  };
}

/**
 * Agent generation options
 */
export interface GenerateOptions {
  /** Memory context for conversation */
  memory?: MemoryContext;
  
  /** Override default generation settings */
  maxTokens?: number;
  temperature?: number;
  maxSteps?: number;
  
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Agent generation result
 */
export interface AgentResult {
  /** Final generated text */
  text: string;
  
  /** Number of steps (LLM calls) taken */
  steps: number;
  
  /** Finish reason */
  finishReason: 'stop' | 'length' | 'max_steps' | 'error';
  
  /** Token usage */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  
  /** Tool calls made during generation */
  toolCalls?: Array<{
    tool: string;
    input: unknown;
    output: unknown;
  }>;
}

/**
 * Agent stream chunk
 */
export interface AgentStreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'done';
  text?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  };
  toolResult?: {
    id: string;
    result: unknown;
  };
  done?: AgentResult;
}

/**
 * Agent instance
 */
export interface Agent {
  id: string;
  name: string;
  instructions: string;
  model: LLMAdapter;
  tools: Record<string, Tool>;
  memory?: MemoryStore;
  
  /** Generate a response */
  generate(prompt: string | Message[], options?: GenerateOptions): Promise<AgentResult>;
  
  /** Stream a response */
  stream(prompt: string | Message[], options?: GenerateOptions): AsyncGenerator<AgentStreamChunk>;
}


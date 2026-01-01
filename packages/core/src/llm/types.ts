/**
 * Core LLM adapter types for model-agnostic orchestration
 */

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export interface GenerateOptions {
  messages: Message[];
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
}

export interface GenerateResult {
  text: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'done';
  text?: string;
  toolCall?: Partial<ToolCall>;
  finishReason?: GenerateResult['finishReason'];
  usage?: GenerateResult['usage'];
}

export interface LLMAdapter {
  /** Unique identifier for this adapter */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Initialize the model (download, load into WebGPU/WASM) */
  initialize(): Promise<void>;
  
  /** Check if model is ready for inference */
  isReady(): boolean;
  
  /** Generate text completion */
  generate(options: GenerateOptions): Promise<GenerateResult>;
  
  /** Stream text completion */
  stream(options: GenerateOptions): AsyncGenerator<StreamChunk, void, unknown>;
  
  /** Check if adapter supports function calling */
  supportsTools(): boolean;
  
  /** Get model context window size */
  getContextWindow(): number;
  
  /** Cleanup resources */
  dispose(): void;
}

export interface LLMAdapterConfig {
  /** Path to model file or URL */
  modelPath: string;
  
  /** Optional model configuration */
  modelConfig?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
  };
  
  /** Optional caching strategy */
  cache?: {
    enabled: boolean;
    storageKey?: string;
  };
}


import type {
  LLMAdapter,
  GenerateOptions,
  GenerateResult,
  StreamChunk,
  Message,
  ToolDefinition,
  ToolCall,
} from '@web-agent/core';
import { FilesetResolver, LlmInference } from '@mediapipe/tasks-genai';

import {
  mediaPipeConfigSchema,
  type MediaPipeConfig,
  type MediaPipeConfigResolved,
} from './types';
import {
  ModelInitializationError,
  ModelNotInitializedError,
  InferenceError,
  ConfigurationError,
} from './errors';

// Extend Navigator type for WebGPU support
declare global {
  interface Navigator {
    gpu?: {
      requestAdapter(): Promise<GPUAdapter | null>;
    };
  }
  interface GPUAdapter {}
}

/**
 * MediaPipe LLM Inference adapter for browser-based AI agents.
 * 
 * Supports Gemma and other compatible models running locally in the browser
 * using WebGPU acceleration with WASM fallback.
 * 
 * @example Basic usage
 * ```typescript
 * import { MediaPipeAdapter } from '@web-agent/mediapipe';
 * 
 * const adapter = new MediaPipeAdapter({
 *   modelPath: '/models/gemma-2b-it-gpu-int4.bin',
 * });
 * 
 * await adapter.initialize();
 * 
 * const result = await adapter.generate({
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * 
 * console.log(result.text);
 * ```
 * 
 * @example With streaming
 * ```typescript
 * for await (const chunk of adapter.stream({ messages })) {
 *   if (chunk.type === 'text') {
 *     process.stdout.write(chunk.text);
 *   }
 * }
 * ```
 */
export class MediaPipeAdapter implements LLMAdapter {
  readonly id = 'mediapipe';
  readonly name = 'MediaPipe LLM Inference';

  private config: MediaPipeConfigResolved;
  private llmInference: LlmInference | null = null;
  private initialized = false;
  private webGPUAvailable: boolean | null = null;

  constructor(config: MediaPipeConfig) {
    // Validate config with Zod
    const result = mediaPipeConfigSchema.safeParse(config);
    if (!result.success) {
      const invalidFields = result.error.errors.map(e => e.path.join('.'));
      throw new ConfigurationError(
        result.error.errors.map(e => e.message).join('; '),
        invalidFields
      );
    }
    this.config = result.data;
  }

  /**
   * Check if WebGPU is available in the current browser
   */
  private async checkWebGPU(): Promise<boolean> {
    if (this.webGPUAvailable !== null) {
      return this.webGPUAvailable;
    }

    try {
      if (!navigator.gpu) {
        this.webGPUAvailable = false;
        return false;
      }

      const adapter = await navigator.gpu.requestAdapter();
      this.webGPUAvailable = adapter !== null;
      return this.webGPUAvailable;
    } catch {
      this.webGPUAvailable = false;
      return false;
    }
  }

  /**
   * Initialize the MediaPipe model.
   * Downloads and loads the model into WebGPU/WASM runtime.
   * 
   * @throws {ModelInitializationError} If model loading fails
   * @throws {WebGPUNotAvailableError} If WebGPU required but unavailable
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Check WebGPU availability
      const hasWebGPU = await this.checkWebGPU();
      
      if (this.config.useWebGPU && !hasWebGPU) {
        console.warn(
          'WebGPU not available, falling back to WASM. Performance may be reduced.'
        );
      }

      // Initialize the fileset resolver for MediaPipe
      const genai = await FilesetResolver.forGenAiTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm'
      );

      // Create LLM inference instance
      this.llmInference = await LlmInference.createFromOptions(genai, {
        baseOptions: {
          modelAssetPath: this.config.modelPath,
        },
        maxTokens: this.config.maxTokens,
        topK: this.config.topK,
        temperature: this.config.temperature,
        randomSeed: this.config.seed ?? Math.floor(Math.random() * 1000000),
      });

      this.initialized = true;
      console.log(`MediaPipe adapter initialized with model: ${this.config.modelPath}`);
    } catch (error) {
      throw new ModelInitializationError(
        error instanceof Error ? error.message : String(error),
        this.config.modelPath,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if the model is ready for inference
   */
  isReady(): boolean {
    return this.initialized && this.llmInference !== null;
  }

  /**
   * Generate a response from the model
   * 
   * @param options - Generation options including messages and parameters
   * @returns Generated text and metadata
   * 
   * @throws {ModelNotInitializedError} If model not initialized
   * @throws {InferenceError} If generation fails
   * 
   * @example
   * ```typescript
   * const result = await adapter.generate({
   *   messages: [
   *     { role: 'system', content: 'You are a helpful assistant.' },
   *     { role: 'user', content: 'What is 2+2?' }
   *   ],
   *   maxTokens: 100,
   *   temperature: 0.5
   * });
   * ```
   */
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    if (!this.isReady()) {
      throw new ModelNotInitializedError();
    }

    const prompt = this.formatMessages(options.messages, options.tools);
    
    try {
      const response = await this.llmInference!.generateResponse(prompt);

      // Parse potential tool calls from response
      const toolCalls = options.tools ? this.parseToolCalls(response) : undefined;
      const text = toolCalls ? this.extractTextBeforeToolCall(response) : response;

      // Estimate token counts (MediaPipe doesn't provide exact counts)
      const promptTokens = this.estimateTokens(prompt);
      const completionTokens = this.estimateTokens(response);

      return {
        text,
        toolCalls,
        finishReason: toolCalls ? 'tool_calls' : 'stop',
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
      };
    } catch (error) {
      throw new InferenceError(
        error instanceof Error ? error.message : String(error),
        prompt,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Stream a response from the model
   * 
   * @param options - Generation options including messages and parameters
   * @yields Chunks of generated text and metadata
   * 
   * @throws {ModelNotInitializedError} If model not initialized
   * @throws {InferenceError} If generation fails
   * 
   * @example
   * ```typescript
   * for await (const chunk of adapter.stream({ messages })) {
   *   if (chunk.type === 'text') {
   *     console.log(chunk.text);
   *   } else if (chunk.type === 'done') {
   *     console.log('Generation complete');
   *   }
   * }
   * ```
   */
  async *stream(options: GenerateOptions): AsyncGenerator<StreamChunk, void, unknown> {
    if (!this.isReady()) {
      throw new ModelNotInitializedError();
    }

    const prompt = this.formatMessages(options.messages, options.tools);
    let fullResponse = '';
    let promptTokens = this.estimateTokens(prompt);

    try {
      // MediaPipe uses a callback-based streaming API
      // We convert it to an async generator
      const chunks: string[] = [];
      let resolveNext: ((value: string | null) => void) | null = null;
      let streamComplete = false;

      this.llmInference!.generateResponse(prompt, (partialResult, done) => {
        if (done) {
          streamComplete = true;
          if (resolveNext) {
            resolveNext(null);
          }
        } else {
          chunks.push(partialResult);
          if (resolveNext) {
            const chunk = chunks.shift()!;
            resolveNext(chunk);
            resolveNext = null;
          }
        }
      });

      // Yield chunks as they arrive
      while (!streamComplete || chunks.length > 0) {
        if (chunks.length > 0) {
          const chunk = chunks.shift()!;
          fullResponse += chunk;
          yield {
            type: 'text',
            text: chunk,
          };
        } else {
          // Wait for next chunk
          await new Promise<string | null>(resolve => {
            resolveNext = resolve;
          });
        }
      }

      // Parse tool calls from complete response
      const toolCalls = options.tools ? this.parseToolCalls(fullResponse) : undefined;
      
      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          yield {
            type: 'tool_call',
            toolCall,
          };
        }
      }

      // Final done chunk with usage
      yield {
        type: 'done',
        finishReason: toolCalls ? 'tool_calls' : 'stop',
        usage: {
          promptTokens,
          completionTokens: this.estimateTokens(fullResponse),
          totalTokens: promptTokens + this.estimateTokens(fullResponse),
        },
      };
    } catch (error) {
      throw new InferenceError(
        error instanceof Error ? error.message : String(error),
        prompt,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * MediaPipe supports basic function calling through prompt engineering
   */
  supportsTools(): boolean {
    return true;
  }

  /**
   * Get the model's context window size
   * Gemma 2B typically has 8192 tokens
   */
  getContextWindow(): number {
    return 8192;
  }

  /**
   * Clean up resources and release model from memory
   */
  dispose(): void {
    if (this.llmInference) {
      this.llmInference.close();
      this.llmInference = null;
    }
    this.initialized = false;
    console.log('MediaPipe adapter disposed');
  }

  /**
   * Format messages into a prompt string for the model
   */
  private formatMessages(messages: Message[], tools?: ToolDefinition[]): string {
    let prompt = '';

    // Add tool definitions if provided
    if (tools && tools.length > 0) {
      prompt += this.formatToolDefinitions(tools);
      prompt += '\n\n';
    }

    // Format each message
    for (const message of messages) {
      switch (message.role) {
        case 'system':
          prompt += `<start_of_turn>system\n${message.content}<end_of_turn>\n`;
          break;
        case 'user':
          prompt += `<start_of_turn>user\n${message.content}<end_of_turn>\n`;
          break;
        case 'assistant':
          prompt += `<start_of_turn>model\n${message.content}<end_of_turn>\n`;
          break;
        case 'tool':
          prompt += `<start_of_turn>tool\nTool "${message.name}" returned: ${message.content}<end_of_turn>\n`;
          break;
      }
    }

    // Add model turn prefix for response
    prompt += '<start_of_turn>model\n';

    return prompt;
  }

  /**
   * Format tool definitions for inclusion in the prompt
   */
  private formatToolDefinitions(tools: ToolDefinition[]): string {
    const toolDescriptions = tools.map(tool => {
      const params = JSON.stringify(tool.parameters, null, 2);
      return `### ${tool.name}\n${tool.description}\n\nParameters:\n\`\`\`json\n${params}\n\`\`\``;
    }).join('\n\n');

    return `You have access to the following tools. To use a tool, respond with a JSON object in this exact format:
\`\`\`json
{"tool_call": {"name": "tool_name", "arguments": {...}}}
\`\`\`

Available tools:

${toolDescriptions}

Only use a tool if it's necessary to answer the user's question. If no tool is needed, respond normally.`;
  }

  /**
   * Parse tool calls from model output
   */
  private parseToolCalls(response: string): ToolCall[] | undefined {
    // Look for tool call JSON in the response
    const toolCallRegex = /```json\s*(\{[\s\S]*?"tool_call"[\s\S]*?\})\s*```/g;
    const matches = [...response.matchAll(toolCallRegex)];

    if (matches.length === 0) {
      // Try without code blocks
      const inlineRegex = /\{"tool_call":\s*\{[^}]+\}\}/g;
      const inlineMatches = [...response.matchAll(inlineRegex)];
      if (inlineMatches.length === 0) {
        return undefined;
      }
    }

    const toolCalls: ToolCall[] = [];

    for (const match of matches) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.tool_call) {
          toolCalls.push({
            id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            name: parsed.tool_call.name,
            arguments: parsed.tool_call.arguments || {},
          });
        }
      } catch {
        // Skip invalid JSON
        continue;
      }
    }

    return toolCalls.length > 0 ? toolCalls : undefined;
  }

  /**
   * Extract text content before any tool call
   */
  private extractTextBeforeToolCall(response: string): string {
    const toolCallIndex = response.indexOf('{"tool_call"');
    const codeBlockIndex = response.indexOf('```json');
    
    const cutoffIndex = Math.min(
      toolCallIndex >= 0 ? toolCallIndex : Infinity,
      codeBlockIndex >= 0 ? codeBlockIndex : Infinity
    );

    if (cutoffIndex === Infinity) {
      return response;
    }

    return response.slice(0, cutoffIndex).trim();
  }

  /**
   * Estimate token count (rough approximation)
   * MediaPipe doesn't expose tokenizer, so we estimate ~4 chars per token
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}


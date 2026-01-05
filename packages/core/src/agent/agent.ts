import type { Message } from '../llm/types';
import type { MemoryStore } from '../memory/types';
import type {
  Agent as IAgent,
  AgentConfig,
  AgentGenerateOptions,
  AgentResult,
  AgentStreamChunk,
} from './types';
import { AgentOrchestrator } from './orchestrator';
import { IndexedDBMemoryStore } from '../memory/indexeddb-store';

/**
 * Agent implementation
 */
export class Agent implements IAgent {
  id: string;
  name: string;
  instructions: string;
  model: AgentConfig['model'];
  tools: Record<string, any>;
  memory?: MemoryStore;
  eventBus?: AgentConfig['eventBus'];
  
  private orchestrator: AgentOrchestrator;
  private defaultOptions: AgentConfig['defaultOptions'];
  
  constructor(config: AgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.instructions = config.instructions;
    this.model = config.model;
    this.tools = config.tools || {};
    this.defaultOptions = config.defaultOptions;
    this.eventBus = config.eventBus;
    
    // Initialize memory
    if (config.memory === true) {
      this.memory = new IndexedDBMemoryStore({
        dbName: `web-agent-${config.id}`,
      });
    } else if (typeof config.memory === 'object') {
      this.memory = config.memory;
    }
    
    // Initialize orchestrator
    const maxSteps = config.defaultOptions?.maxSteps || 10;
    this.orchestrator = new AgentOrchestrator(maxSteps);
  }
  
  /**
   * Generate a response
   */
  async generate(
    prompt: string | Message[],
    options?: AgentGenerateOptions
  ): Promise<AgentResult> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Emit generation:start event
    this.eventBus?.emit({
      type: 'generation:start',
      timestamp: Date.now(),
      payload: {
        requestId,
        agentId: this.id,
        prompt: typeof prompt === 'string' ? prompt : prompt.map(m => m.content).join('\n'),
      },
    });
    
    try {
      // Ensure model is initialized
      if (!this.model.isReady()) {
        await this.model.initialize();
      }
      
      // Build messages
      const messages = await this.buildMessages(prompt, options);
      
      // Generate with tool calling
      const result = await this.orchestrator.execute(
        messages,
        this.tools,
        async (msgs) => {
          const toolDefs = Object.values(this.tools).map((tool) => tool.toJSONSchema());
          
          return this.model.generate({
            messages: msgs,
            tools: toolDefs.length > 0 ? toolDefs : undefined,
            maxTokens: options?.maxTokens || this.defaultOptions?.maxTokens,
            temperature: options?.temperature || this.defaultOptions?.temperature,
          });
        },
        // Tool call callback for event emission
        (toolName, args, result) => {
          this.eventBus?.emit({
            type: 'tool:call',
            timestamp: Date.now(),
            payload: {
              requestId,
              tool: toolName,
              args,
            },
          });
          
          this.eventBus?.emit({
            type: 'tool:result',
            timestamp: Date.now(),
            payload: {
              requestId,
              tool: toolName,
              result,
            },
          });
        }
      );
      
      // Save to memory
      if (this.memory && options?.memory) {
        await this.saveToMemory(messages, result, options.memory);
      }
      
      // Emit generation:end event
      this.eventBus?.emit({
        type: 'generation:end',
        timestamp: Date.now(),
        payload: {
          requestId,
          agentId: this.id,
          text: result.text,
          steps: result.steps,
          finishReason: result.finishReason,
        },
      });
      
      return result;
    } catch (error) {
      // Emit error event
      this.eventBus?.emit({
        type: 'error',
        timestamp: Date.now(),
        payload: {
          requestId,
          agentId: this.id,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'ERR_GENERATION',
        },
      });
      
      throw error;
    }
  }
  
  /**
   * Stream a response
   */
  async *stream(
    prompt: string | Message[],
    options?: AgentGenerateOptions
  ): AsyncGenerator<AgentStreamChunk> {
    // Ensure model is initialized
    if (!this.model.isReady()) {
      await this.model.initialize();
    }
    
    // Build messages
    const messages = await this.buildMessages(prompt, options);
    
    // For now, use generate and yield the result
    // TODO: Implement true streaming with tool calling
    const result = await this.generate(prompt, options);
    
    // Yield text chunks
    const words = result.text.split(' ');
    for (const word of words) {
      yield {
        type: 'text',
        text: word + ' ',
      };
    }
    
    // Yield done
    yield {
      type: 'done',
      done: result,
    };
  }
  
  /**
   * Build messages array from prompt
   */
  private async buildMessages(
    prompt: string | Message[],
    options?: AgentGenerateOptions
  ): Promise<Message[]> {
    const messages: Message[] = [
      { role: 'system', content: this.instructions },
    ];
    
    // Load from memory if available
    if (this.memory && options?.memory) {
      const history = await this.memory.getMessages(options.memory, 50);
      messages.push(...history);
    }
    
    // Add user prompt
    if (typeof prompt === 'string') {
      messages.push({ role: 'user', content: prompt });
    } else {
      messages.push(...prompt);
    }
    
    return messages;
  }
  
  /**
   * Save conversation to memory
   */
  private async saveToMemory(
    messages: Message[],
    result: AgentResult,
    context: AgentGenerateOptions['memory']
  ): Promise<void> {
    if (!this.memory || !context) return;
    
    // Save user message
    const userMessage = messages[messages.length - 1];
    if (userMessage.role === 'user') {
      await this.memory.saveMessage(userMessage, context);
    }
    
    // Save assistant response
    await this.memory.saveMessage(
      {
        role: 'assistant',
        content: result.text,
      },
      context
    );
  }
}


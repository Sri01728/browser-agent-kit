import type { Message, ToolCall, GenerateResult } from '../llm/types';
import type { Tool } from '../tool/types';
import type { AgentResult } from './types';

/**
 * Orchestrates agent execution with tool calling
 */
export class AgentOrchestrator {
  private maxSteps: number;
  
  constructor(maxSteps = 10) {
    this.maxSteps = maxSteps;
  }
  
  /**
   * Execute agent with tool calling loop
   */
  async execute(
    messages: Message[],
    tools: Record<string, Tool>,
    generateFn: (messages: Message[]) => Promise<GenerateResult>
  ): Promise<AgentResult> {
    let currentMessages = [...messages];
    let totalUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    const toolCallHistory: AgentResult['toolCalls'] = [];
    
    for (let step = 0; step < this.maxSteps; step++) {
      // Generate response
      const result = await generateFn(currentMessages);
      
      // Accumulate usage
      totalUsage.promptTokens += result.usage.promptTokens;
      totalUsage.completionTokens += result.usage.completionTokens;
      totalUsage.totalTokens += result.usage.totalTokens;
      
      // No tool calls? We're done
      if (!result.toolCalls || result.toolCalls.length === 0) {
        return {
          text: result.text,
          steps: step + 1,
          finishReason: result.finishReason,
          usage: totalUsage,
          toolCalls: toolCallHistory.length > 0 ? toolCallHistory : undefined,
        };
      }
      
      // Execute tool calls
      const toolResults = await this.executeToolCalls(result.toolCalls, tools);
      
      // Track tool calls
      for (let i = 0; i < result.toolCalls.length; i++) {
        const call = result.toolCalls[i];
        const toolResult = toolResults[i];
        
        if (toolResult.success) {
          toolCallHistory.push({
            tool: call.name,
            input: call.arguments,
            output: toolResult.data,
          });
        }
      }
      
      // Add assistant message with tool calls
      currentMessages.push({
        role: 'assistant',
        content: result.text || '',
        toolCalls: result.toolCalls,
      });
      
      // Add tool results
      for (const toolResult of toolResults) {
        currentMessages.push({
          role: 'tool',
          content: toolResult.success
            ? JSON.stringify(toolResult.data)
            : JSON.stringify({ error: toolResult.error?.message }),
          toolCallId: toolResult.id,
        });
      }
    }
    
    // Max steps reached
    return {
      text: 'Maximum steps reached',
      steps: this.maxSteps,
      finishReason: 'max_steps',
      usage: totalUsage,
      toolCalls: toolCallHistory.length > 0 ? toolCallHistory : undefined,
    };
  }
  
  /**
   * Execute multiple tool calls in parallel
   */
  private async executeToolCalls(
    toolCalls: ToolCall[],
    tools: Record<string, Tool>
  ): Promise<Array<{ id: string; success: boolean; data?: unknown; error?: { message: string } }>> {
    return Promise.all(
      toolCalls.map(async (call) => {
        const tool = tools[call.name];
        
        if (!tool) {
          return {
            id: call.id,
            success: false,
            error: { message: `Tool "${call.name}" not found` },
          };
        }
        
        try {
          const result = await tool.execute(call.arguments);
          return {
            id: call.id,
            success: true,
            data: result,
          };
        } catch (error) {
          return {
            id: call.id,
            success: false,
            error: {
              message: error instanceof Error ? error.message : String(error),
            },
          };
        }
      })
    );
  }
}


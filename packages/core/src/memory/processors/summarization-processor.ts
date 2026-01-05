/**
 * Summarization Processor
 * 
 * Condenses long conversations by summarizing older messages.
 */

import type { Message } from '../../llm/types';
import type { MemoryProcessor, SummarizationOptions } from '../enhanced-types';

export class SummarizationProcessor implements MemoryProcessor {
  name = 'summarization';
  priority = 10;

  private options: Required<SummarizationOptions>;

  constructor(options: SummarizationOptions) {
    this.options = {
      maxMessages: options.maxMessages,
      summarizeAfter: options.summarizeAfter,
      keepRecent: options.keepRecent || 10,
    };
  }

  async process(
    messages: Message[],
    metadata: Record<string, unknown>
  ): Promise<{
    messages: Message[];
    metadata: Record<string, unknown>;
  }> {
    // Only summarize if we exceed the threshold
    if (messages.length <= this.options.summarizeAfter) {
      return { messages, metadata };
    }

    // Calculate how many messages to summarize
    const toSummarize = messages.length - this.options.keepRecent;
    if (toSummarize <= 0) {
      return { messages, metadata };
    }

    // Split messages
    const messagesToSummarize = messages.slice(0, toSummarize);
    const recentMessages = messages.slice(toSummarize);

    // Create summary
    const summary = this.createSummary(messagesToSummarize);

    // Create summary message
    const summaryMessage: Message = {
      role: 'system',
      content: `[Summary of ${messagesToSummarize.length} previous messages]\n\n${summary}`,
    };

    // Update metadata
    const newMetadata = {
      ...metadata,
      summarizedMessages: (metadata.summarizedMessages as number || 0) + messagesToSummarize.length,
      lastSummarizedAt: new Date().toISOString(),
    };

    return {
      messages: [summaryMessage, ...recentMessages],
      metadata: newMetadata,
    };
  }

  /**
   * Create a summary from messages
   */
  private createSummary(messages: Message[]): string {
    // Simple summarization: extract key points
    const userMessages = messages.filter((m) => m.role === 'user');
    const assistantMessages = messages.filter((m) => m.role === 'assistant');

    const summary: string[] = [];

    // Summarize user queries
    if (userMessages.length > 0) {
      const topics = this.extractTopics(userMessages);
      summary.push(`User discussed: ${topics.join(', ')}`);
    }

    // Summarize assistant responses
    if (assistantMessages.length > 0) {
      summary.push(`Assistant provided ${assistantMessages.length} responses`);
    }

    // Add message count
    summary.push(`Total messages: ${messages.length}`);

    return summary.join('. ');
  }

  /**
   * Extract topics from messages (simple keyword extraction)
   */
  private extractTopics(messages: Message[]): string[] {
    const topics = new Set<string>();
    
    for (const message of messages) {
      const content = typeof message.content === 'string' ? message.content : '';
      
      // Extract potential topics (simple approach: nouns and key phrases)
      // In a real implementation, you'd use NLP or LLM for better extraction
      const words = content.toLowerCase().split(/\s+/);
      
      // Look for capitalized words (potential proper nouns)
      const capitalizedWords = content.match(/\b[A-Z][a-z]+\b/g) || [];
      capitalizedWords.forEach((word) => topics.add(word));
      
      // Look for common question words to extract intent
      if (words.includes('what') || words.includes('how') || words.includes('why')) {
        // Extract the main subject
        const subject = words.slice(1, 4).join(' ');
        if (subject) {
          topics.add(subject);
        }
      }
    }

    return Array.from(topics).slice(0, 5); // Limit to 5 topics
  }
}


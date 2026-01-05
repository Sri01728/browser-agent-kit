/**
 * Filtering Processor
 * 
 * Filters messages based on various criteria.
 */

import type { Message } from '../../llm/types';
import type { MemoryProcessor, FilteringOptions } from '../enhanced-types';

export class FilteringProcessor implements MemoryProcessor {
  name = 'filtering';
  priority = 5; // Run before summarization

  private options: FilteringOptions;

  constructor(options: FilteringOptions = {}) {
    this.options = options;
  }

  async process(
    messages: Message[],
    metadata: Record<string, unknown>
  ): Promise<{
    messages: Message[];
    metadata: Record<string, unknown>;
  }> {
    let filtered = [...messages];
    let removedCount = 0;

    // Remove system messages if configured
    if (this.options.removeSystemMessages) {
      const before = filtered.length;
      filtered = filtered.filter((m) => m.role !== 'system');
      removedCount += before - filtered.length;
    }

    // Remove empty messages if configured
    if (this.options.removeEmptyMessages) {
      const before = filtered.length;
      filtered = filtered.filter((m) => {
        const content = typeof m.content === 'string' ? m.content : '';
        return content.trim().length > 0;
      });
      removedCount += before - filtered.length;
    }

    // Remove messages by role if configured
    if (this.options.removeRoles && this.options.removeRoles.length > 0) {
      const before = filtered.length;
      filtered = filtered.filter((m) => !this.options.removeRoles!.includes(m.role));
      removedCount += before - filtered.length;
    }

    // Apply custom filter if provided
    if (this.options.customFilter) {
      const before = filtered.length;
      filtered = filtered.filter(this.options.customFilter);
      removedCount += before - filtered.length;
    }

    // Update metadata
    const newMetadata = {
      ...metadata,
      filteredMessages: (metadata.filteredMessages as number || 0) + removedCount,
      lastFilteredAt: new Date().toISOString(),
    };

    return {
      messages: filtered,
      metadata: newMetadata,
    };
  }
}


/**
 * Memory Manager
 * 
 * Manages multi-resource memories with processor support.
 */

import type {
  Memory,
  MemoryResource,
  MemoryProcessor,
  MemoryManagerConfig,
  MemorySearchQuery,
  MemorySearchResult,
  EnhancedMemoryStore,
} from './enhanced-types';
import type { Message } from '../llm/types';

export class MemoryManager {
  private store: EnhancedMemoryStore;
  private processors: MemoryProcessor[] = [];
  private defaultTTL?: number;
  private cleanupInterval?: number;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: MemoryManagerConfig) {
    this.store = config.store;
    this.processors = config.processors || [];
    this.defaultTTL = config.defaultTTL;
    this.cleanupInterval = config.cleanupInterval;

    // Sort processors by priority
    this.processors.sort((a, b) => a.priority - b.priority);

    // Start auto-cleanup if configured
    if (this.cleanupInterval) {
      this.startAutoCleanup();
    }
  }

  /**
   * Get memory for a resource
   */
  async get(resource: MemoryResource): Promise<Memory | null> {
    return this.store.get(resource);
  }

  /**
   * Add a message to memory
   */
  async addMessage(
    resource: MemoryResource,
    message: Message,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // Get existing memory or create new
    let memory = await this.store.get(resource);

    if (!memory) {
      memory = {
        id: this.generateId(resource),
        resource,
        messages: [],
        metadata: metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set expiration if TTL is configured
      if (this.defaultTTL) {
        memory.expiresAt = new Date(Date.now() + this.defaultTTL);
      }
    }

    // Add message
    memory.messages.push(message);
    memory.updatedAt = new Date();

    // Merge metadata
    if (metadata) {
      memory.metadata = { ...memory.metadata, ...metadata };
    }

    // Process memory
    const processed = await this.processMemory(memory);

    // Save to store
    await this.store.set(resource, processed);
  }

  /**
   * Get messages for a resource
   */
  async getMessages(
    resource: MemoryResource,
    limit?: number
  ): Promise<Message[]> {
    const memory = await this.store.get(resource);
    if (!memory) {
      return [];
    }

    const messages = memory.messages;
    if (limit && limit > 0) {
      return messages.slice(-limit);
    }

    return messages;
  }

  /**
   * Clear memory for a resource
   */
  async clear(resource: MemoryResource): Promise<void> {
    await this.store.delete(resource);
  }

  /**
   * List memories by resource type
   */
  async list(resourceType: string): Promise<Memory[]> {
    return this.store.list(resourceType);
  }

  /**
   * Search memories
   */
  async search(query: MemorySearchQuery): Promise<MemorySearchResult[]> {
    return this.store.search(query);
  }

  /**
   * Add a processor
   */
  addProcessor(processor: MemoryProcessor): void {
    this.processors.push(processor);
    // Re-sort by priority
    this.processors.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove a processor
   */
  removeProcessor(name: string): void {
    this.processors = this.processors.filter((p) => p.name !== name);
  }

  /**
   * Clean up expired memories
   */
  async cleanup(): Promise<number> {
    return this.store.cleanup();
  }

  /**
   * Close the memory manager
   */
  async close(): Promise<void> {
    // Stop auto-cleanup
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Close store
    if (this.store.close) {
      await this.store.close();
    }
  }

  /**
   * Process memory through all processors
   */
  private async processMemory(memory: Memory): Promise<Memory> {
    let messages = [...memory.messages];
    let metadata = { ...memory.metadata };

    // Run through all processors
    for (const processor of this.processors) {
      try {
        const result = await processor.process(messages, metadata);
        messages = result.messages;
        metadata = result.metadata;
      } catch (error) {
        console.error(`Processor ${processor.name} failed:`, error);
        // Continue with other processors
      }
    }

    return {
      ...memory,
      messages,
      metadata,
    };
  }

  /**
   * Generate a unique ID for a memory
   */
  private generateId(resource: MemoryResource): string {
    return `${resource.type}:${resource.id}:${Date.now()}`;
  }

  /**
   * Start auto-cleanup timer
   */
  private startAutoCleanup(): void {
    if (!this.cleanupInterval) {
      return;
    }

    this.cleanupTimer = setInterval(async () => {
      try {
        const deleted = await this.cleanup();
        if (deleted > 0) {
          console.log(`Auto-cleanup: Removed ${deleted} expired memories`);
        }
      } catch (error) {
        console.error('Auto-cleanup failed:', error);
      }
    }, this.cleanupInterval);
  }
}


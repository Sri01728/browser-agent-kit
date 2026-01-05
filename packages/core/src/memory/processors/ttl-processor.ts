/**
 * TTL (Time To Live) Processor
 * 
 * Manages memory expiration based on TTL settings.
 */

import type { Message } from '../../llm/types';
import type { MemoryProcessor, TTLProcessorOptions } from '../enhanced-types';

export class TTLProcessor implements MemoryProcessor {
  name = 'ttl';
  priority = 20; // Run last

  private options: TTLProcessorOptions;

  constructor(options: TTLProcessorOptions) {
    this.options = options;
  }

  async process(
    messages: Message[],
    metadata: Record<string, unknown>
  ): Promise<{
    messages: Message[];
    metadata: Record<string, unknown>;
  }> {
    // Get TTL for this resource type
    const resourceType = metadata.resourceType as string;
    const ttl = this.getTTL(resourceType);

    // Calculate expiration time
    const now = Date.now();
    const expiresAt = now + ttl;

    // Update metadata with TTL info
    const newMetadata = {
      ...metadata,
      ttl,
      expiresAt: new Date(expiresAt).toISOString(),
      ttlUpdatedAt: new Date().toISOString(),
    };

    return {
      messages,
      metadata: newMetadata,
    };
  }

  /**
   * Get TTL for a resource type
   */
  private getTTL(resourceType: string): number {
    if (this.options.ttlByResourceType && resourceType in this.options.ttlByResourceType) {
      return this.options.ttlByResourceType[resourceType];
    }
    return this.options.defaultTTL;
  }
}


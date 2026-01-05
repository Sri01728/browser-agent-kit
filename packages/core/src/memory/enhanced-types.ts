/**
 * Enhanced Memory System Types
 * 
 * Extends the basic memory system with multi-resource support,
 * processors, and search capabilities.
 */

import type { Message } from '../llm/types';

/**
 * Memory resource identifier
 */
export interface MemoryResource {
  /** Resource type (user, session, context, etc.) */
  type: string;
  
  /** Resource identifier */
  id: string;
}

/**
 * Memory entry with metadata
 */
export interface Memory {
  /** Unique memory identifier */
  id: string;
  
  /** Resource this memory belongs to */
  resource: MemoryResource;
  
  /** Conversation messages */
  messages: Message[];
  
  /** Custom metadata */
  metadata: Record<string, unknown>;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Optional expiration timestamp */
  expiresAt?: Date;
}

/**
 * Memory processor interface
 */
export interface MemoryProcessor {
  /** Processor name */
  name: string;
  
  /** Processing priority (lower runs first) */
  priority: number;
  
  /**
   * Process messages and metadata
   * @param messages - Messages to process
   * @param metadata - Metadata to process
   * @returns Processed messages and metadata
   */
  process(
    messages: Message[],
    metadata: Record<string, unknown>
  ): Promise<{
    messages: Message[];
    metadata: Record<string, unknown>;
  }>;
}

/**
 * Memory search query
 */
export interface MemorySearchQuery {
  /** Text query to search in message content */
  query?: string;
  
  /** Metadata filters */
  metadata?: Record<string, unknown>;
  
  /** Date range filter */
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  /** Resource type filter */
  resourceType?: string;
  
  /** Maximum number of results */
  limit?: number;
  
  /** Offset for pagination */
  offset?: number;
}

/**
 * Memory search result
 */
export interface MemorySearchResult {
  /** Matching memory */
  memory: Memory;
  
  /** Relevance score (0-1) */
  score: number;
  
  /** Matching message indices */
  matchingMessages?: number[];
}

/**
 * Enhanced memory store interface
 */
export interface EnhancedMemoryStore {
  /**
   * Get memory for a resource
   * @param resource - Resource identifier
   * @returns Memory or null if not found
   */
  get(resource: MemoryResource): Promise<Memory | null>;
  
  /**
   * Set memory for a resource
   * @param resource - Resource identifier
   * @param memory - Memory to store
   */
  set(resource: MemoryResource, memory: Memory): Promise<void>;
  
  /**
   * Delete memory for a resource
   * @param resource - Resource identifier
   */
  delete(resource: MemoryResource): Promise<void>;
  
  /**
   * List all memories for a resource type
   * @param resourceType - Resource type to filter by
   * @returns Array of memories
   */
  list(resourceType: string): Promise<Memory[]>;
  
  /**
   * Search memories
   * @param query - Search query
   * @returns Array of search results
   */
  search(query: MemorySearchQuery): Promise<MemorySearchResult[]>;
  
  /**
   * Clean up expired memories
   * @returns Number of memories deleted
   */
  cleanup(): Promise<number>;
  
  /**
   * Close the store
   */
  close?(): Promise<void>;
}

/**
 * Memory manager configuration
 */
export interface MemoryManagerConfig {
  /** Memory store implementation */
  store: EnhancedMemoryStore;
  
  /** Memory processors */
  processors?: MemoryProcessor[];
  
  /** Default TTL for memories (in milliseconds) */
  defaultTTL?: number;
  
  /** Auto-cleanup interval (in milliseconds) */
  cleanupInterval?: number;
}

/**
 * Summarization processor options
 */
export interface SummarizationOptions {
  /** Maximum messages before summarization */
  maxMessages: number;
  
  /** Number of messages to summarize */
  summarizeAfter: number;
  
  /** Number of recent messages to keep */
  keepRecent?: number;
}

/**
 * Filtering processor options
 */
export interface FilteringOptions {
  /** Remove system messages */
  removeSystemMessages?: boolean;
  
  /** Remove empty messages */
  removeEmptyMessages?: boolean;
  
  /** Remove messages by role */
  removeRoles?: Array<'user' | 'assistant' | 'system' | 'tool'>;
  
  /** Custom filter function */
  customFilter?: (message: Message) => boolean;
}

/**
 * Metadata extractor options
 */
export interface MetadataExtractorOptions {
  /** Extract topics from messages */
  extractTopics?: boolean;
  
  /** Extract entities from messages */
  extractEntities?: boolean;
  
  /** Extract sentiment from messages */
  extractSentiment?: boolean;
  
  /** Custom extractors */
  customExtractors?: Array<{
    name: string;
    extract: (messages: Message[]) => Record<string, unknown>;
  }>;
}

/**
 * TTL processor options
 */
export interface TTLProcessorOptions {
  /** Default TTL in milliseconds */
  defaultTTL: number;
  
  /** TTL per resource type */
  ttlByResourceType?: Record<string, number>;
}


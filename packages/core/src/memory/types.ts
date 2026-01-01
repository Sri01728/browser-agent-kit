import type { Message } from '../llm/types';

/**
 * Memory context for conversation threads
 */
export interface MemoryContext {
  /** User or entity identifier */
  resource: string;
  
  /** Conversation thread identifier */
  thread: string;
}

/**
 * Memory store interface
 */
export interface MemoryStore {
  /** Save a message to memory */
  saveMessage(message: Message, context: MemoryContext): Promise<void>;
  
  /** Retrieve messages from memory */
  getMessages(context: MemoryContext, limit?: number): Promise<Message[]>;
  
  /** Clear messages from memory */
  clearMessages(context: MemoryContext): Promise<void>;
  
  /** Close/cleanup the store */
  close?(): Promise<void>;
}

/**
 * Stored message with metadata
 */
export interface StoredMessage extends Message {
  id?: string;
  resource: string;
  thread: string;
  timestamp: number;
}


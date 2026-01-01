import type { Message } from '../llm/types';
import type { MemoryStore, MemoryContext, StoredMessage } from './types';

/**
 * IndexedDB-backed memory store for conversation history
 */
export class IndexedDBMemoryStore implements MemoryStore {
  private dbName: string;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  
  constructor(config: { dbName: string }) {
    this.dbName = config.dbName;
  }
  
  /**
   * Initialize the IndexedDB database
   */
  private async initialize(): Promise<void> {
    if (this.db) return;
    
    if (!this.initPromise) {
      this.initPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Create messages store
          if (!db.objectStoreNames.contains('messages')) {
            const store = db.createObjectStore('messages', {
              keyPath: 'id',
              autoIncrement: true,
            });
            
            // Create indexes
            store.createIndex('by_thread', ['resource', 'thread'], { unique: false });
            store.createIndex('by_timestamp', 'timestamp', { unique: false });
          }
        };
      });
    }
    
    return this.initPromise;
  }
  
  /**
   * Save a message to memory
   */
  async saveMessage(message: Message, context: MemoryContext): Promise<void> {
    await this.initialize();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const storedMessage: Omit<StoredMessage, 'id'> = {
      ...message,
      resource: context.resource,
      thread: context.thread,
      timestamp: Date.now(),
    };
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('messages', 'readwrite');
      const store = tx.objectStore('messages');
      const request = store.add(storedMessage);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Retrieve messages from memory
   */
  async getMessages(context: MemoryContext, limit = 50): Promise<Message[]> {
    await this.initialize();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('messages', 'readonly');
      const store = tx.objectStore('messages');
      const index = store.index('by_thread');
      
      const range = IDBKeyRange.only([context.resource, context.thread]);
      const request = index.openCursor(range, 'prev'); // Newest first
      
      const messages: Message[] = [];
      let count = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor && count < limit) {
          const stored = cursor.value as StoredMessage;
          messages.unshift({
            role: stored.role,
            content: stored.content,
            name: stored.name,
            toolCalls: stored.toolCalls,
            toolCallId: stored.toolCallId,
          });
          count++;
          cursor.continue();
        } else {
          resolve(messages);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Clear messages from memory
   */
  async clearMessages(context: MemoryContext): Promise<void> {
    await this.initialize();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('messages', 'readwrite');
      const store = tx.objectStore('messages');
      const index = store.index('by_thread');
      
      const range = IDBKeyRange.only([context.resource, context.thread]);
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Close the database
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}


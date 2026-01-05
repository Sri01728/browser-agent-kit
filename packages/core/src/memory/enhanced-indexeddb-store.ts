/**
 * Enhanced IndexedDB Store
 * 
 * IndexedDB implementation of EnhancedMemoryStore with
 * multi-resource support and search capabilities.
 */

import type {
  Memory,
  MemoryResource,
  MemorySearchQuery,
  MemorySearchResult,
  EnhancedMemoryStore,
} from './enhanced-types';

export class EnhancedIndexedDBStore implements EnhancedMemoryStore {
  private dbName: string;
  private storeName = 'memories';
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(dbName = 'web-agent-memory-enhanced') {
    this.dbName = dbName;
  }

  /**
   * Initialize the database
   */
  private async init(): Promise<void> {
    if (this.db) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store
        const store = db.createObjectStore(this.storeName, { keyPath: 'id' });

        // Create indexes
        store.createIndex('resourceType', 'resource.type', { unique: false });
        store.createIndex('resourceId', 'resource.id', { unique: false });
        store.createIndex('resourceKey', ['resource.type', 'resource.id'], { unique: true });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      };
    });

    return this.initPromise;
  }

  /**
   * Get memory for a resource
   */
  async get(resource: MemoryResource): Promise<Memory | null> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('resourceKey');
      const request = index.get([resource.type, resource.id]);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Convert date strings back to Date objects
          result.createdAt = new Date(result.createdAt);
          result.updatedAt = new Date(result.updatedAt);
          if (result.expiresAt) {
            result.expiresAt = new Date(result.expiresAt);
          }
        }
        resolve(result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get memory'));
      };
    });
  }

  /**
   * Set memory for a resource
   */
  async set(resource: MemoryResource, memory: Memory): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // Ensure dates are stored as ISO strings for IndexedDB
      const toStore = {
        ...memory,
        createdAt: memory.createdAt.toISOString(),
        updatedAt: memory.updatedAt.toISOString(),
        expiresAt: memory.expiresAt?.toISOString(),
      };

      const request = store.put(toStore);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to set memory'));
      };
    });
  }

  /**
   * Delete memory for a resource
   */
  async delete(resource: MemoryResource): Promise<void> {
    await this.init();

    // First get the memory to find its ID
    const memory = await this.get(resource);
    if (!memory) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(memory.id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete memory'));
      };
    });
  }

  /**
   * List all memories for a resource type
   */
  async list(resourceType: string): Promise<Memory[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('resourceType');
      const request = index.getAll(resourceType);

      request.onsuccess = () => {
        const results = request.result.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
          expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
        }));
        resolve(results);
      };

      request.onerror = () => {
        reject(new Error('Failed to list memories'));
      };
    });
  }

  /**
   * Search memories
   */
  async search(query: MemorySearchQuery): Promise<MemorySearchResult[]> {
    await this.init();

    // Get all memories (or filtered by resource type)
    let memories: Memory[];
    if (query.resourceType) {
      memories = await this.list(query.resourceType);
    } else {
      memories = await this.getAllMemories();
    }

    // Apply filters
    let filtered = memories;

    // Date range filter
    if (query.dateRange) {
      filtered = filtered.filter((m) => {
        const created = m.createdAt.getTime();
        const start = query.dateRange!.start.getTime();
        const end = query.dateRange!.end.getTime();
        return created >= start && created <= end;
      });
    }

    // Metadata filter
    if (query.metadata) {
      filtered = filtered.filter((m) => {
        return this.matchesMetadata(m.metadata, query.metadata!);
      });
    }

    // Text search
    let results: MemorySearchResult[];
    if (query.query) {
      results = this.searchByText(filtered, query.query);
    } else {
      results = filtered.map((memory) => ({
        memory,
        score: 1.0,
      }));
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // Apply limit and offset
    const offset = query.offset || 0;
    const limit = query.limit || results.length;
    results = results.slice(offset, offset + limit);

    return results;
  }

  /**
   * Clean up expired memories
   */
  async cleanup(): Promise<number> {
    await this.init();

    const now = new Date();
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('expiresAt');
      
      // Get all memories with expiration dates
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const memory = cursor.value;
          if (memory.expiresAt) {
            const expiresAt = new Date(memory.expiresAt);
            if (expiresAt < now) {
              cursor.delete();
              deletedCount++;
            }
          }
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to cleanup memories'));
      };
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

  /**
   * Get all memories
   */
  private async getAllMemories(): Promise<Memory[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
          expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
        }));
        resolve(results);
      };

      request.onerror = () => {
        reject(new Error('Failed to get all memories'));
      };
    });
  }

  /**
   * Check if metadata matches query
   */
  private matchesMetadata(
    metadata: Record<string, unknown>,
    query: Record<string, unknown>
  ): boolean {
    for (const [key, value] of Object.entries(query)) {
      if (metadata[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Search memories by text
   */
  private searchByText(memories: Memory[], query: string): MemorySearchResult[] {
    const queryLower = query.toLowerCase();
    const results: MemorySearchResult[] = [];

    for (const memory of memories) {
      let score = 0;
      const matchingMessages: number[] = [];

      // Search in messages
      for (let i = 0; i < memory.messages.length; i++) {
        const message = memory.messages[i];
        const content = typeof message.content === 'string' ? message.content.toLowerCase() : '';

        if (content.includes(queryLower)) {
          score += 1;
          matchingMessages.push(i);
        }
      }

      // Search in metadata
      const metadataStr = JSON.stringify(memory.metadata).toLowerCase();
      if (metadataStr.includes(queryLower)) {
        score += 0.5;
      }

      if (score > 0) {
        // Normalize score
        const normalizedScore = Math.min(score / memory.messages.length, 1.0);
        results.push({
          memory,
          score: normalizedScore,
          matchingMessages: matchingMessages.length > 0 ? matchingMessages : undefined,
        });
      }
    }

    return results;
  }
}


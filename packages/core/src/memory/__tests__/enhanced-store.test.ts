/**
 * Tests for EnhancedIndexedDBStore
 * 
 * Note: These tests use a mock IndexedDB implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedIndexedDBStore } from '../enhanced-indexeddb-store';
import type { Memory, MemoryResource } from '../enhanced-types';

// Mock IndexedDB for testing
// In a real test environment, you'd use fake-indexeddb or similar
describe('EnhancedIndexedDBStore', () => {
  let store: EnhancedIndexedDBStore;

  beforeEach(async () => {
    store = new EnhancedIndexedDBStore('test-db');
  });

  afterEach(async () => {
    await store.close();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve memory', async () => {
      const resource: MemoryResource = { type: 'user', id: 'user-123' };
      const memory: Memory = {
        id: 'mem-1',
        resource,
        messages: [{ role: 'user', content: 'Hello' }],
        metadata: { topic: 'greeting' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await store.set(resource, memory);
      const retrieved = await store.get(resource);

      expect(retrieved).toBeTruthy();
      expect(retrieved?.id).toBe(memory.id);
      expect(retrieved?.messages).toEqual(memory.messages);
    });

    it('should return null for non-existent memory', async () => {
      const resource: MemoryResource = { type: 'user', id: 'non-existent' };
      const result = await store.get(resource);
      expect(result).toBeNull();
    });

    it('should update existing memory', async () => {
      const resource: MemoryResource = { type: 'user', id: 'user-123' };
      const memory1: Memory = {
        id: 'mem-1',
        resource,
        messages: [{ role: 'user', content: 'First' }],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await store.set(resource, memory1);

      const memory2: Memory = {
        ...memory1,
        messages: [
          { role: 'user', content: 'First' },
          { role: 'assistant', content: 'Second' },
        ],
        updatedAt: new Date(),
      };

      await store.set(resource, memory2);

      const retrieved = await store.get(resource);
      expect(retrieved?.messages).toHaveLength(2);
    });

    it('should delete memory', async () => {
      const resource: MemoryResource = { type: 'user', id: 'user-123' };
      const memory: Memory = {
        id: 'mem-1',
        resource,
        messages: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await store.set(resource, memory);
      await store.delete(resource);

      const retrieved = await store.get(resource);
      expect(retrieved).toBeNull();
    });
  });

  describe('List Operations', () => {
    it('should list memories by resource type', async () => {
      const memories: Memory[] = [
        {
          id: 'mem-1',
          resource: { type: 'user', id: 'user-1' },
          messages: [],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'mem-2',
          resource: { type: 'user', id: 'user-2' },
          messages: [],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'mem-3',
          resource: { type: 'session', id: 'session-1' },
          messages: [],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const memory of memories) {
        await store.set(memory.resource, memory);
      }

      const userMemories = await store.list('user');
      expect(userMemories).toHaveLength(2);
      expect(userMemories.every((m) => m.resource.type === 'user')).toBe(true);
    });
  });

  describe('Search Operations', () => {
    beforeEach(async () => {
      const memories: Memory[] = [
        {
          id: 'mem-1',
          resource: { type: 'user', id: 'user-1' },
          messages: [
            { role: 'user', content: 'I want to book a flight to Paris' },
          ],
          metadata: { topic: 'travel' },
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        {
          id: 'mem-2',
          resource: { type: 'user', id: 'user-2' },
          messages: [
            { role: 'user', content: 'Show me hotels in London' },
          ],
          metadata: { topic: 'travel' },
          createdAt: new Date('2026-01-02'),
          updatedAt: new Date('2026-01-02'),
        },
        {
          id: 'mem-3',
          resource: { type: 'user', id: 'user-3' },
          messages: [
            { role: 'user', content: 'Help me with my order' },
          ],
          metadata: { topic: 'support' },
          createdAt: new Date('2026-01-03'),
          updatedAt: new Date('2026-01-03'),
        },
      ];

      for (const memory of memories) {
        await store.set(memory.resource, memory);
      }
    });

    it('should search by text query', async () => {
      const results = await store.search({ query: 'Paris' });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].memory.messages[0].content).toContain('Paris');
    });

    it('should search by metadata', async () => {
      const results = await store.search({
        metadata: { topic: 'travel' },
      });

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.memory.metadata.topic === 'travel')).toBe(true);
    });

    it('should search by date range', async () => {
      const results = await store.search({
        dateRange: {
          start: new Date('2026-01-01'),
          end: new Date('2026-01-02'),
        },
      });

      expect(results).toHaveLength(2);
    });

    it('should filter by resource type', async () => {
      const results = await store.search({
        resourceType: 'user',
      });

      expect(results.every((r) => r.memory.resource.type === 'user')).toBe(true);
    });

    it('should apply limit', async () => {
      const results = await store.search({
        metadata: { topic: 'travel' },
        limit: 1,
      });

      expect(results).toHaveLength(1);
    });

    it('should apply offset', async () => {
      const all = await store.search({
        metadata: { topic: 'travel' },
      });

      const paginated = await store.search({
        metadata: { topic: 'travel' },
        offset: 1,
        limit: 1,
      });

      expect(paginated).toHaveLength(1);
      expect(paginated[0].memory.id).not.toBe(all[0].memory.id);
    });

    it('should return relevance scores', async () => {
      const results = await store.search({ query: 'Paris' });
      
      expect(results[0].score).toBeDefined();
      expect(results[0].score).toBeGreaterThan(0);
      expect(results[0].score).toBeLessThanOrEqual(1);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup expired memories', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000);
      const future = new Date(now.getTime() + 1000);

      const memories: Memory[] = [
        {
          id: 'mem-1',
          resource: { type: 'user', id: 'user-1' },
          messages: [],
          metadata: {},
          createdAt: past,
          updatedAt: past,
          expiresAt: past, // Already expired
        },
        {
          id: 'mem-2',
          resource: { type: 'user', id: 'user-2' },
          messages: [],
          metadata: {},
          createdAt: now,
          updatedAt: now,
          expiresAt: future, // Not expired
        },
      ];

      for (const memory of memories) {
        await store.set(memory.resource, memory);
      }

      const deleted = await store.cleanup();
      
      expect(deleted).toBeGreaterThan(0);

      const remaining = await store.list('user');
      expect(remaining.length).toBeLessThan(memories.length);
    });
  });
});


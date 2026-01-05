/**
 * Tests for MemoryManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryManager } from '../memory-manager';
import type { EnhancedMemoryStore, Memory, MemoryResource, MemoryProcessor } from '../enhanced-types';
import type { Message } from '../../llm/types';

describe('MemoryManager', () => {
  let mockStore: EnhancedMemoryStore;
  let manager: MemoryManager;

  beforeEach(() => {
    // Create mock store
    mockStore = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue([]),
      search: vi.fn().mockResolvedValue([]),
      cleanup: vi.fn().mockResolvedValue(0),
    };

    manager = new MemoryManager({
      store: mockStore,
    });
  });

  afterEach(async () => {
    await manager.close();
  });

  describe('Basic Operations', () => {
    it('should add message to new memory', async () => {
      const resource: MemoryResource = { type: 'user', id: 'user-123' };
      const message: Message = { role: 'user', content: 'Hello' };

      await manager.addMessage(resource, message);

      expect(mockStore.set).toHaveBeenCalledWith(
        resource,
        expect.objectContaining({
          resource,
          messages: [message],
        })
      );
    });

    it('should add message to existing memory', async () => {
      const resource: MemoryResource = { type: 'user', id: 'user-123' };
      const existingMemory: Memory = {
        id: 'mem-1',
        resource,
        messages: [{ role: 'user', content: 'First' }],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStore.get = vi.fn().mockResolvedValue(existingMemory);

      const newMessage: Message = { role: 'assistant', content: 'Response' };
      await manager.addMessage(resource, newMessage);

      expect(mockStore.set).toHaveBeenCalledWith(
        resource,
        expect.objectContaining({
          messages: expect.arrayContaining([
            { role: 'user', content: 'First' },
            { role: 'assistant', content: 'Response' },
          ]),
        })
      );
    });

    it('should get messages for resource', async () => {
      const resource: MemoryResource = { type: 'user', id: 'user-123' };
      const memory: Memory = {
        id: 'mem-1',
        resource,
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStore.get = vi.fn().mockResolvedValue(memory);

      const messages = await manager.getMessages(resource);
      expect(messages).toEqual(memory.messages);
    });

    it('should return empty array for non-existent resource', async () => {
      const resource: MemoryResource = { type: 'user', id: 'user-999' };
      const messages = await manager.getMessages(resource);
      expect(messages).toEqual([]);
    });

    it('should limit returned messages', async () => {
      const resource: MemoryResource = { type: 'user', id: 'user-123' };
      const memory: Memory = {
        id: 'mem-1',
        resource,
        messages: [
          { role: 'user', content: 'Message 1' },
          { role: 'assistant', content: 'Response 1' },
          { role: 'user', content: 'Message 2' },
          { role: 'assistant', content: 'Response 2' },
        ],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStore.get = vi.fn().mockResolvedValue(memory);

      const messages = await manager.getMessages(resource, 2);
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Message 2');
    });

    it('should clear memory for resource', async () => {
      const resource: MemoryResource = { type: 'user', id: 'user-123' };
      await manager.clear(resource);
      expect(mockStore.delete).toHaveBeenCalledWith(resource);
    });

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
      ];

      mockStore.list = vi.fn().mockResolvedValue(memories);

      const result = await manager.list('user');
      expect(result).toEqual(memories);
      expect(mockStore.list).toHaveBeenCalledWith('user');
    });
  });

  describe('Processors', () => {
    it('should run processors on memory', async () => {
      const processor: MemoryProcessor = {
        name: 'test-processor',
        priority: 10,
        process: vi.fn().mockResolvedValue({
          messages: [{ role: 'system', content: 'Processed' }],
          metadata: { processed: true },
        }),
      };

      manager.addProcessor(processor);

      const resource: MemoryResource = { type: 'user', id: 'user-123' };
      const message: Message = { role: 'user', content: 'Hello' };

      await manager.addMessage(resource, message);

      expect(processor.process).toHaveBeenCalled();
      expect(mockStore.set).toHaveBeenCalledWith(
        resource,
        expect.objectContaining({
          messages: [{ role: 'system', content: 'Processed' }],
          metadata: expect.objectContaining({ processed: true }),
        })
      );
    });

    it('should run processors in priority order', async () => {
      const callOrder: string[] = [];

      const processor1: MemoryProcessor = {
        name: 'processor-1',
        priority: 20,
        process: vi.fn().mockImplementation(async (messages, metadata) => {
          callOrder.push('processor-1');
          return { messages, metadata };
        }),
      };

      const processor2: MemoryProcessor = {
        name: 'processor-2',
        priority: 10,
        process: vi.fn().mockImplementation(async (messages, metadata) => {
          callOrder.push('processor-2');
          return { messages, metadata };
        }),
      };

      manager.addProcessor(processor1);
      manager.addProcessor(processor2);

      const resource: MemoryResource = { type: 'user', id: 'user-123' };
      await manager.addMessage(resource, { role: 'user', content: 'Test' });

      expect(callOrder).toEqual(['processor-2', 'processor-1']);
    });

    it('should handle processor errors gracefully', async () => {
      const failingProcessor: MemoryProcessor = {
        name: 'failing-processor',
        priority: 10,
        process: vi.fn().mockRejectedValue(new Error('Processor failed')),
      };

      const workingProcessor: MemoryProcessor = {
        name: 'working-processor',
        priority: 20,
        process: vi.fn().mockResolvedValue({
          messages: [{ role: 'user', content: 'Test' }],
          metadata: {},
        }),
      };

      manager.addProcessor(failingProcessor);
      manager.addProcessor(workingProcessor);

      const resource: MemoryResource = { type: 'user', id: 'user-123' };
      
      // Should not throw
      await expect(
        manager.addMessage(resource, { role: 'user', content: 'Test' })
      ).resolves.not.toThrow();

      expect(workingProcessor.process).toHaveBeenCalled();
    });

    it('should remove processor by name', () => {
      const processor: MemoryProcessor = {
        name: 'test-processor',
        priority: 10,
        process: vi.fn().mockResolvedValue({ messages: [], metadata: {} }),
      };

      manager.addProcessor(processor);
      manager.removeProcessor('test-processor');

      // Processor should not be called after removal
      const resource: MemoryResource = { type: 'user', id: 'user-123' };
      manager.addMessage(resource, { role: 'user', content: 'Test' });

      expect(processor.process).not.toHaveBeenCalled();
    });
  });

  describe('Search', () => {
    it('should search memories', async () => {
      const searchResults = [
        {
          memory: {
            id: 'mem-1',
            resource: { type: 'user', id: 'user-1' },
            messages: [{ role: 'user', content: 'Hello' }],
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          score: 0.9,
        },
      ];

      mockStore.search = vi.fn().mockResolvedValue(searchResults);

      const results = await manager.search({ query: 'Hello' });
      expect(results).toEqual(searchResults);
      expect(mockStore.search).toHaveBeenCalledWith({ query: 'Hello' });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup expired memories', async () => {
      mockStore.cleanup = vi.fn().mockResolvedValue(5);

      const deleted = await manager.cleanup();
      expect(deleted).toBe(5);
      expect(mockStore.cleanup).toHaveBeenCalled();
    });
  });

  describe('Metadata', () => {
    it('should merge metadata when adding messages', async () => {
      const resource: MemoryResource = { type: 'user', id: 'user-123' };
      const existingMemory: Memory = {
        id: 'mem-1',
        resource,
        messages: [],
        metadata: { topic: 'travel' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStore.get = vi.fn().mockResolvedValue(existingMemory);

      await manager.addMessage(
        resource,
        { role: 'user', content: 'Test' },
        { status: 'active' }
      );

      expect(mockStore.set).toHaveBeenCalledWith(
        resource,
        expect.objectContaining({
          metadata: { topic: 'travel', status: 'active' },
        })
      );
    });
  });
});


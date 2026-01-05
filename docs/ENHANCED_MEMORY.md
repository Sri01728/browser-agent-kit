# Enhanced Memory System Guide

**Version**: 1.0  
**Status**: Production Ready  
**Package**: `@web-agent/core/memory`

---

## Overview

The Enhanced Memory System provides multi-resource memory management with automatic processing, search capabilities, and lifecycle management for browser-based AI agents.

### Key Features

- ✅ **Multi-Resource Memory** - Separate memories for users, sessions, contexts
- ✅ **Memory Processors** - Automatic summarization, filtering, metadata extraction
- ✅ **Search** - Full-text search + metadata filtering + date ranges
- ✅ **Auto-Cleanup** - Automatic removal of expired memories
- ✅ **IndexedDB Storage** - Efficient browser-based persistence
- ✅ **Type-Safe** - Full TypeScript support

---

## Quick Start

```typescript
import {
  MemoryManager,
  EnhancedIndexedDBStore,
  SummarizationProcessor,
  FilteringProcessor,
} from '@web-agent/core/memory';

// Create memory manager
const memory = new MemoryManager({
  store: new EnhancedIndexedDBStore(),
  processors: [
    new FilteringProcessor({ removeSystemMessages: true }),
    new SummarizationProcessor({ maxMessages: 50, summarizeAfter: 100 }),
  ],
  defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  cleanupInterval: 60 * 60 * 1000, // 1 hour
});

// Add messages
await memory.addMessage(
  { type: 'user', id: 'user-123' },
  { role: 'user', content: 'Hello!' }
);

// Get messages
const messages = await memory.getMessages({ type: 'user', id: 'user-123' });

// Search memories
const results = await memory.search({ query: 'booking' });
```

---

## Core Concepts

### Memory Resource

A memory resource identifies what the memory belongs to:

```typescript
interface MemoryResource {
  type: string;  // 'user', 'session', 'context', etc.
  id: string;    // Unique identifier
}

// Examples:
{ type: 'user', id: 'user-123' }
{ type: 'session', id: 'session-abc' }
{ type: 'context', id: 'flight-booking' }
```

### Memory Entry

A memory entry contains messages and metadata:

```typescript
interface Memory {
  id: string;
  resource: MemoryResource;
  messages: Message[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}
```

### Memory Processors

Processors automatically transform memories:

```typescript
interface MemoryProcessor {
  name: string;
  priority: number;  // Lower runs first
  process(
    messages: Message[],
    metadata: Record<string, unknown>
  ): Promise<{
    messages: Message[];
    metadata: Record<string, unknown>;
  }>;
}
```

---

## Memory Manager API

### Creating a Manager

```typescript
const memory = new MemoryManager({
  store: new EnhancedIndexedDBStore('my-app-memory'),
  processors: [/* processors */],
  defaultTTL: 7 * 24 * 60 * 60 * 1000,
  cleanupInterval: 60 * 60 * 1000,
});
```

### Adding Messages

```typescript
// Add single message
await memory.addMessage(
  { type: 'user', id: 'user-123' },
  { role: 'user', content: 'Hello!' }
);

// Add with metadata
await memory.addMessage(
  { type: 'user', id: 'user-123' },
  { role: 'user', content: 'Book a flight' },
  { topic: 'travel', intent: 'booking' }
);
```

### Getting Messages

```typescript
// Get all messages
const messages = await memory.getMessages({ type: 'user', id: 'user-123' });

// Get recent messages only
const recent = await memory.getMessages({ type: 'user', id: 'user-123' }, 10);
```

### Clearing Memory

```typescript
await memory.clear({ type: 'user', id: 'user-123' });
```

### Listing Memories

```typescript
// List all user memories
const userMemories = await memory.list('user');

// List all session memories
const sessionMemories = await memory.list('session');
```

### Searching Memories

```typescript
// Search by text
const results = await memory.search({
  query: 'flight to Paris',
  limit: 10,
});

// Search by metadata
const results = await memory.search({
  metadata: { topic: 'travel', status: 'completed' },
});

// Search with date range
const results = await memory.search({
  query: 'booking',
  dateRange: {
    start: new Date('2026-01-01'),
    end: new Date('2026-01-31'),
  },
});

// Combined search
const results = await memory.search({
  query: 'flight',
  metadata: { topic: 'travel' },
  resourceType: 'user',
  dateRange: { start: new Date('2026-01-01'), end: new Date('2026-01-31') },
  limit: 20,
  offset: 0,
});
```

### Managing Processors

```typescript
// Add processor
memory.addProcessor(new SummarizationProcessor({ maxMessages: 50 }));

// Remove processor
memory.removeProcessor('summarization');
```

### Cleanup

```typescript
// Manual cleanup
const deleted = await memory.cleanup();
console.log(`Removed ${deleted} expired memories`);

// Auto-cleanup runs based on cleanupInterval
```

### Closing

```typescript
await memory.close();
```

---

## Built-in Processors

### 1. Summarization Processor

Condenses long conversations by summarizing older messages.

```typescript
import { SummarizationProcessor } from '@web-agent/core/memory';

const processor = new SummarizationProcessor({
  maxMessages: 50,        // Target message count
  summarizeAfter: 100,    // Summarize when exceeding this
  keepRecent: 10,         // Keep recent messages intact
});
```

**How it works:**
- Waits until message count exceeds `summarizeAfter`
- Summarizes older messages (all except `keepRecent`)
- Creates a system message with summary
- Keeps recent messages for context

**Example:**
```
Before (100 messages):
[msg1, msg2, ..., msg100]

After:
[summary of msg1-90, msg91, msg92, ..., msg100]
```

### 2. Filtering Processor

Removes unwanted messages based on criteria.

```typescript
import { FilteringProcessor } from '@web-agent/core/memory';

const processor = new FilteringProcessor({
  removeSystemMessages: true,
  removeEmptyMessages: true,
  removeRoles: ['tool'],
  customFilter: (message) => {
    // Custom logic
    return message.content.length > 5;
  },
});
```

**Options:**
- `removeSystemMessages` - Remove system messages
- `removeEmptyMessages` - Remove empty/whitespace messages
- `removeRoles` - Remove messages by role
- `customFilter` - Custom filter function

### 3. Metadata Extractor Processor

Extracts insights from conversations.

```typescript
import { MetadataExtractorProcessor } from '@web-agent/core/memory';

const processor = new MetadataExtractorProcessor({
  extractTopics: true,
  extractEntities: true,
  extractSentiment: true,
  customExtractors: [
    {
      name: 'messageCount',
      extract: (messages) => ({ count: messages.length }),
    },
  ],
});
```

**Extracts:**
- **Topics** - Key topics from conversation
- **Entities** - People, places, organizations
- **Sentiment** - Overall sentiment (positive/neutral/negative)
- **Custom** - Your own extractors

**Example output:**
```typescript
{
  extracted: {
    topics: ['flight', 'booking', 'Paris'],
    entities: {
      people: ['John Smith'],
      places: ['Paris', 'New York'],
      organizations: ['Air France'],
    },
    sentiment: {
      overall: 'positive',
      score: 0.75,
    },
  },
}
```

### 4. TTL Processor

Manages memory expiration.

```typescript
import { TTLProcessor } from '@web-agent/core/memory';

const processor = new TTLProcessor({
  defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  ttlByResourceType: {
    session: 1 * 24 * 60 * 60 * 1000,  // 1 day for sessions
    user: 30 * 24 * 60 * 60 * 1000,    // 30 days for users
  },
});
```

**How it works:**
- Sets `expiresAt` timestamp on memories
- Different TTL per resource type
- Used by cleanup to remove expired memories

---

## Processor Pipeline

Processors run in priority order (lower priority first):

```typescript
const memory = new MemoryManager({
  store,
  processors: [
    new FilteringProcessor({ ... }),           // Priority: 5
    new SummarizationProcessor({ ... }),       // Priority: 10
    new MetadataExtractorProcessor({ ... }),   // Priority: 15
    new TTLProcessor({ ... }),                 // Priority: 20
  ],
});
```

**Execution order:**
1. **Filtering** (5) - Remove unwanted messages
2. **Summarization** (10) - Condense long conversations
3. **Metadata Extraction** (15) - Extract insights
4. **TTL** (20) - Set expiration

**Error Handling:**
- If a processor fails, execution continues
- Errors are logged but don't break the chain
- Allows graceful degradation

---

## Custom Processors

Create your own processors:

```typescript
import type { MemoryProcessor } from '@web-agent/core/memory';

class CustomProcessor implements MemoryProcessor {
  name = 'custom';
  priority = 12; // Between summarization and metadata

  async process(messages, metadata) {
    // Your logic here
    const processed = messages.map(m => ({
      ...m,
      content: m.content.toUpperCase(),
    }));

    return {
      messages: processed,
      metadata: {
        ...metadata,
        customProcessed: true,
      },
    };
  }
}

memory.addProcessor(new CustomProcessor());
```

---

## Storage

### IndexedDB Store

The default storage implementation uses IndexedDB:

```typescript
import { EnhancedIndexedDBStore } from '@web-agent/core/memory';

const store = new EnhancedIndexedDBStore('my-app-memory');
```

**Features:**
- Multi-resource support with compound indexes
- Efficient queries by resource type
- Full-text search on message content
- Date range queries
- Cleanup of expired memories

**Indexes:**
- `resourceType` - Query by type
- `resourceId` - Query by ID
- `resourceKey` - Compound index for efficient lookups
- `createdAt` - Date-based queries
- `updatedAt` - Date-based queries
- `expiresAt` - Cleanup queries

### Custom Store

Implement your own storage:

```typescript
import type { EnhancedMemoryStore } from '@web-agent/core/memory';

class CustomStore implements EnhancedMemoryStore {
  async get(resource) { /* ... */ }
  async set(resource, memory) { /* ... */ }
  async delete(resource) { /* ... */ }
  async list(resourceType) { /* ... */ }
  async search(query) { /* ... */ }
  async cleanup() { /* ... */ }
  async close() { /* ... */ }
}
```

---

## Use Cases

### 1. User-Specific Memory

```typescript
// Each user has their own memory
await memory.addMessage(
  { type: 'user', id: 'user-123' },
  { role: 'user', content: 'I like window seats' }
);

// Later, retrieve user preferences
const messages = await memory.getMessages({ type: 'user', id: 'user-123' });
```

### 2. Session Memory

```typescript
// Temporary session memory
await memory.addMessage(
  { type: 'session', id: 'session-abc' },
  { role: 'user', content: 'Show me flights' }
);

// Sessions expire quickly (1 day TTL)
```

### 3. Context-Specific Memory

```typescript
// Memory for specific workflows
await memory.addMessage(
  { type: 'context', id: 'flight-booking' },
  { role: 'user', content: 'Paris, next week' }
);

// All flight bookings share this context
```

### 4. Search Across Memories

```typescript
// Find all travel-related conversations
const results = await memory.search({
  query: 'flight OR hotel OR booking',
  metadata: { topic: 'travel' },
  dateRange: {
    start: new Date('2026-01-01'),
    end: new Date('2026-12-31'),
  },
});

// Analyze patterns
const topics = results.map(r => r.memory.metadata.extracted?.topics);
```

---

## Best Practices

### 1. Choose Appropriate Resource Types

```typescript
// Good
{ type: 'user', id: 'user-123' }        // Long-term user memory
{ type: 'session', id: 'session-abc' }  // Temporary session
{ type: 'context', id: 'checkout' }     // Workflow-specific

// Avoid
{ type: 'memory', id: '123' }           // Too generic
```

### 2. Configure TTL Appropriately

```typescript
new TTLProcessor({
  defaultTTL: 30 * 24 * 60 * 60 * 1000,  // 30 days default
  ttlByResourceType: {
    session: 1 * 24 * 60 * 60 * 1000,    // 1 day for sessions
    user: 90 * 24 * 60 * 60 * 1000,      // 90 days for users
    context: 7 * 24 * 60 * 60 * 1000,    // 7 days for contexts
  },
});
```

### 3. Use Metadata for Organization

```typescript
await memory.addMessage(
  resource,
  message,
  {
    topic: 'travel',
    intent: 'booking',
    status: 'completed',
    timestamp: Date.now(),
  }
);
```

### 4. Implement Auto-Cleanup

```typescript
const memory = new MemoryManager({
  store,
  processors: [/* ... */],
  cleanupInterval: 60 * 60 * 1000, // Clean up every hour
});
```

### 5. Handle Errors Gracefully

```typescript
try {
  await memory.addMessage(resource, message);
} catch (error) {
  console.error('Failed to save memory:', error);
  // Fallback logic
}
```

---

## Migration from Basic Memory

If you're using the basic memory system:

```typescript
// Old (basic memory)
import { IndexedDBStore } from '@web-agent/core/memory';

const store = new IndexedDBStore();
await store.saveMessage(message, { resource: 'user-123', thread: 'main' });

// New (enhanced memory)
import { MemoryManager, EnhancedIndexedDBStore } from '@web-agent/core/memory';

const memory = new MemoryManager({
  store: new EnhancedIndexedDBStore(),
});

await memory.addMessage(
  { type: 'user', id: 'user-123' },
  message
);
```

**Benefits of upgrading:**
- Multi-resource support
- Automatic processing
- Search capabilities
- Better organization

---

## Performance Considerations

### Memory Usage

- Processors run in-memory
- Large conversations may need summarization
- Configure `maxMessages` appropriately

### Storage

- IndexedDB has ~50MB limit per origin
- Monitor storage usage
- Implement cleanup strategy

### Search Performance

- Full-text search is O(n) on messages
- Use metadata filters to reduce search space
- Consider pagination for large result sets

---

## Troubleshooting

### Memory Not Persisting

```typescript
// Ensure you're using the same database name
const store = new EnhancedIndexedDBStore('consistent-name');
```

### Processors Not Running

```typescript
// Check processor priority order
memory.addProcessor(processor);

// Verify processor is not throwing errors
```

### Search Not Finding Results

```typescript
// Check query syntax
const results = await memory.search({
  query: 'exact phrase', // Case-insensitive
});

// Verify metadata format
const results = await memory.search({
  metadata: { key: 'exact-value' }, // Must match exactly
});
```

---

## API Reference

See [Memory API Reference](./API_REFERENCE.md#memory) for complete API documentation.

---

## Examples

See [Memory Examples](../examples/memory-demo/) for working examples.

---

**Last Updated**: January 4, 2026  
**Version**: 1.0  
**Status**: Production Ready


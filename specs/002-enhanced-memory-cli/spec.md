# Enhanced Memory & CLI - Feature Specification

**Feature ID**: 002  
**Phase**: 3 (Week 6-7)  
**Status**: In Progress  
**Priority**: High  
**Estimated Effort**: 2-3 weeks

---

## Overview

This specification covers two major features for Phase 3 completion:

1. **Enhanced Memory System**: Multi-resource memory with processors for summarization and filtering
2. **CLI Tool**: Scaffolding tool for creating new Web Agent Framework projects

---

## 1. Enhanced Memory System

### 1.1 Current State

The framework currently has basic conversation memory backed by IndexedDB:

```typescript
interface Memory {
  id: string;
  messages: Message[];
  metadata?: Record<string, unknown>;
}
```

**Limitations**:
- Single conversation thread only
- No memory across different resources (users, sessions, contexts)
- No automatic summarization for long conversations
- No filtering or search capabilities
- No memory processors

### 1.2 Goals

1. **Multi-Resource Memory**: Support memory for different resources (users, sessions, contexts)
2. **Memory Processors**: Automatic summarization, filtering, and transformation
3. **Memory Search**: Find relevant memories by content or metadata
4. **Memory Lifecycle**: TTL, archiving, and cleanup
5. **Performance**: Efficient storage and retrieval

### 1.3 User Stories

#### Story 1: Multi-Resource Memory

**As a** developer  
**I want** to store memories for different resources (users, sessions, contexts)  
**So that** I can maintain separate conversation histories and context

**Acceptance Criteria**:
- Can create memory for a specific user ID
- Can create memory for a specific session ID
- Can create memory for a specific context (e.g., "flight-booking", "support-chat")
- Can retrieve memories by resource type and ID
- Can list all memories for a resource type

**Example**:
```typescript
// User-specific memory
const userMemory = await memory.get('user', 'user-123');

// Session-specific memory
const sessionMemory = await memory.get('session', 'session-abc');

// Context-specific memory
const contextMemory = await memory.get('context', 'flight-booking');
```

#### Story 2: Memory Processors

**As a** developer  
**I want** to automatically process memories (summarize, filter, transform)  
**So that** I can keep memory size manageable and extract insights

**Acceptance Criteria**:
- Can register memory processors
- Processors run automatically on memory updates
- Supports summarization processor (condense long conversations)
- Supports filtering processor (remove irrelevant messages)
- Supports custom processors
- Processors are chainable

**Example**:
```typescript
// Summarization processor
memory.addProcessor(new SummarizationProcessor({
  maxMessages: 50,
  summarizeAfter: 100,
}));

// Filtering processor
memory.addProcessor(new FilteringProcessor({
  removeSystemMessages: true,
  removeEmptyMessages: true,
}));

// Custom processor
memory.addProcessor({
  name: 'sentiment-analysis',
  process: async (messages) => {
    // Analyze sentiment and add metadata
    return messages;
  },
});
```

#### Story 3: Memory Search

**As a** developer  
**I want** to search memories by content or metadata  
**So that** I can find relevant past conversations

**Acceptance Criteria**:
- Can search by text content
- Can search by metadata fields
- Can filter by date range
- Can limit results
- Returns ranked results

**Example**:
```typescript
// Search by content
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
  dateRange: { start: '2026-01-01', end: '2026-01-31' },
});
```

### 1.4 Technical Design

#### Memory Schema

```typescript
interface MemoryResource {
  type: 'user' | 'session' | 'context' | string;
  id: string;
}

interface Memory {
  id: string;
  resource: MemoryResource;
  messages: Message[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

interface MemoryProcessor {
  name: string;
  priority: number; // Lower runs first
  process: (messages: Message[], metadata: Record<string, unknown>) => Promise<{
    messages: Message[];
    metadata: Record<string, unknown>;
  }>;
}
```

#### Memory Store Interface

```typescript
interface MemoryStore {
  // CRUD operations
  get(resource: MemoryResource): Promise<Memory | null>;
  set(resource: MemoryResource, memory: Memory): Promise<void>;
  delete(resource: MemoryResource): Promise<void>;
  
  // List operations
  list(resourceType: string): Promise<Memory[]>;
  
  // Search operations
  search(query: MemorySearchQuery): Promise<Memory[]>;
  
  // Lifecycle
  cleanup(): Promise<void>; // Remove expired memories
}

interface MemorySearchQuery {
  query?: string;
  metadata?: Record<string, unknown>;
  dateRange?: { start: Date; end: Date };
  limit?: number;
}
```

#### Built-in Processors

1. **SummarizationProcessor**: Condenses long conversations
2. **FilteringProcessor**: Removes irrelevant messages
3. **MetadataExtractorProcessor**: Extracts metadata from messages
4. **TTLProcessor**: Manages memory expiration

---

## 2. CLI Tool

### 2.1 Goals

1. **Project Scaffolding**: Create new Web Agent Framework projects
2. **Template Support**: React, Vue, Svelte templates
3. **Interactive Setup**: Guide users through configuration
4. **Dependency Management**: Auto-install dependencies
5. **Best Practices**: Generate well-structured projects

### 2.2 User Stories

#### Story 1: Create New Project

**As a** developer  
**I want** to quickly scaffold a new Web Agent Framework project  
**So that** I can start building without manual setup

**Acceptance Criteria**:
- Can run `create-web-agent my-app`
- Prompts for framework choice (React, Vue, Svelte)
- Prompts for features (TypeScript, UI components, memory)
- Creates project directory with all files
- Installs dependencies automatically
- Provides next steps

**Example**:
```bash
$ npx create-web-agent my-app

✨ Creating a new Web Agent Framework project...

? Which framework would you like to use? › React
? Enable TypeScript? › Yes
? Include UI components? › Yes
? Include memory system? › Yes
? Include example agent? › Yes

📦 Installing dependencies...
✅ Project created successfully!

Next steps:
  cd my-app
  pnpm dev

Happy coding! 🚀
```

#### Story 2: Template Selection

**As a** developer  
**I want** to choose from different project templates  
**So that** I can start with the right setup for my needs

**Acceptance Criteria**:
- Supports React template
- Supports Vue template
- Supports Svelte template
- Each template includes example agent
- Each template includes documentation
- Templates are customizable

**Templates**:
1. **React**: Next.js + TypeScript + Tailwind
2. **Vue**: Vite + TypeScript + Composition API
3. **Svelte**: SvelteKit + TypeScript

#### Story 3: Feature Selection

**As a** developer  
**I want** to select which features to include  
**So that** I only get what I need

**Acceptance Criteria**:
- Can enable/disable TypeScript
- Can enable/disable UI components
- Can enable/disable memory system
- Can enable/disable example agent
- Can enable/disable tests
- Features are properly configured

### 2.3 Technical Design

#### CLI Architecture

```
create-web-agent/
├── src/
│   ├── index.ts              # Entry point
│   ├── cli.ts                # CLI logic
│   ├── prompts.ts            # Interactive prompts
│   ├── templates/            # Project templates
│   │   ├── react/
│   │   ├── vue/
│   │   └── svelte/
│   ├── generators/           # Code generators
│   │   ├── project.ts
│   │   ├── agent.ts
│   │   └── component.ts
│   └── utils/
│       ├── install.ts        # Dependency installation
│       ├── git.ts            # Git initialization
│       └── validate.ts       # Input validation
├── templates/                # Template files
└── package.json
```

#### CLI Commands

```bash
# Create new project
create-web-agent <project-name> [options]

# Options
--template <name>     Template to use (react, vue, svelte)
--typescript          Enable TypeScript (default: true)
--ui                  Include UI components (default: true)
--memory              Include memory system (default: true)
--example             Include example agent (default: true)
--no-install          Skip dependency installation
--no-git              Skip git initialization
```

#### Template Structure

```
template-react/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── agents/
│   │   └── example-agent.ts
│   ├── components/
│   │   └── AgentChat.tsx
│   └── lib/
│       └── web-agent.ts
├── public/
└── README.md
```

---

## 3. Success Criteria

### Enhanced Memory System

- [ ] Multi-resource memory implemented
- [ ] At least 3 built-in processors
- [ ] Memory search functionality
- [ ] 30+ comprehensive tests
- [ ] Complete documentation
- [ ] Performance benchmarks

### CLI Tool

- [ ] CLI tool functional
- [ ] 3 project templates (React, Vue, Svelte)
- [ ] Interactive prompts working
- [ ] Dependency installation working
- [ ] Generated projects run successfully
- [ ] CLI tests
- [ ] Complete documentation

---

## 4. Non-Goals

- Advanced memory compression algorithms
- Distributed memory systems
- CLI GUI interface
- Template marketplace
- Plugin system for CLI

---

## 5. Timeline

**Week 6 (Days 1-4)**:
- Day 1: Design memory architecture
- Day 2: Implement multi-resource memory
- Day 3: Implement memory processors
- Day 4: Memory tests and documentation

**Week 7 (Days 5-7)**:
- Day 5: Design CLI architecture
- Day 6: Implement CLI and templates
- Day 7: CLI tests, documentation, final polish

---

## 6. Dependencies

- `@web-agent/core` - Core memory interfaces
- `commander` or `yargs` - CLI framework
- `inquirer` or `prompts` - Interactive prompts
- `chalk` - Terminal colors
- `ora` - Loading spinners
- `execa` - Process execution

---

## 7. Testing Strategy

### Memory System Tests

1. **Unit Tests**: Individual processors, store operations
2. **Integration Tests**: Full memory lifecycle
3. **Performance Tests**: Large conversation handling
4. **Edge Cases**: Concurrent access, expiration

### CLI Tests

1. **Unit Tests**: Generators, validators
2. **Integration Tests**: Full project creation
3. **Template Tests**: Generated projects build/run
4. **E2E Tests**: Complete CLI flow

---

## 8. Documentation

### Memory System

- API reference
- Processor guide
- Search examples
- Best practices
- Migration guide

### CLI Tool

- Installation guide
- Usage examples
- Template documentation
- Customization guide
- Troubleshooting

---

## 9. Open Questions

1. Should memory processors be async or sync?
2. What's the default TTL for memories?
3. Should CLI support custom templates?
4. Should CLI have a config file?
5. How to handle template updates?

---

**Last Updated**: January 4, 2026  
**Status**: In Progress  
**Next Review**: After Week 6 completion


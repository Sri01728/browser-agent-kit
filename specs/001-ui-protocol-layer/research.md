# Research: UI Protocol Layer

**Feature**: 001-ui-protocol-layer
**Date**: 2026-01-01

## Research Areas

### 1. A2U Protocol Design Patterns

**Decision**: Adopt Google's A2U (Agent-to-UI) protocol structure with custom extensions for our use case.

**Rationale**:
- A2U is an emerging standard for declarative agent-to-UI communication
- JSON-based structure aligns with existing LLM output patterns
- Component-action model maps well to tool calling
- Version field enables backward compatibility

**Alternatives Considered**:
- Custom JSON format: More flexibility but less community adoption
- HTML string rendering: Security risks (XSS), harder to validate
- GraphQL-like queries: Overkill for component rendering

**Key Design Decisions**:
```typescript
// A2U Response structure
{
  "version": "1.0",
  "type": "ui",
  "ui": {
    "type": "card",
    "id": "flight-123",
    "props": { "title": "Flight to Paris" },
    "children": [...],
    "actions": [{ "type": "call_tool", "params": {...} }]
  }
}
```

### 2. Event Bus Architecture

**Decision**: Typed pub/sub event bus with synchronous delivery and automatic cleanup.

**Rationale**:
- Decouples agent logic from UI rendering
- Enables multiple subscribers (logging, analytics, UI)
- Type safety prevents runtime errors
- Simple mental model for developers

**Alternatives Considered**:
- RxJS Observables: Too heavy (adds 30KB+ to bundle)
- Browser CustomEvents: Lacks type safety, global pollution
- Redux-style store: Overkill, adds unnecessary complexity

**Key Design Decisions**:
- Events delivered synchronously in registration order
- No event persistence (fire-and-forget)
- Dispose pattern for cleanup
- Built-in event types with extensibility

### 3. React Integration Patterns

**Decision**: Follow CopilotKit and Vercel AI SDK patterns for hooks.

**Rationale**:
- Familiar patterns reduce learning curve
- Proven UX for chat interfaces
- Automatic state management
- Clean mount/unmount handling

**Alternatives Considered**:
- Render props: More flexible but verbose
- HOCs: Outdated pattern, TypeScript challenges
- Context-only: Forces provider wrapper, less composable

**Key Design Decisions**:
- `useAgent` returns `{ messages, sendMessage, isLoading, error }`
- `useAgentStream` adds chunk-by-chunk updates
- Automatic subscription cleanup on unmount
- Memory context as optional parameter

### 4. XSS Prevention Strategy

**Decision**: Use DOMPurify for HTML sanitization + component whitelist.

**Rationale**:
- DOMPurify is the industry standard (used by Google, Microsoft)
- Component whitelist ensures only safe types render
- Two-layer defense: sanitize content AND restrict components

**Alternatives Considered**:
- textContent only: Too restrictive (no formatting)
- CSP headers: Browser-level, doesn't help with DOM manipulation
- Custom sanitizer: High risk of bugs, not audited

**Key Design Decisions**:
- All text props sanitized by default
- HTML content requires explicit `allowHtml: true` prop
- Unknown component types render placeholder (not raw content)
- Actions validated against allowed types

### 5. Performance Optimization

**Decision**: Batch renders with requestAnimationFrame, configurable limits.

**Rationale**:
- Prevents UI jank during streaming updates
- Limits protect against malicious/buggy prompts
- RAF batching is browser-native, zero overhead

**Alternatives Considered**:
- Web Workers: Can't access DOM, adds complexity
- Virtual DOM: Already handled by React for react package
- Time-slicing: Too complex for initial implementation

**Key Design Decisions**:
- Batch streaming updates into 16ms frames
- Default limits: 10 nesting depth, 100 components
- Configurable at renderer initialization
- Warning logs when limits exceeded

### 6. Logging Architecture

**Decision**: Console-based logging with configurable levels.

**Rationale**:
- Zero dependencies (uses native console)
- Familiar pattern for web developers
- Easy to integrate with external logging services
- Can be completely disabled in production

**Alternatives Considered**:
- External logging library: Adds bundle size
- Custom telemetry events: More complex, privacy concerns
- No logging: Harder to debug production issues

**Key Design Decisions**:
- Levels: debug, info, warn, error
- Default: warn in production, debug in development
- Namespace prefix: `[web-agent:ui-protocol]`
- Structured context objects for error logs

## Resolved NEEDS CLARIFICATION

All technical unknowns from the spec have been resolved:

| Unknown | Resolution |
|---------|------------|
| Custom component extension | Typed API with schema validation (Zod) |
| Protocol versioning | Version field with backward-compatible parsing |
| Multi-agent rendering | Last-write-wins with auto-cleanup |
| Observability | Console logging with configurable levels |
| Component limits | Configurable defaults (10/100) |

## Dependencies to Add

### @web-agent/ui-protocol
```json
{
  "dependencies": {
    "@web-agent/core": "workspace:*",
    "zod": "^3.22.4",
    "dompurify": "^3.0.0"
  },
  "devDependencies": {
    "@types/dompurify": "^3.0.0",
    "typescript": "^5.3.0",
    "tsup": "^8.0.0",
    "vitest": "^1.0.0",
    "jsdom": "^24.0.0"
  }
}
```

### @web-agent/react
```json
{
  "dependencies": {
    "@web-agent/core": "workspace:*",
    "@web-agent/ui-protocol": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@testing-library/react": "^14.0.0",
    "typescript": "^5.3.0",
    "tsup": "^8.0.0",
    "vitest": "^1.0.0"
  }
}
```

## Best Practices Identified

1. **Schema First**: Define Zod schemas before any implementation
2. **Event Handlers**: Always return cleanup functions from subscriptions
3. **React Hooks**: Use useCallback for stable function references
4. **DOM Manipulation**: Always use requestAnimationFrame for batching
5. **Error Boundaries**: Wrap A2U rendering in error boundaries
6. **Type Guards**: Use Zod safeParse for runtime type narrowing


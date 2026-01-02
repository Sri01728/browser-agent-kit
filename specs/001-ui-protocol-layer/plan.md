# Implementation Plan: UI Protocol Layer

**Branch**: `001-ui-protocol-layer` | **Date**: 2026-01-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ui-protocol-layer/spec.md`

## Summary

Build the UI Protocol Layer (Phase 2) comprising three packages:
1. **`@web-agent/ui-protocol`** - A2U Protocol Renderer + AG-UI Event Bus
2. **`@web-agent/react`** - React hooks and components for agent integration

This enables AI agents to declaratively control web UIs through structured JSON (A2U protocol) with real-time event-based communication (AG-UI). The implementation follows the existing monorepo structure and constitution principles.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled
**Primary Dependencies**: Zod (validation), React 18+ (for react package), DOMPurify (XSS prevention)
**Storage**: N/A (stateless rendering, memory handled by @web-agent/core)
**Testing**: Vitest with jsdom environment, React Testing Library for react package
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+)
**Project Type**: Monorepo with pnpm workspaces (existing structure)
**Performance Goals**: <100ms render time, <1ms event bus latency, <20KB gzipped for ui-protocol, <15KB for react
**Constraints**: Browser-only (no Node.js APIs), no external API calls, XSS-safe rendering
**Scale/Scope**: 6 built-in component types, 6 event types, 4 React exports, 1 demo application

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Type Safety First ✅
- [x] A2UComponent, A2UAction, AGUIEvent defined as Zod schemas
- [x] Types derived using `z.infer<typeof schema>`
- [x] All component props validated at parse time
- [x] Custom component registry uses typed API

### Principle II: Schema-Driven Development ✅
- [x] A2U protocol schema defined in Zod
- [x] Version field for backward compatibility
- [x] JSON Schema generated for documentation

### Principle III: Error Handling Excellence ✅
- [x] A2UParseError for malformed JSON
- [x] ComponentRenderError for render failures
- [x] EventBusError for subscription issues
- [x] All errors include context (component type, event name)

### Principle IV: Test-Driven Quality ✅
- [x] Test plan: unit tests for parser, renderer, event bus
- [x] Integration tests for React hooks
- [x] Coverage target: >80%

### Principle V: Developer Experience ✅
- [x] Zero-config defaults (built-in components, default limits)
- [x] Progressive disclosure (simple API → advanced options)
- [x] JSDoc with @example for all public APIs

### Principle VI: Performance by Design ✅
- [x] Configurable limits (10 nesting, 100 components)
- [x] Lazy component registration
- [x] Event handler cleanup via dispose()
- [x] Debounced streaming updates

### Principle VII: Security by Default ✅
- [x] DOMPurify for HTML content sanitization
- [x] Component whitelist (only registered types render)
- [x] No eval() or innerHTML with untrusted content
- [x] Action handlers validated before execution

### Principle VIII: Architecture Discipline ✅
- [x] Interfaces in types.ts before implementation
- [x] Event-driven UI communication (AG-UI pattern)
- [x] Dependency injection for renderer configuration
- [x] Separate packages: core → ui-protocol → react

### Principle IX: Browser Compatibility ✅
- [x] No WebGPU/IndexedDB dependencies in UI layer
- [x] Standard DOM APIs only
- [x] Progressive enhancement (text fallback)

### Principle X: Documentation Completeness ✅
- [x] JSDoc for all public exports
- [x] README.md for each package
- [x] Quickstart guide with examples

## Project Structure

### Documentation (this feature)

```text
specs/001-ui-protocol-layer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── a2u-schema.ts
│   └── ag-ui-events.ts
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── core/                           # Existing - updates needed for FR-020, FR-021
│   └── src/
│       └── agent/
│           ├── types.ts            # Add ui field to AgentResponse
│           └── a2u-detector.ts     # parseA2UFromText() - extracts A2U JSON from LLM text
│
├── ui-protocol/                    # NEW: @web-agent/ui-protocol
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsup.config.ts
│   ├── README.md
│   └── src/
│       ├── index.ts                # Public exports
│       ├── a2u/
│       │   ├── types.ts            # A2UComponent, A2UAction, A2UResponse schemas
│       │   ├── parser.ts           # parseA2UResponse()
│       │   ├── renderer.ts         # A2URenderer class
│       │   ├── components/         # Built-in component renderers
│       │   │   ├── index.ts
│       │   │   ├── card.ts
│       │   │   ├── list.ts
│       │   │   ├── button.ts
│       │   │   ├── text.ts
│       │   │   ├── image.ts
│       │   │   └── form.ts
│       │   └── errors.ts           # A2UParseError, ComponentRenderError
│       ├── ag-ui/
│       │   ├── types.ts            # AGUIEvent, EventHandler types
│       │   ├── event-bus.ts        # AGUIEventBus class
│       │   └── errors.ts           # EventBusError
│       └── logger.ts               # Configurable logging
│
├── react/                          # NEW: @web-agent/react
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsup.config.ts
│   ├── README.md
│   └── src/
│       ├── index.ts                # Public exports
│       ├── hooks/
│       │   ├── use-agent.ts        # useAgent hook
│       │   └── use-agent-stream.ts # useAgentStream hook
│       ├── components/
│       │   ├── AgentChat.tsx       # Pre-built chat UI
│       │   └── A2UComponent.tsx    # A2U wrapper for React
│       └── types.ts                # React-specific types
│
└── mediapipe/                      # Existing - no changes needed

examples/
└── flight-booking/                 # NEW: Demo application
    ├── package.json
    ├── index.html
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── agents/
    │   │   └── flight-agent.ts
    │   └── tools/
    │       ├── search-flights.ts
    │       └── book-flight.ts
    └── vite.config.ts
```

**Structure Decision**: Monorepo with new packages following existing patterns. The ui-protocol package is framework-agnostic, react package provides React-specific bindings, and examples/ contains the demo application.

## Complexity Tracking

> No constitution violations identified. All principles satisfied.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Two new packages | ui-protocol + react | Separation of concerns: ui-protocol works with vanilla JS, react adds React-specific bindings |
| DOMPurify dependency | Required for XSS prevention | Constitution VII mandates sanitization; DOMPurify is the standard solution |
| Configurable limits | 10 nesting / 100 components | Balance between flexibility and safety per clarification session |

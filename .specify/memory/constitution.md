<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 → 1.0.0
Bump rationale: MAJOR - Initial constitution adoption for Web Agent Framework

Modified principles: N/A (initial version)

Added sections:
  - 10 Core Principles (Code Quality, Type Safety, Testing, DX, Performance, Security, Architecture, Documentation, Browser Compatibility, Versioning)
  - Technical Standards (Browser-First, Dependency Management)
  - Quality Gates (Testing, Documentation, Security requirements)
  - Governance rules and compliance procedures

Removed sections: N/A (initial version)

Templates requiring updates:
  ✅ .specify/templates/plan-template.md - Constitution Check aligned
  ✅ .specify/templates/spec-template.md - Requirements aligned
  ✅ .specify/templates/tasks-template.md - Task categories aligned
  ✅ .specify/templates/checklist-template.md - Categories aligned
  ✅ .specify/templates/agent-file-template.md - Guidelines aligned

Follow-up TODOs: None
-->

# Web Agent Framework Constitution

> The foundational principles governing all code generation, reviews, and architectural decisions for the client-side AI agent orchestration framework.

## Core Principles

### I. Type Safety First (NON-NEGOTIABLE)

All code MUST use Zod schemas for type definitions and runtime validation. The `any` type is **strictly forbidden** except in well-documented escape hatches with explicit justification.

**Rules:**
- MUST define Zod schemas before implementation
- MUST derive TypeScript types using `z.infer<typeof schema>`
- MUST validate ALL external inputs at system boundaries
- MUST NOT use `any` without documented justification and TODO for removal
- MUST NOT use unvalidated `unknown` types

**Rationale:** Client-side AI agents handle untrusted data from LLM outputs, user inputs, and browser APIs. Type safety prevents runtime crashes and security vulnerabilities in production browser environments.

### II. Schema-Driven Development

Every tool, agent configuration, and data structure MUST be defined schema-first. Schemas serve as the single source of truth for types, validation, and documentation.

**Rules:**
- MUST define input/output schemas for all tools using Zod
- MUST define structured output schemas for agents requiring typed responses
- MUST generate JSON Schema from Zod for LLM function calling
- MUST NOT define interfaces/types manually when schemas can generate them

**Rationale:** Browser-based LLMs require JSON Schema definitions for function calling. Schema-driven development ensures consistency between TypeScript types, runtime validation, and LLM tool definitions.

### III. Error Handling Excellence

All errors MUST provide actionable context for debugging. Generic errors are forbidden in production code.

**Rules:**
- MUST create specific error classes with contextual properties (e.g., `toolId`, `input`, `cause`)
- MUST include fix suggestions in user-facing error messages
- MUST preserve error chains using the `cause` property
- MUST log errors with sufficient context for reproduction
- MUST NOT throw generic `Error('Something went wrong')` messages
- MUST NOT swallow errors silently

**Rationale:** Debugging browser-based AI agents is challenging. Rich error context accelerates issue resolution and improves developer experience.

### IV. Test-Driven Quality

All public APIs MUST have comprehensive test coverage before merge. The Red-Green-Refactor cycle is mandatory for new features.

**Rules:**
- MUST write tests first for new features (TDD)
- MUST cover: happy path, edge cases, error scenarios, async behavior, resource cleanup
- MUST use type-safe mocks implementing full interfaces
- MUST achieve >80% code coverage for core packages
- MUST include integration tests for browser API interactions (IndexedDB, WebGPU)
- MUST NOT merge code with failing tests

**Rationale:** Client-side AI applications run in uncontrolled browser environments. Comprehensive testing ensures reliability across browser versions and configurations.

### V. Developer Experience (DX) Priority

The framework MUST provide exceptional developer experience through sensible defaults, progressive disclosure, and clear documentation.

**Rules:**
- MUST provide zero-configuration defaults for common use cases
- MUST expose advanced options as optional parameters
- MUST include JSDoc with `@param`, `@returns`, `@example`, `@throws` for all public APIs
- MUST provide actionable error messages with fix suggestions
- MUST follow consistent API patterns across all primitives (id/name properties, async returns Promise, dispose for cleanup)
- MUST NOT require configuration for basic functionality

**Rationale:** Developer adoption depends on time-to-first-success. Excellent DX reduces onboarding friction and encourages framework adoption.

### VI. Performance by Design

All code MUST be optimized for browser execution constraints including memory limits, main thread blocking, and network latency.

**Rules:**
- MUST limit unbounded collections (default: 50 messages max for memory)
- MUST use lazy initialization (initialize on first use, not in constructor)
- MUST use streaming for large LLM responses
- MUST use `Promise.all()` for independent parallel operations
- MUST implement `AbortController` for cancellable operations
- MUST provide `dispose()` methods for resource cleanup
- MUST NOT block the main thread for >50ms without yielding
- MUST NOT load models synchronously

**Rationale:** Browser-based LLMs compete for resources with the web application. Performance optimization ensures smooth user experience during AI inference.

### VII. Security by Default

All code MUST follow browser security best practices. API keys MUST NEVER appear in client-side code.

**Rules:**
- MUST proxy sensitive API calls through backend endpoints
- MUST validate ALL inputs with Zod schemas at system boundaries
- MUST use `textContent` for safe text rendering, `DOMPurify` for HTML
- MUST whitelist A2U/AG-UI component types (no arbitrary component rendering)
- MUST NOT embed API keys, secrets, or credentials in browser code
- MUST NOT use `innerHTML` with untrusted content
- MUST NOT execute arbitrary code from agent responses

**Rationale:** Client-side code is fully inspectable. Security violations in browser AI applications can expose users to XSS, data theft, and prompt injection attacks.

### VIII. Architecture Discipline

All code MUST follow interface-first design with clear separation of concerns and dependency injection.

**Rules:**
- MUST define interfaces in `types.ts` before implementations
- MUST inject dependencies (adapters, stores, tools) via constructor
- MUST use event-driven patterns for UI communication (AG-UI protocol)
- MUST separate layers: Core primitives → Implementations → Adapters → UI integration
- MUST NOT hardcode dependencies or create hidden coupling
- MUST NOT manipulate DOM directly from agent logic

**Rationale:** A modular architecture enables swapping LLM providers, storage backends, and UI frameworks without rewriting core logic.

### IX. Browser Compatibility

All code MUST implement feature detection and graceful degradation for browser APIs.

**Rules:**
- MUST check for WebGPU/IndexedDB availability before use
- MUST provide fallbacks (WebGPU → WASM, IndexedDB → memory store)
- MUST implement progressive enhancement (text response → tool calling → UI control)
- MUST support latest 2 versions of Chrome, Firefox, Safari, Edge
- MUST NOT assume browser features exist without detection

**Rationale:** Browser capabilities vary widely. Graceful degradation ensures the framework works across different browser configurations and versions.

### X. Documentation Completeness

All public APIs MUST be fully documented with examples. Code without documentation is incomplete.

**Rules:**
- MUST include JSDoc for every public function, class, and method
- MUST provide working `@example` blocks for common use cases
- MUST add inline comments for non-obvious logic
- MUST maintain README.md for every package
- MUST NOT merge undocumented public APIs

**Rationale:** AI framework users need clear examples to understand complex concepts like agents, tools, and memory. Documentation is part of the developer experience.

## Technical Standards

### Browser-First Architecture

This framework runs entirely in the browser. All technical decisions MUST prioritize browser constraints.

**Technology Stack:**
- **Language**: TypeScript 5.x with strict mode enabled
- **Runtime**: Modern browsers (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+)
- **Build**: ESM modules with tree-shaking support
- **Validation**: Zod for schemas and runtime validation
- **Storage**: IndexedDB for conversation memory (with memory fallback)
- **Inference**: WebGPU-accelerated LLMs (MediaPipe, Transformers.js, LiteRT.js)

**Constraints:**
- No Node.js APIs (fs, path, process, etc.)
- No server-side secrets or API keys
- Maximum initial bundle: <100KB gzipped for core package
- Maximum memory footprint: <500MB during inference

### Dependency Management

Dependencies MUST be minimal, well-maintained, and browser-compatible.

**Rules:**
- MUST prefer zero-dependency implementations for core functionality
- MUST audit dependencies for browser compatibility
- MUST pin dependency versions in production
- MUST NOT add dependencies for functionality achievable in <50 lines
- MUST NOT use Node.js-only packages

## Quality Gates

### Before Merge Checklist

All pull requests MUST pass these gates:

**Code Quality:**
- [ ] All types defined with Zod schemas
- [ ] No `any` or unvalidated `unknown`
- [ ] Specific error classes with context
- [ ] Immutable data patterns (no mutations)
- [ ] Single responsibility functions

**Testing:**
- [ ] Happy path tests passing
- [ ] Edge case tests included
- [ ] Error scenario tests included
- [ ] Async behavior tests included
- [ ] Resource cleanup tests (if applicable)
- [ ] >80% code coverage

**Documentation:**
- [ ] JSDoc on all public APIs
- [ ] Working @example blocks
- [ ] README updated (if adding features)

**Security:**
- [ ] No secrets in code
- [ ] All inputs validated
- [ ] Safe DOM manipulation
- [ ] Only approved A2U components

**Performance:**
- [ ] Bounded collections implemented
- [ ] Lazy initialization used
- [ ] dispose() method provided (if applicable)

## Governance

### Amendment Process

This constitution supersedes all other development practices. Amendments require:

1. Written proposal with rationale
2. Impact analysis on existing code
3. Migration plan for breaking changes
4. Approval from project maintainers
5. Documentation of changes with version bump

### Version Policy

Constitution versions follow semantic versioning:
- **MAJOR**: Breaking changes to principles or removal of rules
- **MINOR**: New principles, sections, or material expansions
- **PATCH**: Clarifications, typo fixes, non-semantic refinements

### Compliance

- All PRs MUST include constitution compliance check
- Violations MUST be justified in Complexity Tracking section of plan.md
- Runtime guidance lives in `.github/PRINCIPLES.md` for AI assistants

### Referenced Documents

- **Detailed Principles**: `.github/PRINCIPLES.md`
- **Prompt Templates**: `.github/PROMPT_TEMPLATE.md`
- **Framework Design**: `docs/FRAMEWORK_DESIGN.md`
- **Getting Started**: `docs/GETTING_STARTED.md`

**Version**: 1.0.0 | **Ratified**: 2026-01-01 | **Last Amended**: 2026-01-01

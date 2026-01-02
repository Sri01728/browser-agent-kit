# AI Code Generation Prompt Template

> Copy this prompt when generating code for the Web Agent Framework

---

## 📋 The Master Prompt

```
Generate code for a client-side Web Agent Framework following these principles:

## Code Quality
- Use Zod schemas for ALL type definitions and runtime validation
- No 'any' types - derive types using z.infer<typeof schema>
- Specific error classes with context (toolId, input, cause)
- Immutable patterns (spread operators, no mutations)
- Single responsibility functions
- Clear separation: validate → execute → format

## Testing
- Arrange-Act-Assert pattern
- Test: happy path, edge cases, errors, async, cleanup
- Type-safe mocks that implement full interfaces
- Integration tests with real browser APIs (IndexedDB)

## Developer Experience
- Zero configuration with sensible defaults
- Progressive disclosure (simple API, advanced options)
- Actionable error messages with fix suggestions
- Full JSDoc with @param, @returns, @example, @throws
- Consistent patterns: id/name on primitives, async returns Promise

## Performance
- Limit collections (default: 50 messages max)
- Lazy initialization (init on first use, not constructor)
- Parallel Promise.all() for independent operations
- Streaming for large responses
- AbortController for cancellation
- dispose() for cleanup

## Security
- NEVER expose API keys in browser code
- Proxy sensitive calls through backend
- Validate ALL inputs with Zod schemas
- Safe DOM: textContent or DOMPurify for innerHTML
- A2U: only pre-approved component types

## Architecture
- Interface-first (define types.ts before implementation)
- Dependency injection (pass adapters, stores, tools)
- Event-driven for UI (emit events, don't manipulate DOM directly)
- Adapters for external integrations (LLM, storage)

## Browser Compatibility
- Feature detection before using WebGPU/IndexedDB
- Graceful fallbacks (WebGPU → WASM, IndexedDB → memory)
- Progressive enhancement (text → tools → UI control)

## Documentation
- JSDoc on every public function/class
- @example blocks with working code
- Inline comments for non-obvious logic
- README.md for each package
```

---

## 🎯 Quick Prompts for Common Tasks

### Creating a Tool

```
Create a [tool name] tool for the Web Agent Framework that:
- [what it does]
- Uses Zod schemas for input/output validation
- Includes proper error handling with ToolExecutionError
- Has JSDoc with examples
- Follows the createTool pattern from @web-agent/core
```

### Creating an LLM Adapter

```
Create a [provider] adapter for the Web Agent Framework that:
- Implements the LLMAdapter interface from @web-agent/core
- Supports generate() and stream() methods
- Handles initialization and disposal
- Includes WebGPU feature detection with WASM fallback
- Has proper error handling for browser environment
```

### Creating a React Component

```
Create a [component name] React component for the Web Agent Framework that:
- Uses the useAgent() hook pattern
- Handles loading, error, and success states
- Renders A2U components when available
- Is accessible (ARIA attributes, keyboard navigation)
- Has TypeScript props with defaults
- Includes Storybook stories or tests
```

### Creating a Test Suite

```
Create tests for [component/function] in the Web Agent Framework:
- Use Vitest with describe/it blocks
- Include: happy path, edge cases, errors, async, cleanup
- Use type-safe mocks implementing full interfaces
- Test browser APIs with appropriate mocking
- Follow Arrange-Act-Assert pattern
```

### Adding a New Feature

```
Add [feature name] to the Web Agent Framework:
- Design interface first in types.ts
- Implement with dependency injection
- Add unit tests with >80% coverage
- Update JSDoc and README
- Consider browser compatibility
- Follow existing patterns in codebase
```

---

## ⚡ One-Line Prompts

### Quick Tool
```
Create a Zod-validated tool called [name] that [action] with proper error handling
```

### Quick Test
```
Write Vitest tests for [function] covering happy path, errors, and edge cases
```

### Quick Fix
```
Fix this code following the Web Agent Framework principles: [paste code]
```

### Quick Docs
```
Add JSDoc with @param, @returns, @example, @throws to this function: [paste code]
```

### Quick Type
```
Convert this to Zod schema with z.infer type: [paste interface]
```

---

## 🔧 Context to Include

When generating code, also mention:

### For Core Package
```
This is for @web-agent/core which runs entirely in the browser.
No Node.js APIs. Use IndexedDB for storage, WebGPU for inference.
```

### For React Package
```
This is for @web-agent/react. Use hooks pattern, handle async states,
render A2U components, follow CopilotKit patterns.
```

### For Adapters
```
This is an LLM adapter for [provider]. Must implement LLMAdapter interface,
handle browser environment, support both generate() and stream().
```

---

## 📊 Quality Checklist

After generating, verify:

```
□ Zod schemas for all types
□ No 'any' or unvalidated unknown
□ Specific error classes
□ Immutable patterns
□ Tests exist
□ JSDoc with examples
□ No API keys in code
□ Inputs validated
□ dispose() for cleanup
□ Feature detection for browser APIs
```

---

## 💡 Pro Tips

### 1. Be Specific About Browser Context
```
"This runs in browser, not Node.js. Use fetch, IndexedDB, WebGPU."
```

### 2. Reference Existing Patterns
```
"Follow the createTool pattern from packages/core/src/tool/create-tool.ts"
```

### 3. Ask for Tests Together
```
"Generate the function AND its test file together"
```

### 4. Include Error Scenarios
```
"Include handling for: network errors, validation failures, timeout"
```

### 5. Request Examples
```
"Include 2-3 usage examples in JSDoc"
```


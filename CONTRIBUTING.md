# Contributing to Web Agent Framework

Thanks for your interest in contributing! This project is built with **GitHub Copilot** for AI-powered development.

## 🚀 Getting Started with GitHub Copilot

### Prerequisites

- [GitHub Copilot](https://github.com/features/copilot) subscription
- VS Code or compatible IDE
- Node.js 18+ and pnpm 8+

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/web-agent-framework.git
cd web-agent-framework

# Install dependencies
pnpm install

# Build packages
pnpm build
```

### GitHub Copilot Configuration

We've included `.github/copilot-instructions.md` with project-specific patterns. Copilot will automatically use these instructions when generating code.

**Key patterns to follow:**
- ✅ Always use Zod for schemas
- ✅ Type-safe everything (no `any`)
- ✅ Browser-first (no server-side code in core)
- ✅ Document with JSDoc + examples
- ✅ Follow security guidelines (no API keys in browser)

## 📖 Documentation Structure

All docs are in the `docs/` folder:

```
docs/
├── README.md                    # Documentation index
├── QUICK_REFERENCE.md           # Visual guides, FAQ
├── GETTING_STARTED.md           # Implementation guide
├── FRAMEWORK_DESIGN.md          # Architecture
├── AGENT_UI_INTEGRATION.md      # UI protocols
├── DECISION_MATRIX.md           # Rationale
└── EXECUTIVE_SUMMARY.md         # Overview
```

## 🏗️ Project Structure

```
web-agent-framework/
├── packages/
│   ├── core/                    # Core primitives (Phase 1 ✅)
│   ├── ui-protocol/            # A2U + AG-UI (Phase 2 🚧)
│   ├── react/                  # React components (Phase 2 🚧)
│   ├── mediapipe/              # MediaPipe adapter (Phase 2 🚧)
│   └── transformers/           # Transformers.js (Future 🔮)
│
├── examples/                    # Example applications
├── docs/                       # Documentation
└── .github/
    └── copilot-instructions.md # Copilot patterns
```

## 🎯 Current Phase

**Phase 1: Core Foundation** ✅ 90% Complete
- Core packages are ready for adapters

**Phase 2: UI Protocol Layer** 🚧 Next Up
- A2U protocol renderer
- AG-UI event bus
- React integration
- MediaPipe adapter

See [Project Status](./README.md#-project-status) for details.

## 💻 Development Workflow

### 1. Pick a Task

Check the current phase in [README.md](./README.md) or create an issue.

### 2. Create a Branch

```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/my-bug
```

### 3. Use GitHub Copilot

Copilot is configured with project patterns. Use:
- **Copilot Chat**: Ask questions about the codebase
- **Inline Suggestions**: Follow established patterns
- **Copilot Edits**: Generate code following our conventions

**Example prompts:**
```
"Create a tool for fetching weather data following the project pattern"
"Add TypeScript types for this function using Zod"
"Implement error handling following project guidelines"
```

### 4. Write Tests

```bash
# Add tests for your changes
pnpm test
```

### 5. Build & Lint

```bash
pnpm build
pnpm lint
```

### 6. Commit

```bash
git add .
git commit -m "feat: add weather tool"
# or
git commit -m "fix: handle null in tool execution"
```

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

### 7. Push & PR

```bash
git push origin feature/my-feature
```

Then create a Pull Request on GitHub.

## 🎨 Code Style

### TypeScript + Zod

```typescript
// ✅ GOOD: Type-safe with Zod
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number().positive()
});

type User = z.infer<typeof schema>;

function process(user: User) {
  // user.name is string
  // user.age is number
}

// ❌ BAD: Using 'any'
function process(user: any) {
  // No type safety
}
```

### Error Handling

```typescript
// ✅ GOOD: Specific error types
try {
  const result = await tool.execute(input);
} catch (error) {
  if (error instanceof ToolExecutionError) {
    console.error(`Tool ${error.toolId} failed`);
  }
  throw error;
}

// ❌ BAD: Silent failures
try {
  const result = await tool.execute(input);
} catch (error) {
  // Nothing - error is swallowed
}
```

### Documentation

```typescript
/**
 * Brief description
 * 
 * @param config - Parameter description
 * @returns Return value description
 * 
 * @example
 * ```typescript
 * const tool = createTool({
 *   id: 'my-tool',
 *   // ... config
 * });
 * ```
 */
export function createTool(config: ToolConfig) {
  // Implementation
}
```

## 🔒 Security Guidelines

### NEVER expose API keys in browser

```typescript
// ❌ BAD
const API_KEY = 'sk-1234567890'; // In browser code!

// ✅ GOOD
// Proxy through your backend
fetch('/api/proxy/service');
```

### Always validate inputs

```typescript
// ✅ GOOD
inputSchema: z.object({
  url: z.string().url(),
  amount: z.number().max(1000)
})

// ❌ BAD
// No validation, user can send anything
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
cd packages/core
pnpm test

# Watch mode
pnpm test --watch
```

### Test Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { Agent } from './agent';

describe('Agent', () => {
  it('should generate response', async () => {
    const agent = new Agent({...});
    const result = await agent.generate('test');
    
    expect(result.text).toBeDefined();
    expect(result.steps).toBeGreaterThan(0);
  });
});
```

## 📦 Publishing (Maintainers Only)

```bash
# Version bump
pnpm version patch/minor/major

# Build all packages
pnpm build

# Publish to npm
pnpm publish -r
```

## 🐛 Reporting Issues

1. Check [existing issues](https://github.com/YOUR_USERNAME/web-agent-framework/issues)
2. Create new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (browser, OS, Node version)

## 💡 Suggesting Features

1. Check [docs/](./docs/) to understand current design
2. Open issue with `[Feature]` prefix
3. Describe:
   - Use case
   - Proposed API
   - Why it fits the framework

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Questions?

- Read [QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) for common patterns
- Check [GitHub Copilot instructions](./.github/copilot-instructions.md)
- Ask in [Discussions](https://github.com/YOUR_USERNAME/web-agent-framework/discussions)

---

**Happy coding with GitHub Copilot! 🚀**


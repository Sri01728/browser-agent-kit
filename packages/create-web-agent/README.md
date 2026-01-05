# create-web-agent

CLI tool for scaffolding Web Agent Framework projects.

## Quick Start

```bash
# Using npm
npm create web-agent@latest

# Using pnpm
pnpm create web-agent

# Using yarn
yarn create web-agent
```

## Usage

### Interactive Mode

Simply run the command without arguments for an interactive experience:

```bash
npm create web-agent@latest
```

You'll be prompted for:
- Project name
- Framework (React, Vue, Svelte)
- TypeScript (yes/no)
- UI components (yes/no)
- Memory system (yes/no)
- Example agent (yes/no)

### Non-Interactive Mode

Provide all options via CLI flags:

```bash
npm create web-agent@latest my-app -- --template react --typescript --ui --memory --example
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `[project-name]` | Name of the project | Prompted |
| `-t, --template <name>` | Template to use (react, vue, svelte) | `react` |
| `--typescript` | Enable TypeScript | `true` |
| `--no-typescript` | Disable TypeScript | - |
| `--ui` | Include UI components | `true` |
| `--no-ui` | Exclude UI components | - |
| `--memory` | Include memory system | `true` |
| `--no-memory` | Exclude memory system | - |
| `--example` | Include example agent | `true` |
| `--no-example` | Exclude example agent | - |
| `--install` | Install dependencies | `true` |
| `--no-install` | Skip dependency installation | - |
| `--git` | Initialize git repository | `true` |
| `--no-git` | Skip git initialization | - |

## Examples

### Minimal React App

```bash
npm create web-agent@latest my-app -- --template react --no-ui --no-memory --no-example
```

### Full-Featured Vue App

```bash
npm create web-agent@latest my-app -- --template vue --typescript --ui --memory --example
```

### Svelte App Without Installation

```bash
npm create web-agent@latest my-app -- --template svelte --no-install
```

## Templates

### React (Next.js)

- **Framework**: Next.js 14 with App Router
- **TypeScript**: Full TypeScript support
- **Styling**: Tailwind CSS
- **Features**:
  - Pre-configured Web Agent setup
  - Example chat interface
  - Hot module reloading
  - Production-ready build

**Project Structure**:
```
my-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── agents/
│       └── tools/
│           └── weather.ts
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.ts
```

### Vue (Coming Soon)

- **Framework**: Vue 3 with Vite
- **TypeScript**: Full TypeScript support
- **Styling**: Tailwind CSS

### Svelte (Coming Soon)

- **Framework**: SvelteKit
- **TypeScript**: Full TypeScript support
- **Styling**: Tailwind CSS

## What's Included

### Core Packages

All templates include:
- `@web-agent/core` - Core agent primitives
- `@web-agent/transformers` - Browser-based LLM adapter

### Optional Packages

Based on your selections:
- `@web-agent/ui-protocol` - A2U & AG-UI components (if `--ui`)
- `@web-agent/react` - React hooks and components (React template)

### Example Agent

If `--example` is enabled, includes:
- Weather tool example
- Pre-configured agent
- Chat interface

### Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.gitignore` - Git ignore rules
- `README.md` - Project documentation

## Development

After creating your project:

```bash
cd my-app

# Install dependencies (if skipped)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Package Managers

The CLI automatically detects your package manager:

1. Checks for lock files (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`)
2. Checks for available binaries (`pnpm`, `yarn`, `npm`)
3. Defaults to `npm`

You can use any package manager you prefer:

```bash
# pnpm
pnpm create web-agent

# npm
npm create web-agent@latest

# yarn
yarn create web-agent
```

## Troubleshooting

### "Invalid project name"

Project names must be valid npm package names:
- Lowercase only
- No spaces
- Can include hyphens and underscores
- Cannot start with a dot or underscore

**Good**: `my-app`, `my_app`, `myapp`  
**Bad**: `My App`, `_myapp`, `.myapp`

### "Directory already exists"

The CLI will prompt you to overwrite the existing directory. Choose:
- **Yes** - Remove existing directory and create new project
- **No** - Abort and choose a different name

### Dependencies Not Installing

If dependency installation fails:

```bash
cd my-app
npm install  # or pnpm install, yarn install
```

### Git Initialization Failed

If git initialization fails, you can manually initialize:

```bash
cd my-app
git init
git add -A
git commit -m "Initial commit"
```

## Advanced Usage

### Custom Template Path (Coming Soon)

```bash
npm create web-agent@latest my-app -- --template /path/to/custom/template
```

### Environment Variables (Coming Soon)

```bash
WEB_AGENT_REGISTRY=https://custom-registry.com npm create web-agent@latest
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT

## Links

- [Web Agent Framework](https://github.com/your-org/web-agent-framework)
- [Documentation](https://github.com/your-org/web-agent-framework/docs)
- [Examples](https://github.com/your-org/web-agent-framework/examples)
- [Issues](https://github.com/your-org/web-agent-framework/issues)


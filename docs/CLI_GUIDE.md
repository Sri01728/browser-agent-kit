# CLI Tool Guide

**Package**: `create-web-agent`  
**Version**: 0.1.0  
**Status**: Production Ready

---

## Overview

The `create-web-agent` CLI tool is the fastest way to start building with the Web Agent Framework. It scaffolds a complete project with all necessary dependencies, configuration, and example code.

---

## Installation

You don't need to install the CLI globally. Use your package manager's `create` command:

```bash
# npm
npm create web-agent@latest

# pnpm (recommended)
pnpm create web-agent

# yarn
yarn create web-agent
```

---

## Quick Start

### 1. Create a New Project

```bash
npm create web-agent@latest my-agent-app
```

### 2. Navigate to Project

```bash
cd my-agent-app
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Open Browser

Visit [http://localhost:3000](http://localhost:3000)

---

## Interactive Mode

The CLI provides a guided, interactive experience:

```bash
$ npm create web-agent@latest

✨ Creating a new Web Agent Framework project...

? Project name: my-agent-app
? Which framework would you like to use? (Use arrow keys)
❯ React (Next.js + TypeScript)
  Vue (Vite + TypeScript)
  Svelte (SvelteKit + TypeScript)

? Enable TypeScript? (Y/n) Y
? Include UI components? (Y/n) Y
? Include memory system? (Y/n) Y
? Include example agent? (Y/n) Y

✔ Project files generated
✔ Dependencies installed
✔ Git repository initialized

✅ Project created successfully!

Next steps:
  cd my-agent-app
  npm run dev

Happy coding! 🚀
```

---

## Non-Interactive Mode

For CI/CD or scripting, use CLI flags:

```bash
npm create web-agent@latest my-app -- \
  --template react \
  --typescript \
  --ui \
  --memory \
  --example \
  --install \
  --git
```

---

## CLI Options Reference

### Project Name

```bash
npm create web-agent@latest <project-name>
```

- **Type**: String
- **Required**: No (prompted if not provided)
- **Validation**: Must be a valid npm package name

### Template

```bash
--template <name>
-t <name>
```

- **Type**: `react` | `vue` | `svelte`
- **Default**: `react`
- **Description**: Framework template to use

### TypeScript

```bash
--typescript       # Enable TypeScript (default)
--no-typescript    # Disable TypeScript
```

- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable or disable TypeScript

### UI Components

```bash
--ui       # Include UI components (default)
--no-ui    # Exclude UI components
```

- **Type**: Boolean
- **Default**: `true`
- **Description**: Include `@web-agent/ui-protocol` and React components

### Memory System

```bash
--memory       # Include memory system (default)
--no-memory    # Exclude memory system
```

- **Type**: Boolean
- **Default**: `true`
- **Description**: Include enhanced memory system

### Example Agent

```bash
--example       # Include example agent (default)
--no-example    # Exclude example agent
```

- **Type**: Boolean
- **Default**: `true`
- **Description**: Include example agent with weather tool

### Install Dependencies

```bash
--install       # Install dependencies (default)
--no-install    # Skip installation
```

- **Type**: Boolean
- **Default**: `true`
- **Description**: Automatically install dependencies

### Git Initialization

```bash
--git       # Initialize git (default)
--no-git    # Skip git initialization
```

- **Type**: Boolean
- **Default**: `true`
- **Description**: Initialize git repository with initial commit

---

## Templates

### React Template

**Stack**:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

**Structure**:
```
my-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page with agent
│   │   └── globals.css      # Global styles
│   └── agents/
│       └── tools/
│           └── weather.ts   # Example tool
├── public/                  # Static assets
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
└── README.md
```

**Scripts**:
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

**Dependencies**:
- `@web-agent/core` - Core primitives
- `@web-agent/ui-protocol` - UI components
- `@web-agent/react` - React hooks
- `@web-agent/transformers` - Browser LLM adapter
- `react`, `react-dom`, `next` - React framework

---

## Use Cases

### 1. Quick Prototype

```bash
npm create web-agent@latest prototype -- --example
```

Creates a project with example agent for quick testing.

### 2. Production App

```bash
npm create web-agent@latest my-app -- --template react --typescript --ui --memory
```

Full-featured production setup.

### 3. Minimal Setup

```bash
npm create web-agent@latest minimal -- --no-ui --no-memory --no-example
```

Bare-bones setup with just core functionality.

### 4. CI/CD Pipeline

```bash
npm create web-agent@latest app -- --template react --no-install --no-git
```

Skip installation and git for CI/CD environments.

---

## Package Manager Detection

The CLI automatically detects your preferred package manager:

### Detection Order

1. **Lock Files**:
   - `pnpm-lock.yaml` → pnpm
   - `yarn.lock` → yarn
   - `package-lock.json` → npm

2. **Binary Availability**:
   - Check if `pnpm` is available
   - Check if `yarn` is available
   - Default to `npm`

### Override Detection

Use the package manager's create command:

```bash
# Force pnpm
pnpm create web-agent

# Force npm
npm create web-agent@latest

# Force yarn
yarn create web-agent
```

---

## Project Structure

### With All Features

```
my-app/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── globals.css      # Global styles
│   └── agents/              # Agent definitions
│       └── tools/           # Tool definitions
│           └── weather.ts   # Example tool
├── public/                  # Static assets
├── node_modules/            # Dependencies
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript config
├── next.config.js           # Next.js config
├── tailwind.config.ts       # Tailwind config
├── postcss.config.js        # PostCSS config
└── README.md                # Project documentation
```

### Without UI Components

```
my-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx         # Basic page without UI components
│   └── agents/
│       └── tools/
│           └── weather.ts
└── ...
```

### Without Example

```
my-app/
├── src/
│   └── app/
│       ├── layout.tsx
│       └── page.tsx         # Empty page
└── ...
```

---

## Configuration Files

### package.json

Contains dependencies and scripts. Customized based on selected options:

```json
{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@web-agent/core": "workspace:*",
    "@web-agent/ui-protocol": "workspace:*",  // if --ui
    "@web-agent/react": "workspace:*",
    "@web-agent/transformers": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0"
  }
}
```

### tsconfig.json

TypeScript configuration with strict mode and Next.js settings:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### .gitignore

Comprehensive ignore rules for Node.js, Next.js, and common IDEs.

---

## Troubleshooting

### Invalid Project Name

**Error**: `Invalid project name: name can only contain URL-friendly characters`

**Solution**: Use lowercase letters, numbers, hyphens, and underscores only:

```bash
# Good
npm create web-agent@latest my-app
npm create web-agent@latest my_app
npm create web-agent@latest myapp123

# Bad
npm create web-agent@latest My App
npm create web-agent@latest _myapp
npm create web-agent@latest .myapp
```

### Directory Already Exists

**Error**: `Directory my-app already exists. Overwrite?`

**Solution**: Choose one:
1. **Overwrite** - Remove existing directory
2. **Abort** - Choose a different name
3. **Manual cleanup**:
   ```bash
   rm -rf my-app
   npm create web-agent@latest my-app
   ```

### Installation Failed

**Error**: `Failed to install dependencies`

**Solution**: Install manually:

```bash
cd my-app
npm install
# or
pnpm install
# or
yarn install
```

### Git Initialization Failed

**Warning**: `Failed to initialize git repository`

**Solution**: Initialize manually:

```bash
cd my-app
git init
git add -A
git commit -m "Initial commit"
```

### Template Not Found

**Error**: `Template "xyz" not found`

**Solution**: Use a valid template:

```bash
npm create web-agent@latest my-app -- --template react
# or
npm create web-agent@latest my-app -- --template vue
# or
npm create web-agent@latest my-app -- --template svelte
```

---

## Best Practices

### 1. Use TypeScript

TypeScript provides better type safety and IDE support:

```bash
npm create web-agent@latest my-app -- --typescript
```

### 2. Include UI Components

UI components provide ready-to-use agent interfaces:

```bash
npm create web-agent@latest my-app -- --ui
```

### 3. Start with Examples

Learn by example - include the example agent:

```bash
npm create web-agent@latest my-app -- --example
```

### 4. Use pnpm

pnpm is faster and more efficient:

```bash
pnpm create web-agent my-app
```

### 5. Initialize Git

Version control from the start:

```bash
npm create web-agent@latest my-app -- --git
```

---

## Next Steps

After creating your project:

1. **Explore the Code**:
   - Check `src/app/page.tsx` for the main page
   - Review `src/agents/tools/weather.ts` for tool examples

2. **Customize the Agent**:
   - Modify agent instructions
   - Add new tools
   - Configure memory settings

3. **Add Features**:
   - Create new pages
   - Add more agents
   - Implement custom UI

4. **Deploy**:
   - Build for production: `npm run build`
   - Deploy to Vercel, Netlify, or any hosting platform

---

## Related Documentation

- [Web Agent Framework](../README.md)
- [A2U Protocol Guide](./A2U_PROTOCOL.md)
- [Enhanced Memory Guide](./ENHANCED_MEMORY.md)
- [React Integration](./REACT_INTEGRATION.md)

---

**Last Updated**: January 4, 2026  
**Version**: 0.1.0  
**Status**: Production Ready


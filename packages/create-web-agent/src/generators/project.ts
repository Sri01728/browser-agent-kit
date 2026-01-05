/**
 * Project generator
 */

import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ProjectConfig {
  projectName: string;
  template: string;
  typescript: boolean;
  ui: boolean;
  memory: boolean;
  example: boolean;
}

/**
 * Generate project from template
 */
export async function generateProject(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const templatePath = path.resolve(__dirname, '../../templates', config.template);

  // Check if template exists
  if (!(await fs.pathExists(templatePath))) {
    throw new Error(`Template "${config.template}" not found`);
  }

  // Copy template files
  await fs.copy(templatePath, projectPath, {
    filter: (src) => {
      // Skip node_modules and build artifacts
      return !src.includes('node_modules') && !src.includes('dist');
    },
  });

  // Update package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  
  packageJson.name = config.projectName;
  
  // Add/remove dependencies based on config
  if (!config.ui) {
    delete packageJson.dependencies['@web-agent/ui-protocol'];
  }
  
  if (!config.memory) {
    // Memory is part of core, but we can add a flag
    packageJson.webAgent = packageJson.webAgent || {};
    packageJson.webAgent.memory = false;
  }

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  // Generate .gitignore
  await generateGitignore(projectPath);

  // Generate README
  await generateReadme(projectPath, config);

  // Remove example files if not needed
  if (!config.example) {
    const examplesPath = path.join(projectPath, 'src', 'agents');
    if (await fs.pathExists(examplesPath)) {
      await fs.remove(examplesPath);
    }
  }
}

/**
 * Generate .gitignore file
 */
async function generateGitignore(projectPath: string): Promise<void> {
  const gitignore = `# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Production
dist
build
.next
out

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# IDE
.vscode
.idea
*.swp
*.swo

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
`;

  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);
}

/**
 * Generate README file
 */
async function generateReadme(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  const readme = `# ${config.projectName}

A Web Agent Framework project created with \`create-web-agent\`.

## Getting Started

First, run the development server:

\`\`\`bash
${config.template === 'react' ? 'npm run dev' : 'npm run dev'}
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- ✅ ${config.template.charAt(0).toUpperCase() + config.template.slice(1)} with TypeScript
${config.ui ? '- ✅ UI Components (@web-agent/ui-protocol)' : ''}
${config.memory ? '- ✅ Enhanced Memory System' : ''}
${config.example ? '- ✅ Example Agent' : ''}

## Learn More

To learn more about the Web Agent Framework, check out:

- [Web Agent Documentation](https://github.com/your-org/web-agent-framework)
- [A2U Protocol Guide](https://github.com/your-org/web-agent-framework/docs/A2U_PROTOCOL.md)
- [Memory System Guide](https://github.com/your-org/web-agent-framework/docs/ENHANCED_MEMORY.md)

## Deploy

Deploy your Web Agent app to Vercel, Netlify, or any hosting platform that supports ${config.template === 'react' ? 'Next.js' : config.template}.
`;

  await fs.writeFile(path.join(projectPath, 'README.md'), readme);
}


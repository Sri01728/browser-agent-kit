/**
 * Tests for create command
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProject } from '../commands/create.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('createProject', () => {
  const testDir = path.join(__dirname, '../../test-output');
  const projectName = 'test-project';
  const projectPath = path.join(testDir, projectName);

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    // Mock stdin to not be TTY (non-interactive mode)
    vi.stubGlobal('process', {
      ...process,
      stdin: { isTTY: false },
    });
  });

  afterEach(async () => {
    await fs.remove(testDir);
    vi.unstubAllGlobals();
  });

  it('should create a React project with default options', async () => {
    await createProject(projectName, {
      template: 'react',
      typescript: true,
      ui: true,
      memory: true,
      example: true,
      install: false, // Skip installation in tests
      git: false, // Skip git in tests
    });

    // Check if project directory was created
    expect(await fs.pathExists(projectPath)).toBe(true);

    // Check if package.json was created
    const packageJsonPath = path.join(projectPath, 'package.json');
    expect(await fs.pathExists(packageJsonPath)).toBe(true);

    const packageJson = await fs.readJson(packageJsonPath);
    expect(packageJson.name).toBe(projectName);
    expect(packageJson.dependencies['@web-agent/core']).toBeDefined();
    expect(packageJson.dependencies['@web-agent/ui-protocol']).toBeDefined();
  });

  it('should create project without UI components', async () => {
    await createProject(projectName, {
      template: 'react',
      typescript: true,
      ui: false,
      memory: true,
      example: true,
      install: false,
      git: false,
    });

    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    
    expect(packageJson.dependencies['@web-agent/ui-protocol']).toBeUndefined();
  });

  it('should create project without example agent', async () => {
    await createProject(projectName, {
      template: 'react',
      typescript: true,
      ui: true,
      memory: true,
      example: false,
      install: false,
      git: false,
    });

    const examplesPath = path.join(projectPath, 'src', 'agents');
    expect(await fs.pathExists(examplesPath)).toBe(false);
  });

  it('should create .gitignore file', async () => {
    await createProject(projectName, {
      template: 'react',
      typescript: true,
      ui: true,
      memory: true,
      example: true,
      install: false,
      git: false,
    });

    const gitignorePath = path.join(projectPath, '.gitignore');
    expect(await fs.pathExists(gitignorePath)).toBe(true);

    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    expect(gitignoreContent).toContain('node_modules');
    expect(gitignoreContent).toContain('dist');
    expect(gitignoreContent).toContain('.env');
  });

  it('should create README file', async () => {
    await createProject(projectName, {
      template: 'react',
      typescript: true,
      ui: true,
      memory: true,
      example: true,
      install: false,
      git: false,
    });

    const readmePath = path.join(projectPath, 'README.md');
    expect(await fs.pathExists(readmePath)).toBe(true);

    const readmeContent = await fs.readFile(readmePath, 'utf-8');
    expect(readmeContent).toContain(projectName);
    expect(readmeContent).toContain('Web Agent Framework');
  });

  it('should throw error for invalid project name', async () => {
    await expect(
      createProject('Invalid Name!', {
        template: 'react',
        typescript: true,
        ui: true,
        memory: true,
        example: true,
        install: false,
        git: false,
      })
    ).rejects.toThrow();
  });
});


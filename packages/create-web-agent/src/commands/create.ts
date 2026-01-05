/**
 * Create command implementation
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import validateNpmPackageName from 'validate-npm-package-name';
import { detectPackageManager, installDependencies } from '../utils/install.js';
import { initGit } from '../utils/git.js';
import { generateProject } from '../generators/project.js';

export interface CreateOptions {
  template: string;
  typescript: boolean;
  ui: boolean;
  memory: boolean;
  example: boolean;
  install: boolean;
  git: boolean;
}

export async function createProject(
  projectName: string | undefined,
  options: CreateOptions
): Promise<void> {
  // Prompt for project name if not provided
  if (!projectName) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'my-web-agent-app',
        validate: (input: string) => {
          const validation = validateNpmPackageName(input);
          if (!validation.validForNewPackages) {
            return validation.errors?.[0] || 'Invalid package name';
          }
          return true;
        },
      },
    ]);
    projectName = answers.projectName;
  }

  // Validate project name
  const validation = validateNpmPackageName(projectName);
  if (!validation.validForNewPackages) {
    throw new Error(`Invalid project name: ${validation.errors?.[0]}`);
  }

  // Prompt for template if not provided via CLI
  let template = options.template;
  if (!template || !['react', 'vue', 'svelte'].includes(template)) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Which framework would you like to use?',
        choices: [
          { name: 'React (Next.js + TypeScript)', value: 'react' },
          { name: 'Vue (Vite + TypeScript)', value: 'vue' },
          { name: 'Svelte (SvelteKit + TypeScript)', value: 'svelte' },
        ],
        default: 'react',
      },
    ]);
    template = answers.template;
  }

  // Prompt for features if running interactively
  if (process.stdin.isTTY) {
    const featureAnswers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'typescript',
        message: 'Enable TypeScript?',
        default: options.typescript,
      },
      {
        type: 'confirm',
        name: 'ui',
        message: 'Include UI components?',
        default: options.ui,
      },
      {
        type: 'confirm',
        name: 'memory',
        message: 'Include memory system?',
        default: options.memory,
      },
      {
        type: 'confirm',
        name: 'example',
        message: 'Include example agent?',
        default: options.example,
      },
    ]);
    
    Object.assign(options, featureAnswers);
  }

  const projectPath = path.resolve(process.cwd(), projectName);

  // Check if directory already exists
  if (await fs.pathExists(projectPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Directory ${projectName} already exists. Overwrite?`,
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('Aborted.'));
      process.exit(0);
    }

    await fs.remove(projectPath);
  }

  // Create project directory
  await fs.ensureDir(projectPath);

  // Generate project files
  const spinner = ora('Generating project files...').start();
  try {
    await generateProject(projectPath, {
      projectName,
      template,
      ...options,
    });
    spinner.succeed('Project files generated');
  } catch (error) {
    spinner.fail('Failed to generate project files');
    throw error;
  }

  // Install dependencies
  if (options.install) {
    const packageManager = await detectPackageManager();
    const installSpinner = ora(`Installing dependencies with ${packageManager}...`).start();
    
    try {
      await installDependencies(projectPath, packageManager);
      installSpinner.succeed('Dependencies installed');
    } catch (error) {
      installSpinner.fail('Failed to install dependencies');
      console.log(chalk.yellow('\nYou can install dependencies manually by running:'));
      console.log(chalk.cyan(`  cd ${projectName}`));
      console.log(chalk.cyan(`  ${packageManager} install`));
    }
  }

  // Initialize git
  if (options.git) {
    const gitSpinner = ora('Initializing git repository...').start();
    
    try {
      await initGit(projectPath);
      gitSpinner.succeed('Git repository initialized');
    } catch (error) {
      gitSpinner.warn('Failed to initialize git repository');
    }
  }

  // Print next steps
  console.log(chalk.cyan('\nNext steps:'));
  console.log(chalk.white(`  cd ${projectName}`));
  
  if (!options.install) {
    const packageManager = await detectPackageManager();
    console.log(chalk.white(`  ${packageManager} install`));
  }
  
  console.log(chalk.white(`  ${await detectPackageManager()} dev`));
  console.log(chalk.cyan('\nHappy coding! 🚀'));
}


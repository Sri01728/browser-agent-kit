#!/usr/bin/env node

/**
 * create-web-agent CLI
 * 
 * Scaffolding tool for creating Web Agent Framework projects.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createProject } from './commands/create.js';

const program = new Command();

program
  .name('create-web-agent')
  .description('Create a new Web Agent Framework project')
  .version('0.1.0')
  .argument('[project-name]', 'Name of the project')
  .option('-t, --template <name>', 'Template to use (react, vue, svelte)', 'react')
  .option('--typescript', 'Enable TypeScript (default: true)', true)
  .option('--no-typescript', 'Disable TypeScript')
  .option('--ui', 'Include UI components (default: true)', true)
  .option('--no-ui', 'Exclude UI components')
  .option('--memory', 'Include memory system (default: true)', true)
  .option('--no-memory', 'Exclude memory system')
  .option('--example', 'Include example agent (default: true)', true)
  .option('--no-example', 'Exclude example agent')
  .option('--install', 'Install dependencies (default: true)', true)
  .option('--no-install', 'Skip dependency installation')
  .option('--git', 'Initialize git repository (default: true)', true)
  .option('--no-git', 'Skip git initialization')
  .action(async (projectName, options) => {
    try {
      console.log(chalk.cyan('\n✨ Creating a new Web Agent Framework project...\n'));
      
      await createProject(projectName, options);
      
      console.log(chalk.green('\n✅ Project created successfully!\n'));
    } catch (error) {
      console.error(chalk.red('\n❌ Error creating project:'), error);
      process.exit(1);
    }
  });

program.parse();


/**
 * Dependency installation utilities
 */

import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

export type PackageManager = 'pnpm' | 'npm' | 'yarn';

/**
 * Detect which package manager to use
 */
export async function detectPackageManager(): Promise<PackageManager> {
  // Check for lock files
  const cwd = process.cwd();
  
  if (await fs.pathExists(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  
  if (await fs.pathExists(path.join(cwd, 'yarn.lock'))) {
    return 'yarn';
  }
  
  if (await fs.pathExists(path.join(cwd, 'package-lock.json'))) {
    return 'npm';
  }

  // Check which package managers are available
  try {
    await execa('pnpm', ['--version']);
    return 'pnpm';
  } catch {
    // pnpm not available
  }

  try {
    await execa('yarn', ['--version']);
    return 'yarn';
  } catch {
    // yarn not available
  }

  return 'npm'; // Default to npm
}

/**
 * Install dependencies
 */
export async function installDependencies(
  projectPath: string,
  packageManager: PackageManager
): Promise<void> {
  const installCommand = packageManager === 'yarn' ? 'install' : 'install';
  
  await execa(packageManager, [installCommand], {
    cwd: projectPath,
    stdio: 'inherit',
  });
}


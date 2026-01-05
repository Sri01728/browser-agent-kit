/**
 * Git utilities
 */

import { execa } from 'execa';

/**
 * Initialize git repository
 */
export async function initGit(projectPath: string): Promise<void> {
  try {
    // Check if git is available
    await execa('git', ['--version']);
    
    // Initialize repository
    await execa('git', ['init'], { cwd: projectPath });
    
    // Add all files
    await execa('git', ['add', '-A'], { cwd: projectPath });
    
    // Create initial commit
    await execa('git', ['commit', '-m', 'Initial commit from create-web-agent'], {
      cwd: projectPath,
    });
  } catch (error) {
    // Git not available or failed, ignore
    throw error;
  }
}


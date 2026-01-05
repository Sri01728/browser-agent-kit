/**
 * Tests for utility functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectPackageManager } from '../utils/install.js';
import fs from 'fs-extra';
import { execa } from 'execa';

// Mock fs-extra
vi.mock('fs-extra');

// Mock execa
vi.mock('execa');

describe('detectPackageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect pnpm from lock file', async () => {
    vi.mocked(fs.pathExists).mockImplementation(async (path) => {
      return String(path).includes('pnpm-lock.yaml');
    });

    const pm = await detectPackageManager();
    expect(pm).toBe('pnpm');
  });

  it('should detect yarn from lock file', async () => {
    vi.mocked(fs.pathExists).mockImplementation(async (path) => {
      return String(path).includes('yarn.lock');
    });

    const pm = await detectPackageManager();
    expect(pm).toBe('yarn');
  });

  it('should detect npm from lock file', async () => {
    vi.mocked(fs.pathExists).mockImplementation(async (path) => {
      return String(path).includes('package-lock.json');
    });

    const pm = await detectPackageManager();
    expect(pm).toBe('npm');
  });

  it('should detect pnpm from binary availability', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    vi.mocked(execa).mockResolvedValue({
      stdout: '8.0.0',
      stderr: '',
      exitCode: 0,
      command: 'pnpm --version',
      failed: false,
      timedOut: false,
      isCanceled: false,
      killed: false,
    } as any);

    const pm = await detectPackageManager();
    expect(pm).toBe('pnpm');
  });

  it('should default to npm if nothing else available', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    vi.mocked(execa).mockRejectedValue(new Error('Command not found'));

    const pm = await detectPackageManager();
    expect(pm).toBe('npm');
  });
});


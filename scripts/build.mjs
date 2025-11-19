#!/usr/bin/env node
/**
 * Build script for Hoego
 *
 * Workaround for Tauri bundler issue where it looks for "hoego.rs" instead of "hoego"
 * This script creates symlinks before running the Tauri build.
 */

import { execSync } from 'child_process';
import { existsSync, symlinkSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Paths for debug and release binaries
const debugBinary = join(rootDir, 'src-tauri/target/debug/hoego');
const debugSymlink = join(rootDir, 'src-tauri/target/debug/hoego.rs');
const releaseBinary = join(rootDir, 'src-tauri/target/release/hoego');
const releaseSymlink = join(rootDir, 'src-tauri/target/release/hoego.rs');

/**
 * Create symlink if binary exists and symlink doesn't
 */
function createSymlink(binary, symlink) {
  if (existsSync(binary)) {
    // Remove old symlink if it exists
    if (existsSync(symlink)) {
      try {
        unlinkSync(symlink);
      } catch (_err) {
        console.warn(`Warning: Could not remove old symlink ${symlink}:`, _err.message);
      }
    }

    try {
      symlinkSync(binary, symlink);
      console.log(`✓ Created symlink: ${symlink} -> ${binary}`);
    } catch (_err) {
      console.error(`Error creating symlink ${symlink}:`, _err.message);
    }
  }
}

/**
 * Monitor for binary creation and create symlinks
 */
function setupSymlinks() {
  // Create symlinks for existing binaries
  createSymlink(debugBinary, debugSymlink);
  createSymlink(releaseBinary, releaseSymlink);
}

// Setup initial symlinks
setupSymlinks();

// Run the actual Tauri build
console.log('\n🔨 Building Hoego...\n');

try {
  execSync('tauri build', {
    stdio: 'inherit',
    cwd: rootDir,
  });

  // Create symlinks again after build (in case they're needed for bundling)
  setupSymlinks();

  console.log('\n✅ Build completed successfully!\n');
} catch (err) {
  console.error('\n❌ Build failed!\n');
  if (err instanceof Error) {
    console.error(err.message);
  }
  process.exit(1);
}

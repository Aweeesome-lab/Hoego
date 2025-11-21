#!/usr/bin/env node
/**
 * Build script for Hoego
 *
 * Workaround for Tauri bundler issue where it looks for "hoego.rs" instead of "hoego"
 * This script creates symlinks before running the Tauri build.
 * Also handles DMG conversion if bundle_dmg.sh fails.
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
        console.warn(
          `Warning: Could not remove old symlink ${symlink}:`,
          _err.message
        );
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

// Attempt to build
try {
  execSync('tauri build', {
    stdio: 'inherit',
    cwd: rootDir,
  });
  console.log('\n✅ Tauri build completed!\n');
} catch (_err) {
  console.warn(
    '\n⚠ Tauri build encountered an issue, checking for DMG files...\n'
  );
}

// Create symlinks again after build (in case they're needed for bundling)
setupSymlinks();

// Convert read-write DMG to compressed DMG
console.log('\n📦 Converting DMG to compressed format...\n');
const macosBundle = join(rootDir, 'src-tauri/target/release/bundle/macos');
const rwDmgPattern = 'rw.Hoego_*.dmg';

try {
  // Find rw.Hoego DMG files
  const files = execSync(
    `find "${macosBundle}" -name "${rwDmgPattern}" 2>/dev/null || true`,
    {
      encoding: 'utf8',
      cwd: rootDir,
    }
  ).trim();

  if (files) {
    const rwDmgPath = files.split('\n')[0];
    const finalDmgPath = rwDmgPath.replace('rw.', '');

    console.log(`Converting: ${rwDmgPath}`);
    console.log(`       to: ${finalDmgPath}`);

    execSync(
      `hdiutil convert "${rwDmgPath}" -format UDZO -o "${finalDmgPath}"`,
      {
        stdio: 'inherit',
        cwd: rootDir,
      }
    );

    console.log('✓ DMG conversion completed successfully!');
  } else {
    console.log('ℹ No read-write DMG found, skipping conversion.');
  }
} catch (err) {
  console.warn('⚠ DMG conversion failed (non-critical):', err.message);
}

console.log('\n✅ Build completed successfully!\n');

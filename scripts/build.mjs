#!/usr/bin/env node
/**
 * Build script for Hoego
 *
 * Handles:
 * 1. Symlink workaround for Tauri bundler (hoego.rs -> hoego)
 * 2. DMG conversion from read-write to compressed format
 */

import { execSync } from 'child_process';
import { existsSync, symlinkSync, unlinkSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const macosBundle = join(rootDir, 'src-tauri/target/release/bundle/macos');

// Binary paths
const BINARIES = [
  {
    binary: join(rootDir, 'src-tauri/target/debug/hoego'),
    symlink: join(rootDir, 'src-tauri/target/debug/hoego.rs'),
  },
  {
    binary: join(rootDir, 'src-tauri/target/release/hoego'),
    symlink: join(rootDir, 'src-tauri/target/release/hoego.rs'),
  },
];

/**
 * Create symlink for Tauri bundler workaround
 */
function createSymlink({ binary, symlink }) {
  if (!existsSync(binary)) return;

  try {
    if (existsSync(symlink)) unlinkSync(symlink);
    symlinkSync(binary, symlink);
    console.log(`✓ Symlink: ${symlink.split('/').pop()}`);
  } catch (err) {
    console.warn(`⚠ Symlink failed: ${err.message}`);
  }
}

/**
 * Convert read-write DMG to compressed format
 */
function convertDmg() {
  if (!existsSync(macosBundle)) {
    console.log('ℹ No macos bundle found, skipping DMG conversion.');
    return;
  }

  const files = readdirSync(macosBundle);
  const rwDmg = files.find((f) => f.startsWith('rw.') && f.endsWith('.dmg'));

  if (!rwDmg) {
    console.log('ℹ No read-write DMG found.');
    return;
  }

  const rwPath = join(macosBundle, rwDmg);
  const finalPath = join(macosBundle, rwDmg.replace('rw.', ''));

  // Remove existing final DMG if exists
  if (existsSync(finalPath)) {
    console.log(`🗑 Removing existing: ${rwDmg.replace('rw.', '')}`);
    unlinkSync(finalPath);
  }

  console.log(`📦 Converting: ${rwDmg} → ${rwDmg.replace('rw.', '')}`);

  try {
    execSync(`hdiutil convert "${rwPath}" -format UDZO -o "${finalPath}"`, {
      stdio: 'inherit',
    });
    console.log('✓ DMG conversion completed!');

    // Clean up rw DMG
    unlinkSync(rwPath);
    console.log('✓ Cleaned up temporary DMG.');
  } catch (err) {
    console.warn(`⚠ DMG conversion failed: ${err.message}`);
  }
}

// === Main ===
console.log('\n🔨 Building Hoego...\n');

// Setup symlinks
BINARIES.forEach(createSymlink);

// Run Tauri build
try {
  execSync('tauri build', { stdio: 'inherit', cwd: rootDir });
  console.log('\n✅ Tauri build completed!\n');
} catch (_err) {
  console.warn('\n⚠ Tauri build had issues, attempting DMG recovery...\n');
}

// Post-build symlinks
BINARIES.forEach(createSymlink);

// Convert DMG
convertDmg();

console.log('\n✅ Build completed!\n');

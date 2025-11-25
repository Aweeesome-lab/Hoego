#!/usr/bin/env node
/**
 * Build script for Hoego
 */

import { execSync } from 'child_process';
import { existsSync, symlinkSync, unlinkSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const macosBundle = join(rootDir, 'src-tauri/target/release/bundle/macos');

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

function createSymlink({ binary, symlink }) {
  if (!existsSync(binary)) return;
  try {
    if (existsSync(symlink)) unlinkSync(symlink);
    symlinkSync(binary, symlink);
  } catch {
    // Ignore symlink errors - not critical for build
  }
}

function installApp() {
  const appPath = join(macosBundle, 'Hoego.app');
  const destPath = '/Applications/Hoego.app';

  if (!existsSync(appPath)) return;

  try {
    if (existsSync(destPath)) {
      execSync(`rm -rf "${destPath}"`, { stdio: 'pipe' });
    }
    execSync(`cp -R "${appPath}" "${destPath}"`, { stdio: 'pipe' });
    console.log('✓ Installed to /Applications');
  } catch (_) {
    console.log('⚠ Install failed (permission?)');
  }
}

function convertDmg() {
  if (!existsSync(macosBundle)) return null;

  const files = readdirSync(macosBundle);
  const rwDmg = files.find((f) => f.startsWith('rw.') && f.endsWith('.dmg'));
  if (!rwDmg) return null;

  const rwPath = join(macosBundle, rwDmg);
  const finalPath = join(macosBundle, rwDmg.replace('rw.', ''));

  if (existsSync(finalPath)) unlinkSync(finalPath);

  try {
    execSync(`hdiutil convert "${rwPath}" -format UDZO -o "${finalPath}"`, {
      stdio: 'pipe',
    });
    unlinkSync(rwPath);
    return finalPath;
  } catch (_) {
    return null;
  }
}

// === Main ===
console.log('\n🔨 Building Hoego...\n');

BINARIES.forEach(createSymlink);

try {
  execSync('tauri build 2>&1 | grep -v -E "(^\\s*Warn|bundle_dmg\\.sh|^\\s*Error failed to bundle)"', {
    stdio: 'inherit',
    cwd: rootDir,
    shell: true,
  });
} catch (_) {
  // DMG bundling may fail, but we handle it
}

BINARIES.forEach(createSymlink);

const dmgPath = convertDmg();
if (dmgPath) {
  console.log(`✓ DMG: ${dmgPath.split('/').pop()}`);
}

installApp();

console.log('\n✅ Build completed!\n');

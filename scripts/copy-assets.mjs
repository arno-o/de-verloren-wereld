import { cp, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, 'assets');
const distDir = path.join(rootDir, 'dist');
const targetDir = path.join(distDir, 'assets');

const ensureDir = async (dir) => {
  try {
    await stat(dir);
  } catch {
    await mkdir(dir, { recursive: true });
  }
};

const copyAssets = async () => {
  await ensureDir(distDir);
  await cp(sourceDir, targetDir, { recursive: true });
  console.log('[copy-assets] Assets copied to dist/assets');
};

copyAssets().catch((error) => {
  console.error('[copy-assets] Failed to copy assets:', error);
  process.exit(1);
});

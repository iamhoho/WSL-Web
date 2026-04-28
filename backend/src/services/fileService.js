import fs from 'fs/promises';
import path from 'path';
import { validatePath } from '../utils/pathUtils.js';

export async function readDir(dirPath) {
  const safePath = validatePath(dirPath);
  const items = await fs.readdir(safePath, { withFileTypes: true });
  const result = await Promise.all(
    items.map(async (item) => {
      const itemPath = path.join(safePath, item.name);
      try {
        const stats = await fs.stat(itemPath);
        return {
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          mtime: stats.mtime.toISOString(),
        };
      } catch {
        return {
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file',
          size: 0,
          mtime: new Date().toISOString(),
        };
      }
    })
  );
  return { items: result, path: safePath };
}

export async function readFile(filePath) {
  const safePath = validatePath(filePath);
  const content = await fs.readFile(safePath, 'utf-8');
  return { content, path: safePath };
}

export async function writeFile(filePath, content) {
  const safePath = validatePath(filePath);
  await fs.writeFile(safePath, content, 'utf-8');
  return { path: safePath };
}

export async function makeDir(dirPath) {
  const safePath = validatePath(dirPath);
  await fs.mkdir(safePath, { recursive: true });
  return { path: safePath };
}

export async function deleteItem(itemPath) {
  const safePath = validatePath(itemPath);
  const stats = await fs.stat(safePath);
  if (stats.isDirectory()) {
    await fs.rm(safePath, { recursive: true });
  } else {
    await fs.unlink(safePath);
  }
  return { path: safePath };
}

export async function rename(oldPath, newPath) {
  const safeOldPath = validatePath(oldPath);
  const safeNewPath = validatePath(newPath);
  await fs.rename(safeOldPath, safeNewPath);
  return { oldPath: safeOldPath, newPath: safeNewPath };
}

export async function getStats(filePath) {
  const safePath = validatePath(filePath);
  const stats = await fs.stat(safePath);
  return {
    size: stats.size,
    mtime: stats.mtime.toISOString(),
    isDirectory: stats.isDirectory(),
    isFile: stats.isFile(),
    path: safePath,
  };
}

import path from 'path';

const BASE_PATH = process.env.WSL_BASE_PATH || '/home';

export function safePath(userPath) {
  const resolved = path.resolve(BASE_PATH, userPath);
  if (!resolved.startsWith(BASE_PATH)) {
    throw new Error('Path traversal attempt blocked');
  }
  return resolved;
}

export function validatePath(filePath) {
  if (filePath.includes('\0')) {
    throw new Error('Invalid path: null byte detected');
  }
  return safePath(filePath);
}

export function getBasePath() {
  return BASE_PATH;
}

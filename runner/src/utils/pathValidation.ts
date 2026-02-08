import path from 'path';

/**
 * Checks whether a given script path resides inside one of the allowed directories.
 * Uses path.resolve for normalization (no filesystem access).
 * @param scriptPath - The path to validate
 * @param allowedDirs - Array of allowed parent directories
 * @returns true if scriptPath is a child of any allowedDir, false otherwise
 */
export function isPathAllowed(scriptPath: string, allowedDirs: string[]): boolean {
  if (!scriptPath || typeof scriptPath !== 'string') {
    return false;
  }

  const resolvedPath = path.resolve(scriptPath);

  return allowedDirs.some((dir) => {
    const resolvedDir = path.resolve(dir);
    return resolvedPath.startsWith(resolvedDir + path.sep);
  });
}

/**
 * Returns the list of directories from which test scripts are allowed to run.
 * Includes default directories plus any additional ones from ALLOWED_SCRIPT_DIRS env var.
 * @returns Array of resolved absolute directory paths
 */
export function getAllowedScriptDirs(): string[] {
  const defaultDirs = [
    path.resolve(process.cwd(), 'uploads'),
    path.resolve(process.cwd(), '..', 'backend', 'uploads', 'ui-tests'),
  ];

  const envDirs: string[] = [];

  if (process.env.ALLOWED_SCRIPT_DIRS) {
    const parsed = process.env.ALLOWED_SCRIPT_DIRS
      .split(',')
      .map((dir) => dir.trim())
      .filter((dir) => dir.length > 0)
      .map((dir) => path.resolve(dir));

    envDirs.push(...parsed);
  }

  const allDirs = [...defaultDirs, ...envDirs];
  return [...new Set(allDirs)];
}

import { promises } from 'fs';
const { access } = promises;

/**
 * Checks if a file/folder at the given path exists.
 *
 * @param path - Path to check.
 * @returns If the file/folder exists.
 */
export default async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

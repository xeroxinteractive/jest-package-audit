import exists from './exists';
import { resolve } from 'path';

/**
 * Check if a folder is using yarn.
 *
 * @param path - Path of the folder to check.
 * @returns Whether the folder has a yarn.lock file.
 */
export default async function isYarn(path: string): Promise<boolean> {
  return await exists(resolve(path, 'yarn.lock'));
}

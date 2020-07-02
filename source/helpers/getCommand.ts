import { InputOptions } from 'source/static';
import isYarn from './isYarn';

/**
 * Gets the audit command string from the given options.
 *
 * @param root - The root directory of the project being audited.
 * @param inputOptions - Options for running the audit.
 * @returns Audit command string to run.
 */
export default async function getCommand(
  root: string,
  inputOptions?: InputOptions
): Promise<string> {
  if (inputOptions?.command) {
    return inputOptions.command;
  }
  const { yarn = await isYarn(root), level, dependencyType } =
    inputOptions || {};
  let command;
  if (yarn) {
    command = 'yarn audit';
    if (level) {
      command += ` --level ${level}`;
    }
    if (dependencyType) {
      command += ` --groups ${dependencyType}`;
    }
  } else {
    command = 'npm audit';
    if (level && level !== 'info') {
      command += ` --audit-level=${level}`;
    }
    if (dependencyType === 'dependencies') {
      command += ` --only=prod`;
    } else if (dependencyType === 'devDependencies') {
      command += ` --only=dev`;
    }
  }
  return command;
}

import { InputOptions } from 'source/static';

/**
 * Gets the audit command string from the given options.
 *
 * @param root - The root directory of the project being audited.
 * @param inputOptions - Options for running the audit.
 * @returns Audit command string to run.
 */
export default function getCommand(
  root: string,
  inputOptions: InputOptions
): string {
  if (inputOptions.command) {
    return inputOptions.command;
  }
  const { yarn, level, dependencyType } = inputOptions || {};
  let command;
  if (yarn) {
    command = 'yarn audit --json';
    if (level) {
      command += ` --level ${level}`;
    }
    if (dependencyType) {
      command += ` --groups ${dependencyType}`;
    }
  } else {
    command = 'npm audit --json';
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
